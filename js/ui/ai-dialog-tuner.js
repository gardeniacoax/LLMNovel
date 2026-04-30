import { ConfigManager } from '../config.js'

class AIDialogTuner {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.chapter = options.chapter || null
        this.currentContent = options.currentContent || ''
        this.apiClient = options.apiClient || null
        this.history = options.history || []
        
        this.onApply = options.onApply || null
        this.onClose = options.onClose || null
    }
    
    setApiClient(client) {
        this.apiClient = client
    }
    
    open(chapter, currentContent) {
        this.chapter = chapter
        this.currentContent = currentContent
        
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="ai-dialog-overlay">
                <div class="ai-dialog-modal">
                    <div class="dialog-header">
                        <h3>AI微调</h3>
                        <button class="close-btn" id="dialog-close">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="dialog-body">
                        <div class="dialog-section">
                            <div class="section-label">当前章节</div>
                            <div class="chapter-info">
                                ${this.chapter ? `第${this.chapter.chapterNum}章：${this.chapter.title}` : '未知章节'}
                            </div>
                        </div>
                        
                        <div class="dialog-section">
                            <div class="section-label">当前内容预览</div>
                            <div class="content-preview" id="content-preview">
                                ${this.formatPreview(this.currentContent)}
                            </div>
                        </div>
                        
                        <div class="dialog-section">
                            <div class="section-label">修改要求</div>
                            <textarea class="request-input" id="request-input" rows="4"
                                placeholder="输入修改要求，例如：&#10;- 增加更多环境描写&#10;- 让对话更生动&#10;- 加强情感表达&#10;- 调整节奏，增加紧张感"></textarea>
                        </div>
                        
                        <div class="quick-actions">
                            <span class="quick-label">快捷指令：</span>
                            <button class="quick-btn" data-request="增加环境描写">增加环境描写</button>
                            <button class="quick-btn" data-request="让对话更生动">对话更生动</button>
                            <button class="quick-btn" data-request="加强情感表达">加强情感</button>
                            <button class="quick-btn" data-request="调整节奏">调整节奏</button>
                            <button class="quick-btn" data-request="精简冗余内容">精简冗余</button>
                        </div>
                        
                        <div class="dialog-section">
                            <div class="section-label">修改历史</div>
                            <div class="history-list" id="history-list">
                                ${this.renderHistory()}
                            </div>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="btn btn-secondary" id="btn-cancel">取消</button>
                        <button class="btn btn-primary" id="btn-apply">
                            <span class="btn-text">应用修改</span>
                            <span class="btn-loading hidden">
                                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                处理中...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    renderHistory() {
        if (this.history.length === 0) {
            return '<div class="no-history">暂无修改历史</div>'
        }
        
        return this.history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-header">
                    <span class="history-request">${item.request}</span>
                    <span class="history-time">${this.formatTime(item.time)}</span>
                </div>
                <div class="history-preview">${item.preview || ''}</div>
                <button class="history-restore" data-index="${index}">恢复此版本</button>
            </div>
        `).join('')
    }
    
    formatPreview(content) {
        if (!content) return '<span class="empty-preview">暂无内容</span>'
        
        const preview = content.slice(0, 500)
        return this.escapeHtml(preview) + (content.length > 500 ? '...' : '')
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp)
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
    }
    
    escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    async applyModification(request) {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        if (!request || !request.trim()) {
            return null
        }
        
        const systemPrompt = `你是一位专业的小说编辑。请根据用户的修改要求，对章节内容进行调整。

要求：
1. 保持原文的基本风格和叙事视角
2. 只针对用户要求的部分进行修改
3. 保持内容的连贯性
4. 直接输出修改后的完整内容，不要添加任何解释

请直接输出修改后的章节内容。`

        const userPrompt = `当前章节内容：
${this.currentContent}

修改要求：${request}

请根据修改要求调整章节内容，直接输出修改后的完整内容。`

        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            systemPrompt,
            userPrompt
        )
        
        const response = await this.apiClient.request(messages, {
            maxTokens: 65536,
            temperature: 0.7
        })
        
        const result = response.choices[0].message.content.trim()
        
        this.history.unshift({
            request: request,
            time: Date.now(),
            result: result,
            preview: result.slice(0, 100) + '...'
        })
        
        return result
    }
    
    bindEvents() {
        const closeBtn = document.getElementById('dialog-close')
        const cancelBtn = document.getElementById('btn-cancel')
        const applyBtn = document.getElementById('btn-apply')
        const requestInput = document.getElementById('request-input')
        const quickBtns = document.querySelectorAll('.quick-btn')
        const historyRestoreBtns = document.querySelectorAll('.history-restore')
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close())
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close())
        }
        
        if (applyBtn) {
            applyBtn.addEventListener('click', async () => {
                const request = requestInput?.value?.trim()
                if (!request) return
                
                const btnText = applyBtn.querySelector('.btn-text')
                const btnLoading = applyBtn.querySelector('.btn-loading')
                
                if (btnText) btnText.classList.add('hidden')
                if (btnLoading) btnLoading.classList.remove('hidden')
                applyBtn.disabled = true
                
                try {
                    const result = await this.applyModification(request)
                    
                    if (result && this.onApply) {
                        this.onApply(result, request)
                    }
                    
                    this.currentContent = result
                    const preview = document.getElementById('content-preview')
                    if (preview) {
                        preview.innerHTML = this.formatPreview(result)
                    }
                    
                    const historyList = document.getElementById('history-list')
                    if (historyList) {
                        historyList.innerHTML = this.renderHistory()
                        this.bindHistoryEvents()
                    }
                    
                } catch (error) {
                    console.error('应用修改失败:', error)
                    alert('应用修改失败：' + error.message)
                } finally {
                    if (btnText) btnText.classList.remove('hidden')
                    if (btnLoading) btnLoading.classList.add('hidden')
                    applyBtn.disabled = false
                }
            })
        }
        
        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const request = btn.dataset.request
                if (requestInput) {
                    requestInput.value = request
                }
            })
        })
        
        this.bindHistoryEvents()
        
        const overlay = document.querySelector('.ai-dialog-overlay')
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close()
                }
            })
        }
    }
    
    bindHistoryEvents() {
        const historyRestoreBtns = document.querySelectorAll('.history-restore')
        historyRestoreBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index)
                const item = this.history[index]
                
                if (item && item.result && this.onApply) {
                    this.onApply(item.result, `恢复：${item.request}`)
                    this.currentContent = item.result
                    
                    const preview = document.getElementById('content-preview')
                    if (preview) {
                        preview.innerHTML = this.formatPreview(item.result)
                    }
                }
            })
        })
    }
    
    close() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (container) {
            container.innerHTML = ''
        }
        
        if (this.onClose) {
            this.onClose()
        }
    }
    
    applyStyles() {
        if (!document.getElementById('ai-dialog-tuner-styles')) {
            const style = document.createElement('style')
            style.id = 'ai-dialog-tuner-styles'
            style.textContent = `
                .ai-dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                
                .ai-dialog-modal {
                    background: #1a1a2e;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 640px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                
                .dialog-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid #2d2d44;
                }
                
                .dialog-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #e2e8f0;
                }
                
                .close-btn {
                    padding: 4px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                
                .close-btn:hover {
                    background: #2d2d44;
                    color: #e2e8f0;
                }
                
                .dialog-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }
                
                .dialog-section {
                    margin-bottom: 20px;
                }
                
                .section-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: #94a3b8;
                    margin-bottom: 8px;
                }
                
                .chapter-info {
                    font-size: 14px;
                    color: #e2e8f0;
                }
                
                .content-preview {
                    background: #252542;
                    border-radius: 6px;
                    padding: 12px;
                    font-size: 13px;
                    color: #cbd5e1;
                    line-height: 1.6;
                    max-height: 120px;
                    overflow-y: auto;
                }
                
                .empty-preview {
                    color: #64748b;
                    font-style: italic;
                }
                
                .request-input {
                    width: 100%;
                    background: #252542;
                    border: 1px solid #2d2d44;
                    border-radius: 6px;
                    padding: 12px;
                    color: #e2e8f0;
                    font-size: 14px;
                    line-height: 1.5;
                    resize: vertical;
                    font-family: inherit;
                }
                
                .request-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                }
                
                .request-input::placeholder {
                    color: #64748b;
                }
                
                .quick-actions {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 20px;
                }
                
                .quick-label {
                    font-size: 12px;
                    color: #64748b;
                }
                
                .quick-btn {
                    padding: 4px 10px;
                    background: #252542;
                    border: 1px solid #374151;
                    border-radius: 4px;
                    color: #94a3b8;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .quick-btn:hover {
                    background: #374151;
                    color: #e2e8f0;
                }
                
                .history-list {
                    max-height: 150px;
                    overflow-y: auto;
                }
                
                .no-history {
                    padding: 12px;
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                }
                
                .history-item {
                    padding: 10px;
                    background: #252542;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                
                .history-item:last-child {
                    margin-bottom: 0;
                }
                
                .history-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                
                .history-request {
                    font-size: 13px;
                    color: #e2e8f0;
                }
                
                .history-time {
                    font-size: 11px;
                    color: #64748b;
                }
                
                .history-preview {
                    font-size: 12px;
                    color: #94a3b8;
                    margin-bottom: 8px;
                }
                
                .history-restore {
                    padding: 4px 8px;
                    background: transparent;
                    border: 1px solid #3b82f6;
                    border-radius: 4px;
                    color: #60a5fa;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .history-restore:hover {
                    background: #1e3a5f;
                }
                
                .dialog-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 16px 20px;
                    border-top: 1px solid #2d2d44;
                }
                
                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-secondary {
                    background: transparent;
                    border: 1px solid #374151;
                    color: #94a3b8;
                }
                
                .btn-secondary:hover {
                    background: #252542;
                    color: #e2e8f0;
                }
                
                .btn-primary {
                    background: #3b82f6;
                    border: none;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #2563eb;
                }
                
                .btn-primary:disabled {
                    background: #3b82f6;
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                .btn-loading {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .hidden {
                    display: none !important;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `
            document.head.appendChild(style)
        }
    }
}

export { AIDialogTuner }
