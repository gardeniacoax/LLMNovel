class CheckpointManager {
    static STORAGE_KEY = 'novel_checkpoints'
    
    static save(projectId, checkpoint) {
        const checkpoints = this.getAll()
        checkpoints[projectId] = {
            ...checkpoint,
            savedAt: Date.now()
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(checkpoints))
    }
    
    static load(projectId) {
        const checkpoints = this.getAll()
        return checkpoints[projectId] || null
    }
    
    static getAll() {
        const data = localStorage.getItem(this.STORAGE_KEY)
        return data ? JSON.parse(data) : {}
    }
    
    static clear(projectId) {
        const checkpoints = this.getAll()
        delete checkpoints[projectId]
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(checkpoints))
    }
    
    static clearAll() {
        localStorage.removeItem(this.STORAGE_KEY)
    }
    
    static hasUnfinished(projectId) {
        const checkpoint = this.load(projectId)
        return checkpoint && !checkpoint.completed
    }
    
    static update(projectId, updates) {
        const checkpoint = this.load(projectId)
        if (checkpoint) {
            this.save(projectId, { ...checkpoint, ...updates })
        }
    }
    
    static markCompleted(projectId) {
        this.update(projectId, { completed: true })
    }
    
    static getProgress(projectId) {
        const checkpoint = this.load(projectId)
        if (!checkpoint) return null
        
        const processedCount = checkpoint.processedChapters?.length || 0
        const totalCount = checkpoint.totalChapters || 0
        
        return {
            processedCount,
            totalCount,
            percentage: totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0,
            savedAt: checkpoint.savedAt,
            completed: checkpoint.completed
        }
    }
    
    static getExpiredCheckpoints(maxAge = 24 * 60 * 60 * 1000) {
        const checkpoints = this.getAll()
        const now = Date.now()
        const expired = []
        
        for (const [projectId, checkpoint] of Object.entries(checkpoints)) {
            if (now - checkpoint.savedAt > maxAge) {
                expired.push(projectId)
            }
        }
        
        return expired
    }
    
    static cleanExpired(maxAge = 24 * 60 * 60 * 1000) {
        const expired = this.getExpiredCheckpoints(maxAge)
        expired.forEach(projectId => this.clear(projectId))
        return expired.length
    }
}

class RecoveryDialog {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.checkpoint = options.checkpoint || null
        
        this.onRecover = options.onRecover || null
        this.onDiscard = options.onDiscard || null
    }
    
    show() {
        if (!this.checkpoint) return
        
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        const savedTime = new Date(this.checkpoint.savedAt).toLocaleString()
        const processedCount = this.checkpoint.processedChapters?.length || 0
        const totalCount = this.checkpoint.totalChapters || 0
        
        container.innerHTML = `
            <div class="recovery-overlay">
                <div class="recovery-dialog">
                    <div class="dialog-icon">📋</div>
                    <h3>发现未完成的任务</h3>
                    <p class="dialog-desc">上次处理到第 ${processedCount}/${totalCount} 章</p>
                    <p class="dialog-time">保存时间：${savedTime}</p>
                    <div class="dialog-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0}%"></div>
                        </div>
                        <span class="progress-text">${totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0}%</span>
                    </div>
                    <div class="dialog-actions">
                        <button class="btn btn-secondary btn-discard">放弃并重新开始</button>
                        <button class="btn btn-primary btn-recover">继续上次任务</button>
                    </div>
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    bindEvents() {
        const recoverBtn = document.querySelector('.btn-recover')
        const discardBtn = document.querySelector('.btn-discard')
        
        if (recoverBtn) {
            recoverBtn.addEventListener('click', () => {
                if (this.onRecover) {
                    this.onRecover(this.checkpoint)
                }
                this.close()
            })
        }
        
        if (discardBtn) {
            discardBtn.addEventListener('click', () => {
                if (this.onDiscard) {
                    this.onDiscard()
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
        if (!document.getElementById('recovery-dialog-styles')) {
            const style = document.createElement('style')
            style.id = 'recovery-dialog-styles'
            style.textContent = `
                .recovery-overlay {
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
                
                .recovery-dialog {
                    background: #1a1a2e;
                    border-radius: 12px;
                    padding: 32px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                
                .dialog-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .recovery-dialog h3 {
                    margin: 0 0 12px 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #e2e8f0;
                }
                
                .dialog-desc {
                    font-size: 14px;
                    color: #94a3b8;
                    margin: 0 0 8px 0;
                }
                
                .dialog-time {
                    font-size: 12px;
                    color: #64748b;
                    margin: 0 0 20px 0;
                }
                
                .dialog-progress {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                
                .progress-bar {
                    flex: 1;
                    height: 8px;
                    background: #374151;
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3B82F6, #10B981);
                    border-radius: 4px;
                }
                
                .progress-text {
                    font-size: 13px;
                    color: #3b82f6;
                    font-weight: 500;
                }
                
                .dialog-actions {
                    display: flex;
                    gap: 12px;
                }
                
                .btn {
                    flex: 1;
                    padding: 12px 20px;
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

class AutoSaveManager {
    constructor(options = {}) {
        this.projectId = options.projectId || null
        this.interval = options.interval || 30000
        this.enabled = options.enabled !== false
        
        this.getData = options.getData || null
        this.onSave = options.onSave || null
        
        this.timer = null
        this.lastSave = null
    }
    
    start() {
        if (!this.enabled || !this.projectId) return
        
        this.stop()
        
        this.timer = setInterval(() => {
            this.save()
        }, this.interval)
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
    }
    
    save() {
        if (!this.projectId || !this.getData) return
        
        const data = this.getData()
        
        if (data) {
            CheckpointManager.save(this.projectId, {
                ...data,
                autoSaved: true
            })
            
            this.lastSave = Date.now()
            
            if (this.onSave) {
                this.onSave(data)
            }
        }
    }
    
    setProjectId(id) {
        this.projectId = id
    }
    
    setInterval(interval) {
        this.interval = interval
        if (this.timer) {
            this.start()
        }
    }
    
    enable() {
        this.enabled = true
        this.start()
    }
    
    disable() {
        this.enabled = false
        this.stop()
    }
    
    getLastSaveTime() {
        return this.lastSave
    }
    
    getTimeSinceLastSave() {
        if (!this.lastSave) return null
        return Date.now() - this.lastSave
    }
}

class SessionRecovery {
    constructor(options = {}) {
        this.projectId = options.projectId || null
        this.onRecover = options.onRecover || null
        this.onDiscard = options.onDiscard || null
        
        this.dialog = null
    }
    
    checkAndRecover() {
        if (!this.projectId) return false
        
        if (CheckpointManager.hasUnfinished(this.projectId)) {
            const checkpoint = CheckpointManager.load(this.projectId)
            
            this.dialog = new RecoveryDialog({
                container: document.body,
                checkpoint: checkpoint,
                onRecover: (cp) => {
                    if (this.onRecover) {
                        this.onRecover(cp)
                    }
                },
                onDiscard: () => {
                    CheckpointManager.clear(this.projectId)
                    if (this.onDiscard) {
                        this.onDiscard()
                    }
                }
            })
            
            this.dialog.show()
            return true
        }
        
        return false
    }
    
    setProjectId(id) {
        this.projectId = id
    }
}

export { 
    CheckpointManager, 
    RecoveryDialog, 
    AutoSaveManager, 
    SessionRecovery 
}
