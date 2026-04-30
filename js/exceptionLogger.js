/**
 * 异常日志记录模块
 * 提供错误捕获、日志记录、用户提示等功能
 */

/**
 * 异常日志记录器
 */
class ExceptionLogger {
    constructor(options = {}) {
        this.maxLogs = options.maxLogs || 100
        this.enableConsole = options.enableConsole !== false
        this.enableStorage = options.enableStorage !== false
        this.enableUI = options.enableUI !== false
        this.logs = []
        this.listeners = []
        
        this.setupGlobalErrorHandler()
    }
    
    /**
     * 设置全局错误处理器
     */
    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            this.log({
                type: 'error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                timestamp: Date.now()
            })
        })
        
        window.addEventListener('unhandledrejection', (event) => {
            this.log({
                type: 'promise',
                message: event.reason.message || String(event.reason),
                stack: event.reason.stack || null,
                timestamp: Date.now()
            })
        })
    }
    
    /**
     * 记录日志
     */
    log(logEntry) {
        const log = {
            ...logEntry,
            id: this.generateId(),
            timestamp: logEntry.timestamp || Date.now()
        }
        
        this.logs.push(log)
        
        if (this.logs.length > this.maxLogs) {
            this.logs.shift()
        }
        
        if (this.enableConsole) {
            this.logToConsole(log)
        }
        
        if (this.enableStorage) {
            this.logToStorage(log)
        }
        
        if (this.enableUI) {
            this.logToUI(log)
        }
        
        this.notifyListeners(log)
        
        return log
    }
    
    /**
     * 生成日志ID
     */
    generateId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    /**
     * 输出到控制台
     */
    logToConsole(log) {
        const timestamp = new Date(log.timestamp).toLocaleString('zh-CN')
        const prefix = `[${timestamp}] [${log.type.toUpperCase()}]`
        
        switch (log.type) {
            case 'error':
                console.error(prefix, log.message, log)
                break
            case 'warning':
                console.warn(prefix, log.message, log)
                break
            case 'info':
                console.info(prefix, log.message, log)
                break
            case 'debug':
                console.debug(prefix, log.message, log)
                break
            default:
                console.log(prefix, log.message, log)
        }
    }
    
    /**
     * 存储到localStorage
     */
    logToStorage(log) {
        try {
            const logs = JSON.parse(localStorage.getItem('exception_logs') || '[]')
            logs.push(log)
            
            if (logs.length > this.maxLogs) {
                logs.shift()
            }
            
            localStorage.setItem('exception_logs', JSON.stringify(logs))
        } catch (error) {
            console.error('日志存储失败:', error)
        }
    }
    
    /**
     * 显示到UI
     */
    logToUI(log) {
        const container = document.getElementById('error-toast-container')
        if (!container) return
        
        const toast = document.createElement('div')
        toast.className = `error-toast ${this.getToastClass(log.type)}`
        toast.innerHTML = `
            <div class="flex items-center">
                <span class="text-2xl mr-3">${this.getToastIcon(log.type)}</span>
                <div>
                    <div class="font-semibold">${this.getToastTitle(log.type)}</div>
                    <div class="text-sm">${log.message}</div>
                </div>
            </div>
        `
        
        container.appendChild(toast)
        
        setTimeout(() => {
            toast.remove()
        }, 5000)
    }
    
    /**
     * 获取Toast样式类
     */
    getToastClass(type) {
        const classes = {
            error: 'bg-red-900 border-red-700',
            warning: 'bg-yellow-900 border-yellow-700',
            info: 'bg-blue-900 border-blue-700',
            success: 'bg-green-900 border-green-700',
            debug: 'bg-gray-900 border-gray-700'
        }
        return classes[type] || classes.info
    }
    
    /**
     * 获取Toast图标
     */
    getToastIcon(type) {
        const icons = {
            error: '✗',
            warning: '⚠',
            info: 'ℹ',
            success: '✓',
            debug: '🔍'
        }
        return icons[type] || icons.info
    }
    
    /**
     * 获取Toast标题
     */
    getToastTitle(type) {
        const titles = {
            error: '错误',
            warning: '警告',
            info: '提示',
            success: '成功',
            debug: '调试'
        }
        return titles[type] || titles.info
    }
    
    /**
     * 记录错误
     */
    error(message, data = {}) {
        return this.log({
            type: 'error',
            message,
            ...data
        })
    }
    
    /**
     * 记录警告
     */
    warning(message, data = {}) {
        return this.log({
            type: 'warning',
            message,
            ...data
        })
    }
    
    /**
     * 记录信息
     */
    info(message, data = {}) {
        return this.log({
            type: 'info',
            message,
            ...data
        })
    }
    
    /**
     * 记录调试信息
     */
    debug(message, data = {}) {
        return this.log({
            type: 'debug',
            message,
            ...data
        })
    }
    
    /**
     * 记录成功信息
     */
    success(message, data = {}) {
        return this.log({
            type: 'success',
            message,
            ...data
        })
    }
    
    /**
     * 获取所有日志
     */
    getLogs() {
        return [...this.logs]
    }
    
    /**
     * 获取指定类型的日志
     */
    getLogsByType(type) {
        return this.logs.filter(log => log.type === type)
    }
    
    /**
     * 清除所有日志
     */
    clearLogs() {
        this.logs = []
        localStorage.removeItem('exception_logs')
    }
    
    /**
     * 导出日志
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2)
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
    notifyListeners(log) {
        this.listeners.forEach(callback => callback(log))
    }
}

/**
 * 错误边界类
 */
