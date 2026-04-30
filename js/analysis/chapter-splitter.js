class ChapterSplitter {
    constructor() {
        this.patterns = {
            standard: /^第[一二三四五六七八九十百千万零\d]+[章节回集].*$/gm,
            numeric: /^\d+[\.\、].*$/gm,
            bracket: /^【第[一二三四五六七八九十百千万零\d]+章】.*$/gm,
            chapter: /^Chapter\s*\d+.*$/gim,
            custom: null
        }
        
        this.defaultPattern = 'standard'
    }
    
    split(content, patternType = 'standard', customPattern = null) {
        let pattern = this.getPattern(patternType, customPattern)
        
        if (!pattern) {
            return this.createSingleChapter(content)
        }
        
        const matches = [...content.matchAll(pattern)]
        
        if (matches.length === 0) {
            return this.createSingleChapter(content)
        }
        
        const chapters = []
        
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            const startIndex = match.index
            const endIndex = i < matches.length - 1 ? matches[i + 1].index : content.length
            
            const chapterContent = content.slice(startIndex, endIndex).trim()
            const lines = chapterContent.split('\n')
            const title = lines[0].trim()
            
            chapters.push({
                chapterNum: i + 1,
                title: title,
                content: chapterContent,
                wordCount: this.countWords(chapterContent),
                startIndex: startIndex,
                endIndex: endIndex,
                analysisStatus: 'pending',
                analysisResult: null
            })
        }
        
        return chapters
    }
    
    getPattern(patternType, customPattern = null) {
        if (patternType === 'custom' && customPattern) {
            try {
                return new RegExp(customPattern, 'gm')
            } catch (error) {
                console.error('自定义正则表达式无效:', error)
                return this.patterns.standard
            }
        }
        
        return this.patterns[patternType] || this.patterns.standard
    }
    
    createSingleChapter(content) {
        return [{
            chapterNum: 1,
            title: '全文',
            content: content.trim(),
            wordCount: this.countWords(content),
            startIndex: 0,
            endIndex: content.length,
            analysisStatus: 'pending',
            analysisResult: null
        }]
    }
    
    previewSplit(content, patternType = 'standard', customPattern = null) {
        let pattern = this.getPattern(patternType, customPattern)
        
        if (!pattern) {
            return [{
                chapterNum: 1,
                title: '全文',
                position: 0,
                wordCount: this.countWords(content)
            }]
        }
        
        const matches = [...content.matchAll(pattern)]
        
        if (matches.length === 0) {
            return [{
                chapterNum: 1,
                title: '全文',
                position: 0,
                wordCount: this.countWords(content)
            }]
        }
        
        return matches.map((match, index) => {
            const endIndex = index < matches.length - 1 ? matches[index + 1].index : content.length
            const chapterContent = content.slice(match.index, endIndex)
            
            return {
                chapterNum: index + 1,
                title: match[0].trim(),
                position: match.index,
                wordCount: this.countWords(chapterContent)
            }
        })
    }
    
    countWords(text) {
        if (!text) return 0
        
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
        const numbers = (text.match(/\d+/g) || []).length
        
        return chineseChars + englishWords + numbers
    }
    
    mergeChapters(chapters, startIndex, endIndex) {
        if (startIndex < 0 || endIndex >= chapters.length || startIndex > endIndex) {
            return chapters
        }
        
        const merged = []
        
        for (let i = 0; i < chapters.length; i++) {
            if (i < startIndex) {
                merged.push({ ...chapters[i], chapterNum: i + 1 })
            } else if (i === startIndex) {
                const toMerge = chapters.slice(startIndex, endIndex + 1)
                const mergedContent = toMerge.map(ch => ch.content).join('\n\n')
                const mergedTitle = toMerge.map(ch => ch.title).join(' + ')
                
                merged.push({
                    chapterNum: startIndex + 1,
                    title: mergedTitle,
                    content: mergedContent,
                    wordCount: this.countWords(mergedContent),
                    startIndex: toMerge[0].startIndex,
                    endIndex: toMerge[toMerge.length - 1].endIndex,
                    analysisStatus: 'pending',
                    analysisResult: null,
                    merged: true,
                    mergedFrom: toMerge.map(ch => ch.chapterNum)
                })
            } else if (i > endIndex) {
                merged.push({ ...chapters[i], chapterNum: merged.length + 1 })
            }
        }
        
        return merged
    }
    
    splitChapter(chapters, chapterIndex, splitPosition) {
        if (chapterIndex < 0 || chapterIndex >= chapters.length) {
            return chapters
        }
        
        const chapter = chapters[chapterIndex]
        const content = chapter.content
        
        if (splitPosition <= 0 || splitPosition >= content.length) {
            return chapters
        }
        
        const firstPart = content.slice(0, splitPosition).trim()
        const secondPart = content.slice(splitPosition).trim()
        
        const result = []
        
        for (let i = 0; i < chapters.length; i++) {
            if (i < chapterIndex) {
                result.push(chapters[i])
            } else if (i === chapterIndex) {
                result.push({
                    chapterNum: chapterIndex + 1,
                    title: chapter.title + ' (上)',
                    content: firstPart,
                    wordCount: this.countWords(firstPart),
                    startIndex: chapter.startIndex,
                    endIndex: chapter.startIndex + splitPosition,
                    analysisStatus: 'pending',
                    analysisResult: null
                })
                
                result.push({
                    chapterNum: chapterIndex + 2,
                    title: chapter.title + ' (下)',
                    content: secondPart,
                    wordCount: this.countWords(secondPart),
                    startIndex: chapter.startIndex + splitPosition,
                    endIndex: chapter.endIndex,
                    analysisStatus: 'pending',
                    analysisResult: null
                })
            } else {
                result.push({
                    ...chapters[i],
                    chapterNum: chapters[i].chapterNum + 1
                })
            }
        }
        
        return result
    }
    
    detectPatternType(content) {
        const results = {}
        
        for (const [type, pattern] of Object.entries(this.patterns)) {
            if (type === 'custom') continue
            
            const matches = content.match(pattern)
            results[type] = matches ? matches.length : 0
        }
        
        let bestType = 'standard'
        let bestCount = 0
        
        for (const [type, count] of Object.entries(results)) {
            if (count > bestCount) {
                bestCount = count
                bestType = type
            }
        }
        
        return {
            recommended: bestType,
            counts: results
        }
    }
    
    getSplitStats(chapters) {
        if (!chapters || chapters.length === 0) {
            return {
                totalChapters: 0,
                totalWords: 0,
                avgWords: 0,
                minWords: 0,
                maxWords: 0
            }
        }
        
        const wordCounts = chapters.map(ch => ch.wordCount)
        const totalWords = wordCounts.reduce((sum, count) => sum + count, 0)
        
        return {
            totalChapters: chapters.length,
            totalWords: totalWords,
            avgWords: Math.round(totalWords / chapters.length),
            minWords: Math.min(...wordCounts),
            maxWords: Math.max(...wordCounts)
        }
    }
    
    validateChapters(chapters, minWords = 100, maxWords = 50000) {
        const issues = []
        
        chapters.forEach((chapter, index) => {
            if (chapter.wordCount < minWords) {
                issues.push({
                    type: 'too_short',
                    chapterNum: chapter.chapterNum,
                    title: chapter.title,
                    wordCount: chapter.wordCount,
                    message: `章节字数过少（${chapter.wordCount}字），建议合并`
                })
            }
            
            if (chapter.wordCount > maxWords) {
                issues.push({
                    type: 'too_long',
                    chapterNum: chapter.chapterNum,
                    title: chapter.title,
                    wordCount: chapter.wordCount,
                    message: `章节字数过多（${chapter.wordCount}字），建议拆分`
                })
            }
        })
        
        return {
            valid: issues.length === 0,
            issues: issues
        }
    }
}

