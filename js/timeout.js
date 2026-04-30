/**
 * 网络超时管理模块
 * 本地程序，默认无超时限制
 */

/**
 * 超时管理器
 */
class TimeoutManager {
    constructor() {
        this.defaultTimeout = 0
        this.timeouts = new Map()
        this.requestStats = {
            total: 0,
            success: 0,
            failed: 0,
            timeout: 0
        }
    }
    
    /**
     * 带超时的fetch请求（timeout为0时无限制）
     */
    fetchWithTimeout(url, options = {}, timeout = this.defaultTimeout) {
        return new Promise((resolve, reject) => {
            const controller = new AbortController()
            const signal = controller.signal
            
            let timeoutId = null
            if (timeout > 0) {
                timeoutId = setTimeout(() => {
                    controller.abort()
                    this.requestStats.timeout++
                    reject(new Error(`请求超时 (${timeout / 1000}秒)`))
                }, timeout)
            }
            
            this.requestStats.total++
            
            fetch(url, { ...options, signal })
                .then(response => {
                    if (timeoutId) clearTimeout(timeoutId)
                    this.requestStats.success++
                    resolve(response)
                })
                .catch(error => {
                    if (timeoutId) clearTimeout(timeoutId)
                    this.requestStats.failed++
                    
                    if (error.name === 'AbortError') {
                        reject(new Error('请求被取消'))
                    } else {
                        reject(error)
                    }
                })
        })
    }
    
    /**
     * 带重试机制的请求
     */
    async requestWithRetry(requestFn, options = {}) {
        const {
            maxRetries = 3,
            retryDelay = 1000,
            timeout = this.defaultTimeout,
            onRetry = null
        } = options
        
        let lastError = null
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.fetchWithTimeout(
                    requestFn.url,
                    requestFn.options,
                    timeout
                )
                return result
            } catch (error) {
                lastError = error
                
                if (attempt < maxRetries) {
                    console.warn(`请求失败，${retryDelay * attempt}ms后重试 (${attempt}/${maxRetries})`)
                    
                    if (onRetry) {
                        onRetry(attempt, error)
                    }
                    
                    await this.delay(retryDelay * attempt)
                }
            }
        }
        
        throw lastError
    }
    
    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    /**
     * 设置命名超时
     */
    setTimeout(name, callback, delay) {
        this.clearTimeout(name)
        const timeoutId = setTimeout(callback, delay)
        this.timeouts.set(name, timeoutId)
    }
    
    /**
     * 清除命名超时
     */
    clearTimeout(name) {
        if (this.timeouts.has(name)) {
            clearTimeout(this.timeouts.get(name))
            this.timeouts.delete(name)
        }
    }
    
    /**
     * 清除所有超时
     */
    clearAllTimeouts() {
        this.timeouts.forEach(timeoutId => clearTimeout(timeoutId))
        this.timeouts.clear()
    }
    
    /**
     * 获取请求统计
     */
    getStats() {
        return { ...this.requestStats }
    }
    
    /**
     * 重置统计
     */
    resetStats() {
        this.requestStats = {
            total: 0,
            success: 0,
            failed: 0,
            timeout: 0
        }
    }
    
    /**
     * 设置默认超时时间
     */
    setDefaultTimeout(timeout) {
        this.defaultTimeout = timeout
    }
}

/**
 * 请求队列管理器
 */
class RequestQueue {
    constructor(maxConcurrent = 5) {
        this.maxConcurrent = maxConcurrent
        this.queue = []
        this.active = 0
    }
    
    /**
     * 添加请求到队列
     */
    async add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                requestFn,
                resolve,
                reject
            })
            this.process()
        })
    }
    
    /**
     * 处理队列
     */
    async process() {
        if (this.active >= this.maxConcurrent || this.queue.length === 0) {
            return
        }
        
        this.active++
        const { requestFn, resolve, reject } = this.queue.shift()
        
        try {
            const result = await requestFn()
            resolve(result)
        } catch (error) {
            reject(error)
        } finally {
            this.active--
            this.process()
        }
    }
    
    /**
     * 清空队列
     */
    clear() {
        this.queue = []
    }
    
    /**
     * 获取队列长度
     */
    getLength() {
        return this.queue.length
    }
    
    /**
     * 获取活动请求数
     */
    getActiveCount() {
        return this.active
    }
}

/**
 * 请求缓存管理器
 */
class RequestCache {
    constructor(maxSize = 100, ttl = 300000) {
        this.maxSize = maxSize
        this.ttl = ttl
        this.cache = new Map()
    }
    
    /**
     * 生成缓存键
     */
    generateKey(url, options) {
        const method = options.method || 'GET'
        const body = options.body || ''
        return `${method}:${url}:${typeof body === 'string' ? body : JSON.stringify(body)}`
    }
    
    /**
     * 获取缓存
     */
    get(url, options) {
        const key = this.generateKey(url, options)
        const cached = this.cache.get(key)
        
        if (!cached) {
            return null
        }
        
        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(key)
            return null
        }
        
        return cached.data
    }
    
    /**
     * 设置缓存
     */
    set(url, options, data) {
        const key = this.generateKey(url, options)
        
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value
            this.cache.delete(firstKey)
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        })
    }
    
    /**
     * 清除缓存
     */
    clear() {
        this.cache.clear()
    }
    
    /**
     * 获取缓存大小
     */
    getSize() {
        return this.cache.size
    }
}

/**
 * 网络状态监控器
 */
class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine
        this.listeners = []
        this.setupListeners()
    }
    
    /**
     * 设置监听器
     */
    setupListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true
            this.notifyListeners('online')
        })
        
        window.addEventListener('offline', () => {
            this.isOnline = false
            this.notifyListeners('offline')
        })
    }
    
    /**
     * 添加监听器
     */
    addListener(callback) {
        this.listeners.push(callback)
    }
    
    /**
     * 移除监听器
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback)
        if (index > -1) {
            this.listeners.splice(index, 1)
        }
    }
    
    /**
     * 通知监听器
     */
    notifyListeners(status) {
        this.listeners.forEach(callback => callback(status))
    }
    
    /**
     * 获取网络状态
     */
    getStatus() {
        return this.isOnline
    }
}

export { TimeoutManager, RequestQueue, RequestCache, NetworkMonitor }
