import { WordCountValidator } from '../wordcount/index.js'

class ChapterViewer {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.chapter = options.chapter || null
        this.currentTab = options.defaultTab || 'original'
        
        this.onTabChange = options.onTabChange || null
        this.onEdit = options.onEdit || null
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        if (!this.chapter) {
            container.innerHTML = `
                <div class="chapter-viewer-empty">
                    <div class="empty-icon">
                        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <p class="empty-text">请选择一个章节查看</p>
                </div>
            `
            this.applyStyles()
            return
        }
        
        container.innerHTML = `
            <div class="chapter-viewer">
                <div class="viewer-header">
                    <div class="chapter-info">
                        <h3 class="chapter-title">${this.chapter.title || `第${this.chapter.chapterNum}章`}</h3>
                        <span class="chapter-meta">
                            原字数：${(this.chapter.wordCount || 0).toLocaleString()} 字
                            ${this.chapter.rewriteContent ? ` | 改写后：${WordCountValidator.countWords(this.chapter.rewriteContent).toLocaleString()} 字` : ''}
                        </span>
                    </div>
                    <div class="viewer-tabs">
                        <button class="tab-btn ${this.currentTab === 'original' ? 'active' : ''}" data-tab="original">
                            原文
                        </button>
                        <button class="tab-btn ${this.currentTab === 'analysis' ? 'active' : ''}" data-tab="analysis">
                            分析
                        </button>
                        <button class="tab-btn ${this.currentTab === 'compare' ? 'active' : ''}" data-tab="compare">
                            对比
                        </button>
                        <button class="tab-btn ${this.currentTab === 'edit' ? 'active' : ''}" data-tab="edit">
                            编辑
                        </button>
                    </div>
                </div>
                <div class="viewer-content" id="viewer-content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    renderTabContent() {
        switch (this.currentTab) {
            case 'original':
                return this.renderOriginal()
            case 'analysis':
                return this.renderAnalysis()
            case 'compare':
                return this.renderCompare()
            case 'edit':
                return this.renderEdit()
            default:
                return this.renderOriginal()
        }
    }
    
    renderOriginal() {
        return `
            <div class="content-section">
                <div class="section-header">
                    <span class="section-title">原文内容</span>
                    <span class="word-count">${(this.chapter.wordCount || 0).toLocaleString()} 字</span>
                </div>
                <div class="content-text">
                    ${this.formatContent(this.chapter.content)}
                </div>
            </div>
        `
    }
    
    renderAnalysis() {
        const analysis = this.chapter.analysisResult
        
        if (!analysis) {
            return `
                <div class="no-data">
                    <div class="no-data-icon">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                    </div>
                    <p class="no-data-text">该章节尚未分析</p>
                    <button class="btn btn-secondary mt-4" id="start-analysis-btn">开始分析</button>
                </div>
            `
        }
        
        return `
            <div class="content-section">
                <div class="section-header">
                    <span class="section-title">章节分析</span>
                </div>
                <div class="analysis-content">
                    ${analysis.summary ? `
                        <div class="analysis-item">
                            <span class="item-label">章节主旨</span>
                            <p class="item-value">${analysis.summary}</p>
                        </div>
                    ` : ''}
                    
