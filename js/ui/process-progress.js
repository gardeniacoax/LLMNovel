class ProcessProgressBar {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.steps = options.steps || []
        this.currentStep = options.currentStep || 0
        
        this.onStepClick = options.onStepClick || null
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="process-progress">
                <div class="progress-steps">
                    ${this.steps.map((step, index) => this.renderStep(step, index)).join('')}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.getProgressPercentage()}%"></div>
                </div>
                <div class="progress-info">
                    <span class="current-step">当前：${this.steps[this.currentStep]?.name || '未开始'}</span>
                    <span class="progress-percent">${this.getProgressPercentage()}%</span>
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    renderStep(step, index) {
        const status = this.getStepStatus(index)
        
        return `
            <div class="progress-step ${status}" data-step="${index}">
                <div class="step-icon">
                    ${status === 'completed' ? '✓' : status === 'active' ? '●' : index + 1}
                </div>
                <div class="step-name">${step.name}</div>
                ${step.description ? `<div class="step-desc">${step.description}</div>` : ''}
            </div>
        `
    }
    
    getStepStatus(index) {
        if (index < this.currentStep) return 'completed'
        if (index === this.currentStep) return 'active'
        return 'pending'
    }
    
    getProgressPercentage() {
        if (this.steps.length <= 1) return 100
        return Math.round((this.currentStep / (this.steps.length - 1)) * 100)
    }
    
    setStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex
            this.render()
        }
    }
    
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++
            this.render()
            return true
        }
        return false
    }
    
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--
            this.render()
            return true
        }
        return false
    }
    
    reset() {
        this.currentStep = 0
        this.render()
    }
    
    complete() {
        this.currentStep = this.steps.length - 1
        this.render()
    }
    
    setSteps(steps) {
        this.steps = steps
        this.currentStep = 0
        this.render()
    }
    
    bindEvents() {
        const stepElements = document.querySelectorAll('.progress-step')
        stepElements.forEach(el => {
            el.addEventListener('click', () => {
                const stepIndex = parseInt(el.dataset.step)
                if (this.onStepClick) {
                    this.onStepClick(stepIndex)
                }
            })
        })
    }
    
    applyStyles() {
        if (!document.getElementById('process-progress-styles')) {
            const style = document.createElement('style')
            style.id = 'process-progress-styles'
            style.textContent = `
                .process-progress {
                    padding: 20px;
                    background: #1a1a2e;
                    border-radius: 8px;
                }
                
                .progress-steps {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 16px;
                    position: relative;
                }
                
                .progress-steps::before {
                    content: '';
                    position: absolute;
                    top: 16px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #374151;
                    z-index: 0;
                }
                
                .progress-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                    position: relative;
                    z-index: 1;
                    cursor: pointer;
                }
                
                .step-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    margin-bottom: 8px;
                    transition: all 0.3s ease;
                }
                
                .progress-step.completed .step-icon {
                    background: #10B981;
                    color: white;
                }
                
                .progress-step.active .step-icon {
                    background: #3B82F6;
                    color: white;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
                }
                
                .progress-step.pending .step-icon {
                    background: #374151;
                    color: #9CA3AF;
                }
                
                .step-name {
                    font-size: 12px;
                    color: #e2e8f0;
                    text-align: center;
                }
                
                .step-desc {
                    font-size: 10px;
                    color: #64748b;
                    text-align: center;
                    margin-top: 4px;
                }
                
                .progress-step.completed .step-name {
                    color: #10B981;
                }
                
                .progress-step.active .step-name {
                    color: #3B82F6;
                    font-weight: 500;
                }
                
                .progress-step.pending .step-name {
                    color: #64748b;
                }
                
                .progress-bar {
                    height: 4px;
                    background: #374151;
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3B82F6, #10B981);
                    transition: width 0.3s ease;
                }
                
                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                }
                
                .current-step {
                    color: #94a3b8;
                }
                
                .progress-percent {
                    color: #3B82F6;
                    font-weight: 500;
                }
                
                @media (max-width: 640px) {
                    .progress-steps {
                        flex-wrap: wrap;
                        gap: 16px;
                    }
                    
                    .progress-step {
                        flex: 0 0 calc(33.333% - 12px);
                    }
                    
                    .progress-steps::before {
                        display: none;
                    }
                }
            `
            document.head.appendChild(style)
        }
    }
}

class CircularProgress {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.progress = options.progress || 0
        this.size = options.size || 80
        this.strokeWidth = options.strokeWidth || 6
        
