/**
 * 重复提交拦截模块
 * 提供防抖、节流、锁机制等功能
 */

/**
 * 提交拦截器
 */
class SubmitGuard {
    constructor() {
        this.pendingRequests = new Map()
        this.debounceTimers = new Map()
        this.throttleTimers = new Map()
    }
    
    /**
     * 防抖函数
     */
    debounce(key, callback, delay = 500) {
        return (...args) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key))
            }
            
            const timerId = setTimeout(() => {
                callback(...args)
                this.debounceTimers.delete(key)
            }, delay)
            
            this.debounceTimers.set(key, timerId)
        }
    }
    
    /**
     * 节流函数
     */
    throttle(key, callback, delay = 1000) {
        return (...args) => {
            if (this.pendingRequests.has(key)) {
                return
            }
            
            this.pendingRequests.set(key, true)
            
            callback(...args)
            
            setTimeout(() => {
                this.pendingRequests.delete(key)
            }, delay)
        }
    }
    
    /**
     * 带锁的异步请求
     */
    async withLock(key, callback) {
        if (this.pendingRequests.has(key)) {
            throw new Error('请求正在进行中，请勿重复提交')
        }
        
        this.pendingRequests.set(key, true)
        
        try {
            const result = await callback()
            return result
        } finally {
            this.pendingRequests.delete(key)
        }
    }
    
    /**
     * 检查是否有待处理请求
     */
    isPending(key) {
        return this.pendingRequests.has(key)
    }
    
    /**
     * 清除待处理请求
     */
    clearPending(key) {
        this.pendingRequests.delete(key)
    }
    
    /**
     * 清除所有待处理请求
     */
    clearAllPending() {
        this.pendingRequests.clear()
    }
    
    /**
     * 清除防抖定时器
     */
    clearDebounce(key) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key))
            this.debounceTimers.delete(key)
        }
    }
    
    /**
     * 清除所有防抖定时器
     */
    clearAllDebounce() {
        this.debounceTimers.forEach(timerId => clearTimeout(timerId))
        this.debounceTimers.clear()
    }
    
    /**
     * 清除所有节流定时器
     */
    clearAllThrottle() {
        this.throttleTimers.forEach(timerId => clearTimeout(timerId))
        this.throttleTimers.clear()
    }
    
    /**
     * 清除所有
     */
    clearAll() {
        this.clearAllPending()
        this.clearAllDebounce()
        this.clearAllThrottle()
    }
}

/**
 * 按钮状态管理器
 */
class ButtonStateManager {
    constructor() {
        this.buttons = new Map()
    }
    
    /**
     * 设置加载状态
     */
    setLoading(buttonId, loading = true, loadingText = '处理中...') {
        const button = document.getElementById(buttonId)
        if (!button) return
        
        if (!this.buttons.has(buttonId)) {
            this.buttons.set(buttonId, {
                originalText: button.textContent,
                originalDisabled: button.disabled,
                originalClasses: button.className
            })
        }
        
        const original = this.buttons.get(buttonId)
        
        if (loading) {
            button.disabled = true
            button.textContent = loadingText
            button.classList.add('opacity-50', 'cursor-not-allowed')
            
            const spinner = document.createElement('span')
            spinner.className = 'inline-block animate-spin mr-2'
            spinner.innerHTML = '⟳'
            button.insertBefore(spinner, button.firstChild)
        } else {
            button.disabled = original.originalDisabled
            button.textContent = original.originalText
            button.className = original.originalClasses
        }
    }
    
    /**
     * 禁用按钮
     */
    disable(buttonId) {
        const button = document.getElementById(buttonId)
        if (button) {
            button.disabled = true
            button.classList.add('opacity-50', 'cursor-not-allowed')
        }
    }
    
    /**
     * 启用按钮
     */
    enable(buttonId) {
        const button = document.getElementById(buttonId)
        if (button) {
            button.disabled = false
            button.classList.remove('opacity-50', 'cursor-not-allowed')
        }
    }
    
    /**
     * 显示成功状态
     */
    showSuccess(buttonId, successText = '成功', duration = 2000) {
        const button = document.getElementById(buttonId)
        if (!button) return
        
        const originalText = button.textContent
        
        button.textContent = successText
        button.classList.add('bg-green-600')
        button.classList.remove('bg-blue-600', 'bg-slate-600')
        
        setTimeout(() => {
            button.textContent = originalText
            button.classList.remove('bg-green-600')
            button.classList.add('bg-blue-600')
        }, duration)
    }
    
