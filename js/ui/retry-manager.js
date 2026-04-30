class RetryManager {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3
        this.retryDelay = options.retryDelay || 1000
        this.exponentialBackoff = options.exponentialBackoff !== false
        this.maxDelay = options.maxDelay || 30000
        
        this.retryCount = 0
        this.lastError = null
        this.onRetry = options.onRetry || null
        this.onFailed = options.onFailed || null
    }
    
    async execute(task, context = {}) {
        this.retryCount = 0
        this.lastError = null
        
        while (this.retryCount < this.maxRetries) {
            try {
                const result = await task(context)
                return result
            } catch (error) {
                this.lastError = error
                this.retryCount++
                
                if (this.retryCount < this.maxRetries) {
                    const delay = this.calculateDelay()
                    
                    if (this.onRetry) {
                        this.onRetry({
                            attempt: this.retryCount,
                            maxRetries: this.maxRetries,
                            delay: delay,
                            error: error
                        })
                    }
                    
                    await this.sleep(delay)
                }
            }
        }
        
        if (this.onFailed) {
            this.onFailed({
                attempts: this.retryCount,
                error: this.lastError
            })
        }
        
        throw this.lastError
    }
    
    calculateDelay() {
        if (!this.exponentialBackoff) {
            return this.retryDelay
        }
        
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1)
        return Math.min(delay, this.maxDelay)
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    getRetryCount() {
        return this.retryCount
    }
    
    getLastError() {
        return this.lastError
    }
    
    reset() {
        this.retryCount = 0
        this.lastError = null
    }
}

class BatchRetryManager {
    constructor(options = {}) {
        this.items = options.items || []
        this.processItem = options.processItem || null
        this.maxRetries = options.maxRetries || 3
        this.concurrency = options.concurrency || 1
        
        this.results = []
        this.failedItems = []
        this.processedCount = 0
        
        this.onProgress = options.onProgress || null
        this.onItemComplete = options.onItemComplete || null
        this.onItemFailed = options.onItemFailed || null
        this.onComplete = options.onComplete || null
    }
    
    setItems(items) {
        this.items = items
        this.results = []
        this.failedItems = []
        this.processedCount = 0
    }
    
    async execute() {
        this.results = []
        this.failedItems = []
        this.processedCount = 0
        
        const queue = [...this.items]
        const active = new Set()
        
        while (queue.length > 0 || active.size > 0) {
            while (active.size < this.concurrency && queue.length > 0) {
                const item = queue.shift()
                const promise = this.processItemWithRetry(item)
                active.add(promise)
                
                promise.finally(() => {
                    active.delete(promise)
                })
            }
            
            if (active.size > 0) {
                await Promise.race(active)
            }
        }
        
        if (this.onComplete) {
            this.onComplete({
                total: this.items.length,
                succeeded: this.results.length,
                failed: this.failedItems.length,
                results: this.results,
                failedItems: this.failedItems
            })
        }
        
        return {
            results: this.results,
            failedItems: this.failedItems
        }
    }
    
    async processItemWithRetry(item) {
        const retryManager = new RetryManager({
            maxRetries: this.maxRetries,
            onRetry: (info) => {
                if (this.onProgress) {
                    this.onProgress({
                        item: item,
                        status: 'retrying',
                        attempt: info.attempt,
                        maxRetries: info.maxRetries
                    })
                }
            }
        })
        
        try {
            const result = await retryManager.execute(async () => {
                return await this.processItem(item)
            })
            
            this.results.push({ item, result })
            this.processedCount++
            
            if (this.onItemComplete) {
                this.onItemComplete({ item, result })
            }
            
            if (this.onProgress) {
                this.onProgress({
                    item: item,
                    status: 'completed',
                    processed: this.processedCount,
                    total: this.items.length
                })
            }
            
            return result
            
        } catch (error) {
            this.failedItems.push({ item, error })
            this.processedCount++
            
            if (this.onItemFailed) {
                this.onItemFailed({ item, error })
            }
            
            if (this.onProgress) {
                this.onProgress({
                    item: item,
                    status: 'failed',
                    processed: this.processedCount,
                    total: this.items.length,
                    error: error
                })
            }
            
            throw error
        }
    }
    
    getFailedItems() {
        return this.failedItems
    }
    
    getResults() {
        return this.results
    }
    
    getProgress() {
        return {
            total: this.items.length,
            processed: this.processedCount,
            succeeded: this.results.length,
            failed: this.failedItems.length,
            percentage: this.items.length > 0 
                ? Math.round((this.processedCount / this.items.length) * 100) 
                : 0
        }
    }
    
    async retryFailed() {
        if (this.failedItems.length === 0) {
            return { results: [], failedItems: [] }
        }
        
        const failedOnly = this.failedItems.map(f => f.item)
        this.failedItems = []
        
        const batchRetry = new BatchRetryManager({
            items: failedOnly,
            processItem: this.processItem,
            maxRetries: this.maxRetries,
            concurrency: this.concurrency,
            onProgress: this.onProgress,
            onItemComplete: this.onItemComplete,
            onItemFailed: this.onItemFailed
        })
        
        const result = await batchRetry.execute()
        
        this.results.push(...result.results)
        this.failedItems = result.failedItems
        
        return result
    }
}

class RetryDialog {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.failedItems = options.failedItems || []
        
