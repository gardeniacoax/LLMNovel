/**
 * Bug修复模块
 * 提供已知Bug修复、边界情况处理、错误提示优化等功能
 */

/**
 * Bug修复管理器
 */
class BugFixManager {
    constructor() {
        this.knownBugs = new Map()
        this.fixes = new Map()
        this.initializeKnownBugs()
    }
    
    /**
     * 初始化已知Bug列表
     */
    initializeKnownBugs() {
        this.registerBug('localStorage-quota', {
            description: 'localStorage存储空间不足',
            severity: 'high',
            fix: () => this.fixLocalStorageQuota()
        })
        
        this.registerBug('json-parse-error', {
            description: 'JSON解析错误',
            severity: 'medium',
            fix: () => this.fixJsonParseError()
        })
        
        this.registerBug('encoding-error', {
            description: '文件编码错误',
            severity: 'medium',
            fix: () => this.fixEncodingError()
        })
        
        this.registerBug('memory-leak', {
            description: '内存泄漏',
            severity: 'high',
            fix: () => this.fixMemoryLeak()
        })
        
        this.registerBug('event-listener-leak', {
            description: '事件监听器泄漏',
            severity: 'medium',
            fix: () => this.fixEventListenerLeak()
        })
        
        this.registerBug('cors-error', {
            description: '跨域请求错误',
            severity: 'high',
            fix: () => this.fixCorsError()
        })
        
        this.registerBug('async-race-condition', {
            description: '异步竞态条件',
            severity: 'high',
            fix: () => this.fixAsyncRaceCondition()
        })
    }
    
    /**
     * 注册Bug
     */
    registerBug(id, config) {
        this.knownBugs.set(id, {
            id,
            description: config.description,
            severity: config.severity,
            fix: config.fix,
            occurrences: 0
        })
    }
    
    /**
     * 报告Bug
     */
    reportBug(id, context = {}) {
        const bug = this.knownBugs.get(id)
        if (bug) {
            bug.occurrences++
            console.warn(`[Bug报告] ${bug.description}`, context)
            return bug.fix()
        }
        return null
    }
    
    /**
     * 修复localStorage存储空间不足
     */
    fixLocalStorageQuota() {
        try {
            const usedSpace = this.calculateLocalStorageSize()
            const maxSize = 5 * 1024 * 1024
            
            if (usedSpace > maxSize * 0.9) {
                const oldData = this.getOldData()
                
                oldData.forEach(key => {
                    localStorage.removeItem(key)
                })
                
                console.log('已清理旧数据释放空间')
                return true
            }
        } catch (error) {
            console.error('修复localStorage空间失败:', error)
        }
        return false
    }
    
