import { ConfigManager } from '../config.js'
import { WordCountValidator, ContinueWordCountBuilder } from '../wordcount/index.js'
import { StyleCardApplier } from '../style/style-card-applier.js'

class ContinueOutlineGenerator {
    constructor(options = {}) {
        this.workspaceData = options.workspaceData || null
        this.settings = options.settings || {}
        this.apiClient = options.apiClient || null
        
        this.onProgress = options.onProgress || null
        this.onComplete = options.onComplete || null
        this.onError = options.onError || null
        
        this.outline = null
    }
    
    setApiClient(client) {
        this.apiClient = client
    }
    
    setWorkspaceData(data) {
        this.workspaceData = data
    }
    
    setSettings(settings) {
        this.settings = { ...this.settings, ...settings }
    }
    
    async generate(chapterNum) {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        if (!this.workspaceData) {
            throw new Error('工作区数据未设置')
        }
        
        this.notifyProgress({ stage: 'generating', message: `正在生成第${chapterNum}章续写大纲...` })
        
        try {
            const stylePrompt = this.buildStylePrompt()
            
            const systemPrompt = this.buildSystemPrompt()
            const userPrompt = this.buildUserPrompt(chapterNum, stylePrompt)
            
            const messages = ConfigManager.buildMessagesWithGlobalPrompt(
                systemPrompt,
                userPrompt
            )
            
            const response = await this.apiClient.request(messages, {
                maxTokens: 4096,
                temperature: 0.7
            })
            
            const content = response.choices[0].message.content.trim()
            this.outline = this.parseOutline(content)
            
            this.notifyProgress({ stage: 'completed', message: '大纲生成完成' })
            this.notifyComplete(this.outline)
            
            return this.outline
            
        } catch (error) {
            this.notifyError(error)
            throw error
        }
    }
    
    buildSystemPrompt() {
        return `你是一位专业的小说续写助手。请根据前情提要、剧情走向和角色信息，生成续写章节的大纲。

大纲应包含：
1. 章节标题
2. 主要事件
3. 关键场景（2-3个）
4. 角色参与情况
5. 结尾悬念

输出格式要求：
必须以JSON格式输出，格式如下：
{
    "title": "章节标题",
    "main_event": "主要事件",
    "key_scenes": ["场景1", "场景2"],
    "character_involvement": ["角色1：行为", "角色2：行为"],
    "cliffhanger": "结尾悬念"
}`
    }
    
    buildUserPrompt(chapterNum, stylePrompt) {
        let prompt = ''
        
        if (stylePrompt) {
            prompt += `${stylePrompt}\n\n`
        }
        
        const previousChapters = this.getPreviousChapters(3)
        const plotAnalysis = this.workspaceData.analysis?.plotAnalysis || null
        const roleCards = this.workspaceData.roleCards || null
        
        prompt += `请生成第${chapterNum}章的续写大纲：\n\n`
        
        if (previousChapters.length > 0) {
            prompt += `前情提要：\n`
            previousChapters.forEach(ch => {
                const summary = ch.analysisResult?.summary || ch.content?.slice(0, 200) || ''
                prompt += `- 第${ch.chapterNum}章：${summary}\n`
            })
            prompt += '\n'
        }
        
        if (plotAnalysis) {
            prompt += `总剧情走向：\n${JSON.stringify(plotAnalysis, null, 2)}\n\n`
        }
        
        if (roleCards) {
            prompt += `角色信息：\n${JSON.stringify(roleCards, null, 2)}\n\n`
        }
        
        if (this.settings.userOutline) {
            prompt += `用户大纲要求：\n${this.settings.userOutline}\n\n`
        }
        
        prompt += `请生成第${chapterNum}章的续写大纲：`
        
        return prompt
    }
    
    buildStylePrompt() {
        if (!this.settings.styleCardId) return ''
        
        return StyleCardApplier.buildStylePrompt(this.settings.styleCardId)
    }
    