class ErrorBoundary {
    constructor(logger) {
        this.logger = logger
        this.errorComponents = new Map()
    }
    
    /**
     * 包装异步函数
     */
    wrapAsync(fn, context = null) {
        return async (...args) => {
            try {
                return await fn.apply(context, args)
            } catch (error) {
                this.logger.error(`异步函数执行失败: ${error.message}`, {
                    function: fn.name,
                    arguments: args,
                    stack: error.stack
                })
                throw error
            }
        }
    }
    
    /**
     * 包装同步函数
     */
    wrapSync(fn, context = null) {
        return (...args) => {
            try {
                return fn.apply(context, args)
            } catch (error) {
                this.logger.error(`同步函数执行失败: ${error.message}`, {
                    function: fn.name,
                    arguments: args,
                    stack: error.stack
                })
                throw error
            }
        }
    }
    
    /**
     * 注册错误组件
     */
    registerErrorComponent(componentId, fallback) {
        this.errorComponents.set(componentId, fallback)
    }
    
    /**
     * 处理组件错误
     */
    handleComponentError(componentId, error) {
        this.logger.error(`组件错误: ${error.message}`, {
            componentId,
            stack: error.stack
        })
        
        const fallback = this.errorComponents.get(componentId)
        if (fallback) {
            return fallback(error)
        }
        
        return null
    }
}

/**
 * 用户提示管理器
 */
class UserNotifier {
    constructor() {
        this.container = null
        this.createContainer()
    }
    
    /**
     * 创建容器
     */
    createContainer() {
        this.container = document.createElement('div')
        this.container.id = 'user-notifier-container'
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2'
        document.body.appendChild(this.container)
    }
    
    /**
     * 显示提示
     */
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div')
        notification.className = `notification ${this.getNotificationClass(type)}`
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <span class="text-2xl mr-3">${this.getNotificationIcon(type)}</span>
                    <span>${message}</span>
                </div>
                <button class="ml-4 text-white hover:text-gray-300" onclick="this.parentElement.parentElement.remove()">
                    ✕
                </button>
            </div>
        `
        
        this.container.appendChild(notification)
        
        setTimeout(() => {
            notification.classList.add('fade-out')
            setTimeout(() => notification.remove(), 300)
        }, duration)
        
        return notification
    }
    
    /**
     * 获取提示样式类
     */
    getNotificationClass(type) {
        const classes = {
            success: 'bg-green-900 border border-green-700 text-white',
            error: 'bg-red-900 border border-red-700 text-white',
            warning: 'bg-yellow-900 border border-yellow-700 text-white',
            info: 'bg-blue-900 border border-blue-700 text-white'
        }
        return classes[type] || classes.info
    }
    
    /**
     * 获取提示图标
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        }
        return icons[type] || icons.info
    }
    
    /**
     * 成功提示
     */
    success(message, duration = 3000) {
        return this.show(message, 'success', duration)
    }
    
    /**
     * 错误提示
     */
    error(message, duration = 4000) {
        return this.show(message, 'error', duration)
    }
    
    /**
     * 警告提示
     */
    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration)
    }
    
    /**
     * 信息提示
     */
    info(message, duration = 3000) {
        return this.show(message, 'info', duration)
    }
    
    /**
     * 清除所有提示
     */
    clearAll() {
        this.container.innerHTML = ''
    }
}

const logger = new ExceptionLogger({
    enableConsole: true,
    enableStorage: true,
    enableUI: true,
    maxLogs: 100
})

const errorBoundary = new ErrorBoundary(logger)
const userNotifier = new UserNotifier()

export { ExceptionLogger, ErrorBoundary, UserNotifier, logger, errorBoundary, userNotifier }