                    ${analysis.key_events && analysis.key_events.length > 0 ? `
                        <div class="analysis-item">
                            <span class="item-label">关键情节</span>
                            <ul class="item-list">
                                ${analysis.key_events.map(e => `<li>${e}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${analysis.character_performances && analysis.character_performances.length > 0 ? `
                        <div class="analysis-item">
                            <span class="item-label">角色表现</span>
                            <div class="character-list">
                                ${analysis.character_performances.map(cp => `
                                    <div class="character-item">
                                        <span class="character-name">${cp.name}</span>
                                        <div class="character-details">
                                            ${cp.speech ? `<p><span class="detail-label">语言：</span>${cp.speech}</p>` : ''}
                                            ${cp.body_language ? `<p><span class="detail-label">动作：</span>${cp.body_language}</p>` : ''}
                                            ${cp.clothing_change ? `<p><span class="detail-label">衣着：</span>${cp.clothing_change}</p>` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${analysis.chapter_function && analysis.chapter_function.length > 0 ? `
                        <div class="analysis-item">
                            <span class="item-label">章节作用</span>
                            <div class="tag-list">
                                ${analysis.chapter_function.map(f => `<span class="tag">${f}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `
    }
    
    renderCompare() {
        if (!this.chapter.rewriteContent) {
            return `
                <div class="no-data">
                    <div class="no-data-icon">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                    </div>
                    <p class="no-data-text">该章节尚未改写/续写</p>
                </div>
            `
        }
        
        const originalWordCount = this.chapter.wordCount || WordCountValidator.countWords(this.chapter.content)
        const rewriteWordCount = WordCountValidator.countWords(this.chapter.rewriteContent)
        const ratio = originalWordCount > 0 ? Math.round((rewriteWordCount / originalWordCount) * 100) : 0
        
        return `
            <div class="compare-view">
                <div class="compare-stats">
                    <div class="stat-item">
                        <span class="stat-label">原文</span>
                        <span class="stat-value">${originalWordCount.toLocaleString()} 字</span>
                    </div>
                    <div class="stat-arrow">→</div>
                    <div class="stat-item">
                        <span class="stat-label">改写</span>
                        <span class="stat-value">${rewriteWordCount.toLocaleString()} 字</span>
                    </div>
                    <div class="stat-ratio ${ratio >= 80 && ratio <= 120 ? 'ratio-good' : 'ratio-warning'}">
                        ${ratio}%
                    </div>
                </div>
                
                <div class="compare-panels">
                    <div class="compare-panel">
                        <div class="panel-header">
                            <span>原文</span>
                        </div>
                        <div class="panel-content">
                            ${this.formatContent(this.chapter.content)}
                        </div>
                    </div>
                    <div class="compare-panel">
                        <div class="panel-header">
                            <span>改写后</span>
                        </div>
                        <div class="panel-content">
                            ${this.formatContent(this.chapter.rewriteContent)}
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    renderEdit() {
        const content = this.chapter.rewriteContent || this.chapter.content || ''
        
        return `
            <div class="edit-view">
                <div class="edit-toolbar">
                    <button class="toolbar-btn" id="btn-undo" title="撤销">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                        </svg>
                    </button>
                    <button class="toolbar-btn" id="btn-redo" title="重做">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path>
                        </svg>
                    </button>
                    <span class="toolbar-divider"></span>
                    <button class="toolbar-btn" id="btn-copy" title="复制">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                    </button>
                    <button class="toolbar-btn" id="btn-clear" title="清空">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                    <span class="toolbar-divider"></span>
                    <span class="word-count-display" id="edit-word-count">
                        ${WordCountValidator.countWords(content).toLocaleString()} 字
                    </span>
                </div>
                <textarea class="edit-textarea" id="edit-content">${content}</textarea>
                <div class="edit-actions">
                    <button class="btn btn-secondary" id="btn-cancel-edit">取消</button>
                    <button class="btn btn-primary" id="btn-save-edit">保存</button>
                </div>
            </div>
        `
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
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    bindEvents() {
        const tabBtns = document.querySelectorAll('.tab-btn')
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTab = btn.dataset.tab
                this.render()
                
                if (this.onTabChange) {
                    this.onTabChange(this.currentTab)
                }
            })
        })
        
        const startAnalysisBtn = document.getElementById('start-analysis-btn')
        if (startAnalysisBtn) {
            startAnalysisBtn.addEventListener('click', () => {
                if (this.onEdit) {
                    this.onEdit('start-analysis', this.chapter)
                }
            })
        }
        
        const editContent = document.getElementById('edit-content')
        const editWordCount = document.getElementById('edit-word-count')
        
        if (editContent && editWordCount) {
            editContent.addEventListener('input', () => {
                const count = WordCountValidator.countWords(editContent.value)
                editWordCount.textContent = `${count.toLocaleString()} 字`
            })
        }
        
        const saveEditBtn = document.getElementById('btn-save-edit')
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => {
                const content = document.getElementById('edit-content')?.value || ''
                if (this.onEdit) {
                    this.onEdit('save', { chapter: this.chapter, content: content })
                }
            })
        }
        
