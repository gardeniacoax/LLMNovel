/**
 * 性能优化模块
 * 提供性能监控、优化建议、资源管理等功能
 */

/**
 * 性能监控器
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {}
        this.observers = []
        this.isMonitoring = false
    }
    
    /**
     * 开始监控
     */
    startMonitoring() {
        if (this.isMonitoring) return
        
        this.isMonitoring = true
        this.observePerformance()
        this.startResourceTiming()
        
        console.log('🔍 性能监控已启动')
    }
    
    /**
     * 停止监控
     */
    stopMonitoring() {
        this.isMonitoring = false
        this.observers.forEach(observer => observer.disconnect())
        this.observers = []
        
        console.log('🔍 性能监控已停止')
    }
    
    /**
     * 观察性能指标
     */
    observePerformance() {
        if (!window.performance || !window.PerformanceObserver) {
            console.warn('浏览器不支持PerformanceObserver')
            return
        }
        
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                this.recordMetric(entry.name, entry.duration)
            })
        })
        
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
        this.observers.push(observer)
    }
    
    /**
     * 开始资源计时
     */
    startResourceTiming() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const resources = performance.getEntriesByType('resource')
                
                resources.forEach(resource => {
                    this.metrics[resource.name] = {
                        type: 'resource',
                        duration: resource.duration,
                        size: resource.transferSize || 0,
                        startTime: resource.startTime
                    }
                })
            }, 0)
        })
    }
    
    /**
     * 记录指标
     */
    recordMetric(name, value) {
        if (!this.metrics[name]) {
            this.metrics[name] = []
        }
        
        this.metrics[name].push({
            value,
            timestamp: Date.now()
        })
    }
    
    /**
     * 测量函数执行时间
     */
    measureFunction(name, fn) {
        return async (...args) => {
            const start = performance.now()
            const result = await fn(...args)
            const end = performance.now()
            
            this.recordMetric(name, end - start)
            
            return result
        }
    }
    
    /**
     * 获取页面加载性能
     */
    getPageLoadMetrics() {
        if (!window.performance) return null
        
        const timing = performance.timing
        const navigation = performance.getEntriesByType('navigation')[0]
        
        return {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            domProcessing: timing.domComplete - timing.domInteractive,
            totalLoad: timing.loadEventEnd - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
        }
    }
    
    /**
     * 获取首次绘制时间
     */
    getFirstPaint() {
        const entries = performance.getEntriesByType('paint')
        const fp = entries.find(entry => entry.name === 'first-paint')
        return fp ? fp.startTime : null
    }
    
    /**
     * 获取首次内容绘制时间
     */
    getFirstContentfulPaint() {
        const entries = performance.getEntriesByType('paint')
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
        return fcp ? fcp.startTime : null
    }
    
    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        if (!performance.memory) return null
        
        return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
        }
    }
    
    /**
     * 获取所有指标
     */
    getAllMetrics() {
        return {
            pageLoad: this.getPageLoadMetrics(),
            memory: this.getMemoryUsage(),
            custom: this.metrics
        }
    }
    
    /**
     * 生成性能报告
     */
    generateReport() {
        const metrics = this.getAllMetrics()
        
        return {
            timestamp: Date.now(),
            pageLoad: metrics.pageLoad,
            memory: metrics.memory,
            recommendations: this.generateRecommendations(metrics)
        }
    }
    
    /**
     * 生成优化建议
     */
    generateRecommendations(metrics) {
        const recommendations = []
        
        if (metrics.pageLoad) {
            if (metrics.pageLoad.totalLoad > 3000) {
                recommendations.push({
                    type: 'performance',
                    severity: 'warning',
                    message: '页面加载时间过长',
                    suggestion: '建议优化资源加载、减少HTTP请求、使用CDN'
                })
            }
            
            if (metrics.pageLoad.firstContentfulPaint > 2000) {
                recommendations.push({
                    type: 'performance',
                    severity: 'warning',
                    message: '首次内容绘制时间过长',
                    suggestion: '建议优化关键渲染路径、减少阻塞资源'
                })
            }
        }
        
        if (metrics.memory) {
            if (parseFloat(metrics.memory.usagePercentage) > 80) {
                recommendations.push({
                    type: 'memory',
                    severity: 'warning',
                    message: '内存使用率过高',
                    suggestion: '建议检查内存泄漏、优化数据结构'
                })
            }
        }
        
        return recommendations
    }
}

