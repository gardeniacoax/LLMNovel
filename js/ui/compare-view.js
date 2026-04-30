class CompareView {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.original = options.original || ''
        this.rewritten = options.rewritten || ''
        this.viewMode = options.viewMode || 'side-by-side'
        
        this.onModeChange = options.onModeChange || null
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="compare-view">
                <div class="compare-toolbar">
                    <div class="toolbar-left">
                        <button class="view-mode-btn ${this.viewMode === 'side-by-side' ? 'active' : ''}" 
                                data-mode="side-by-side">并排对比</button>
                        <button class="view-mode-btn ${this.viewMode === 'inline' ? 'active' : ''}" 
                                data-mode="inline">内联对比</button>
                        <button class="view-mode-btn ${this.viewMode === 'diff' ? 'active' : ''}" 
                                data-mode="diff">差异高亮</button>
                    </div>
                    <div class="toolbar-right">
                        <span class="compare-stats">
                            原文 ${this.countWords(this.original)} 字 → 改写 ${this.countWords(this.rewritten)} 字
                        </span>
                    </div>
                </div>
                <div class="compare-content">
                    ${this.renderContent()}
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    renderContent() {
        switch (this.viewMode) {
            case 'side-by-side':
                return this.renderSideBySide()
            case 'inline':
                return this.renderInline()
            case 'diff':
                return this.renderDiff()
            default:
                return this.renderSideBySide()
        }
    }
    
    renderSideBySide() {
        return `
            <div class="compare-panels">
                <div class="compare-panel">
                    <div class="panel-header">
                        <span class="panel-title">原文</span>
                        <span class="word-count">${this.countWords(this.original)} 字</span>
                    </div>
                    <div class="panel-content">${this.formatContent(this.original)}</div>
                </div>
                <div class="compare-panel">
                    <div class="panel-header">
                        <span class="panel-title">改写后</span>
                        <span class="word-count">${this.countWords(this.rewritten)} 字</span>
                    </div>
                    <div class="panel-content">${this.formatContent(this.rewritten)}</div>
                </div>
            </div>
        `
    }
    
    renderInline() {
        const paragraphs1 = this.original.split('\n').filter(p => p.trim())
        const paragraphs2 = this.rewritten.split('\n').filter(p => p.trim())
        const maxLen = Math.max(paragraphs1.length, paragraphs2.length)
        
        let html = '<div class="compare-inline">'
        for (let i = 0; i < maxLen; i++) {
            const original = paragraphs1[i] || ''
            const rewritten = paragraphs2[i] || ''
            const hasChange = original !== rewritten
            
            html += `
                <div class="inline-pair ${hasChange ? 'has-change' : ''}">
                    <div class="inline-label">段落 ${i + 1}</div>
                    <div class="inline-original">
                        <span class="inline-tag">原文</span>
                        <div class="inline-text">${this.escapeHtml(original) || '<span class="empty-text">（无内容）</span>'}</div>
                    </div>
                    <div class="inline-rewritten">
                        <span class="inline-tag">改写</span>
                        <div class="inline-text">${this.escapeHtml(rewritten) || '<span class="empty-text">（无内容）</span>'}</div>
                    </div>
                </div>
            `
        }
        html += '</div>'
        return html
    }
    
    renderDiff() {
        const diff = this.computeDiff(this.original, this.rewritten)
        
        let html = '<div class="compare-diff">'
        html += '<div class="diff-legend">'
        html += '<span class="legend-item"><span class="legend-color added"></span> 新增</span>'
        html += '<span class="legend-item"><span class="legend-color removed"></span> 删除</span>'
        html += '<span class="legend-item"><span class="legend-color unchanged"></span> 未变</span>'
        html += '</div>'
        html += '<div class="diff-content">'
        
        diff.forEach(part => {
            const className = part.added ? 'diff-added' : part.removed ? 'diff-removed' : 'diff-unchanged'
            html += `<span class="${className}">${this.escapeHtml(part.value)}</span>`
        })
        
        html += '</div></div>'
        return html
    }
    
    computeDiff(oldText, newText) {
        const oldChars = [...oldText]
        const newChars = [...newText]
        
        const diff = []
        let i = 0
        let j = 0
        
        const lcs = this.computeLCS(oldChars, newChars)
        
        let lcsIndex = 0
        i = 0
        j = 0
        
        while (i < oldChars.length || j < newChars.length) {
            if (lcsIndex < lcs.length && i < oldChars.length && j < newChars.length && 
                oldChars[i] === lcs[lcsIndex] && newChars[j] === lcs[lcsIndex]) {
                if (diff.length > 0 && !diff[diff.length - 1].added && !diff[diff.length - 1].removed) {
                    diff[diff.length - 1].value += oldChars[i]
                } else {
                    diff.push({ value: oldChars[i] })
                }
                i++
                j++
                lcsIndex++
            } else if (j < newChars.length && (i >= oldChars.length || oldChars[i] !== newChars[j])) {
                diff.push({ value: newChars[j], added: true })
                j++
            } else if (i < oldChars.length) {
                diff.push({ value: oldChars[i], removed: true })
                i++
            }
        }
        
        return this.mergeConsecutive(diff)
    }
    
    computeLCS(arr1, arr2) {
        const m = arr1.length
        const n = arr2.length
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (arr1[i - 1] === arr2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
                }
            }
        }
        
        const lcs = []
        let i = m
        let j = n
        
        while (i > 0 && j > 0) {
            if (arr1[i - 1] === arr2[j - 1]) {
                lcs.unshift(arr1[i - 1])
                i--
                j--
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--
            } else {
                j--
            }
        }
        
        return lcs
    }
    
    mergeConsecutive(diff) {
        const merged = []
        
        diff.forEach(part => {
            if (merged.length === 0) {
                merged.push({ ...part })
            } else {
                const last = merged[merged.length - 1]
                if ((part.added && last.added) || (part.removed && last.removed) || 
                    (!part.added && !part.removed && !last.added && !last.removed)) {
                    last.value += part.value
                } else {
                    merged.push({ ...part })
                }
            }
        })
        
        return merged
    }
    
    countWords(text) {
        if (!text) return 0
        
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
        const numbers = (text.match(/\d+/g) || []).length
        
        return chineseChars + englishWords + numbers
    }
    
    formatContent(content) {
        if (!content) return '<p class="empty-content">暂无内容</p>'
        
        return content
            .split('\n')
            .filter(p => p.trim())
            .map(p => `<p>${this.escapeHtml(p)}</p>`)
            .join('')
    }
    
    escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    setOriginal(content) {
        this.original = content
        this.render()
    }
    
    setRewritten(content) {
        this.rewritten = content
        this.render()
    }
    
    setViewMode(mode) {
        this.viewMode = mode
        this.render()
        
        if (this.onModeChange) {
            this.onModeChange(mode)
        }
    }
    
    bindEvents() {
        const modeBtns = document.querySelectorAll('.view-mode-btn')
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setViewMode(btn.dataset.mode)
            })
        })
    }
    
    applyStyles() {
        if (!document.getElementById('compare-view-styles')) {
            const style = document.createElement('style')
            style.id = 'compare-view-styles'
            style.textContent = `
                .compare-view {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #16162a;
                }
                
                .compare-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: #1a1a2e;
                    border-bottom: 1px solid #2d2d44;
                }
                
                .toolbar-left {
                    display: flex;
                    gap: 8px;
                }
                
                .view-mode-btn {
                    padding: 8px 16px;
                    background: transparent;
                    border: 1px solid #374151;
                    border-radius: 6px;
                    color: #94a3b8;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .view-mode-btn:hover {
                    background: #252542;
                    color: #e2e8f0;
                }
                
                .view-mode-btn.active {
                    background: #3b82f6;
                    border-color: #3b82f6;
                    color: white;
                }
                
                .compare-stats {
                    font-size: 12px;
                    color: #64748b;
                }
                
                .compare-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }
                
                .compare-panels {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    height: 100%;
                }
                
                .compare-panel {
                    background: #1a1a2e;
                    border-radius: 8px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .panel-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: #252542;
                    border-bottom: 1px solid #2d2d44;
                }
                
                .panel-title {
                    font-size: 13px;
                    font-weight: 500;
                    color: #e2e8f0;
                }
                
                .word-count {
                    font-size: 12px;
                    color: #64748b;
                }
                
                .panel-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    color: #cbd5e1;
                    font-size: 14px;
                    line-height: 1.8;
                }
                
                .panel-content p {
                    margin: 0 0 12px 0;
                    text-indent: 2em;
                }
                
                .panel-content p:last-child {
                    margin-bottom: 0;
                }
                
                .empty-content {
                    color: #64748b;
                    text-align: center;
                    padding: 32px;
                }
                
                .compare-inline {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .inline-pair {
                    background: #1a1a2e;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .inline-pair.has-change {
                    border-left: 3px solid #3b82f6;
                }
                
                .inline-label {
                    padding: 8px 16px;
                    background: #252542;
                    font-size: 12px;
                    color: #64748b;
                }
                
                .inline-original,
                .inline-rewritten {
                    padding: 12px 16px;
                    border-bottom: 1px solid #2d2d44;
                }
                
                .inline-rewritten {
                    border-bottom: none;
                }
                
                .inline-tag {
                    display: inline-block;
                    padding: 2px 8px;
                    background: #374151;
                    border-radius: 4px;
                    font-size: 11px;
                    color: #94a3b8;
                    margin-bottom: 8px;
                }
                
                .inline-text {
                    color: #cbd5e1;
                    font-size: 14px;
                    line-height: 1.6;
                }
                
                .empty-text {
                    color: #64748b;
                    font-style: italic;
                }
                
                .compare-diff {
                    background: #1a1a2e;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .diff-legend {
                    display: flex;
                    gap: 16px;
                    padding: 12px 16px;
                    background: #252542;
                    border-bottom: 1px solid #2d2d44;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #94a3b8;
                }
                
                .legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                }
                
                .legend-color.added { background: #166534; }
                .legend-color.removed { background: #7f1d1d; }
                .legend-color.unchanged { background: #374151; }
                
                .diff-content {
                    padding: 16px;
                    color: #cbd5e1;
                    font-size: 14px;
                    line-height: 1.8;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                
                .diff-added {
                    background: #166534;
                    color: #86efac;
                }
                
                .diff-removed {
                    background: #7f1d1d;
                    color: #fca5a5;
                    text-decoration: line-through;
                }
                
                .diff-unchanged {
                    color: #cbd5e1;
                }
                
                @media (max-width: 767px) {
                    .compare-panels {
                        grid-template-columns: 1fr;
                    }
                    
                    .compare-toolbar {
                        flex-direction: column;
                        gap: 12px;
                    }
                    
                    .toolbar-left {
                        width: 100%;
                        justify-content: center;
                    }
                    
                    .toolbar-right {
                        width: 100%;
                        text-align: center;
                    }
                }
            `
            document.head.appendChild(style)
        }
    }
}

