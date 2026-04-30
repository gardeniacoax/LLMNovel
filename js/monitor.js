class ErrorHandler {
    constructor() {
        this.errors = []
        this.maxErrors = 100
        this.errorCallbacks = []
        
        this.setupGlobalErrorHandler()
    }
    
    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                timestamp: Date.now()
            })
        })
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason ? event.reason.message : 'Unhandled Promise Rejection',
                stack: event.reason ? event.reason.stack : null,
                timestamp: Date.now()
            })
        })
    }
    
    handleError(error) {
        const errorInfo = {
            id: Date.now(),
            ...error,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: error.timestamp || Date.now()
        }
        
        this.errors.unshift(errorInfo)
        
        if (this.errors.length > this.maxErrors) {
            this.errors.pop()
        }
        
        this.errorCallbacks.forEach(callback => {
            try {
                callback(errorInfo)
            } catch (e) {
                console.error('Error callback failed:', e)
            }
        })
        
        console.error('Error captured:', errorInfo)
        
        return errorInfo
    }
    
    onError(callback) {
        this.errorCallbacks.push(callback)
    }
    
    getErrors() {
        return this.errors
    }
    
    clearErrors() {
        this.errors = []
    }
    
    getError(id) {
        return this.errors.find(e => e.id === id)
    }
    
    exportErrors() {
        const blob = new Blob([JSON.stringify(this.errors, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `errors_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }
}

class Logger {
    constructor() {
        this.logs = []
        this.maxLogs = 1000
        this.level = 'info'
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        }
    }
    
    setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.level = level
        }
    }
    
    log(level, message, data = {}) {
        if (this.levels[level] < this.levels[this.level]) {
            return
        }
        
        const logEntry = {
            id: Date.now(),
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            url: window.location.href
        }
        
        this.logs.unshift(logEntry)
        
        if (this.logs.length > this.maxLogs) {
            this.logs.pop()
        }
        
        const consoleMethod = level === 'debug' ? 'log' : level
        console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data)
        
        return logEntry
    }
    
    debug(message, data = {}) {
        return this.log('debug', message, data)
    }
    
    info(message, data = {}) {
        return this.log('info', message, data)
    }
    
    warn(message, data = {}) {
        return this.log('warn', message, data)
    }
    
    error(message, data = {}) {
        return this.log('error', message, data)
    }
    
    getLogs(level = null) {
        if (level) {
            return this.logs.filter(log => log.level === level)
        }
        return this.logs
    }
    
    clearLogs() {
        this.logs = []
    }
    
    exportLogs() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `logs_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }
    
    searchLogs(query) {
        const lowerQuery = query.toLowerCase()
        return this.logs.filter(log => 
            log.message.toLowerCase().includes(lowerQuery) ||
            JSON.stringify(log.data).toLowerCase().includes(lowerQuery)
        )
    }
}

class ErrorBoundary {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container
        this.options = {
            fallbackUI: options.fallbackUI || this.getDefaultFallbackUI(),
            onError: options.onError || null,
            showDetails: options.showDetails !== false,
            ...options
        }
        
        this.hasError = false
        this.error = null
    }
    
    getDefaultFallbackUI() {
        return `
            <div class="error-boundary p-8 bg-red-900/20 border border-red-700 rounded-lg">
                <div class="flex items-center mb-4">
                    <svg class="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <h2 class="text-xl font-bold text-red-400">出现错误</h2>
                </div>
                <p class="text-slate-300 mb-4">抱歉，页面出现了错误。请刷新页面重试。</p>
                <div class="flex space-x-3">
                    <button onclick="location.reload()" class="btn btn-primary">刷新页面</button>
                    <button onclick="this.parentElement.parentElement.style.display='none'" class="btn btn-secondary">关闭</button>
                </div>
            </div>
        `
    }
    
    catch(error, errorInfo = {}) {
        this.hasError = true
        this.error = {
            error,
            ...errorInfo,
            timestamp: Date.now()
        }
        
        if (this.options.onError) {
            this.options.onError(this.error)
        }
        
        this.render()
        
        return this.error
    }
    
    render() {
        if (!this.hasError) {
            return
        }
        
        let html = this.options.fallbackUI
        
        if (this.options.showDetails && this.error) {
            html += `
                <div class="error-details mt-4 p-4 bg-slate-800 rounded text-sm">
                    <h3 class="font-bold text-slate-300 mb-2">错误详情:</h3>
                    <pre class="text-red-400 overflow-auto">${this.escapeHtml(this.error.error.message || this.error.error)}</pre>
                    ${this.error.error.stack ? `
                        <details class="mt-2">
                            <summary class="cursor-pointer text-slate-400 hover:text-slate-300">查看堆栈信息</summary>
                            <pre class="mt-2 text-xs text-slate-500 overflow-auto">${this.escapeHtml(this.error.error.stack)}</pre>
                        </details>
                    ` : ''}
                </div>
            `
        }
        
        this.container.innerHTML = html
    }
    
    escapeHtml(text) {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    reset() {
        this.hasError = false
        this.error = null
        this.container.innerHTML = ''
    }
}

class PerformanceMonitor {
    constructor() {
        this.metrics = []
        this.maxMetrics = 100
    }
    
    startMeasure(name) {
        performance.mark(`${name}-start`)
    }
    
    endMeasure(name) {
        performance.mark(`${name}-end`)
        performance.measure(name, `${name}-start`, `${name}-end`)
        
        const measure = performance.getEntriesByName(name, 'measure')[0]
        
        if (measure) {
            const metric = {
                id: Date.now(),
                name,
                duration: measure.duration,
                startTime: measure.startTime,
                timestamp: new Date().toISOString()
            }
            
            this.metrics.unshift(metric)
            
            if (this.metrics.length > this.maxMetrics) {
                this.metrics.pop()
            }
            
            performance.clearMarks(`${name}-start`)
            performance.clearMarks(`${name}-end`)
            performance.clearMeasures(name)
            
            return metric
        }
        
        return null
    }
    
    measureFunction(name, fn) {
        return async (...args) => {
            this.startMeasure(name)
            try {
                const result = await fn(...args)
                this.endMeasure(name)
                return result
            } catch (error) {
                this.endMeasure(name)
                throw error
            }
        }
    }
    
    getMetrics(name = null) {
        if (name) {
            return this.metrics.filter(m => m.name === name)
        }
        return this.metrics
    }
    
    getAverageDuration(name) {
        const metrics = this.getMetrics(name)
        if (metrics.length === 0) return 0
        
        const total = metrics.reduce((sum, m) => sum + m.duration, 0)
        return total / metrics.length
    }
    
    clearMetrics() {
        this.metrics = []
    }
    
    getPerformanceSummary() {
        const grouped = {}
        
        this.metrics.forEach(metric => {
            if (!grouped[metric.name]) {
                grouped[metric.name] = {
                    count: 0,
                    totalDuration: 0,
                    avgDuration: 0,
                    minDuration: Infinity,
                    maxDuration: 0
                }
            }
            
            grouped[metric.name].count++
            grouped[metric.name].totalDuration += metric.duration
            grouped[metric.name].minDuration = Math.min(grouped[metric.name].minDuration, metric.duration)
            grouped[metric.name].maxDuration = Math.max(grouped[metric.name].maxDuration, metric.duration)
        })
        
        Object.keys(grouped).forEach(name => {
            grouped[name].avgDuration = grouped[name].totalDuration / grouped[name].count
        })
        
        return grouped
    }
}

class SystemMonitor {
    constructor() {
        this.errorHandler = new ErrorHandler()
        this.logger = new Logger()
        this.performanceMonitor = new PerformanceMonitor()
        
        this.setupErrorLogging()
    }
    
    setupErrorLogging() {
        this.errorHandler.onError((error) => {
            this.logger.error('System error', error)
        })
    }
    
    getSystemStatus() {
        const usage = this.performanceMonitor.getPerformanceSummary()
        const errors = this.errorHandler.getErrors()
        const logs = this.logger.getLogs()
        
        return {
            timestamp: new Date().toISOString(),
            errors: {
                total: errors.length,
                recent: errors.slice(0, 5)
            },
            logs: {
                total: logs.length,
                byLevel: {
                    debug: logs.filter(l => l.level === 'debug').length,
                    info: logs.filter(l => l.level === 'info').length,
                    warn: logs.filter(l => l.level === 'warn').length,
                    error: logs.filter(l => l.level === 'error').length
                }
            },
            performance: usage,
            memory: this.getMemoryUsage()
        }
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
            }
        }
        return null
    }
    
    exportSystemReport() {
        const report = this.getSystemStatus()
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `system_report_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }
}

const systemMonitor = new SystemMonitor()

export { 
    systemMonitor, 
    SystemMonitor, 
    ErrorHandler, 
    Logger, 
    ErrorBoundary, 
    PerformanceMonitor 
}
