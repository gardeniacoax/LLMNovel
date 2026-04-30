class ChapterStatusBadge {
    static render(status, additionalInfo = {}) {
        const config = this.getStatusConfig(status, additionalInfo)
        
        return `
            <div class="status-badge ${config.className}">
                <span class="status-icon">${config.icon}</span>
                <span class="status-text">${config.text}</span>
                ${additionalInfo.wordCount ? `<span class="status-detail">${additionalInfo.wordCount}字</span>` : ''}
                ${additionalInfo.retryCount ? `<span class="status-retry">重试${additionalInfo.retryCount}次</span>` : ''}
            </div>
        `
    }
    
    static renderCompact(status) {
        const config = this.getStatusConfig(status)
        return `<span class="status-compact ${config.className}" title="${config.text}">${config.icon}</span>`
    }
    
    static getStatusConfig(status, info = {}) {
        const configs = {
            pending: {
                icon: '⏸',
                text: '待处理',
                className: 'status-pending'
            },
            outline_generating: {
                icon: '📝',
                text: '梗概生成中',
                className: 'status-processing'
            },
            outline_editing: {
                icon: '✏️',
                text: '梗概编辑中',
                className: 'status-processing'
            },
            content_generating: {
                icon: '⏳',
                text: '内容生成中',
                className: 'status-processing'
            },
            processing: {
                icon: '⏳',
                text: '处理中',
                className: 'status-processing'
            },
            completed: {
                icon: '✅',
                text: '已完成',
                className: 'status-completed'
            },
            failed: {
                icon: '❌',
                text: '失败',
                className: 'status-failed'
            },
            warning: {
                icon: '⚠️',
                text: '字数不达标',
                className: 'status-warning'
            },
            unprocessable: {
                icon: '🚫',
                text: '无法处理',
                className: 'status-unprocessable'
            },
            paused: {
                icon: '⏸',
                text: '已暂停',
                className: 'status-paused'
            },
            skipped: {
                icon: '⏭',
                text: '已跳过',
                className: 'status-skipped'
            }
        }
        
        return configs[status] || configs.pending
    }
    
    static getIcon(status) {
        return this.getStatusConfig(status).icon
    }
    
    static getText(status) {
        return this.getStatusConfig(status).text
    }
    
    static getClassName(status) {
        return this.getStatusConfig(status).className
    }
    
    static isProcessing(status) {
        return ['outline_generating', 'outline_editing', 'content_generating', 'processing'].includes(status)
    }
    
    static isCompleted(status) {
        return status === 'completed'
    }
    
    static isFailed(status) {
        return status === 'failed'
    }
    
    static isWarning(status) {
        return status === 'warning'
    }
    
    static canRetry(status) {
        return ['failed', 'warning'].includes(status)
    }
    
    static applyStyles() {
        if (!document.getElementById('chapter-status-styles')) {
            const style = document.createElement('style')
            style.id = 'chapter-status-styles'
            style.textContent = `
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    white-space: nowrap;
                }
                
                .status-icon {
                    font-size: 12px;
                }
                
                .status-text {
                    color: #e2e8f0;
                }
                
                .status-detail {
                    color: #94a3b8;
                    font-size: 11px;
                }
                
                .status-retry {
                    color: #f87171;
                    font-size: 10px;
                }
                
                .status-pending {
                    background: #374151;
                }
                
                .status-pending .status-icon {
                    color: #9CA3AF;
                }
                
                .status-processing {
                    background: #1e3a5f;
                    animation: pulse 2s infinite;
                }
                
                .status-processing .status-icon {
                    color: #60A5FA;
                }
                
                .status-completed {
                    background: #166534;
                }
                
                .status-completed .status-icon {
                    color: #86efac;
                }
                
                .status-failed {
                    background: #7f1d1d;
                }
                
                .status-failed .status-icon {
                    color: #fca5a5;
                }
                
                .status-warning {
                    background: #854d0e;
                }
                
                .status-warning .status-icon {
                    color: #fde047;
                }
                
                .status-unprocessable {
                    background: #4a1d7f;
                }
                
                .status-unprocessable .status-icon {
                    color: #c4b5fd;
                }
                
                .status-paused {
                    background: #374151;
                }
                
                .status-paused .status-icon {
                    color: #fbbf24;
                }
                
                .status-skipped {
                    background: #374151;
                }
                
                .status-skipped .status-icon {
                    color: #9CA3AF;
                }
                
                .status-compact {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    font-size: 12px;
                    cursor: help;
                }
                
                .status-compact.status-pending {
                    background: #374151;
                }
                
                .status-compact.status-processing {
                    background: #1e3a5f;
                    animation: pulse 2s infinite;
                }
                
                .status-compact.status-completed {
                    background: #166534;
                }
                
                .status-compact.status-failed {
                    background: #7f1d1d;
                }
                
                .status-compact.status-warning {
                    background: #854d0e;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `
            document.head.appendChild(style)
        }
    }
}

class ChapterListItem {
    constructor(options = {}) {
        this.chapter = options.chapter || {}
        this.selected = options.selected || false
        
        this.onSelect = options.onSelect || null
        this.onView = options.onView || null
        this.onRetry = options.onRetry || null
        this.onEdit = options.onEdit || null
    }
    
