import { WordCountValidator } from './wordcount-validator.js'

const REWRITE_DEFAULT_SETTINGS = {
    mode: 'ratio',
    ratio: {
        minRatio: 0.8,
        maxRatio: 1.2
    },
    absolute: {
        minWords: 1000,
        maxWords: 10000,
        targetWords: 5000
    },
    reference: {
        tolerance: 0.1
    }
}

class RewriteWordCountBuilder {
    static buildPrompt(chapter, settings) {
        const originalWordCount = chapter.wordCount || chapter.originalWordCount || 0
        let wordCountInstruction = ''
        
        switch (settings.mode) {
            case 'ratio':
                const minWords = Math.floor(originalWordCount * settings.ratio.minRatio)
                const maxWords = Math.ceil(originalWordCount * settings.ratio.maxRatio)
                wordCountInstruction = `字数要求：改写后的章节字数应在${minWords}至${maxWords}字之间（原章节${originalWordCount}字的${Math.round(settings.ratio.minRatio * 100)}%至${Math.round(settings.ratio.maxRatio * 100)}%）。请严格控制字数，不要超出范围。`
                break
                
            case 'absolute':
                wordCountInstruction = `字数要求：改写后的章节字数应在${settings.absolute.minWords}至${settings.absolute.maxWords}字之间，目标字数为${settings.absolute.targetWords}字。请严格控制字数，不要超出范围。`
                break
                
            case 'reference':
                const tolerance = settings.reference.tolerance
                const refMin = Math.floor(originalWordCount * (1 - tolerance))
                const refMax = Math.ceil(originalWordCount * (1 + tolerance))
                wordCountInstruction = `字数要求：改写后的章节字数应接近原章节字数（${originalWordCount}字），允许${Math.round(tolerance * 100)}%的偏差，即${refMin}至${refMax}字之间。请严格控制字数，不要超出范围。`
                break
                
            default:
                const defaultMin = Math.floor(originalWordCount * 0.8)
                const defaultMax = Math.ceil(originalWordCount * 1.2)
                wordCountInstruction = `字数要求：改写后的章节字数应在${defaultMin}至${defaultMax}字之间。请严格控制字数，不要超出范围。`
        }
        
        return wordCountInstruction
    }
    
    static calculateExpectedRange(chapter, settings) {
        const originalWordCount = chapter.wordCount || chapter.originalWordCount || 0
        
        switch (settings.mode) {
            case 'ratio':
                return {
                    min: Math.floor(originalWordCount * settings.ratio.minRatio),
                    max: Math.ceil(originalWordCount * settings.ratio.maxRatio),
                    original: originalWordCount
                }
                
            case 'absolute':
                return {
                    min: settings.absolute.minWords,
                    max: settings.absolute.maxWords,
                    original: originalWordCount
                }
                
            case 'reference':
                return {
                    min: Math.floor(originalWordCount * (1 - settings.reference.tolerance)),
                    max: Math.ceil(originalWordCount * (1 + settings.reference.tolerance)),
                    original: originalWordCount
                }
                
            default:
                return {
                    min: Math.floor(originalWordCount * 0.8),
                    max: Math.ceil(originalWordCount * 1.2),
                    original: originalWordCount
                }
        }
    }
    
    static getDefaultSettings() {
        return JSON.parse(JSON.stringify(REWRITE_DEFAULT_SETTINGS))
    }
    