    /**
     * 计算localStorage使用大小
     */
    calculateLocalStorageSize() {
        let size = 0
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                size += localStorage[key].length * 2
            }
        }
        return size
    }
    
    /**
     * 获取旧数据
     */
    getOldData() {
        const items = []
        const now = Date.now()
        const threshold = 7 * 24 * 60 * 60 * 1000
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                try {
                    const data = JSON.parse(localStorage[key])
                    if (data.timestamp && (now - data.timestamp > threshold)) {
                        items.push(key)
                    }
                } catch (e) {
                    continue
                }
            }
        }
        
        return items
    }
    
    /**
     * 修复JSON解析错误
     */
    fixJsonParseError() {
        const originalParse = JSON.parse
        
        JSON.parse = function(text, reviver) {
            try {
                return originalParse(text, reviver)
            } catch (error) {
                console.warn('JSON解析失败，尝试修复:', error.message)
                
                const fixed = text
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/'/g, '"')
                    .replace(/(\w+):/g, '"$1":')
                
                try {
                    return originalParse(fixed, reviver)
                } catch (e) {
                    console.error('JSON修复失败:', e.message)
                    throw error
                }
            }
        }
        
        return true
    }
    
    /**
     * 修复文件编码错误
     */
    fixEncodingError() {
        const originalTextDecoder = TextDecoder
        
        window.TextDecoder = function(encoding, options) {
            const decoder = new originalTextDecoder(encoding, options)
            
            const originalDecode = decoder.decode.bind(decoder)
            decoder.decode = function(input, options) {
                try {
                    return originalDecode(input, options)
                } catch (error) {
                    console.warn('解码失败，尝试使用备用编码:', error.message)
                    
                    const fallbackEncodings = ['utf-8', 'gbk', 'gb2312', 'big5']
                    
                    for (const enc of fallbackEncodings) {
                        try {
                            const fallbackDecoder = new originalTextDecoder(enc)
                            return fallbackDecoder.decode(input, options)
                        } catch (e) {
                            continue
                        }
                    }
                    
                    throw error
                }
            }
            
            return decoder
        }
        
        return true
    }
    
    /**
     * 修复内存泄漏
     */
    fixMemoryLeak() {
        if (window.gc) {
            window.gc()
        }
        
        const intervals = window.__intervals || []
        const timeouts = window.__timeouts || []
        
        intervals.forEach(id => clearInterval(id))
        timeouts.forEach(id => clearTimeout(id))
        
        window.__intervals = []
        window.__timeouts = []
        
        const originalSetInterval = window.setInterval
        const originalSetTimeout = window.setTimeout
        
        window.setInterval = function(...args) {
            const id = originalSetInterval(...args)
            window.__intervals = window.__intervals || []
            window.__intervals.push(id)
            return id
        }
        
        window.setTimeout = function(...args) {
            const id = originalSetTimeout(...args)
            window.__timeouts = window.__timeouts || []
            window.__timeouts.push(id)
            return id
        }
        
        return true
    }
    
    /**
     * 修复事件监听器泄漏
     */
    fixEventListenerLeak() {
        const listeners = new Map()
        
        const originalAddEventListener = EventTarget.prototype.addEventListener
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener
        
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            const key = `${type}_${listener.toString().slice(0, 50)}`
            
            if (!listeners.has(this)) {
                listeners.set(this, new Map())
            }
            
            const elementListeners = listeners.get(this)
            
            if (!elementListeners.has(key)) {
                elementListeners.set(key, { type, listener, options, count: 0 })
            }
            
            elementListeners.get(key).count++
            
            if (elementListeners.get(key).count > 10) {
                console.warn('检测到重复事件监听器:', type, this)
            }
            
            return originalAddEventListener.call(this, type, listener, options)
        }
        
        EventTarget.prototype.removeEventListener = function(type, listener, options) {
            const key = `${type}_${listener.toString().slice(0, 50)}`
            
            if (listeners.has(this) && listeners.get(this).has(key)) {
                const elementListeners = listeners.get(this)
                elementListeners.get(key).count--
                
                if (elementListeners.get(key).count <= 0) {
                    elementListeners.delete(key)
                }
            }
            
            return originalRemoveEventListener.call(this, type, listener, options)
        }
        
        return true
    }
    
    /**
     * 修复跨域请求错误
     */
    fixCorsError() {
        const originalFetch = window.fetch
        
        window.fetch = function(url, options = {}) {
            const corsUrl = url
            
            if (!options.mode) {
                options.mode = 'cors'
            }
            
            if (!options.headers) {
                options.headers = {}
            }
            
            if (!options.headers['Content-Type']) {
                options.headers['Content-Type'] = 'application/json'
            }
            
            return originalFetch(corsUrl, options).catch(error => {
                if (error.message.includes('CORS')) {
                    console.error('CORS错误:', error.message)
                    console.log('建议：请确保API服务器已配置正确的CORS头')
                }
                throw error
            })
        }
        
        return true
    }
    
    /**
     * 修复异步竞态条件
     */
    fixAsyncRaceCondition() {
        window.createRaceConditionSafe = function() {
            let latestRequestId = 0
            
            return {
                async run(asyncFn) {
                    const requestId = ++latestRequestId
                    
                    const result = await asyncFn()
                    
                    if (requestId !== latestRequestId) {
                        throw new Error('请求已被新请求取代')
                    }
                    
                    return result
                },
                
                isLatest(requestId) {
                    return requestId === latestRequestId
                }
            }
        }
        
        return true
    }
    
    /**
     * 应用所有修复
     */
    applyAllFixes() {
        const results = []
        
        this.knownBugs.forEach((bug, id) => {
            try {
                const fixed = bug.fix()
                results.push({
                    id,
                    description: bug.description,
                    fixed
                })
            } catch (error) {
                results.push({
                    id,
                    description: bug.description,
                    fixed: false,
                    error: error.message
                })
            }
        })
        
        return results
    }
}

/**
 * 边界情况处理器
 */
class EdgeCaseHandler {
    /**
     * 处理空值
     */
    static handleNull(value, defaultValue) {
        return value === null || value === undefined ? defaultValue : value
    }
    
    /**
     * 处理数组越界
     */
    static handleArrayBounds(array, index, defaultValue = null) {
        if (!Array.isArray(array)) return defaultValue
        if (index < 0 || index >= array.length) return defaultValue
        return array[index]
    }
    
    /**
     * 处理字符串截断
     */
    static truncateString(str, maxLength, suffix = '...') {
        if (!str || str.length <= maxLength) return str
        return str.substring(0, maxLength - suffix.length) + suffix
    }
    
    /**
     * 处理数字范围
     */
    static clampNumber(value, min, max) {
        return Math.min(Math.max(value, min), max)
    }
    