/**
 * 资源加载优化器
 */
class ResourceOptimizer {
    constructor() {
        this.loadedResources = new Set()
        this.pendingResources = new Map()
    }
    
    /**
     * 预加载资源
     */
    preloadResource(url, type = 'script') {
        if (this.loadedResources.has(url)) {
            return Promise.resolve()
        }
        
        if (this.pendingResources.has(url)) {
            return this.pendingResources.get(url)
        }
        
        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link')
            link.rel = 'preload'
            link.href = url
            link.as = type
            
            link.onload = () => {
                this.loadedResources.add(url)
                this.pendingResources.delete(url)
                resolve()
            }
            
            link.onerror = () => {
                this.pendingResources.delete(url)
                reject(new Error(`预加载失败: ${url}`))
            }
            
            document.head.appendChild(link)
        })
        
        this.pendingResources.set(url, promise)
        return promise
    }
    
    /**
     * 懒加载脚本
     */
    lazyLoadScript(url) {
        if (this.loadedResources.has(url)) {
            return Promise.resolve()
        }
        
        if (this.pendingResources.has(url)) {
            return this.pendingResources.get(url)
        }
        
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = url
            script.async = true
            
            script.onload = () => {
                this.loadedResources.add(url)
                this.pendingResources.delete(url)
                resolve()
            }
            
            script.onerror = () => {
                this.pendingResources.delete(url)
                reject(new Error(`脚本加载失败: ${url}`))
            }
            
            document.body.appendChild(script)
        })
        
        this.pendingResources.set(url, promise)
        return promise
    }
    
    /**
     * 懒加载样式
     */
    lazyLoadStyle(url) {
        if (this.loadedResources.has(url)) {
            return Promise.resolve()
        }
        
        if (this.pendingResources.has(url)) {
            return this.pendingResources.get(url)
        }
        
        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = url
            
            link.onload = () => {
                this.loadedResources.add(url)
                this.pendingResources.delete(url)
                resolve()
            }
            
            link.onerror = () => {
                this.pendingResources.delete(url)
                reject(new Error(`样式加载失败: ${url}`))
            }
            
            document.head.appendChild(link)
        })
        
        this.pendingResources.set(url, promise)
        return promise
    }
    
    /**
     * 懒加载图片
     */
    lazyLoadImage(element, options = {}) {
        const {
            rootMargin = '50px',
            threshold = 0.1
        } = options
        
        return new Promise((resolve) => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target
                        
                        if (img.dataset.src) {
                            img.src = img.dataset.src
                            img.removeAttribute('data-src')
                        }
                        
                        observer.unobserve(img)
                        resolve()
                    }
                })
            }, {
                rootMargin,
                threshold
            })
            
            observer.observe(element)
        })
    }
    
    /**
     * 批量懒加载图片
     */
    lazyLoadImages(selector = 'img[data-src]') {
        const images = document.querySelectorAll(selector)
        
        images.forEach(img => {
            this.lazyLoadImage(img)
        })
    }
}

/**
 * DOM优化器
 */
class DOMOptimizer {
    /**
     * 批量更新DOM
     */
    static batchUpdate(updates) {
        const fragment = document.createDocumentFragment()
        
        updates.forEach(update => {
            const element = update()
            if (element) {
                fragment.appendChild(element)
            }
        })
        
        return fragment
    }
    
