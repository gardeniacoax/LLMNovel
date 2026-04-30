class AutoSaveManager {
    constructor(dataManager) {
        this.dataManager = dataManager
        this.saveInterval = 30000
        this.pendingChanges = new Map()
        this.timer = null
        this.isRunning = false
        this.lastSaveTime = null
        this.saveCount = 0
    }
    
    start() {
        if (this.isRunning) return
        
        this.isRunning = true
        this.timer = setInterval(() => {
            this.flushPendingChanges()
        }, this.saveInterval)
        
        window.addEventListener('beforeunload', () => {
            this.flushPendingChangesSync()
        })
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.flushPendingChanges()
            }
        })
        
        console.log('自动保存管理器已启动，间隔:', this.saveInterval / 1000, '秒')
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
        this.isRunning = false
        console.log('自动保存管理器已停止')
    }
    
    setSaveInterval(interval) {
        this.saveInterval = interval
        if (this.isRunning) {
            this.stop()
            this.start()
        }
    }
    
    markDirty(key, data, type = 'chapter') {
        this.pendingChanges.set(key, {
            data,
            type,
            timestamp: Date.now()
        })
        
        if (this.pendingChanges.size >= 10) {
            this.flushPendingChanges()
        }
    }
    
    markChapterDirty(workspaceId, chapterNum, data) {
        const key = `chapter_${workspaceId}_${chapterNum}`
        this.markDirty(key, { workspaceId, chapterNum, ...data }, 'chapter')
    }
    
    markAnalysisDirty(workspaceId, data) {
        const key = `analysis_${workspaceId}`
        this.markDirty(key, { workspaceId, ...data }, 'analysis')
    }
    
    async flushPendingChanges() {
        if (this.pendingChanges.size === 0) return
        
        const changes = Array.from(this.pendingChanges.entries())
        this.pendingChanges.clear()
        
        const results = {
            success: 0,
            failed: 0,
            errors: []
        }
        
        for (const [key, { data, type }] of changes) {
            try {
                if (type === 'chapter') {
                    await this.dataManager.saveChapter(data.workspaceId, data.chapterNum, data)
                } else if (type === 'analysis') {
                    await this.dataManager.saveAnalysis(data.workspaceId, data)
                }
                results.success++
            } catch (error) {
                console.error('自动保存失败:', key, error)
                results.failed++
                results.errors.push({ key, error: error.message })
                this.pendingChanges.set(key, { data, type, timestamp: Date.now() })
            }
        }
        
        if (results.success > 0) {
            this.lastSaveTime = Date.now()
            this.saveCount++
            console.log(`自动保存完成: 成功${results.success}项, 失败${results.failed}项`)
        }
        
        return results
    }
    
    flushPendingChangesSync() {
        if (this.pendingChanges.size === 0) return
        
        const changes = Array.from(this.pendingChanges.entries())
        
        for (const [key, { data, type }] of changes) {
            try {
                const dirtyKey = `novel_dirty_${key}`
                localStorage.setItem(dirtyKey, JSON.stringify({
                    data,
                    type,
                    timestamp: Date.now()
                }))
            } catch (error) {
                console.error('紧急保存失败:', key, error)
            }
        }
        
        console.log('紧急保存完成:', changes.length, '项')
    }
    
    async recoverDirtyData() {
        const dirtyKeys = Object.keys(localStorage).filter(k => k.startsWith('novel_dirty_'))
        
        if (dirtyKeys.length === 0) return { recovered: 0, failed: 0 }
        
        const results = { recovered: 0, failed: 0 }
        
        for (const key of dirtyKeys) {
            try {
                const stored = localStorage.getItem(key)
                const { data, type } = JSON.parse(stored)
                
                if (type === 'chapter') {
                    await this.dataManager.saveChapter(data.workspaceId, data.chapterNum, data)
                } else if (type === 'analysis') {
                    await this.dataManager.saveAnalysis(data.workspaceId, data)
                }
                
                localStorage.removeItem(key)
                results.recovered++
                console.log('恢复脏数据成功:', key)
            } catch (error) {
                console.error('恢复脏数据失败:', key, error)
                results.failed++
            }
        }
        
        return results
    }
    
    getPendingCount() {
        return this.pendingChanges.size
    }
    
    getLastSaveTime() {
        return this.lastSaveTime
    }
    
    getSaveCount() {
        return this.saveCount
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            saveInterval: this.saveInterval,
            pendingCount: this.pendingChanges.size,
            lastSaveTime: this.lastSaveTime,
            saveCount: this.saveCount
        }
    }
    
    forceSave() {
        return this.flushPendingChanges()
    }
}

export { AutoSaveManager }
