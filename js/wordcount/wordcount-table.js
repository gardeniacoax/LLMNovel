import { WordCountValidator } from './wordcount-validator.js'
import { RewriteWordCountBuilder } from './rewrite-wordcount.js'

class WordCountCompareTable {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container
        this.chapters = options.chapters || []
        this.settings = options.settings || RewriteWordCountBuilder.getDefaultSettings()
        this.mode = options.mode || 'rewrite'
        this.onRowClick = options.onRowClick || null
    }
    
    render() {
        if (!this.container) return
        
        const rows = this.chapters.map(ch => this.renderRow(ch)).join('')
        
        this.container.innerHTML = `
            <div class="word-count-table">
                <div class="table-header grid grid-cols-5 gap-2 p-3 bg-slate-600 rounded-t-lg text-sm font-medium">
                    <span class="text-slate-300">章节</span>
                    <span class="text-slate-300">原字数</span>
                    <span class="text-slate-300">目标范围</span>
                    <span class="text-slate-300">${this.mode === 'rewrite' ? '改写字数' : '生成字数'}</span>
                    <span class="text-slate-300">比例</span>
                </div>
                <div class="table-body max-h-96 overflow-y-auto">
                    ${rows || '<div class="p-4 text-center text-slate-400">暂无章节数据</div>'}
                </div>
                <div class="table-footer grid grid-cols-5 gap-2 p-3 bg-slate-600 rounded-b-lg text-sm font-medium border-t border-slate-500">
                    ${this.renderSummary()}
                </div>
            </div>
        `
        
        this.bindEvents()
    }
    
    renderRow(chapter) {
        const originalWordCount = chapter.wordCount || chapter.originalWordCount || 0
        const rewriteWordCount = chapter.rewriteWordCount || chapter.generatedWordCount || 0
        
        let range = { min: 0, max: 0 }
        if (this.mode === 'rewrite') {
            range = RewriteWordCountBuilder.calculateExpectedRange(
                { wordCount: originalWordCount },
                this.settings
            )
        } else {
            range = {
                min: this.settings.minWords,
                max: this.settings.maxWords
            }
        }
        
        const hasResult = rewriteWordCount > 0
        const result = hasResult ? WordCountValidator.formatWordCount(rewriteWordCount) : '待处理'
        
        let ratio = '-'
        let ratioClass = ''
        
        if (hasResult && originalWordCount > 0) {
            const ratioPercent = WordCountValidator.calculateRatio(rewriteWordCount, originalWordCount)
            ratio = ratioPercent + '%'
            
            if (rewriteWordCount >= range.min && rewriteWordCount <= range.max) {
                ratioClass = 'text-green-400'
            } else if (rewriteWordCount < range.min) {
                ratioClass = 'text-yellow-400'
            } else {
                ratioClass = 'text-red-400'
            }
        }
        
        const statusClass = this.getStatusClass(chapter, range)
        
        return `
            <div class="table-row grid grid-cols-5 gap-2 p-3 hover:bg-slate-600 cursor-pointer transition-colors ${statusClass}" 
                data-chapter-num="${chapter.chapterNum}">
                <span class="text-white">第${chapter.chapterNum}章</span>
                <span class="text-slate-300">${originalWordCount > 0 ? WordCountValidator.formatWordCount(originalWordCount) : '-'}</span>
                <span class="text-slate-300 text-sm">${range.min > 0 ? `${WordCountValidator.formatWordCount(range.min)} ~ ${WordCountValidator.formatWordCount(range.max)}` : '-'}</span>
                <span class="${hasResult ? 'text-white' : 'text-slate-500'}">${result}</span>
                <span class="${ratioClass}">${ratio}</span>
            </div>
        `
    }
    
    getStatusClass(chapter, range) {
        const rewriteWordCount = chapter.rewriteWordCount || chapter.generatedWordCount || 0
        
        if (rewriteWordCount === 0) {
            return 'status-pending'
        }
        
        if (rewriteWordCount >= range.min && rewriteWordCount <= range.max) {
            return 'status-success border-l-4 border-green-500'
        }
        
        if (rewriteWordCount < range.min) {
            return 'status-warning border-l-4 border-yellow-500'
        }
        
        return 'status-error border-l-4 border-red-500'
    }
    
    renderSummary() {
        const totalOriginal = this.chapters.reduce((sum, ch) => sum + (ch.wordCount || ch.originalWordCount || 0), 0)
        const totalRewritten = this.chapters.reduce((sum, ch) => sum + (ch.rewriteWordCount || ch.generatedWordCount || 0), 0)
        
        let avgRatio = '-'
        if (totalRewritten > 0 && totalOriginal > 0) {
            avgRatio = WordCountValidator.calculateRatio(totalRewritten, totalOriginal) + '%'
        }
        
        const completedCount = this.chapters.filter(ch => (ch.rewriteWordCount || ch.generatedWordCount || 0) > 0).length
        
        return `
            <span class="text-white">合计 (${completedCount}/${this.chapters.length})</span>
            <span class="text-slate-300">${WordCountValidator.formatWordCount(totalOriginal)}</span>
            <span class="text-slate-300">-</span>
            <span class="text-white">${WordCountValidator.formatWordCount(totalRewritten)}</span>
            <span class="text-blue-400">${avgRatio}</span>
        `
    }
    
    bindEvents() {
        const rows = this.container.querySelectorAll('.table-row')
        rows.forEach(row => {
            row.addEventListener('click', () => {
                const chapterNum = parseInt(row.dataset.chapterNum)
                if (this.onRowClick) {
                    this.onRowClick(chapterNum)
                }
            })
        })
    }
    
    setChapters(chapters) {
        this.chapters = chapters
        this.render()
    }
    
    setSettings(settings) {
        this.settings = settings
        this.render()
    }
    
    setMode(mode) {
        this.mode = mode
        this.render()
    }
    
    updateChapter(chapterNum, data) {
        const index = this.chapters.findIndex(ch => ch.chapterNum === chapterNum)
        if (index !== -1) {
            this.chapters[index] = { ...this.chapters[index], ...data }
            this.render()
        }
    }
    
    getStats() {
        const totalOriginal = this.chapters.reduce((sum, ch) => sum + (ch.wordCount || ch.originalWordCount || 0), 0)
        const totalRewritten = this.chapters.reduce((sum, ch) => sum + (ch.rewriteWordCount || ch.generatedWordCount || 0), 0)
        const completedCount = this.chapters.filter(ch => (ch.rewriteWordCount || ch.generatedWordCount || 0) > 0).length
        
        let validCount = 0
        let invalidCount = 0
        
        this.chapters.forEach(ch => {
            const rewriteWordCount = ch.rewriteWordCount || ch.generatedWordCount || 0
            if (rewriteWordCount > 0) {
                const originalWordCount = ch.wordCount || ch.originalWordCount || 0
                const range = this.mode === 'rewrite'
                    ? RewriteWordCountBuilder.calculateExpectedRange({ wordCount: originalWordCount }, this.settings)
                    : { min: this.settings.minWords, max: this.settings.maxWords }
                
                if (rewriteWordCount >= range.min && rewriteWordCount <= range.max) {
                    validCount++
                } else {
                    invalidCount++
                }
            }
        })
        
        return {
            totalChapters: this.chapters.length,
            completedCount,
            pendingCount: this.chapters.length - completedCount,
            validCount,
            invalidCount,
            totalOriginal,
            totalRewritten,
            avgRatio: totalOriginal > 0 ? Math.round((totalRewritten / totalOriginal) * 100) : 0
        }
    }
}