    getPreviousChapters(count) {
        if (!this.workspaceData || !this.workspaceData.chapters) return []
        
        const chapters = this.workspaceData.chapters
        return chapters.slice(-count)
    }
    
    parseOutline(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                
                return {
                    title: parsed.title || '',
                    main_event: parsed.main_event || '',
                    key_scenes: parsed.key_scenes || [],
                    character_involvement: parsed.character_involvement || [],
                    cliffhanger: parsed.cliffhanger || '',
                    raw: response
                }
            }
        } catch (error) {
            console.error('解析大纲失败:', error)
        }
        
        return {
            title: '',
            main_event: response.slice(0, 200),
            key_scenes: [],
            character_involvement: [],
            cliffhanger: '',
            raw: response,
            parseError: true
        }
    }
    
    notifyProgress(data) {
        if (this.onProgress) {
            this.onProgress(data)
        }
    }
    
    notifyComplete(outline) {
        if (this.onComplete) {
            this.onComplete(outline)
        }
    }
    
    notifyError(error) {
        if (this.onError) {
            this.onError(error)
        }
    }
    
    getOutline() {
        return this.outline
    }
}

class ContinueContentGenerator {
    constructor(options = {}) {
        this.outline = options.outline || null
        this.chapterNum = options.chapterNum || 1
        this.settings = options.settings || {}
        this.apiClient = options.apiClient || null
        
        this.onProgress = options.onProgress || null
        this.onComplete = options.onComplete || null
        this.onError = options.onError || null
        
        this.content = ''
        this.validation = null
    }
    
    setApiClient(client) {
        this.apiClient = client
    }
    
    setOutline(outline) {
        this.outline = outline
    }
    
    setChapterNum(num) {
        this.chapterNum = num
    }
    
    setSettings(settings) {
        this.settings = { ...this.settings, ...settings }
    }
    
    async generate() {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        if (!this.outline) {
            throw new Error('大纲未设置')
        }
        
        this.notifyProgress({ stage: 'generating', message: '正在生成续写内容...', progress: 0 })
        
        try {
            const wordCountInstruction = this.buildWordCountInstruction()
            const stylePrompt = this.buildStylePrompt()
            
            const systemPrompt = this.buildSystemPrompt()
            const userPrompt = this.buildUserPrompt(wordCountInstruction, stylePrompt)
            
            const messages = ConfigManager.buildMessagesWithGlobalPrompt(
                systemPrompt,
                userPrompt
            )
            
            const response = await this.apiClient.request(messages, {
                maxTokens: 65536,
                temperature: 0.8
            })
            
            this.content = response.choices[0].message.content.trim()
            
            const wordCount = WordCountValidator.countWords(this.content)
            
            this.validation = WordCountValidator.validateContinue(
                this.content,
                this.settings.wordCount || {}
            )
            
            const result = {
                content: this.content,
                wordCount: wordCount,
                validation: this.validation
            }
            
            this.notifyProgress({ stage: 'completed', message: '内容生成完成', progress: 100 })
            this.notifyComplete(result)
            
            return result
            
        } catch (error) {
            this.notifyError(error)
            throw error
        }
    }
    
    async generateStream(onChunk) {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        if (!this.outline) {
            throw new Error('大纲未设置')
        }
        
        this.notifyProgress({ stage: 'generating', message: '正在生成续写内容...', progress: 0 })
        
        try {
            const wordCountInstruction = this.buildWordCountInstruction()
            const stylePrompt = this.buildStylePrompt()
            
            const systemPrompt = this.buildSystemPrompt()
            const userPrompt = this.buildUserPrompt(wordCountInstruction, stylePrompt)
            
            const messages = ConfigManager.buildMessagesWithGlobalPrompt(
                systemPrompt,
                userPrompt
            )
            
            const response = await this.apiClient.requestStream(messages, {
                maxTokens: 65536,
                temperature: 0.8
            })
            
            this.content = ''
            
            for await (const chunk of response) {
                this.content += chunk
                if (onChunk) onChunk(this.content)
            }
            
            const wordCount = WordCountValidator.countWords(this.content)
            
            this.validation = WordCountValidator.validateContinue(
                this.content,
                this.settings.wordCount || {}
            )
            
            const result = {
                content: this.content,
                wordCount: wordCount,
                validation: this.validation
            }
            
            this.notifyProgress({ stage: 'completed', message: '内容生成完成', progress: 100 })
            this.notifyComplete(result)
            
            return result
            
        } catch (error) {
            this.notifyError(error)
            throw error
        }
    }
    
