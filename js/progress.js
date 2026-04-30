class ProgressBar {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container
        this.options = {
            height: options.height || '8px',
            color: options.color || '#3b82f6',
            bgColor: options.bgColor || '#1e293b',
            animated: options.animated !== false,
            showPercent: options.showPercent !== false,
            showLabel: options.showLabel !== false,
            striped: options.striped || false,
            ...options
        }
        
        this.value = 0
        this.max = 100
        this.label = ''
        
        this.render()
    }
    
    render() {
        this.container.innerHTML = `
            <div class="progress-bar-wrapper">
                ${this.options.showLabel ? `
                    <div class="progress-bar-header flex justify-between items-center mb-2">
                        <span class="progress-label text-sm font-medium text-slate-300">${this.label}</span>
                        ${this.options.showPercent ? `<span class="progress-percent text-sm text-slate-400">0%</span>` : ''}
                    </div>
                ` : ''}
                <div class="progress-bar-bg rounded-full overflow-hidden" style="height: ${this.options.height}; background: ${this.options.bgColor}">
                    <div class="progress-bar-fill h-full rounded-full transition-all duration-300 ${this.options.animated ? 'transition-all' : ''} ${this.options.striped ? 'bg-stripes' : ''}" style="width: 0%; background: ${this.options.color}"></div>
                </div>
            </div>
        `
        
        this.labelElement = this.container.querySelector('.progress-label')
        this.percentElement = this.container.querySelector('.progress-percent')
        this.fillElement = this.container.querySelector('.progress-bar-fill')
    }
    
    setValue(value, label = null) {
        this.value = Math.min(Math.max(0, value), this.max)
        const percent = Math.round((this.value / this.max) * 100)
        
        this.fillElement.style.width = `${percent}%`
        
        if (this.percentElement) {
            this.percentElement.textContent = `${percent}%`
        }
        
        if (label !== null) {
            this.setLabel(label)
        }
    }
    
    setLabel(label) {
        this.label = label
        if (this.labelElement) {
            this.labelElement.textContent = label
        }
    }
    
    setColor(color) {
        this.options.color = color
        this.fillElement.style.background = color
    }
    
    reset() {
        this.setValue(0, '')
    }
    
    complete(label = '完成') {
        this.setValue(100, label)
        this.setColor('#22c55e')
    }
    
    error(label = '失败') {
        this.setColor('#ef4444')
        this.setLabel(label)
    }
}

class ProgressRing {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container
        this.options = {
            size: options.size || 120,
            strokeWidth: options.strokeWidth || 8,
            color: options.color || '#3b82f6',
            bgColor: options.bgColor || '#1e293b',
            textColor: options.textColor || '#f1f5f9',
            showPercent: options.showPercent !== false,
            showLabel: options.showLabel !== false,
            animated: options.animated !== false,
            ...options
        }
        
        this.value = 0
        this.max = 100
        this.label = ''
        
        this.render()
    }
    
    render() {
        const { size, strokeWidth, bgColor, textColor } = this.options
        const radius = (size - strokeWidth) / 2
        const circumference = radius * 2 * Math.PI
        
        this.container.innerHTML = `
            <div class="progress-ring-wrapper flex flex-col items-center">
                <div class="progress-ring relative" style="width: ${size}px; height: ${size}px">
                    <svg class="transform -rotate-90" width="${size}" height="${size}">
                        <circle
                            class="progress-ring-bg"
                            stroke="${bgColor}"
                            stroke-width="${strokeWidth}"
                            fill="transparent"
                            r="${radius}"
                            cx="${size / 2}"
                            cy="${size / 2}"
                        />
                        <circle
                            class="progress-ring-fill transition-all duration-300"
                            stroke="${this.options.color}"
                            stroke-width="${strokeWidth}"
                            stroke-linecap="round"
                            fill="transparent"
                            r="${radius}"
                            cx="${size / 2}"
                            cy="${size / 2}"
                            style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${circumference}"
                        />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        ${this.options.showPercent ? `<span class="progress-ring-percent text-2xl font-bold" style="color: ${textColor}">0%</span>` : ''}
                        ${this.options.showLabel ? `<span class="progress-ring-label text-xs text-slate-400 mt-1">${this.label}</span>` : ''}
                    </div>
                </div>
            </div>
        `
        
        this.percentElement = this.container.querySelector('.progress-ring-percent')
        this.labelElement = this.container.querySelector('.progress-ring-label')
        this.fillElement = this.container.querySelector('.progress-ring-fill')
        this.circumference = circumference
    }
    
    setValue(value, label = null) {
        this.value = Math.min(Math.max(0, value), this.max)
        const percent = this.value / this.max
        const offset = this.circumference - (percent * this.circumference)
        
        this.fillElement.style.strokeDashoffset = offset
        
        if (this.percentElement) {
            this.percentElement.textContent = `${Math.round(percent * 100)}%`
        }
        
        if (label !== null) {
            this.setLabel(label)
        }
    }
    
    setLabel(label) {
        this.label = label
        if (this.labelElement) {
            this.labelElement.textContent = label
        }
    }
    
    setColor(color) {
        this.options.color = color
        this.fillElement.setAttribute('stroke', color)
    }
    
    reset() {
        this.setValue(0, '')
    }
    
    complete(label = '完成') {
        this.setValue(100, label)
        this.setColor('#22c55e')
    }
    
    error(label = '失败') {
        this.setColor('#ef4444')
        this.setLabel(label)
    }
}