        this.label = options.label || ''
        this.showPercent = options.showPercent !== false
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        const radius = (this.size - this.strokeWidth) / 2
        const circumference = radius * 2 * Math.PI
        const offset = circumference - (this.progress / 100) * circumference
        
        container.innerHTML = `
            <div class="circular-progress" style="width: ${this.size}px; height: ${this.size}px;">
                <svg width="${this.size}" height="${this.size}">
                    <circle
                        class="progress-bg"
                        cx="${this.size / 2}"
                        cy="${this.size / 2}"
                        r="${radius}"
                        fill="none"
                        stroke="#374151"
                        stroke-width="${this.strokeWidth}"
                    />
                    <circle
                        class="progress-circle"
                        cx="${this.size / 2}"
                        cy="${this.size / 2}"
                        r="${radius}"
                        fill="none"
                        stroke="#3B82F6"
                        stroke-width="${this.strokeWidth}"
                        stroke-linecap="round"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${offset}"
                        transform="rotate(-90 ${this.size / 2} ${this.size / 2})"
                    />
                </svg>
                <div class="progress-content">
                    ${this.showPercent ? `<span class="progress-value">${Math.round(this.progress)}%</span>` : ''}
                    ${this.label ? `<span class="progress-label">${this.label}</span>` : ''}
                </div>
            </div>
        `
        
        this.applyStyles()
    }
    
    setProgress(progress) {
        this.progress = Math.min(100, Math.max(0, progress))
        this.render()
    }
    
    applyStyles() {
        if (!document.getElementById('circular-progress-styles')) {
            const style = document.createElement('style')
            style.id = 'circular-progress-styles'
            style.textContent = `
                .circular-progress {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .progress-circle {
                    transition: stroke-dashoffset 0.3s ease;
                }
                
                .progress-content {
                    position: absolute;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                
                .progress-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #e2e8f0;
                }
                
                .progress-label {
                    font-size: 10px;
                    color: #64748b;
                    margin-top: 2px;
                }
            `
            document.head.appendChild(style)
        }
    }
}

class LinearProgressBar {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.progress = options.progress || 0
        this.label = options.label || ''
        this.showPercent = options.showPercent !== false
        this.animated = options.animated !== false
        this.color = options.color || 'blue'
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="linear-progress">
                ${this.label ? `<div class="progress-label">${this.label}</div>` : ''}
                <div class="progress-track">
                    <div class="progress-fill color-${this.color} ${this.animated ? 'animated' : ''}" 
                         style="width: ${this.progress}%"></div>
                </div>
                ${this.showPercent ? `<div class="progress-percent">${Math.round(this.progress)}%</div>` : ''}
            </div>
        `
        
        this.applyStyles()
    }
    
    setProgress(progress) {
        this.progress = Math.min(100, Math.max(0, progress))
        
        const fill = document.querySelector('.linear-progress .progress-fill')
        const percent = document.querySelector('.linear-progress .progress-percent')
        
        if (fill) {
            fill.style.width = `${this.progress}%`
        }
        
        if (percent) {
            percent.textContent = `${Math.round(this.progress)}%`
        }
    }
    
    applyStyles() {
        if (!document.getElementById('linear-progress-styles')) {
            const style = document.createElement('style')
            style.id = 'linear-progress-styles'
            style.textContent = `
                .linear-progress {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .linear-progress .progress-label {
                    font-size: 13px;
                    color: #94a3b8;
                    min-width: 80px;
                }
                
                .linear-progress .progress-track {
                    flex: 1;
                    height: 8px;
                    background: #374151;
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .linear-progress .progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                
                .linear-progress .progress-fill.animated {
                    background-size: 200% 100%;
                    animation: progress-shimmer 1.5s infinite;
                }
                
                .linear-progress .progress-fill.color-blue {
                    background: linear-gradient(90deg, #3B82F6, #60A5FA);
                }
                
                .linear-progress .progress-fill.color-green {
                    background: linear-gradient(90deg, #10B981, #34D399);
                }
                
                .linear-progress .progress-fill.color-yellow {
                    background: linear-gradient(90deg, #F59E0B, #FBBF24);
                }
                
                .linear-progress .progress-fill.color-red {
                    background: linear-gradient(90deg, #EF4444, #F87171);
                }
                
                .linear-progress .progress-percent {
                    font-size: 13px;
                    font-weight: 500;
                    color: #e2e8f0;
                    min-width: 40px;
                    text-align: right;
                }
                
                @keyframes progress-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `
            document.head.appendChild(style)
        }
    }
}

export { ProcessProgressBar, CircularProgress, LinearProgressBar }