        const cancelEditBtn = document.getElementById('btn-cancel-edit')
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.currentTab = 'original'
                this.render()
            })
        }
        
        const copyBtn = document.getElementById('btn-copy')
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const content = document.getElementById('edit-content')?.value || ''
                navigator.clipboard.writeText(content).then(() => {
                    copyBtn.classList.add('success')
                    setTimeout(() => copyBtn.classList.remove('success'), 1000)
                })
            })
        }
        
        const clearBtn = document.getElementById('btn-clear')
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const editContent = document.getElementById('edit-content')
                if (editContent) {
                    editContent.value = ''
                    editContent.dispatchEvent(new Event('input'))
                }
            })
        }
    }
    
    setChapter(chapter) {
        this.chapter = chapter
        this.render()
    }
    
    setTab(tab) {
        this.currentTab = tab
        this.render()
    }
    
    getEditContent() {
        const editContent = document.getElementById('edit-content')
        return editContent ? editContent.value : ''
    }
    
    applyStyles() {
        if (!document.getElementById('chapter-viewer-styles')) {
            const style = document.createElement('style')
            style.id = 'chapter-viewer-styles'
            style.textContent = `
                .chapter-viewer {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                
                .chapter-viewer-empty {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                }
                
                .empty-icon {
                    margin-bottom: 16px;
                    color: #475569;
                }
                
                .empty-text {
                    font-size: 14px;
                }
                
                .viewer-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    border-bottom: 1px solid #2d2d44;
                    background: #1a1a2e;
                }
                
                .chapter-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .chapter-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin: 0;
                }
                
                .chapter-meta {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 4px;
                }
                
                .viewer-tabs {
                    display: flex;
                    gap: 4px;
                }
                
                .tab-btn {
                    padding: 8px 16px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    font-size: 13px;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: background 0.2s, color 0.2s;
                }
                
                .tab-btn:hover {
                    background: #2d2d44;
                    color: #e2e8f0;
                }
                
                .tab-btn.active {
                    background: #3b82f6;
                    color: white;
                }
                
                .viewer-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }
                
                .content-section {
                    background: #1a1a2e;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: #252542;
                    border-bottom: 1px solid #2d2d44;
                }
                
                .section-title {
                    font-size: 14px;
                    font-weight: 500;
                    color: #e2e8f0;
                }
                
                .word-count {
                    font-size: 12px;
                    color: #64748b;
                }
                
                .content-text {
                    padding: 16px;
                    color: #cbd5e1;
                    font-size: 14px;
                    line-height: 1.8;
                }
                
                .content-text p {
                    margin: 0 0 12px 0;
                    text-indent: 2em;
                }
                
                .content-text p:last-child {
                    margin-bottom: 0;
                }
                
                .empty-content {
                    color: #64748b;
                    text-align: center;
                    padding: 32px;
                }
                
                .no-data {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 48px;
                    color: #64748b;
                }
                
                .no-data-icon {
                    margin-bottom: 16px;
                    color: #475569;
                }
                
                .no-data-text {
                    font-size: 14px;
                }
                
                .analysis-content {
                    padding: 16px;
                }
                
                .analysis-item {
                    margin-bottom: 20px;
                }
                
                .analysis-item:last-child {
                    margin-bottom: 0;
                }
                
                .item-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: #94a3b8;
                    margin-bottom: 8px;
                }
                
                .item-value {
                    color: #e2e8f0;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0;
                }
                
                .item-list {
                    margin: 0;
                    padding-left: 20px;
                    color: #e2e8f0;
                    font-size: 14px;
                    line-height: 1.8;
                }
                
                .item-list li {
                    margin-bottom: 4px;
                }
                
                .character-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .character-item {
                    background: #252542;
                    border-radius: 6px;
                    padding: 12px;
                }
                
                .character-name {
                    font-weight: 500;
                    color: #3b82f6;
                    margin-bottom: 8px;
                    display: block;
                }
                
                .character-details p {
                    margin: 4px 0;
                    font-size: 13px;
                    color: #cbd5e1;
                }
                
                .detail-label {
                    color: #64748b;
                }
                
                .tag-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .tag {
                    padding: 4px 12px;
                    background: #252542;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #94a3b8;
                }
                
                .compare-view {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .compare-stats {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    padding: 16px;
                    background: #1a1a2e;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
                
                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .stat-label {
                    font-size: 12px;
                    color: #64748b;
                }
                
                .stat-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: #e2e8f0;
                }
                
                .stat-arrow {
                    font-size: 20px;
                    color: #64748b;
                }
                
                .stat-ratio {
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .ratio-good {
                    background: #166534;
                    color: #86efac;
                }
                
                .ratio-warning {
                    background: #854d0e;
                    color: #fde047;
                }
                
                .compare-panels {
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    min-height: 0;
                }
                
                .compare-panel {
                    background: #1a1a2e;
                    border-radius: 8px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .compare-panel .panel-header {
                    padding: 12px 16px;
                    background: #252542;
                    border-bottom: 1px solid #2d2d44;
                    font-size: 13px;
                    font-weight: 500;
                    color: #94a3b8;
                }
                
                .compare-panel .panel-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    color: #cbd5e1;
                    font-size: 14px;
                    line-height: 1.8;
                }
                
                .compare-panel .panel-content p {
                    margin: 0 0 12px 0;
                    text-indent: 2em;
                }
                
                .edit-view {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .edit-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px;
                    background: #1a1a2e;
                    border-radius: 8px;
                    margin-bottom: 12px;
                }
                
                .toolbar-btn {
                    padding: 8px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background 0.2s, color 0.2s;
                }
                
                .toolbar-btn:hover {
                    background: #2d2d44;
                    color: #e2e8f0;
                }
                
                .toolbar-btn.success {
                    color: #22c55e;
                }
                
                .toolbar-divider {
                    width: 1px;
                    height: 20px;
                    background: #2d2d44;
                    margin: 0 4px;
                }
                
                .word-count-display {
                    margin-left: auto;
                    font-size: 13px;
                    color: #64748b;
                }
                
                .edit-textarea {
                    flex: 1;
                    width: 100%;
                    background: #1a1a2e;
                    border: 1px solid #2d2d44;
                    border-radius: 8px;
                    padding: 16px;
                    color: #e2e8f0;
                    font-size: 14px;
                    line-height: 1.8;
                    resize: none;
                    font-family: inherit;
                }
                
                .edit-textarea:focus {
                    outline: none;
                    border-color: #3b82f6;
                }
                
                .edit-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 12px;
                }
                
                @media (max-width: 767px) {
                    .viewer-header {
                        flex-direction: column;
                        gap: 12px;
                    }
                    
                    .viewer-tabs {
                        width: 100%;
                        overflow-x: auto;
                    }
                    
                    .compare-panels {
                        grid-template-columns: 1fr;
                    }
                }
            `
            document.head.appendChild(style)
        }
    }
}