    /**
     * 虚拟滚动
     */
    static createVirtualScroll(container, options = {}) {
        const {
            itemHeight = 50,
            bufferSize = 5,
            renderItem
        } = options
        
        const state = {
            scrollTop: 0,
            items: [],
            visibleItems: []
        }
        
        const updateVisibleItems = () => {
            const containerHeight = container.clientHeight
            const startIndex = Math.max(0, Math.floor(state.scrollTop / itemHeight) - bufferSize)
            const endIndex = Math.min(
                state.items.length,
                Math.ceil((state.scrollTop + containerHeight) / itemHeight) + bufferSize
            )
            
            state.visibleItems = state.items.slice(startIndex, endIndex).map((item, i) => ({
                item,
                index: startIndex + i,
                top: (startIndex + i) * itemHeight
            }))
            
            render()
        }
        
        const render = () => {
            const fragment = document.createDocumentFragment()
            
            state.visibleItems.forEach(({ item, index, top }) => {
                const element = renderItem(item, index)
                element.style.position = 'absolute'
                element.style.top = `${top}px`
                element.style.height = `${itemHeight}px`
                fragment.appendChild(element)
            })
            
            container.innerHTML = ''
            container.appendChild(fragment)
        }
        
        container.addEventListener('scroll', () => {
            state.scrollTop = container.scrollTop
            requestAnimationFrame(updateVisibleItems)
        })
        
        return {
            setItems: (items) => {
                state.items = items
                container.style.height = `${items.length * itemHeight}px`
                updateVisibleItems()
            },
            update: updateVisibleItems
        }
    }
    
    /**
     * 防抖DOM更新
     */
    static debounceUpdate(fn, delay = 16) {
        let frameId = null
        
        return (...args) => {
            if (frameId) {
                cancelAnimationFrame(frameId)
            }
            
            frameId = requestAnimationFrame(() => {
                fn(...args)
                frameId = null
            })
        }
    }
    
    /**
     * 优化事件监听
     */
    static optimizeEventListener(element, event, handler, options = {}) {
        const {
            passive = true,
            capture = false,
            debounce = 0,
            throttle = 0
        } = options
        
        let optimizedHandler = handler
        
        if (debounce > 0) {
            let timeoutId = null
            optimizedHandler = (...args) => {
                clearTimeout(timeoutId)
                timeoutId = setTimeout(() => handler(...args), debounce)
            }
        }
        
        if (throttle > 0) {
            let lastCall = 0
            optimizedHandler = (...args) => {
                const now = Date.now()
                if (now - lastCall >= throttle) {
                    lastCall = now
                    handler(...args)
                }
            }
        }
        
        element.addEventListener(event, optimizedHandler, {
            passive,
            capture
        })
        
        return () => {
            element.removeEventListener(event, optimizedHandler, { capture })
        }
    }
}

/**
 * 缓存管理器
 */
class CacheManager {
    constructor(maxSize = 100) {
        this.cache = new Map()
        this.maxSize = maxSize
        this.accessOrder = []
    }
    
    /**
     * 获取缓存
     */
    get(key) {
        if (!this.cache.has(key)) return null
        
        this.updateAccessOrder(key)
        return this.cache.get(key)
    }
    
    /**
     * 设置缓存
     */
    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            this.evict()
        }
        
        this.cache.set(key, value)
        this.updateAccessOrder(key)
    }
    
    /**
     * 更新访问顺序
     */
    updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key)
        if (index > -1) {
            this.accessOrder.splice(index, 1)
        }
        this.accessOrder.push(key)
    }
    
    /**
     * 淘汰最少使用
     */
    evict() {
        if (this.accessOrder.length === 0) return
        
        const keyToRemove = this.accessOrder.shift()
        this.cache.delete(keyToRemove)
    }
    
    /**
     * 清空缓存
     */
    clear() {
        this.cache.clear()
        this.accessOrder = []
    }
    
    /**
     * 获取缓存统计
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            usagePercentage: (this.cache.size / this.maxSize * 100).toFixed(2)
        }
    }
}

const performanceMonitor = new PerformanceMonitor()
const resourceOptimizer = new ResourceOptimizer()

export { 
    PerformanceMonitor, 
    ResourceOptimizer, 
    DOMOptimizer, 
    CacheManager,
    performanceMonitor,
    resourceOptimizer
}