class StepIndicator {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container
        this.options = {
            steps: options.steps || [],
            currentStep: options.currentStep || 1,
            color: options.color || '#3b82f6',
            completedColor: options.completedColor || '#22c55e',
            orientation: options.orientation || 'horizontal',
            ...options
        }
        
        this.render()
    }
    
    render() {
        const { steps, currentStep, color, completedColor, orientation } = this.options
        
        const isVertical = orientation === 'vertical'
        const flexClass = isVertical ? 'flex-col' : 'flex-row'
        const stepMarginClass = isVertical ? 'mb-4' : 'mr-8'
        
        this.container.innerHTML = `
            <div class="step-indicator flex ${flexClass} items-${isVertical ? 'start' : 'center'} justify-center">
                ${steps.map((step, index) => {
                    const stepNum = index + 1
                    const isCompleted = stepNum < currentStep
                    const isCurrent = stepNum === currentStep
                    const isPending = stepNum > currentStep
                    
                    return `
                        <div class="step-item flex ${isVertical ? 'items-start' : 'items-center'} ${stepMarginClass} last:${isVertical ? 'mb-0' : 'mr-0'}">
                            <div class="step-circle relative flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm transition-all duration-300 ${
                                isCompleted 
                                    ? `border-[${completedColor}] bg-[${completedColor}] text-white` 
                                    : isCurrent 
                                        ? `border-[${color}] bg-[${color}] text-white` 
                                        : 'border-slate-600 bg-slate-800 text-slate-400'
                            }">
                                ${isCompleted ? `
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                    </svg>
                                ` : stepNum}
                            </div>
                            ${isVertical ? `
                                <div class="ml-3 flex-1">
                                    <div class="text-sm font-medium ${isCurrent ? 'text-white' : 'text-slate-400'}">${step.title}</div>
                                    ${step.description ? `<div class="text-xs text-slate-500 mt-1">${step.description}</div>` : ''}
                                </div>
                            ` : `
                                <div class="ml-2 text-sm font-medium ${isCurrent ? 'text-white' : 'text-slate-400'}">${step.title}</div>
                            `}
                            ${index < steps.length - 1 ? `
                                <div class="${isVertical ? 'absolute left-5 top-10 w-0.5 h-8' : 'ml-2 w-8 h-0.5'} ${
                                    isCompleted ? `bg-[${completedColor}]` : 'bg-slate-600'
                                }"></div>
                            ` : ''}
                        </div>
                    `
                }).join('')}
            </div>
        `
    }
    
    setCurrentStep(step) {
        this.options.currentStep = step
        this.render()
    }
    
    nextStep() {
        if (this.options.currentStep < this.options.steps.length) {
            this.setCurrentStep(this.options.currentStep + 1)
        }
    }
    
    prevStep() {
        if (this.options.currentStep > 1) {
            this.setCurrentStep(this.options.currentStep - 1)
        }
    }
}

class StatusDisplay {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container
        this.options = {
            title: options.title || '状态',
            showTime: options.showTime !== false,
            showIcon: options.showIcon !== false,
            ...options
        }
        