    static validateSettings(settings) {
        const errors = []
        
        if (!['ratio', 'absolute', 'reference'].includes(settings.mode)) {
            errors.push('无效的控制模式')
        }
        
        if (settings.mode === 'ratio') {
            if (settings.ratio.minRatio <= 0 || settings.ratio.minRatio > 1) {
                errors.push('最小比例应在0-1之间')
            }
            if (settings.ratio.maxRatio < 1) {
                errors.push('最大比例应大于等于1')
            }
            if (settings.ratio.minRatio > settings.ratio.maxRatio) {
                errors.push('最小比例不能大于最大比例')
            }
        }
        
        if (settings.mode === 'absolute') {
            if (settings.absolute.minWords < 100) {
                errors.push('最小字数不能少于100字')
            }
            if (settings.absolute.maxWords > 100000) {
                errors.push('最大字数不能超过100000字')
            }
            if (settings.absolute.minWords > settings.absolute.maxWords) {
                errors.push('最小字数不能大于最大字数')
            }
            if (settings.absolute.targetWords < settings.absolute.minWords || 
                settings.absolute.targetWords > settings.absolute.maxWords) {
                errors.push('目标字数应在最小和最大字数之间')
            }
        }
        
        if (settings.mode === 'reference') {
            if (settings.reference.tolerance <= 0 || settings.reference.tolerance > 0.5) {
                errors.push('允许偏差应在0-50%之间')
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        }
    }
}

class RewriteWordCountUI {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId)
        this.settings = options.settings || RewriteWordCountBuilder.getDefaultSettings()
        this.originalWordCount = options.originalWordCount || 0
        this.onChange = options.onChange || null
    }
    
    render() {
        if (!this.container) return
        
        this.container.innerHTML = `
            <div class="word-count-control p-4 bg-slate-700 rounded-lg">
                <h4 class="text-white font-medium mb-4">字数控制设置</h4>
                
                <div class="mode-selector mb-4">
                    <label class="text-slate-400 text-sm mb-2 block">控制模式：</label>
                    <div class="flex space-x-4">
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="rewrite-mode" value="ratio" 
                                ${this.settings.mode === 'ratio' ? 'checked' : ''}
                                class="mr-2">
                            <span class="text-white">按比例（相对原文）</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="rewrite-mode" value="absolute" 
                                ${this.settings.mode === 'absolute' ? 'checked' : ''}
                                class="mr-2">
                            <span class="text-white">绝对字数</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="rewrite-mode" value="reference" 
                                ${this.settings.mode === 'reference' ? 'checked' : ''}
                                class="mr-2">
                            <span class="text-white">参考原文</span>
                        </label>
                    </div>
                </div>
                
                <div id="mode-settings-container">
                    ${this.renderModeSettings()}
                </div>
                
                <div class="expected-output mt-4 p-3 bg-slate-600 rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">预计输出：</span>
                        <span id="expected-range" class="text-white font-medium">${this.getExpectedRangeText()}</span>
                    </div>
                    ${this.originalWordCount > 0 ? `
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-slate-400">原章节字数：</span>
                            <span class="text-blue-400">${WordCountValidator.formatWordCount(this.originalWordCount)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `
        
        this.bindEvents()
    }
    
    renderModeSettings() {
        switch (this.settings.mode) {
            case 'ratio':
                return this.renderRatioSettings()
            case 'absolute':
                return this.renderAbsoluteSettings()
            case 'reference':
                return this.renderReferenceSettings()
            default:
                return this.renderRatioSettings()
        }
    }
    
    renderRatioSettings() {
        return `
            <div class="ratio-settings space-y-4">
                <div>
                    <label class="text-slate-400 text-sm mb-2 block">最小比例</label>
                    <div class="flex items-center space-x-3">
                        <input type="range" id="min-ratio" min="0.5" max="1" step="0.05" 
                            value="${this.settings.ratio.minRatio}"
                            class="flex-1">
                        <span id="min-ratio-value" class="text-white w-16 text-right">${Math.round(this.settings.ratio.minRatio * 100)}%</span>
                    </div>
                    <p class="text-slate-500 text-xs mt-1">对应字数：<span id="min-ratio-words">${this.getRatioWords('min')}</span></p>
                </div>
                
                <div>
                    <label class="text-slate-400 text-sm mb-2 block">最大比例</label>
                    <div class="flex items-center space-x-3">
                        <input type="range" id="max-ratio" min="1" max="2" step="0.05" 
                            value="${this.settings.ratio.maxRatio}"
                            class="flex-1">
                        <span id="max-ratio-value" class="text-white w-16 text-right">${Math.round(this.settings.ratio.maxRatio * 100)}%</span>
                    </div>
                    <p class="text-slate-500 text-xs mt-1">对应字数：<span id="max-ratio-words">${this.getRatioWords('max')}</span></p>
                </div>
            </div>
        `
    }
    
    renderAbsoluteSettings() {
        return `
            <div class="absolute-settings space-y-4">
                <div>
                    <label class="text-slate-400 text-sm mb-2 block">目标字数</label>
                    <div class="flex items-center space-x-3">
                        <input type="number" id="target-words" 
                            value="${this.settings.absolute.targetWords}"
                            min="100" max="100000" step="100"
                            class="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white">
                        <span class="text-slate-400">字</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-slate-400 text-sm mb-2 block">最小字数</label>
                        <input type="number" id="min-words" 
                            value="${this.settings.absolute.minWords}"
                            min="100" max="100000" step="100"
                            class="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white">
                    </div>
                    <div>
                        <label class="text-slate-400 text-sm mb-2 block">最大字数</label>
                        <input type="number" id="max-words" 
                            value="${this.settings.absolute.maxWords}"
                            min="100" max="100000" step="100"
                            class="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white">
                    </div>
                </div>
            </div>
        `
    }
    
    renderReferenceSettings() {
        return `
            <div class="reference-settings">
                <label class="text-slate-400 text-sm mb-2 block">允许偏差</label>
                <div class="flex items-center space-x-3">
                    <input type="range" id="tolerance" min="0.05" max="0.3" step="0.01" 
                        value="${this.settings.reference.tolerance}"
                        class="flex-1">
                    <span id="tolerance-value" class="text-white w-16 text-right">±${Math.round(this.settings.reference.tolerance * 100)}%</span>
                </div>
                <p class="text-slate-500 text-xs mt-2">
                    允许范围：<span id="reference-range">${this.getReferenceRangeText()}</span>
                </p>
            </div>
        `
    }
    
    bindEvents() {
        const modeRadios = this.container.querySelectorAll('input[name="rewrite-mode"]')
        modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.settings.mode = e.target.value
                this.updateModeSettings()
                this.notifyChange()
            })
        })
        
        this.bindModeSpecificEvents()
    }
    
    bindModeSpecificEvents() {
        if (this.settings.mode === 'ratio') {
            const minRatioInput = document.getElementById('min-ratio')
            const maxRatioInput = document.getElementById('max-ratio')
            
            if (minRatioInput) {
                minRatioInput.addEventListener('input', (e) => {
                    this.settings.ratio.minRatio = parseFloat(e.target.value)
                    document.getElementById('min-ratio-value').textContent = Math.round(this.settings.ratio.minRatio * 100) + '%'
                    document.getElementById('min-ratio-words').textContent = this.getRatioWords('min')
                    this.updateExpectedRange()
                    this.notifyChange()
                })
            }
            
            if (maxRatioInput) {
                maxRatioInput.addEventListener('input', (e) => {
                    this.settings.ratio.maxRatio = parseFloat(e.target.value)
                    document.getElementById('max-ratio-value').textContent = Math.round(this.settings.ratio.maxRatio * 100) + '%'
                    document.getElementById('max-ratio-words').textContent = this.getRatioWords('max')
                    this.updateExpectedRange()
                    this.notifyChange()
                })
            }
        }
        
        if (this.settings.mode === 'absolute') {
            const targetInput = document.getElementById('target-words')
            const minInput = document.getElementById('min-words')
            const maxInput = document.getElementById('max-words')
            
            if (targetInput) {
                targetInput.addEventListener('input', (e) => {
                    this.settings.absolute.targetWords = parseInt(e.target.value) || 5000
                    this.notifyChange()
                })
            }
            
            if (minInput) {
                minInput.addEventListener('input', (e) => {
                    this.settings.absolute.minWords = parseInt(e.target.value) || 1000
                    this.updateExpectedRange()
                    this.notifyChange()
                })
            }
            
            if (maxInput) {
                maxInput.addEventListener('input', (e) => {
                    this.settings.absolute.maxWords = parseInt(e.target.value) || 10000
                    this.updateExpectedRange()
                    this.notifyChange()
                })
            }
        }
        
        if (this.settings.mode === 'reference') {
            const toleranceInput = document.getElementById('tolerance')
            
            if (toleranceInput) {
                toleranceInput.addEventListener('input', (e) => {
                    this.settings.reference.tolerance = parseFloat(e.target.value)
                    document.getElementById('tolerance-value').textContent = '±' + Math.round(this.settings.reference.tolerance * 100) + '%'
                    document.getElementById('reference-range').textContent = this.getReferenceRangeText()
                    this.updateExpectedRange()
                    this.notifyChange()
                })
            }
        }
    }
    
    updateModeSettings() {
        const container = document.getElementById('mode-settings-container')
        if (container) {
            container.innerHTML = this.renderModeSettings()
            this.bindModeSpecificEvents()
            this.updateExpectedRange()
        }
    }
    
    updateExpectedRange() {
        const rangeEl = document.getElementById('expected-range')
        if (rangeEl) {
            rangeEl.textContent = this.getExpectedRangeText()
        }
    }
    
    getRatioWords(type) {
        if (this.originalWordCount <= 0) return '需要原文'
        
        if (type === 'min') {
            return WordCountValidator.formatWordCount(
                Math.floor(this.originalWordCount * this.settings.ratio.minRatio)
            )
        }
        return WordCountValidator.formatWordCount(
            Math.ceil(this.originalWordCount * this.settings.ratio.maxRatio)
        )
    }
    
    getReferenceRangeText() {
        if (this.originalWordCount <= 0) return '需要原文'
        
        const min = Math.floor(this.originalWordCount * (1 - this.settings.reference.tolerance))
        const max = Math.ceil(this.originalWordCount * (1 + this.settings.reference.tolerance))
        return `${WordCountValidator.formatWordCount(min)} ~ ${WordCountValidator.formatWordCount(max)}`
    }
    
    getExpectedRangeText() {
        const range = RewriteWordCountBuilder.calculateExpectedRange(
            { wordCount: this.originalWordCount },
            this.settings
        )
        return `${WordCountValidator.formatWordCount(range.min)} ~ ${WordCountValidator.formatWordCount(range.max)}`
    }
    
    setOriginalWordCount(count) {
        this.originalWordCount = count
        this.render()
    }
    
    getSettings() {
        return JSON.parse(JSON.stringify(this.settings))
    }
    
    setSettings(settings) {
        this.settings = { ...REWRITE_DEFAULT_SETTINGS, ...settings }
        this.render()
    }
    
    notifyChange() {
        if (this.onChange) {
            this.onChange(this.settings)
        }
    }
}

export { RewriteWordCountBuilder, RewriteWordCountUI, REWRITE_DEFAULT_SETTINGS }
