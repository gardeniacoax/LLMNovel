import { ConfigManager, ApiConfigManager } from './config.js'

class RequestQueue {
    constructor(maxConcurrent = 3) {
        this.queue = []
        this.activeRequests = 0
        this.maxConcurrent = maxConcurrent
    }
    
    add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                requestFn,
                resolve,
                reject
            })
            this.process()
        })
    }
    
    process() {
        while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
            const { requestFn, resolve, reject } = this.queue.shift()
            this.activeRequests++
            
            requestFn()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    this.activeRequests--
                    this.process()
                })
        }
    }
    
    clear() {
        this.queue = []
    }
    
    getStats() {
        return {
            pending: this.queue.length,
            active: this.activeRequests,
            total: this.queue.length + this.activeRequests
        }
    }
}

class RequestCache {
    constructor(maxSize = 50, ttl = 3600000) {
        this.cache = new Map()
        this.maxSize = maxSize
        this.ttl = ttl
    }
    
    generateKey(messages, options) {
        const content = JSON.stringify({ messages, options })
        let hash = 0
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        return `cache_${hash}`
    }
    
    get(key) {
        const item = this.cache.get(key)
        if (!item) return null
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key)
            return null
        }
        
        return item.data
    }
    
    set(key, data) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value
            this.cache.delete(firstKey)
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        })
    }
    
    clear() {
        this.cache.clear()
    }
    
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        }
    }
}

class RequestLogger {
    constructor(maxLogs = 100) {
        this.logs = []
        this.maxLogs = maxLogs
    }
    
    log(requestId, type, message, data = {}) {
        const logEntry = {
            id: requestId,
            type,
            message,
            data,
            timestamp: new Date().toISOString()
        }
        
        this.logs.unshift(logEntry)
        
        if (this.logs.length > this.maxLogs) {
            this.logs.pop()
        }
        
        console.log(`[API ${type}] ${message}`, data)
    }
    
    getLogs(limit = 20) {
        return this.logs.slice(0, limit)
    }
    
    clear() {
        this.logs = []
    }
}

class RequestStats {
    constructor() {
        this.stats = {
            total: 0,
            success: 0,
            failed: 0,
            cancelled: 0,
            cached: 0,
            totalTime: 0,
            avgTime: 0
        }
    }
    
    record(type, duration = 0) {
        this.stats.total++
        this.stats[type]++
        
        if (duration > 0) {
            this.stats.totalTime += duration
            this.stats.avgTime = Math.round(this.stats.totalTime / this.stats.success)
        }
    }
    
    getStats() {
        return { ...this.stats }
    }
    
    reset() {
        this.stats = {
            total: 0,
            success: 0,
            failed: 0,
            cancelled: 0,
            cached: 0,
            totalTime: 0,
            avgTime: 0
        }
    }
}

class ApiClient {
    constructor() {
        this.retryCount = 3
        this.timeout = 0
        this.retryDelay = 1000
        
        this.queue = new RequestQueue(3)
        this.cache = new RequestCache(50, 3600000)
        this.logger = new RequestLogger(100)
        this.stats = new RequestStats()
        
        this.activeRequests = new Map()
        this.requestIdCounter = 0
    }
    
    getConfig() {
        return ApiConfigManager.getApiConfig()
    }
    
    generateRequestId() {
        return `req_${++this.requestIdCounter}_${Date.now()}`
    }
    
    async request(messages, options = {}) {
        const requestId = this.generateRequestId()
        const startTime = Date.now()
        
        this.logger.log(requestId, 'START', '开始请求', {
            messageCount: messages.length,
            options
        })
        
        const cacheKey = options.useCache !== false ? this.cache.generateKey(messages, options) : null
        
        if (cacheKey) {
            const cached = this.cache.get(cacheKey)
            if (cached) {
                this.stats.record('cached')
                this.logger.log(requestId, 'CACHE', '使用缓存', { cacheKey })
                return cached
            }
        }
        
        const config = this.getConfig()
        
        if (!config.apiKey) {
            const error = new Error('请先配置API Key')
            this.logger.log(requestId, 'ERROR', 'API Key未配置')
            this.stats.record('failed')
            throw error
        }
        
        const globalPrompt = ConfigManager.getGlobalPrompt()
        const finalMessages = this.prependGlobalPrompt(messages, globalPrompt)
        
        const body = {
            model: config.modelId,
            messages: finalMessages,
            max_tokens: options.maxTokens || config.maxTokens,
            temperature: options.temperature || config.temperature,
            stream: false
        }
        
        try {
            const result = await this.queue.add(() => 
                this.sendWithRetry(requestId, config, body, options.retryCount)
            )
            
            const duration = Date.now() - startTime
            this.stats.record('success', duration)
            
            if (cacheKey) {
                this.cache.set(cacheKey, result)
            }
            
            this.logger.log(requestId, 'SUCCESS', '请求成功', {
                duration: `${duration}ms`,
                tokens: result.usage
            })
            
            return result
            
        } catch (error) {
            this.stats.record('failed')
            
            if (error.name === 'AbortError' || error.message.includes('取消')) {
                this.stats.record('cancelled')
                this.logger.log(requestId, 'CANCEL', '请求已取消')
            } else {
                this.logger.log(requestId, 'ERROR', '请求失败', {
                    error: error.message
                })
            }
            
            throw error
        }
    }
    