    buildSystemPrompt() {
        return `你是一位专业的小说作家。请根据章节大纲、文风要求和角色信息，撰写完整的章节内容。

要求：
1. 严格保持原文文风
2. 角色行为符合人设
3. 对话自然生动
4. 段落分明，节奏合理
5. 结尾设置悬念

请直接输出章节正文，不要添加标题或其他说明。`
    }
    
    buildUserPrompt(wordCountInstruction, stylePrompt) {
        let prompt = ''
        
        if (stylePrompt) {
            prompt += `${stylePrompt}\n\n`
        }
        
        if (wordCountInstruction) {
            prompt += `${wordCountInstruction}\n\n`
        }
        
        prompt += `章节大纲：
${JSON.stringify(this.outline, null, 2)}

`
        
        if (this.settings.roleCards) {
            prompt += `角色信息：
${JSON.stringify(this.settings.roleCards, null, 2)}

`
        }
        
        prompt += `请撰写第${this.chapterNum}章内容：`
        
        return prompt
    }
    
    buildWordCountInstruction() {
        if (!this.settings.wordCount) return ''
        
        return ContinueWordCountBuilder.buildPrompt(this.outline, this.settings.wordCount)
    }
    
    buildStylePrompt() {
        if (!this.settings.styleCardId) return ''
        
        return StyleCardApplier.buildStylePrompt(this.settings.styleCardId)
    }
    
    notifyProgress(data) {
        if (this.onProgress) {
            this.onProgress(data)
        }
    }
    
    notifyComplete(result) {
        if (this.onComplete) {
            this.onComplete(result)
        }
    }
    
    notifyError(error) {
        if (this.onError) {
            this.onError(error)
        }
    }
    
    getContent() {
        return this.content
    }
    
    getValidation() {
        return this.validation
    }
}

class ContinueExecutor {
    constructor(options = {}) {
        this.workspaceData = options.workspaceData || null
        this.settings = options.settings || {}
        this.apiClient = options.apiClient || null
        
        this.chapterStart = options.chapterStart || 1
        this.chapterEnd = options.chapterEnd || 1
        this.chapters = []
        
        this.currentChapterIndex = -1
        this.isRunning = false
        this.isPaused = false
        
        this.onChapterStart = options.onChapterStart || null
        this.onChapterProgress = options.onChapterProgress || null
        this.onChapterComplete = options.onChapterComplete || null
        this.onChapterError = options.onChapterError || null
        this.onAllComplete = options.onAllComplete || null
        this.onStatusChange = options.onStatusChange || null
        
        this.results = []
        this.errors = []
    }
    
    setApiClient(client) {
        this.apiClient = client
    }
    
    setWorkspaceData(data) {
        this.workspaceData = data
    }
    
    setSettings(settings) {
        this.settings = { ...this.settings, ...settings }
    }
    
    setChapterRange(start, end) {
        this.chapterStart = start
        this.chapterEnd = end
        this.initChapters()
    }
    
    setChapters(chapters) {
        this.chapters = chapters.map(ch => {
            if (typeof ch === 'object') {
                return {
                    chapterNum: ch.chapterNum,
                    status: ch.status || 'pending',
                    outline: ch.outline || null,
                    content: ch.content || null,
                    validation: ch.validation || null
                }
            }
            return {
                chapterNum: ch,
                status: 'pending',
                outline: null,
                content: null,
                validation: null
            }
        })
    }
    
    initChapters() {
        this.chapters = []
        for (let i = this.chapterStart; i <= this.chapterEnd; i++) {
            this.chapters.push({
                chapterNum: i,
                status: 'pending',
                outline: null,
                content: null,
                validation: null
            })
        }
    }
    