        this.onRetrySelected = options.onRetrySelected || null
        this.onRetryAll = options.onRetryAll || null
        this.onSkip = options.onSkip || null
    }
    
    show() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="retry-overlay">
                <div class="retry-dialog">
                    <div class="dialog-header">
                        <h3>重试失败项</h3>
                        <span class="failed-count">${this.failedItems.length} 项失败</span>
                    </div>
                    <div class="dialog-body">
                        <div class="failed-list">
                            ${this.renderFailedItems()}
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="btn btn-secondary btn-skip">跳过全部</button>
                        <button class="btn btn-primary btn-retry-selected">重试选中</button>
                        <button class="btn btn-primary btn-retry-all">重试全部</button>
                    </div>
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    renderFailedItems() {
        return this.failedItems.map((item, index) => `
            <div class="failed-item" data-index="${index}">
                <label class="failed-checkbox">
                    <input type="checkbox" checked data-index="${index}">
                </label>
                <div class="failed-info">
                    <span class="failed-name">${item.item?.title || item.item?.chapterNum || `项目 ${index + 1}`}</span>
                    <span class="failed-error">${item.error?.message || '未知错误'}</span>
                </div>
            </div>
        `).join('')
    }
    
    bindEvents() {
        const retryAllBtn = document.querySelector('.btn-retry-all')
        const retrySelectedBtn = document.querySelector('.btn-retry-selected')
        const skipBtn = document.querySelector('.btn-skip')
        
        if (retryAllBtn) {
            retryAllBtn.addEventListener('click', () => {
                if (this.onRetryAll) {
                    this.onRetryAll(this.failedItems)
                }
                this.close()
            })
        }
        
        if (retrySelectedBtn) {
            retrySelectedBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('.failed-checkbox input:checked')
                const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index))
                const selectedItems = selectedIndices.map(i => this.failedItems[i])
                
                if (this.onRetrySelected) {
                    this.onRetrySelected(selectedItems)
                }
                this.close()
            })
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                if (this.onSkip) {
                    this.onSkip()
                }
                this.close()
            })
        }
    }
    
    close() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (container) {
            container.innerHTML = ''
        }
    }
    
    applyStyles() {
        if (!document.getElementById('retry-dialog-styles')) {
            const style = document.createElement('style')
            style.id = 'retry-dialog-styles'
            style.textContent = `
                .retry-overlay {
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
                }
                
                .retry-dialog {
                    background: #1a1a2e;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 500px;
                    max-height: 80vh;
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
                
                .failed-count {
                    padding: 4px 10px;
                    background: #7f1d1d;
                    border-radius: 12px;
                    font-size: 12px;
                    color: #fca5a5;
                }
                
                .dialog-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }
                
                .failed-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .failed-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #252542;
                    border-radius: 6px;
                    border-left: 3px solid #f87171;
                }
                
                .failed-checkbox input {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                
                .failed-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .failed-name {
                    font-size: 14px;
                    color: #e2e8f0;
                }
                
                .failed-error {
                    font-size: 12px;
                    color: #f87171;
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
            `
            document.head.appendChild(style)
        }
    }
}

class RetryProgressIndicator {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.currentAttempt = 0
        this.maxAttempts = options.maxAttempts || 3
        this.status = 'idle'
        
        this.onCancel = options.onCancel || null
    }
    
    show() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="retry-progress">
                <div class="progress-content">
                    <div class="progress-spinner"></div>
                    <div class="progress-info">
                        <span class="progress-status">重试中...</span>
                        <span class="progress-attempt">第 <span id="current-attempt">1</span>/${this.maxAttempts} 次</span>
                    </div>
                    <button class="cancel-btn" id="cancel-retry">取消</button>
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    setAttempt(attempt) {
        this.currentAttempt = attempt
        const attemptEl = document.getElementById('current-attempt')
        if (attemptEl) {
            attemptEl.textContent = attempt
        }
    }
    
    setStatus(status) {
        this.status = status
        const statusEl = document.querySelector('.progress-status')
        if (statusEl) {
            const statusTexts = {
                idle: '准备中...',
                retrying: '重试中...',
                success: '成功',
                failed: '失败'
            }
            statusEl.textContent = statusTexts[status] || status
        }
    }
    
    close() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (container) {
            container.innerHTML = ''
        }
    }
    
    bindEvents() {
        const cancelBtn = document.getElementById('cancel-retry')
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.onCancel) {
                    this.onCancel()
                }
                this.close()
            })
        }
    }
    
    applyStyles() {
        if (!document.getElementById('retry-progress-styles')) {
            const style = document.createElement('style')
            style.id = 'retry-progress-styles'
            style.textContent = `
                .retry-progress {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #1a1a2e;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                }
                
                .progress-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .progress-spinner {
                    width: 24px;
                    height: 24px;
                    border: 2px solid #374151;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .progress-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                
                .progress-status {
                    font-size: 14px;
                    color: #e2e8f0;
                }
                
                .progress-attempt {
                    font-size: 12px;
                    color: #64748b;
                }
                
                .cancel-btn {
                    padding: 6px 12px;
                    background: transparent;
                    border: 1px solid #374151;
                    border-radius: 4px;
                    color: #94a3b8;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .cancel-btn:hover {
                    background: #252542;
                    color: #e2e8f0;
                }
            `
            document.head.appendChild(style)
        }
    }
}

export { 
    RetryManager, 
    BatchRetryManager, 
    RetryDialog, 
    RetryProgressIndicator 
}