    prependGlobalPrompt(messages, globalPrompt) {
        return ConfigManager.prependGlobalPrompt(messages)
    }
    
    async sendWithRetry(requestId, config, body, maxRetries = this.retryCount) {
        const controller = new AbortController()
        
        this.activeRequests.set(requestId, {
            controller,
            startTime: Date.now()
        })
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                let timeoutId = null
                if (this.timeout > 0) {
                    timeoutId = setTimeout(() => controller.abort(), this.timeout)
                }
                
                const response = await fetch(config.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`
                    },
                    body: JSON.stringify(body),
                    signal: controller.signal
                })
                
                if (timeoutId) clearTimeout(timeoutId)
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}))
                    const errorMessage = error.error?.message || `HTTP ${response.status}`
                    
                    if (response.status === 429) {
                        const retryAfter = response.headers.get('retry-after')
                        if (retryAfter) {
                            const delay = parseInt(retryAfter) * 1000
                            this.logger.log(requestId, 'RETRY', `速率限制，等待${delay}ms后重试`, {
                                attempt,
                                maxRetries
                            })
                            await this.delay(delay)
                            continue
                        }
                    }
                    
                    if (response.status >= 500 && attempt < maxRetries) {
                        this.logger.log(requestId, 'RETRY', `服务器错误，第${attempt}次重试`, {
                            attempt,
                            maxRetries,
                            error: errorMessage
                        })
                        await this.delay(this.retryDelay * attempt)
                        continue
                    }
                    
                    throw new Error(errorMessage)
                }
                
                const data = await response.json()
                this.activeRequests.delete(requestId)
                return data
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    this.activeRequests.delete(requestId)
                    throw new Error('请求超时或已取消')
                }
                
                if (attempt < maxRetries) {
                    this.logger.log(requestId, 'RETRY', `请求失败，第${attempt}次重试`, {
                        attempt,
                        maxRetries,
                        error: error.message
                    })
                    await this.delay(this.retryDelay * attempt)
                } else {
                    this.activeRequests.delete(requestId)
                    throw error
                }
            }
        }
    }
    
    cancelRequest(requestId) {
        const request = this.activeRequests.get(requestId)
        if (request) {
            request.controller.abort()
            this.activeRequests.delete(requestId)
            this.logger.log(requestId, 'CANCEL', '手动取消请求')
            return true
        }
        return false
    }
    
    cancelAllRequests() {
        const count = this.activeRequests.size
        this.activeRequests.forEach((request, requestId) => {
            request.controller.abort()
            this.logger.log(requestId, 'CANCEL', '批量取消请求')
        })
        this.activeRequests.clear()
        return count
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    getQueueStats() {
        return this.queue.getStats()
    }
    
    getCacheStats() {
        return this.cache.getStats()
    }
    
    getStats() {
        return this.stats.getStats()
    }
    
    getLogs(limit = 20) {
        return this.logger.getLogs(limit)
    }
    
    clearCache() {
        this.cache.clear()
        this.logger.log('system', 'CACHE', '缓存已清空')
    }
    
    resetStats() {
        this.stats.reset()
        this.logger.log('system', 'STATS', '统计已重置')
    }
    
    async chat(messages, options = {}) {
        const response = await this.request(messages, options)
        return response.choices[0].message.content
    }
    
    async analyzeNovel(content, onProgress) {
        const taskInstructions = `你是一位专业的小说分析师。请分析以下小说文本，输出两个JSON对象：

1. 剧情分析JSON（plotAnalysis）：
{
  "summary": "总体剧情梗概",
  "totalChapters": 数字,
  "totalWords": 数字,
  "chapters": [
    {
      "chapterNum": 章节号,
      "title": "章节标题",
      "summary": "本章梗概",
      "wordCount": 字数,
      "keyEvents": ["关键事件"],
      "characters": ["出场角色"]
    }
  ],
  "characters": [
    {
      "name": "角色名",
      "appearance": "外貌描写",
      "personality": "性格特质",
      "relationships": ["人际关系"],
      "plotChanges": ["剧情变化轨迹"]
    }
  ]
}

2. 文风分析JSON（styleAnalysis）：
{
  "sentencePatterns": {
    "avgLength": 平均句长,
    "types": ["句式类型"],
    "proportions": {"short": 比例, "medium": 比例, "long": 比例}
  },
  "vocabulary": {
    "preferences": ["用词偏好"],
    "frequency": {"formal": 比例, "casual": 比例},
    "uniqueWords": ["特色词汇"]
  },
  "rhythm": {
    "pace": "节奏快慢",
    "description": "节奏描述"
  },
  "emotion": {
    "primary": "主要情感",
    "secondary": ["次要情感"],
    "intensity": 强度
  },
  "rhetoric": {
    "metaphor": "比喻使用",
    "personification": "拟人使用",
    "parallelism": "排比使用"
  },
  "paragraphStyle": {
    "avgLength": 平均段落长度,
    "structure": "段落结构特点"
  },
  "dialogueStyle": {
    "proportion": 对话占比,
    "features": ["对话特点"]
  }
}

请严格按照JSON格式输出，不要添加任何其他文字。`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(taskInstructions, content)
        
        if (onProgress) onProgress(10, '正在分析文本...')
        
        const response = await this.request(messages, {
            maxTokens: 8192,
            temperature: 0.3
        })
        
        if (onProgress) onProgress(80, '正在解析结果...')
        
        const resultText = response.choices[0].message.content
        
        try {
            const { plotAnalysis, styleAnalysis } = this.parseAnalysisResult(resultText)
            
            if (!plotAnalysis || !styleAnalysis) {
                console.error('解析结果:', { plotAnalysis, styleAnalysis })
                throw new Error('解析失败：未能提取完整的分析数据')
            }
            
            if (onProgress) onProgress(100, '分析完成')
            
            return {
                plotAnalysis,
                styleAnalysis
            }
        } catch (error) {
            console.error('JSON解析错误:', error)
            console.error('原始返回内容:', resultText)
            throw new Error(`JSON解析失败: ${error.message}`)
        }
    }
    
    parseAnalysisResult(text) {
        let cleanText = text
        
        cleanText = cleanText.replace(/```json\s*/gi, '')
        cleanText = cleanText.replace(/```\s*/g, '')
        cleanText = cleanText.trim()
        
        let plotAnalysis = null
        let styleAnalysis = null
        
        const plotPatterns = [
            /\{\s*"plotAnalysis"\s*:\s*\{[\s\S]*?\}\s*\}/,
            /"plotAnalysis"\s*:\s*\{[\s\S]*?\}\s*(?=,|"styleAnalysis"|\}$)/
        ]
        
        const stylePatterns = [
            /\{\s*"styleAnalysis"\s*:\s*\{[\s\S]*?\}\s*\}/,
            /"styleAnalysis"\s*:\s*\{[\s\S]*?\}\s*\}?$/
        ]
        
        for (const pattern of plotPatterns) {
            const match = cleanText.match(pattern)
            if (match) {
                try {
                    let jsonStr = match[0]
                    if (!jsonStr.startsWith('{')) {
                        jsonStr = '{' + jsonStr
                    }
                    if (!jsonStr.endsWith('}')) {
                        jsonStr = jsonStr + '}'
                    }
                    const parsed = JSON.parse(jsonStr)
                    if (parsed.plotAnalysis) {
                        plotAnalysis = parsed.plotAnalysis
                        break
                    }
                } catch (e) {
                    console.warn('plotAnalysis模式匹配失败:', e.message)
                }
            }
        }
        
        for (const pattern of stylePatterns) {
            const match = cleanText.match(pattern)
            if (match) {
                try {
                    let jsonStr = match[0]
                    if (!jsonStr.startsWith('{')) {
                        jsonStr = '{' + jsonStr
                    }
                    if (!jsonStr.endsWith('}')) {
                        jsonStr = jsonStr + '}'
                    }
                    const parsed = JSON.parse(jsonStr)
                    if (parsed.styleAnalysis) {
                        styleAnalysis = parsed.styleAnalysis
                        break
                    }
                } catch (e) {
                    console.warn('styleAnalysis模式匹配失败:', e.message)
                }
            }
        }
        
        if (!plotAnalysis || !styleAnalysis) {
            const jsonObjects = this.extractJsonObjects(cleanText)
            
            for (const obj of jsonObjects) {
                if (obj.plotAnalysis && !plotAnalysis) {
                    plotAnalysis = obj.plotAnalysis
                }
                if (obj.styleAnalysis && !styleAnalysis) {
                    styleAnalysis = obj.styleAnalysis
                }
            }
        }
        
        if (!plotAnalysis || !styleAnalysis) {
            try {
                const parsed = JSON.parse(cleanText)
                plotAnalysis = parsed.plotAnalysis || null
                styleAnalysis = parsed.styleAnalysis || null
            } catch (e) {
                console.warn('直接解析失败:', e.message)
            }
        }
        
        return { plotAnalysis, styleAnalysis }
    }
    
    extractJsonObjects(text) {
        const results = []
        let depth = 0
        let start = -1
        
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
                if (depth === 0) {
                    start = i
                }
                depth++
            } else if (text[i] === '}') {
                depth--
                if (depth === 0 && start !== -1) {
                    const jsonStr = text.substring(start, i + 1)
                    try {
                        const parsed = JSON.parse(jsonStr)
                        results.push(parsed)
                    } catch (e) {
                        // 忽略解析失败的对象
                    }
                    start = -1
                }
            }
        }
        
        return results
    }
}

const apiClient = new ApiClient()

export { apiClient, ApiClient, RequestQueue, RequestCache, RequestLogger, RequestStats }