class ChapterListPanel {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.chapters = options.chapters || []
        this.selectedChapters = options.selectedChapters || []
        
        this.onChapterSelect = options.onChapterSelect || null
        this.onSelectAll = options.onSelectAll || null
        this.onSelectNone = options.onSelectNone || null
        this.onInvertSelection = options.onInvertSelection || null
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="chapter-list-panel">
                <div class="list-header">
                    <span class="list-title">章节列表</span>
                    <div class="list-actions">
                        <button class="action-btn" id="btn-select-all" title="全选">全选</button>
                        <button class="action-btn" id="btn-select-none" title="取消选择">取消</button>
                        <button class="action-btn" id="btn-invert" title="反选">反选</button>
                    </div>
                </div>
                <div class="list-body" id="chapter-list-body">
                    ${this.renderChapterList()}
                </div>
                <div class="list-footer">
                    <span class="selection-count">已选择 <span id="selected-count">${this.selectedChapters.length}</span> 章</span>
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    renderChapterList() {
        if (this.chapters.length === 0) {
            return '<div class="empty-list">暂无章节数据</div>'
        }
        
        return this.chapters.map(chapter => {
            const isSelected = this.selectedChapters.includes(chapter.chapterNum)
            const statusIcon = this.getStatusIcon(chapter.status)
            
            return `
                <div class="chapter-item ${isSelected ? 'selected' : ''}" data-chapter-num="${chapter.chapterNum}">
                    <input type="checkbox" class="chapter-checkbox" 
                        ${isSelected ? 'checked' : ''} 
                        data-chapter-num="${chapter.chapterNum}">
                    <span class="chapter-num">第${chapter.chapterNum}章</span>
                    <span class="chapter-title-text" title="${chapter.title}">${chapter.title}</span>
                    <span class="chapter-status">${statusIcon}</span>
                </div>
            `
        }).join('')
    }
    
    getStatusIcon(status) {
        const icons = {
            pending: '⏸',
            outline_generating: '📝',
            outline_editing: '✏️',
            content_generating: '⏳',
            completed: '✅',
            failed: '❌'
        }
        return icons[status] || '⏸'
    }
    