class ProofreadingView {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.content = options.content || ''
        this.issues = options.issues || []
        
        this.onFix = options.onFix || null
        this.onIgnore = options.onIgnore || null
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="proofreading-view">
                <div class="proofreading-toolbar">
                    <div class="toolbar-left">
                        <span class="issue-count">发现 ${this.issues.length} 个问题</span>
                    </div>
                    <div class="toolbar-right">
                        <button class="proof-btn btn-ignore-all">忽略全部</button>
                        <button class="proof-btn btn-fix-all">一键修复</button>
                    </div>
                </div>
                <div class="proofreading-content">
                    <div class="content-text" id="proof-content">
                        ${this.renderContentWithHighlights()}
                    </div>
                </div>
                <div class="proofreading-issues">
                    ${this.renderIssues()}
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    renderContentWithHighlights() {
        let content = this.content
        let offset = 0
        
        const sortedIssues = [...this.issues].sort((a, b) => a.start - b.start)
        
        sortedIssues.forEach((issue, index) => {
            const start = issue.start + offset
            const end = issue.end + offset
            
            const before = content.slice(0, start)
            const text = content.slice(start, end)
            const after = content.slice(end)
            
            const highlight = `<span class="issue-highlight" data-issue="${index}">${text}</span>`
            
            content = before + highlight + after
            offset += highlight.length - text.length
        })
        
        return this.escapeHtml(content).replace(/&lt;span class="issue-highlight" data-issue="(\d+)"&gt;(.*?)&lt;\/span&gt;/g, 
            '<span class="issue-highlight" data-issue="$1">$2</span>')
    }
    