    render() {
        const statusBadge = ChapterStatusBadge.render(
            this.chapter.status,
            {
                wordCount: this.chapter.wordCount,
                retryCount: this.chapter.retryCount
            }
        )
        
        return `
            <div class="chapter-list-item ${this.selected ? 'selected' : ''}" 
                 data-chapter="${this.chapter.chapterNum}">
                <div class="chapter-checkbox-wrapper">
                    <input type="checkbox" class="chapter-checkbox" 
                           ${this.selected ? 'checked' : ''}
                           data-chapter="${this.chapter.chapterNum}">
                </div>
                <div class="chapter-info">
                    <span class="chapter-num">第${this.chapter.chapterNum}章</span>
                    <span class="chapter-title">${this.chapter.title}</span>
                </div>
                ${statusBadge}
                <div class="chapter-actions">
                    <button class="action-btn btn-view" title="查看" data-action="view">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                    </button>
                    ${ChapterStatusBadge.canRetry(this.chapter.status) ? `
                        <button class="action-btn btn-retry" title="重试" data-action="retry">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                    ` : ''}
                    ${ChapterStatusBadge.isCompleted(this.chapter.status) ? `
                        <button class="action-btn btn-edit" title="编辑" data-action="edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `
    }
    
    bindEvents(element) {
        const checkbox = element.querySelector('.chapter-checkbox')
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation()
                if (this.onSelect) {
                    this.onSelect(this.chapter.chapterNum, e.target.checked)
                }
            })
        }
        
        const actionBtns = element.querySelectorAll('.action-btn')
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation()
                const action = btn.dataset.action
                
                switch (action) {
                    case 'view':
                        if (this.onView) this.onView(this.chapter)
                        break
                    case 'retry':
                        if (this.onRetry) this.onRetry(this.chapter)
                        break
                    case 'edit':
                        if (this.onEdit) this.onEdit(this.chapter)
                        break
                }
            })
        })
        
        element.addEventListener('click', () => {
            if (this.onView) this.onView(this.chapter)
        })
    }
}

class ChapterStatsPanel {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.chapters = options.chapters || []
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        const stats = this.calculateStats()
        
        container.innerHTML = `
            <div class="chapter-stats-panel">
                <div class="stats-header">
                    <h4 class="stats-title">章节统计</h4>
                </div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${stats.total}</span>
                        <span class="stat-label">总章节</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value text-green">${stats.completed}</span>
                        <span class="stat-label">已完成</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value text-yellow">${stats.processing}</span>
                        <span class="stat-label">处理中</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value text-red">${stats.failed}</span>
                        <span class="stat-label">失败</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value text-gray">${stats.pending}</span>
                        <span class="stat-label">待处理</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value text-orange">${stats.warning}</span>
                        <span class="stat-label">警告</span>
                    </div>
                </div>
                <div class="stats-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${stats.percentage}%"></div>
                    </div>
                    <span class="progress-text">${stats.percentage}% 完成</span>
                </div>
                ${stats.failed > 0 || stats.warning > 0 ? `
                    <div class="stats-actions">
                        ${stats.failed > 0 ? `
                            <button class="stats-btn btn-retry-failed">
                                重试失败 (${stats.failed})
                            </button>
                        ` : ''}
                        ${stats.warning > 0 ? `
                            <button class="stats-btn btn-retry-warning">
                                处理警告 (${stats.warning})
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `
        
        this.applyStyles()
    }
    
    calculateStats() {
        const total = this.chapters.length
        let completed = 0
        let processing = 0
        let failed = 0
        let pending = 0
        let warning = 0
        
        this.chapters.forEach(ch => {
            switch (ch.status) {
                case 'completed':
                    completed++
                    break
                case 'outline_generating':
                case 'outline_editing':
                case 'content_generating':
                case 'processing':
                    processing++
                    break
                case 'failed':
                    failed++
                    break
                case 'warning':
                    warning++
                    break
                default:
                    pending++
            }
        })
        
        return {
            total,
            completed,
            processing,
            failed,
            pending,
            warning,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        }
    }
    
    setChapters(chapters) {
        this.chapters = chapters
        this.render()
    }
    
    applyStyles() {
        if (!document.getElementById('chapter-stats-panel-styles')) {
            const style = document.createElement('style')
            style.id = 'chapter-stats-panel-styles'
            style.textContent = `
                .chapter-stats-panel {
                    background: #1a1a2e;
                    border-radius: 8px;
                    padding: 16px;
                }
                
                .stats-header {
                    margin-bottom: 16px;
                }
                
                .stats-title {
                    font-size: 14px;
                    font-weight: 500;
                    color: #e2e8f0;
                    margin: 0;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 12px;
                    background: #252542;
                    border-radius: 6px;
                }
                
                .stat-value {
                    font-size: 20px;
                    font-weight: 600;
                    color: #e2e8f0;
                }
                
                .stat-value.text-green { color: #86efac; }
                .stat-value.text-yellow { color: #fde047; }
                .stat-value.text-red { color: #fca5a5; }
                .stat-value.text-gray { color: #94a3b8; }
                .stat-value.text-orange { color: #fdba74; }
                
                .stat-label {
                    font-size: 11px;
                    color: #64748b;
                    margin-top: 4px;
                }
                
                .stats-progress {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .progress-bar-container {
                    flex: 1;
                    height: 8px;
                    background: #374151;
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3B82F6, #10B981);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                
                .progress-text {
                    font-size: 12px;
                    color: #94a3b8;
                    white-space: nowrap;
                }
                
                .stats-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                
                .stats-btn {
                    flex: 1;
                    padding: 8px 12px;
                    background: #252542;
                    border: none;
                    border-radius: 6px;
                    color: #e2e8f0;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .stats-btn:hover {
                    background: #374151;
                }
                
                .btn-retry-failed {
                    border: 1px solid #f87171;
                }
                
                .btn-retry-warning {
                    border: 1px solid #fbbf24;
                }
            `
            document.head.appendChild(style)
        }
    }
}

ChapterStatusBadge.applyStyles()

export { ChapterStatusBadge, ChapterListItem, ChapterStatsPanel }
