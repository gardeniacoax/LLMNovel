import { WordCountValidator } from './wordcount-validator.js'

const CONTINUE_DEFAULT_SETTINGS = {
    targetWords: 5000,
    minWords: 3000,
    maxWords: 8000,
    presets: {
        short: { target: 2000, min: 1000, max: 3000 },
        medium: { target: 5000, min: 3000, max: 8000 },
        long: { target: 8000, min: 5000, max: 12000 }
    }
}

class ContinueWordCountBuilder {
    static buildPrompt(outline, settings) {
        return `字数要求：续写的章节字数应在${settings.minWords}至${settings.maxWords}字之间，目标字数为${settings.targetWords}字。请严格控制字数，确保内容充实、情节完整。

章节大纲：
${outline}

请严格按照字数要求进行续写。`
    }
    
    static applyPreset(presetName) {
        const presets = CONTINUE_DEFAULT_SETTINGS.presets
        return presets[presetName] ? { ...presets[presetName] } : { ...presets.medium }
    }
    
    static getDefaultSettings() {
        return {
            targetWords: CONTINUE_DEFAULT_SETTINGS.targetWords,
            minWords: CONTINUE_DEFAULT_SETTINGS.minWords,
            maxWords: CONTINUE_DEFAULT_SETTINGS.maxWords
        }
    }
    
    static validateSettings(settings) {
        const errors = []
        
        if (settings.minWords < 100) {
            errors.push('最小字数不能少于100字')
        }
        
        if (settings.maxWords > 100000) {
            errors.push('最大字数不能超过100000字')
        }
        
        if (settings.minWords > settings.maxWords) {
            errors.push('最小字数不能大于最大字数')
        }
        
        if (settings.targetWords < settings.minWords || settings.targetWords > settings.maxWords) {
            errors.push('目标字数应在最小和最大字数之间')
        }
        
        return {
            valid: errors.length === 0,
            errors
        }
    }
    
    static calculateExpectedRange(settings) {
        return {
            min: settings.minWords,
            max: settings.maxWords,
            target: settings.targetWords
        }
    }
    
    static estimateTotalWords(settings, chapterCount) {
        return {
            min: settings.minWords * chapterCount,
            max: settings.maxWords * chapterCount,
            average: settings.targetWords * chapterCount
        }
    }
}