    renderIssues() {
        if (this.issues.length === 0) {
            return '<div class="no-issues">未发现问题</div>'
        }
        
        return this.issues.map((issue, index) => `
            <div class="issue-item" data-issue="${index}">
                <div class="issue-header">
                    <span class="issue-type ${issue.type}">${this.getIssueTypeText(issue.type)}</span>
                    <span class="issue-pos">位置：${issue.start}-${issue.end}</span>
                </div>
                <div class="issue-text">"${this.escapeHtml(issue.text)}"</div>
                <div class="issue-suggestion">
                    建议：${issue.suggestion || '无'}
                </div>
                <div class="issue-actions">
                    <button class="issue-btn btn-ignore" data-issue="${index}">忽略</button>
                    <button class="issue-btn btn-fix" data-issue="${index}">修复</button>
                </div>
            </div>
        `).join('')
    }
    
    getIssueTypeText(type) {
        const types = {
            typo: '错别字',
            grammar: '语法错误',
            punctuation: '标点问题',
            style: '文风问题',
            consistency: '一致性问题'
        }
        return types[type] || type
    }
    
    escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    setContent(content) {
        this.content = content
        this.render()
    }
    
    setIssues(issues) {
        this.issues = issues
        this.render()
    }
    
    bindEvents() {
        document.querySelectorAll('.btn-fix').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.issue)
                if (this.onFix) {
                    this.onFix(this.issues[index], index)
                }
            })
        })
        
        document.querySelectorAll('.btn-ignore').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.issue)
                if (this.onIgnore) {
                    this.onIgnore(this.issues[index], index)
                }
            })
        })
        
        document.querySelector('.btn-fix-all')?.addEventListener('click', () => {
            this.issues.forEach((issue, index) => {
                if (this.onFix) {
                    this.onFix(issue, index)
                }
            })
        })
        
        document.querySelector('.btn-ignore-all')?.addEventListener('click', () => {
            this.issues.forEach((issue, index) => {
                if (this.onIgnore) {
                    this.onIgnore(issue, index)
                }
            })
        })
        
        document.querySelectorAll('.issue-highlight').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.issue)
                const issueItem = document.querySelector(`.issue-item[data-issue="${index}"]`)
                if (issueItem) {
                    issueItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    issueItem.classList.add('highlight')
                    setTimeout(() => issueItem.classList.remove('highlight'), 2000)
                }
            })
        })
    }
    
    applyStyles() {
        if (!document.getElementById('proofreading-view-styles')) {
            const style = document.createElement('style')
            style.id = 'proofreading-view-styles'
            style.textContent = `
                .proofreading-view {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #16162a;
                }
                
                .proofreading-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: #1a1a2e;
                    border-bottom: 1px solid #2d2d44;
                }
                
                .issue-count {
                    font-size: 13px;
                    color: #fbbf24;
                }
                
                .toolbar-right {
                    display: flex;
                    gap: 8px;
                }
                
                .proof-btn {
                    padding: 6px 12px;
                    background: transparent;
                    border: 1px solid #374151;
                    border-radius: 4px;
                    color: #94a3b8;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .proof-btn:hover {
                    background: #252542;
                    color: #e2e8f0;
                }
                
                .proofreading-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }
                
                .content-text {
                    color: #cbd5e1;
                    font-size: 14px;
                    line-height: 1.8;
                    white-space: pre-wrap;
                }
                
                .issue-highlight {
                    background: rgba(251, 191, 36, 0.3);
                    border-bottom: 2px solid #fbbf24;
                    cursor: pointer;
                }
                
                .issue-highlight:hover {
                    background: rgba(251, 191, 36, 0.5);
                }
                
                .proofreading-issues {
                    max-height: 200px;
                    overflow-y: auto;
                    background: #1a1a2e;
                    border-top: 1px solid #2d2d44;
                }
                
                .no-issues {
                    padding: 16px;
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                }
                
                .issue-item {
                    padding: 12px 16px;
                    border-bottom: 1px solid #2d2d44;
                    transition: background 0.2s;
                }
                
                .issue-item:last-child {
                    border-bottom: none;
                }
                
                .issue-item.highlight {
                    background: #1e3a5f;
                }
                
                .issue-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;
                }
                
                .issue-type {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                }
                
                .issue-type.typo { background: #7f1d1d; color: #fca5a5; }
                .issue-type.grammar { background: #854d0e; color: #fde047; }
                .issue-type.punctuation { background: #1e3a5f; color: #93c5fd; }
                .issue-type.style { background: #166534; color: #86efac; }
                .issue-type.consistency { background: #4a1d7f; color: #c4b5fd; }
                
                .issue-pos {
                    font-size: 11px;
                    color: #64748b;
                }
                
                .issue-text {
                    font-size: 13px;
                    color: #e2e8f0;
                    margin-bottom: 6px;
                }
                
                .issue-suggestion {
                    font-size: 12px;
                    color: #94a3b8;
                    margin-bottom: 8px;
                }
                
                .issue-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .issue-btn {
                    padding: 4px 10px;
                    background: transparent;
                    border: 1px solid #374151;
                    border-radius: 4px;
                    color: #94a3b8;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .issue-btn:hover {
                    background: #252542;
                }
                
                .btn-fix {
                    border-color: #3b82f6;
                    color: #60a5fa;
                }
                
                .btn-fix:hover {
                    background: #1e3a5f;
                }
            `
            document.head.appendChild(style)
        }
    }
}

export { CompareView, ProofreadingView }