    async executeChapter(chapter, settings = null) {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        const chapterIndex = typeof chapter === 'number' ? chapter : this.chapters.findIndex(ch => ch.chapterNum === chapter.chapterNum)
        
        if (chapterIndex < 0 || chapterIndex >= this.chapters.length) {
            throw new Error('章节索引无效')
        }
        
        const targetChapter = this.chapters[chapterIndex]
        const useSettings = settings || this.settings
        
        this.notifyChapterStart(targetChapter, chapterIndex)
        targetChapter.status = 'outline_generating'
        
        try {
            const outlineGenerator = new ContinueOutlineGenerator({
                workspaceData: this.workspaceData,
                settings: useSettings,
                apiClient: this.apiClient,
                onProgress: (data) => {
                    this.notifyChapterProgress(targetChapter, { ...data, phase: 'outline' }, chapterIndex)
                }
            })
            
            const outline = await outlineGenerator.generate(targetChapter.chapterNum)
            targetChapter.outline = outline
            targetChapter.status = 'content_generating'
            
            this.notifyChapterProgress(targetChapter, { stage: 'outline_completed', phase: 'outline' }, chapterIndex)
            
            const contentGenerator = new ContinueContentGenerator({
                outline: outline,
                chapterNum: targetChapter.chapterNum,
                settings: {
                    ...useSettings,
                    roleCards: this.workspaceData?.roleCards
                },
                apiClient: this.apiClient,
                onProgress: (data) => {
                    this.notifyChapterProgress(targetChapter, { ...data, phase: 'content' }, chapterIndex)
                }
            })
            
            const result = await contentGenerator.generate()
            
            targetChapter.content = result.content
            targetChapter.wordCount = result.wordCount
            targetChapter.validation = result.validation
            targetChapter.status = 'completed'
            
            this.notifyChapterComplete(targetChapter, result, chapterIndex)
            
            return result
            
        } catch (error) {
            targetChapter.status = 'failed'
            targetChapter.error = error.message
            
            this.errors.push({
                chapterIndex: chapterIndex,
                chapterNum: targetChapter.chapterNum,
                error: error.message
            })
            
            this.notifyChapterError(targetChapter, error, chapterIndex)
            throw error
        }
    }
    
    async executeBatch(chapters, settings = null) {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        const useSettings = settings || this.settings
        
        if (chapters && chapters.length > 0) {
            this.setChapters(chapters)
        }
        
        this.isRunning = true
        this.isPaused = false
        this.results = []
        this.errors = []
        
        this.notifyStatusChange('running')
        
        for (let i = 0; i < this.chapters.length; i++) {
            if (!this.isRunning) {
                this.notifyStatusChange('stopped')
                return this.results
            }
            
            while (this.isPaused) {
                await this.sleep(500)
                if (!this.isRunning) {
                    this.notifyStatusChange('stopped')
                    return this.results
                }
            }
            
            this.currentChapterIndex = i
            
            try {
                const result = await this.executeChapter(i, useSettings)
                this.results.push({
                    chapterIndex: i,
                    chapterNum: this.chapters[i].chapterNum,
                    result: result
                })
            } catch (error) {
                console.error(`章节 ${this.chapters[i].chapterNum} 续写失败:`, error)
            }
        }
        
        this.isRunning = false
        this.notifyStatusChange('completed')
        this.notifyAllComplete(this.chapters, this.results, this.errors)
        
        return this.results
    }
    
