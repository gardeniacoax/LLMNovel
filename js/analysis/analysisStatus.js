export const AnalysisStatus = {
    PENDING: 'pending',
    ANALYZING: 'analyzing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    EDITED: 'edited'
}

export class AnalysisStateManager {
    constructor() {
        this.state = {
            currentChapter: null,
            completedCount: 0,
            failedCount: 0,
            pendingCount: 0,
            isPaused: false,
            isCancelled: false,
            startTime: null,
            endTime: null
        }
    }
    
    reset() {
        this.state = {
            currentChapter: null,
            completedCount: 0,
            failedCount: 0,
            pendingCount: 0,
            isPaused: false,
            isCancelled: false,
            startTime: null,
            endTime: null
        }
    }
    
    start() {
        this.state.startTime = new Date().toISOString()
        this.state.isCancelled = false
        this.state.isPaused = false
    }
    
    end() {
        this.state.endTime = new Date().toISOString()
    }
    
    setCurrentChapter(chapterNum) {
        this.state.currentChapter = chapterNum
    }
    
    setPendingCount(count) {
        this.state.pendingCount = count
    }
    
    incrementCompleted() {
        this.state.completedCount++
        this.state.pendingCount = Math.max(0, this.state.pendingCount - 1)
    }
    
    incrementFailed() {
        this.state.failedCount++
        this.state.pendingCount = Math.max(0, this.state.pendingCount - 1)
    }
    
    pause() {
        this.state.isPaused = true
    }
    
    resume() {
        this.state.isPaused = false
    }
    
    cancel() {
        this.state.isCancelled = true
    }
    
    isPausedState() {
        return this.state.isPaused
    }
    
    isCancelledState() {
        return this.state.isCancelled
    }
    
    getState() {
        return { ...this.state }
    }
    
    getProgress() {
        const total = this.state.completedCount + this.state.failedCount + this.state.pendingCount
        return {
            completed: this.state.completedCount,
            failed: this.state.failedCount,
            pending: this.state.pendingCount,
            total: total,
            percent: total > 0 ? Math.round((this.state.completedCount / total) * 100) : 0
        }
    }
    
    getStatusText(status) {
        const statusMap = {
            [AnalysisStatus.PENDING]: '○ 待分析',
            [AnalysisStatus.ANALYZING]: '⏳ 分析中',
            [AnalysisStatus.COMPLETED]: '✓ 已完成',
            [AnalysisStatus.FAILED]: '✗ 失败',
            [AnalysisStatus.EDITED]: '✎ 已编辑'
        }
        return statusMap[status] || '○ 待分析'
    }
    
    getStatusColor(status) {
        const colorMap = {
            [AnalysisStatus.PENDING]: 'text-slate-400',
            [AnalysisStatus.ANALYZING]: 'text-yellow-400',
            [AnalysisStatus.COMPLETED]: 'text-green-400',
            [AnalysisStatus.FAILED]: 'text-red-400',
            [AnalysisStatus.EDITED]: 'text-blue-400'
        }
        return colorMap[status] || 'text-slate-400'
    }
    
    getStatusIcon(status) {
        const iconMap = {
            [AnalysisStatus.PENDING]: '○',
            [AnalysisStatus.ANALYZING]: '⏳',
            [AnalysisStatus.COMPLETED]: '✓',
            [AnalysisStatus.FAILED]: '✗',
            [AnalysisStatus.EDITED]: '✎'
        }
        return iconMap[status] || '○'
    }
    
    getDuration() {
        if (!this.state.startTime) return 0
        
        const start = new Date(this.state.startTime).getTime()
        const end = this.state.endTime ? new Date(this.state.endTime).getTime() : Date.now()
        
        return end - start
    }
    
    getFormattedDuration() {
        const duration = this.getDuration()
        const seconds = Math.floor(duration / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        
        if (hours > 0) {
            return `${hours}小时${minutes % 60}分钟`
        } else if (minutes > 0) {
            return `${minutes}分钟${seconds % 60}秒`
        } else {
            return `${seconds}秒`
        }
    }
    
    getSummary() {
        return {
            completed: this.state.completedCount,
            failed: this.state.failedCount,
            pending: this.state.pendingCount,
            duration: this.getFormattedDuration(),
            isComplete: this.state.pendingCount === 0 && !this.state.isPaused
        }
    }
}