class ContinueWordCountUI {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId)
        this.settings = options.settings || ContinueWordCountBuilder.getDefaultSettings()
        this.chapterCount = options.chapterCount || 1
        this.onChange = options.onChange || null
    }
    
    render() {
        if (!this.container) return
        
        this.container.innerHTML = `
            <div class="word-count-control p-4 bg-slate-700 rounded-lg">
                <h4 class="text-white font-medium mb-4">续写字数设置</h4>
                
                <div class="space-y-4">
                    <div>
                        <label class="text-slate-400 text-sm mb-2 block">目标字数</label>
                        <div class="flex items-center space-x-3">
                            <input type="range" id="target-words-slider" 
                                min="1000" max="15000" step="100" 
                                value="${this.settings.targetWords}"
                                class="flex-1">
                            <input type="number" id="target-words-input"
                                value="${this.settings.targetWords}"
                                min="100" max="100000" step="100"
                                class="w-24 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-center">
                            <span class="text-slate-400">字</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-slate-400 text-sm mb-2 block">最小字数</label>
                            <div class="flex items-center space-x-2">
                                <input type="number" id="min-words" 
                                    value="${this.settings.minWords}"
                                    min="100" max="100000" step="100"
                                    class="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white">
                                <span class="text-slate-400">字</span>
                            </div>
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-2 block">最大字数</label>
                            <div class="flex items-center space-x-2">
                                <input type="number" id="max-words" 
                                    value="${this.settings.maxWords}"
                                    min="100" max="100000" step="100"
                                    class="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white">
                                <span class="text-slate-400">字</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="quick-presets mt-4">
                    <label class="text-slate-400 text-sm mb-2 block">快捷设置：</label>
                    <div class="flex space-x-2">
                        <button class="btn btn-sm btn-secondary preset-btn" data-preset="short">
                            短篇 2000
                        </button>
                        <button class="btn btn-sm btn-secondary preset-btn" data-preset="medium">
                            中篇 5000
                        </button>
                        <button class="btn btn-sm btn-secondary preset-btn" data-preset="long">
                            长篇 8000
                        </button>
                        <button class="btn btn-sm btn-secondary preset-btn" data-preset="custom">
                            自定义
                        </button>
                    </div>
                </div>
                
                <div class="expected-output mt-4 p-3 bg-slate-600 rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">预计每章输出：</span>
                        <span id="expected-range" class="text-white font-medium">${this.getExpectedRangeText()}</span>
                    </div>
                    ${this.chapterCount > 1 ? `
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-slate-400">预计总字数（${this.chapterCount}章）：</span>
                            <span id="total-estimate" class="text-blue-400">${this.getTotalEstimateText()}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `
        
        this.bindEvents()
    }
    
    bindEvents() {
        const targetSlider = document.getElementById('target-words-slider')
        const targetInput = document.getElementById('target-words-input')
        const minInput = document.getElementById('min-words')
        const maxInput = document.getElementById('max-words')
        const presetBtns = this.container.querySelectorAll('.preset-btn')
        
        if (targetSlider) {
            targetSlider.addEventListener('input', (e) => {
                this.settings.targetWords = parseInt(e.target.value)
                if (targetInput) {
                    targetInput.value = this.settings.targetWords
                }
                this.updateExpectedRange()
                this.notifyChange()
            })
        }
        
        if (targetInput) {
            targetInput.addEventListener('input', (e) => {
                this.settings.targetWords = parseInt(e.target.value) || 5000
                if (targetSlider) {
                    targetSlider.value = Math.min(this.settings.targetWords, 15000)
                }
                this.updateExpectedRange()
                this.notifyChange()
            })
        }
        
        if (minInput) {
            minInput.addEventListener('input', (e) => {
                this.settings.minWords = parseInt(e.target.value) || 1000
                this.updateExpectedRange()
                this.notifyChange()
            })
        }
        
        if (maxInput) {
            maxInput.addEventListener('input', (e) => {
                this.settings.maxWords = parseInt(e.target.value) || 10000
                this.updateExpectedRange()
                this.notifyChange()
            })
        }
        
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset
                this.applyPreset(preset)
            })
        })
    }
    
    applyPreset(presetName) {
        if (presetName === 'custom') {
            return
        }
        
        const preset = ContinueWordCountBuilder.applyPreset(presetName)
        this.settings.targetWords = preset.target
        this.settings.minWords = preset.min
        this.settings.maxWords = preset.max
        
        this.render()
        this.notifyChange()
    }
    
    updateExpectedRange() {
        const rangeEl = document.getElementById('expected-range')
        if (rangeEl) {
            rangeEl.textContent = this.getExpectedRangeText()
        }
        
        const totalEl = document.getElementById('total-estimate')
        if (totalEl && this.chapterCount > 1) {
            totalEl.textContent = this.getTotalEstimateText()
        }
    }
    
    getExpectedRangeText() {
        return `${WordCountValidator.formatWordCount(this.settings.minWords)} ~ ${WordCountValidator.formatWordCount(this.settings.maxWords)}`
    }
    
    getTotalEstimateText() {
        const estimate = ContinueWordCountBuilder.estimateTotalWords(this.settings, this.chapterCount)
        return `${WordCountValidator.formatWordCount(estimate.min)} ~ ${WordCountValidator.formatWordCount(estimate.max)}`
    }
    
    setChapterCount(count) {
        this.chapterCount = count
        this.render()
    }
    
    getSettings() {
        return {
            targetWords: this.settings.targetWords,
            minWords: this.settings.minWords,
            maxWords: this.settings.maxWords
        }
    }
    
    setSettings(settings) {
        this.settings = { ...ContinueWordCountBuilder.getDefaultSettings(), ...settings }
        this.render()
    }
    
    notifyChange() {
        if (this.onChange) {
            this.onChange(this.getSettings())
        }
    }
}

export { ContinueWordCountBuilder, ContinueWordCountUI, CONTINUE_DEFAULT_SETTINGS }