    async executeAll() {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        this.initChapters()
        
        this.isRunning = true
        this.isPaused = false
        this.results = []
        this.errors = []
        
        this.notifyStatusChange('running')
        
        for (let i = 0; i < this.chapters.length; i++) {
            if (!this.isRunning) {
                this.notifyStatusChange('stopped')
                return this.results
            }
            
            while (this.isPaused) {
                await this.sleep(500)
                if (!this.isRunning) {
                    this.notifyStatusChange('stopped')
                    return this.results
                }
            }
            
            this.currentChapterIndex = i
            
            try {
                const result = await this.executeChapter(i, this.settings)
                this.results.push({
                    chapterIndex: i,
                    chapterNum: this.chapters[i].chapterNum,
                    result: result
                })
            } catch (error) {
                console.error(`章节 ${this.chapters[i].chapterNum} 续写失败:`, error)
            }
        }
        
        this.isRunning = false
        this.notifyStatusChange('completed')
        this.notifyAllComplete(this.chapters, this.results, this.errors)
        
        return this.results
    }
    
    pause() {
        this.isPaused = true
        this.notifyStatusChange('paused')
    }
    
    resume() {
        this.isPaused = false
        this.notifyStatusChange('running')
    }
    
    stop() {
        this.isRunning = false
        this.isPaused = false
        this.notifyStatusChange('stopped')
    }
    
    retryChapter(chapterIndex) {
        const chapter = this.chapters[chapterIndex]
        if (chapter) {
            chapter.status = 'pending'
            chapter.error = null
            
            const errorIndex = this.errors.findIndex(e => e.chapterIndex === chapterIndex)
            if (errorIndex !== -1) {
                this.errors.splice(errorIndex, 1)
            }
        }
    }
    
    getStats() {
        const completed = this.chapters.filter(ch => ch.status === 'completed').length
        const pending = this.chapters.filter(ch => ch.status === 'pending').length
        const failed = this.chapters.filter(ch => ch.status === 'failed').length
        const processing = this.chapters.filter(ch => 
            ['outline_generating', 'content_generating'].includes(ch.status)
        ).length
        
        return {
            total: this.chapters.length,
            completed,
            pending,
            failed,
            processing,
            percentage: this.chapters.length > 0 ? Math.round((completed / this.chapters.length) * 100) : 0
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    notifyChapterStart(chapter, index) {
        if (this.onChapterStart) {
            this.onChapterStart(chapter, index)
        }
    }
    
    notifyChapterProgress(chapter, data, index) {
        if (this.onChapterProgress) {
            this.onChapterProgress(chapter, data, index)
        }
    }
    
    notifyChapterComplete(chapter, result, index) {
        if (this.onChapterComplete) {
            this.onChapterComplete(chapter, result, index)
        }
    }
    
    notifyChapterError(chapter, error, index) {
        if (this.onChapterError) {
            this.onChapterError(chapter, error, index)
        }
    }
    
    notifyAllComplete(chapters, results, errors) {
        if (this.onAllComplete) {
            this.onAllComplete(chapters, results, errors)
        }
    }
    
    notifyStatusChange(status) {
        if (this.onStatusChange) {
            this.onStatusChange(status)
        }
    }
    
    exportResults() {
        let content = ''
        
        this.chapters.forEach(chapter => {
            if (chapter.content) {
                content += `${chapter.outline?.title || `第${chapter.chapterNum}章`}\n\n`
                content += chapter.content
                content += '\n\n'
            }
        })
        
        return content
    }
    
    exportWithStats() {
        const stats = this.getStats()
        let content = `# 续写统计报告\n\n`
        content += `总章节：${stats.total}\n`
        content += `已完成：${stats.completed}\n`
        content += `失败：${stats.failed}\n\n`
        content += `---\n\n`
        
        this.chapters.forEach(chapter => {
            content += `${chapter.outline?.title || `第${chapter.chapterNum}章`}\n\n`
            
            if (chapter.content) {
                content += `字数：${chapter.wordCount || 0} 字`
                content += chapter.validation && chapter.validation.isValid ? ' ✓' : ' ⚠'
                content += `\n\n`
                content += chapter.content
            } else {
                content += `状态：${chapter.status}\n`
                if (chapter.error) {
                    content += `错误：${chapter.error}\n`
                }
            }
            
            content += '\n\n'
        })
        
        return content
    }
}

export { 
    ContinueOutlineGenerator,
    ContinueContentGenerator, 
    ContinueExecutor 
}