    /**
     * 显示错误状态
     */
    showError(buttonId, errorText = '失败', duration = 2000) {
        const button = document.getElementById(buttonId)
        if (!button) return
        
        const originalText = button.textContent
        
        button.textContent = errorText
        button.classList.add('bg-red-600')
        button.classList.remove('bg-blue-600', 'bg-slate-600')
        
        setTimeout(() => {
            button.textContent = originalText
            button.classList.remove('bg-red-600')
            button.classList.add('bg-blue-600')
        }, duration)
    }
    
    /**
     * 重置按钮状态
     */
    reset(buttonId) {
        const button = document.getElementById(buttonId)
        if (!button) return
        
        const original = this.buttons.get(buttonId)
        if (original) {
            button.textContent = original.originalText
            button.disabled = original.originalDisabled
            button.className = original.originalClasses
        }
    }
    
    /**
     * 清除所有按钮状态
     */
    clearAll() {
        this.buttons.forEach((original, buttonId) => {
            this.reset(buttonId)
        })
        this.buttons.clear()
    }
}

/**
 * 表单提交管理器
 */
class FormSubmitManager {
    constructor() {
        this.submitGuard = new SubmitGuard()
        this.buttonManager = new ButtonStateManager()
        this.forms = new Map()
    }
    
    /**
     * 注册表单
     */
    registerForm(formId, options = {}) {
        const {
            submitButtonId,
            onSubmit,
            validate = null,
            successText = '提交成功',
            errorText = '提交失败',
            loadingText = '提交中...'
        } = options
        
        this.forms.set(formId, {
            submitButtonId,
            onSubmit,
            validate,
            successText,
            errorText,
            loadingText
        })
    }
    
    /**
     * 提交表单
     */
    async submit(formId) {
        const formConfig = this.forms.get(formId)
        if (!formConfig) {
            throw new Error(`表单 ${formId} 未注册`)
        }
        
        const {
            submitButtonId,
            onSubmit,
            validate,
            successText,
            errorText,
            loadingText
        } = formConfig
        
        if (this.submitGuard.isPending(formId)) {
            return
        }
        
        if (validate) {
            const validationResult = validate()
            if (!validationResult.valid) {
                return
            }
        }
        
        try {
            this.buttonManager.setLoading(submitButtonId, true, loadingText)
            
            await this.submitGuard.withLock(formId, onSubmit)
            
            this.buttonManager.setLoading(submitButtonId, false)
            this.buttonManager.showSuccess(submitButtonId, successText)
        } catch (error) {
            this.buttonManager.setLoading(submitButtonId, false)
            this.buttonManager.showError(submitButtonId, errorText)
            throw error
        }
    }
    
    /**
     * 取消提交
     */
    cancel(formId) {
        this.submitGuard.clearPending(formId)
        
        const formConfig = this.forms.get(formId)
        if (formConfig) {
            this.buttonManager.setLoading(formConfig.submitButtonId, false)
        }
    }
    
    /**
     * 清除所有
     */
    clearAll() {
        this.submitGuard.clearAll()
        this.buttonManager.clearAll()
        this.forms.clear()
    }
}

/**
 * 请求拦截器
 */
class RequestInterceptor {
    constructor() {
        this.interceptors = {
            request: [],
            response: []
        }
    }
    
    /**
     * 添加请求拦截器
     */
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor)
    }
    
    /**
     * 添加响应拦截器
     */
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor)
    }
    
    /**
     * 移除请求拦截器
     */
    removeRequestInterceptor(interceptor) {
        const index = this.interceptors.request.indexOf(interceptor)
        if (index > -1) {
            this.interceptors.request.splice(index, 1)
        }
    }
    
    /**
     * 移除响应拦截器
     */
    removeResponseInterceptor(interceptor) {
        const index = this.interceptors.response.indexOf(interceptor)
        if (index > -1) {
            this.interceptors.response.splice(index, 1)
        }
    }
    
    /**
     * 应用请求拦截器
     */
    async applyRequestInterceptors(config) {
        let modifiedConfig = config
        
        for (const interceptor of this.interceptors.request) {
            modifiedConfig = await interceptor(modifiedConfig)
        }
        
        return modifiedConfig
    }
    
    /**
     * 应用响应拦截器
     */
    async applyResponseInterceptors(response) {
        let modifiedResponse = response
        
        for (const interceptor of this.interceptors.response) {
            modifiedResponse = await interceptor(modifiedResponse)
        }
        
        return modifiedResponse
    }
    
    /**
     * 清除所有拦截器
     */
    clearAll() {
        this.interceptors.request = []
        this.interceptors.response = []
    }
}

export { SubmitGuard, ButtonStateManager, FormSubmitManager, RequestInterceptor }