class ChapterSplitterUI {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId)
        this.content = options.content || ''
        this.patternType = options.patternType || 'standard'
        this.customPattern = options.customPattern || ''
        this.chapters = []
        this.onConfirm = options.onConfirm || null
        this.onCancel = options.onCancel || null
    }
    
    render() {
        if (!this.container) return
        
        const detection = new ChapterSplitter().detectPatternType(this.content)
        
        this.container.innerHTML = `
            <div class="chapter-splitter">
                <div class="splitter-header mb-4">
                    <h3 class="text-lg font-semibold text-white mb-2">章节拆分预览</h3>
                    <p class="text-slate-400 text-sm">自动检测推荐模式：${detection.recommended}（识别 ${detection.counts[detection.recommended]} 个章节）</p>
                </div>
                
                <div class="pattern-selector mb-4">
                    <label class="text-slate-400 text-sm mb-2 block">识别模式：</label>
                    <div class="flex flex-wrap gap-4">
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="split-pattern" value="standard" 
                                ${this.patternType === 'standard' ? 'checked' : ''}
                                class="mr-2">
                            <span class="text-white">标准模式（第X章）</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="split-pattern" value="numeric" 
                                ${this.patternType === 'numeric' ? 'checked' : ''}
                                class="mr-2">
                            <span class="text-white">数字模式（1.）</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="split-pattern" value="bracket" 
                                ${this.patternType === 'bracket' ? 'checked' : ''}
                                class="mr-2">
                            <span class="text-white">括号模式（【第X章】）</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="split-pattern" value="chapter" 
                                ${this.patternType === 'chapter' ? 'checked' : ''}
                                class="mr-2">
                            <span class="text-white">英文模式（Chapter）</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="split-pattern" value="custom" 
                                ${this.patternType === 'custom' ? 'checked' : ''}
                                class="mr-2">
                            <span class="text-white">自定义正则</span>
                        </label>
                    </div>
                    
                    <div id="custom-pattern-input" class="mt-3 ${this.patternType === 'custom' ? '' : 'hidden'}">
                        <input type="text" id="custom-pattern" 
                            value="${this.customPattern}"
                            placeholder="输入自定义正则表达式..."
                            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none">
                    </div>
                </div>
                
                <div class="preview-table mb-4">
                    <div class="table-header grid grid-cols-5 gap-2 p-3 bg-slate-600 rounded-t-lg text-sm font-medium">
                        <span class="text-slate-300">章节</span>
                        <span class="text-slate-300 col-span-2">标题</span>
                        <span class="text-slate-300">字数</span>
                        <span class="text-slate-300">操作</span>
                    </div>
                    <div class="table-body max-h-64 overflow-y-auto" id="preview-list">
                    </div>
                </div>
                
                <div class="splitter-stats mb-4 p-3 bg-slate-700 rounded-lg">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-400">共识别 <span id="total-chapters">0</span> 个章节</span>
                        <span class="text-slate-400">总字数 <span id="total-words">0</span></span>
                    </div>
                </div>
                
                <div class="splitter-actions flex justify-end space-x-3">
                    <button class="btn btn-secondary" id="btn-cancel">取消</button>
                    <button class="btn btn-primary" id="btn-confirm">确认导入</button>
                </div>
            </div>
        `
        
        this.bindEvents()
        this.updatePreview()
    }
    
    bindEvents() {
        const patternRadios = this.container.querySelectorAll('input[name="split-pattern"]')
        patternRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.patternType = e.target.value
                const customInput = document.getElementById('custom-pattern-input')
                if (customInput) {
                    customInput.classList.toggle('hidden', this.patternType !== 'custom')
                }
                this.updatePreview()
            })
        })
        
        const customPatternInput = document.getElementById('custom-pattern')
        if (customPatternInput) {
            customPatternInput.addEventListener('input', (e) => {
                this.customPattern = e.target.value
                if (this.patternType === 'custom') {
                    this.updatePreview()
                }
            })
        }
        
        const cancelBtn = document.getElementById('btn-cancel')
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.onCancel) this.onCancel()
            })
        }
        
        const confirmBtn = document.getElementById('btn-confirm')
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (this.onConfirm) this.onConfirm(this.chapters)
            })
        }
    }
    
    updatePreview() {
        const splitter = new ChapterSplitter()
        this.chapters = splitter.split(this.content, this.patternType, this.customPattern)
        
        const listContainer = document.getElementById('preview-list')
        if (listContainer) {
            listContainer.innerHTML = this.chapters.map((ch, index) => `
                <div class="table-row grid grid-cols-5 gap-2 p-3 hover:bg-slate-600 transition-colors" data-index="${index}">
                    <span class="text-white">第${ch.chapterNum}章</span>
                    <span class="text-slate-300 col-span-2 truncate" title="${ch.title}">${ch.title}</span>
                    <span class="text-slate-300">${ch.wordCount.toLocaleString()}</span>
                    <span class="text-slate-400">
                        <button class="text-blue-400 hover:text-blue-300 text-sm view-btn" data-index="${index}">查看</button>
                    </span>
                </div>
            `).join('')
            
            listContainer.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation()
                    const index = parseInt(btn.dataset.index)
                    this.showChapterContent(index)
                })
            })
        }
        
        const stats = splitter.getSplitStats(this.chapters)
        const totalChaptersEl = document.getElementById('total-chapters')
        const totalWordsEl = document.getElementById('total-words')
        
        if (totalChaptersEl) totalChaptersEl.textContent = stats.totalChapters
        if (totalWordsEl) totalWordsEl.textContent = stats.totalWords.toLocaleString()
    }
    
    showChapterContent(index) {
        const chapter = this.chapters[index]
        if (!chapter) return
        
        const content = `
            <div class="chapter-preview">
                <h4 class="text-white font-medium mb-2">${chapter.title}</h4>
                <p class="text-slate-400 text-sm mb-4">字数：${chapter.wordCount.toLocaleString()}</p>
                <div class="bg-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre class="text-slate-300 text-sm whitespace-pre-wrap">${chapter.content.slice(0, 1000)}${chapter.content.length > 1000 ? '...' : ''}</pre>
                </div>
            </div>
        `
        
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-slate-700">
                ${content}
                <div class="mt-4 flex justify-end">
                    <button class="btn btn-secondary close-btn">关闭</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove())
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove()
        })
    }
    
    setContent(content) {
        this.content = content
        this.render()
    }
    
    getChapters() {
        return this.chapters
    }
}

export { ChapterSplitter, ChapterSplitterUI }