        this.status = 'idle'
        this.message = ''
        this.details = {}
        
        this.render()
    }
    
    render() {
        const statusConfig = this.getStatusConfig()
        
        this.container.innerHTML = `
            <div class="status-display bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        ${this.options.showIcon ? `
                            <div class="status-icon w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bgClass}">
                                ${statusConfig.icon}
                            </div>
                        ` : ''}
                        <div>
                            <h3 class="text-lg font-semibold">${this.options.title}</h3>
                            <p class="text-sm ${statusConfig.textClass}">${this.message || statusConfig.defaultMessage}</p>
                        </div>
                    </div>
                    ${this.options.showTime ? `
                        <div class="text-xs text-slate-500">
                            ${new Date().toLocaleTimeString()}
                        </div>
                    ` : ''}
                </div>
                
                ${Object.keys(this.details).length > 0 ? `
                    <div class="status-details grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-700">
                        ${Object.entries(this.details).map(([key, value]) => `
                            <div class="text-sm">
                                <span class="text-slate-400">${key}:</span>
                                <span class="ml-2 font-medium">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `
    }
    
    getStatusConfig() {
        const configs = {
            idle: {
                icon: `<svg class="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>`,
                bgClass: 'bg-slate-700',
                textClass: 'text-slate-400',
                defaultMessage: '等待中...'
            },
            running: {
                icon: `<svg class="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>`,
                bgClass: 'bg-blue-900',
                textClass: 'text-blue-400',
                defaultMessage: '处理中...'
            },
            success: {
                icon: `<svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>`,
                bgClass: 'bg-green-900',
                textClass: 'text-green-400',
                defaultMessage: '完成'
            },
            error: {
                icon: `<svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>`,
                bgClass: 'bg-red-900',
                textClass: 'text-red-400',
                defaultMessage: '失败'
            },
            warning: {
                icon: `<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>`,
                bgClass: 'bg-yellow-900',
                textClass: 'text-yellow-400',
                defaultMessage: '警告'
            }
        }
        
        return configs[this.status] || configs.idle
    }
    
    setStatus(status, message = '', details = {}) {
        this.status = status
        this.message = message
        this.details = details
        this.render()
    }
    
    setDetails(details) {
        this.details = { ...this.details, ...details }
        this.render()
    }
    
    reset() {
        this.setStatus('idle', '', {})
    }
}

class ProgressManager {
    constructor() {
        this.progressBars = new Map()
        this.progressRings = new Map()
        this.stepIndicators = new Map()
        this.statusDisplays = new Map()
    }
    
    createProgressBar(id, container, options = {}) {
        const progressBar = new ProgressBar(container, options)
        this.progressBars.set(id, progressBar)
        return progressBar
    }
    
    createProgressRing(id, container, options = {}) {
        const progressRing = new ProgressRing(container, options)
        this.progressRings.set(id, progressRing)
        return progressRing
    }
    
    createStepIndicator(id, container, options = {}) {
        const stepIndicator = new StepIndicator(container, options)
        this.stepIndicators.set(id, stepIndicator)
        return stepIndicator
    }
    
    createStatusDisplay(id, container, options = {}) {
        const statusDisplay = new StatusDisplay(container, options)
        this.statusDisplays.set(id, statusDisplay)
        return statusDisplay
    }
    
    getProgressBar(id) {
        return this.progressBars.get(id)
    }
    
    getProgressRing(id) {
        return this.progressRings.get(id)
    }
    
    getStepIndicator(id) {
        return this.stepIndicators.get(id)
    }
    
    getStatusDisplay(id) {
        return this.statusDisplays.get(id)
    }
    
    destroy(id) {
        this.progressBars.delete(id)
        this.progressRings.delete(id)
        this.stepIndicators.delete(id)
        this.statusDisplays.delete(id)
    }
    
    destroyAll() {
        this.progressBars.clear()
        this.progressRings.clear()
        this.stepIndicators.clear()
        this.statusDisplays.clear()
    }
}

const progressManager = new ProgressManager()

export { 
    progressManager, 
    ProgressManager, 
    ProgressBar, 
    ProgressRing, 
    StepIndicator, 
    StatusDisplay 
}