    bindEvents() {
        const checkboxes = document.querySelectorAll('.chapter-checkbox')
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const chapterNum = parseInt(e.target.dataset.chapterNum)
                this.toggleChapter(chapterNum)
            })
        })
        
        const chapterItems = document.querySelectorAll('.chapter-item')
        chapterItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('chapter-checkbox')) return
                
                const chapterNum = parseInt(item.dataset.chapterNum)
                if (this.onChapterSelect) {
                    this.onChapterSelect(chapterNum)
                }
            })
        })
        
        const selectAllBtn = document.getElementById('btn-select-all')
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAll())
        }
        
        const selectNoneBtn = document.getElementById('btn-select-none')
        if (selectNoneBtn) {
            selectNoneBtn.addEventListener('click', () => this.selectNone())
        }
        
        const invertBtn = document.getElementById('btn-invert')
        if (invertBtn) {
            invertBtn.addEventListener('click', () => this.invertSelection())
        }
    }
    
    toggleChapter(chapterNum) {
        const index = this.selectedChapters.indexOf(chapterNum)
        
        if (index === -1) {
            this.selectedChapters.push(chapterNum)
        } else {
            this.selectedChapters.splice(index, 1)
        }
        
        this.updateSelection()
    }
    
    selectAll() {
        this.selectedChapters = this.chapters.map(ch => ch.chapterNum)
        this.updateSelection()
        
        if (this.onSelectAll) {
            this.onSelectAll(this.selectedChapters)
        }
    }
    
    selectNone() {
        this.selectedChapters = []
        this.updateSelection()
        
        if (this.onSelectNone) {
            this.onSelectNone()
        }
    }
    
    invertSelection() {
        const allChapterNums = this.chapters.map(ch => ch.chapterNum)
        this.selectedChapters = allChapterNums.filter(num => !this.selectedChapters.includes(num))
        this.updateSelection()
        
        if (this.onInvertSelection) {
            this.onInvertSelection(this.selectedChapters)
        }
    }
    
    updateSelection() {
        const items = document.querySelectorAll('.chapter-item')
        items.forEach(item => {
            const chapterNum = parseInt(item.dataset.chapterNum)
            const isSelected = this.selectedChapters.includes(chapterNum)
            
            item.classList.toggle('selected', isSelected)
            
            const checkbox = item.querySelector('.chapter-checkbox')
            if (checkbox) {
                checkbox.checked = isSelected
            }
        })
        
        const countEl = document.getElementById('selected-count')
        if (countEl) {
            countEl.textContent = this.selectedChapters.length
        }
    }
    
    setChapters(chapters) {
        this.chapters = chapters
        this.selectedChapters = []
        this.render()
    }
    
    getSelectedChapters() {
        return this.chapters.filter(ch => this.selectedChapters.includes(ch.chapterNum))
    }
    
    applyStyles() {
        if (!document.getElementById('chapter-list-panel-styles')) {
            const style = document.createElement('style')
            style.id = 'chapter-list-panel-styles'
            style.textContent = `
                .chapter-list-panel {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px;
                    border-bottom: 1px solid #2d2d44;
                }
                
                .list-title {
                    font-size: 14px;
                    font-weight: 500;
                    color: #e2e8f0;
                }
                
                .list-actions {
                    display: flex;
                    gap: 4px;
                }
                
                .action-btn {
                    padding: 4px 8px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    font-size: 12px;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background 0.2s, color 0.2s;
                }
                
                .action-btn:hover {
                    background: #2d2d44;
                    color: #e2e8f0;
                }
                
                .list-body {
                    flex: 1;
                    overflow-y: auto;
                }
                
                .empty-list {
                    padding: 32px;
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                }
                
                .chapter-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 12px;
                    border-bottom: 1px solid #2d2d44;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .chapter-item:hover {
                    background: #252542;
                }
                
                .chapter-item.selected {
                    background: #1e3a5f;
                }
                
                .chapter-checkbox {
                    margin-right: 8px;
                    cursor: pointer;
                }
                
                .chapter-num {
                    font-size: 12px;
                    color: #64748b;
                    min-width: 50px;
                }
                
                .chapter-title-text {
                    flex: 1;
                    font-size: 13px;
                    color: #e2e8f0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-right: 8px;
                }
                
                .chapter-status {
                    font-size: 12px;
                }
                
                .list-footer {
                    padding: 12px;
                    border-top: 1px solid #2d2d44;
                    background: #1a1a2e;
                }
                
                .selection-count {
                    font-size: 12px;
                    color: #64748b;
                }
            `
            document.head.appendChild(style)
        }
    }
}

export { ChapterViewer, ChapterListPanel }