class WordCountStatsView {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container
        this.stats = options.stats || {}
    }
    
    render() {
        if (!this.container) return
        
        const stats = this.stats
        
        this.container.innerHTML = `
            <div class="word-count-stats grid grid-cols-4 gap-4">
                <div class="stat-card p-4 bg-slate-700 rounded-lg text-center">
                    <div class="text-3xl font-bold text-white mb-1">${stats.totalChapters || 0}</div>
                    <div class="text-slate-400 text-sm">总章节</div>
                </div>
                <div class="stat-card p-4 bg-slate-700 rounded-lg text-center">
                    <div class="text-3xl font-bold text-green-400 mb-1">${stats.validCount || 0}</div>
                    <div class="text-slate-400 text-sm">达标章节</div>
                </div>
                <div class="stat-card p-4 bg-slate-700 rounded-lg text-center">
                    <div class="text-3xl font-bold text-yellow-400 mb-1">${stats.invalidCount || 0}</div>
                    <div class="text-slate-400 text-sm">未达标</div>
                </div>
                <div class="stat-card p-4 bg-slate-700 rounded-lg text-center">
                    <div class="text-3xl font-bold text-blue-400 mb-1">${stats.avgRatio || 0}%</div>
                    <div class="text-slate-400 text-sm">平均比例</div>
                </div>
            </div>
            
            <div class="progress-section mt-4">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-slate-400">完成进度</span>
                    <span class="text-white">${stats.completedCount || 0}/${stats.totalChapters || 0}</span>
                </div>
                <div class="progress-bar h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div class="progress-fill h-full bg-blue-500 transition-all duration-300" 
                        style="width: ${this.getProgressPercent()}%"></div>
                </div>
            </div>
        `
    }
    
    getProgressPercent() {
        if (!this.stats.totalChapters || this.stats.totalChapters === 0) return 0
        return Math.round((this.stats.completedCount / this.stats.totalChapters) * 100)
    }
    
    setStats(stats) {
        this.stats = stats
        this.render()
    }
}

export { WordCountCompareTable, WordCountStatsView }