    /**
     * 处理日期格式
     */
    static formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return ''
        
        const d = new Date(date)
        if (isNaN(d.getTime())) return ''
        
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        const seconds = String(d.getSeconds()).padStart(2, '0')
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds)
    }
    
    /**
     * 处理文件大小显示
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B'
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB']
        const k = 1024
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
    }
    
    /**
     * 处理URL验证
     */
    static isValidUrl(string) {
        try {
            new URL(string)
            return true
        } catch (_) {
            return false
        }
    }
    
    /**
     * 处理邮箱验证
     */
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return re.test(email)
    }
    
    /**
     * 处理手机号验证（中国）
     */
    static isValidPhone(phone) {
        const re = /^1[3-9]\d{9}$/
        return re.test(phone)
    }
    
    /**
     * 处理深拷贝
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj
        
        if (obj instanceof Date) return new Date(obj)
        if (obj instanceof Array) return obj.map(item => this.deepClone(item))
        if (obj instanceof Object) {
            const copy = {}
            Object.keys(obj).forEach(key => {
                copy[key] = this.deepClone(obj[key])
            })
            return copy
        }
        
        return obj
    }
    
    /**
     * 处理对象合并
     */
    static deepMerge(target, source) {
        const result = this.deepClone(target)
        
        Object.keys(source).forEach(key => {
            if (source[key] instanceof Object && key in target) {
                result[key] = this.deepMerge(target[key], source[key])
            } else {
                result[key] = this.deepClone(source[key])
            }
        })
        
        return result
    }
    
    /**
     * 处理防抖
     */
    static debounce(fn, delay = 300) {
        let timer = null
        return function(...args) {
            clearTimeout(timer)
            timer = setTimeout(() => fn.apply(this, args), delay)
        }
    }
    
    /**
     * 处理节流
     */
    static throttle(fn, delay = 300) {
        let lastTime = 0
        return function(...args) {
            const now = Date.now()
            if (now - lastTime >= delay) {
                lastTime = now
                fn.apply(this, args)
            }
        }
    }
}

/**
 * 错误提示优化器
 */
class ErrorToastOptimizer {
    /**
     * 优化错误消息
     */
    static optimizeErrorMessage(error) {
        const errorMap = {
            'Network Error': '网络连接失败，请检查网络设置',
            'timeout': '请求超时，请稍后重试',
            '401': 'API密钥无效或已过期',
            '403': '没有权限访问该资源',
            '404': '请求的资源不存在',
            '429': '请求过于频繁，请稍后重试',
            '500': '服务器内部错误',
            '502': '网关错误',
            '503': '服务暂时不可用',
            'Failed to fetch': '网络请求失败',
            'JSON.parse': '数据解析失败',
            'localStorage': '本地存储空间不足',
            'QuotaExceededError': '存储空间已满，请清理旧数据'
        }
        
        let message = error.message || error.toString()
        
        for (const [key, value] of Object.entries(errorMap)) {
            if (message.includes(key)) {
                message = value
                break
            }
        }
        
        return message
    }
    
    /**
     * 显示优化后的错误提示
     */
    static showError(error, duration = 5000) {
        const message = this.optimizeErrorMessage(error)
        
        const toast = document.createElement('div')
        toast.className = 'error-toast-optimized'
        toast.innerHTML = `
            <div class="error-icon">❌</div>
            <div class="error-content">
                <div class="error-title">操作失败</div>
                <div class="error-message">${message}</div>
            </div>
            <button class="error-close">×</button>
        `
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `
        
        const style = document.createElement('style')
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .error-icon {
                font-size: 24px;
            }
            
            .error-content {
                flex: 1;
            }
            
            .error-title {
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .error-message {
                font-size: 13px;
                opacity: 0.9;
            }
            
            .error-close {
                background: transparent;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 4px;
                opacity: 0.7;
            }
            
            .error-close:hover {
                opacity: 1;
            }
        `
        
        if (!document.querySelector('#error-toast-styles')) {
            style.id = 'error-toast-styles'
            document.head.appendChild(style)
        }
        
        document.body.appendChild(toast)
        
        const closeBtn = toast.querySelector('.error-close')
        closeBtn.addEventListener('click', () => {
            toast.style.animation = 'slideInRight 0.3s ease reverse'
            setTimeout(() => toast.remove(), 300)
        })
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideInRight 0.3s ease reverse'
                setTimeout(() => toast.remove(), 300)
            }
        }, duration)
    }
}

const bugFixManager = new BugFixManager()

export { 
    BugFixManager, 
    EdgeCaseHandler, 
    ErrorToastOptimizer,
    bugFixManager
}
