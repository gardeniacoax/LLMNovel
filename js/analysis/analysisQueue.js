import { AnalysisStatus, AnalysisStateManager } from './analysisStatus.js'

export class AnalysisQueue {
    constructor() {
        this.queue = []
        this.isProcessing = false
        this.isPaused = false
        this.currentIndex = 0
        this.stateManager = new AnalysisStateManager()
        
        this.onProgress = null
        this.onChapterStart = null
        this.onChapterComplete = null
        this.onChapterError = null
        this.onComplete = null
        this.onError = null
    }
    
    add(chapters) {
        this.queue = chapters.filter(c => 
            c.analysisStatus === AnalysisStatus.PENDING || 
            c.analysisStatus === AnalysisStatus.FAILED
        )
        this.currentIndex = 0
        this.stateManager.reset()
        this.stateManager.setPendingCount(this.queue.length)
    }
    
    setCallbacks(callbacks) {
        if (callbacks.onProgress) this.onProgress = callbacks.onProgress
        if (callbacks.onChapterStart) this.onChapterStart = callbacks.onChapterStart
        if (callbacks.onChapterComplete) this.onChapterComplete = callbacks.onChapterComplete
        if (callbacks.onChapterError) this.onChapterError = callbacks.onChapterError
        if (callbacks.onComplete) this.onComplete = callbacks.onComplete
        if (callbacks.onError) this.onError = callbacks.onError
    }
    
    async process(analyzeFn) {
        if (this.queue.length === 0) {
            if (this.onComplete) {
                this.onComplete([])
            }
            return
        }
        
        this.isProcessing = true
        this.isPaused = false
        this.stateManager.start()
        
        while (this.currentIndex < this.queue.length) {
            if (this.isPaused) {
                break
            }
            
            const chapter = this.queue[this.currentIndex]
            chapter.analysisStatus = AnalysisStatus.ANALYZING
            
            this.stateManager.setCurrentChapter(chapter.chapterNum)
            
            if (this.onChapterStart) {
                this.onChapterStart(chapter, this.currentIndex, this.queue.length)
            }
            
            if (this.onProgress) {
                this.onProgress(this.currentIndex + 1, this.queue.length, chapter)
            }
            
            try {
                const result = await analyzeFn(chapter)
                
                const validationResult = this.validateAnalysisResult(result)
                if (!validationResult.valid) {
                    throw new Error(validationResult.error)
                }
                
                chapter.analysisResult = result
                chapter.analysisStatus = AnalysisStatus.COMPLETED
                chapter.analyzedAt = new Date().toISOString()
                
                this.stateManager.incrementCompleted()
                
                if (this.onChapterComplete) {
                    this.onChapterComplete(chapter, result, this.currentIndex, this.queue.length)
                }
                
            } catch (error) {
                chapter.analysisStatus = AnalysisStatus.FAILED
                chapter.error = error.message
                
                this.stateManager.incrementFailed()
                
                if (this.onChapterError) {
                    this.onChapterError(chapter, error, this.currentIndex, this.queue.length)
                }
                
                if (this.onError) {
                    this.onError(chapter, error)
                }
            }
            
            this.currentIndex++
        }
        
        this.stateManager.end()
        
        if (!this.isPaused && this.currentIndex >= this.queue.length) {
            this.isProcessing = false
            
            if (this.onComplete) {
                this.onComplete(this.queue, this.stateManager.getSummary())
            }
        }
    }
    
    validateAnalysisResult(result) {
        if (!result) {
            return { valid: false, error: '分析结果为空' }
        }
        
        if (result.error || result.parseError) {
            return { valid: false, error: result.error || result.parseError }
        }
        
        return { valid: true }
    }
    
    pause() {
        this.isPaused = true
        this.stateManager.pause()
    }
    
    resume(analyzeFn) {
        if (this.isPaused) {
            this.isPaused = false
            this.stateManager.resume()
            this.process(analyzeFn)
        }
    }
    
    cancel() {
        this.isPaused = true
        this.isProcessing = false
        this.stateManager.cancel()
        this.queue = []
        this.currentIndex = 0
    }
    
    retry(chapterNum, analyzeFn) {
        const chapter = this.queue.find(c => c.chapterNum === chapterNum)
        if (chapter && chapter.analysisStatus === AnalysisStatus.FAILED) {
            chapter.analysisStatus = AnalysisStatus.PENDING
            chapter.error = null
            return this.processSingle(chapter, analyzeFn)
        }
        return null
    }
    
    async processSingle(chapter, analyzeFn) {
        chapter.analysisStatus = AnalysisStatus.ANALYZING
        
        if (this.onChapterStart) {
            this.onChapterStart(chapter, 0, 1)
        }
        
        try {
            const result = await analyzeFn(chapter)
            
            const validationResult = this.validateAnalysisResult(result)
            if (!validationResult.valid) {
                throw new Error(validationResult.error)
            }
            
            chapter.analysisResult = result
            chapter.analysisStatus = AnalysisStatus.COMPLETED
            chapter.analyzedAt = new Date().toISOString()
            
            if (this.onChapterComplete) {
                this.onChapterComplete(chapter, result, 0, 1)
            }
            
            return result
            
        } catch (error) {
            chapter.analysisStatus = AnalysisStatus.FAILED
            chapter.error = error.message
            
            if (this.onChapterError) {
                this.onChapterError(chapter, error, 0, 1)
            }
            
            throw error
        }
    }
    
    getProgress() {
        return {
            current: this.currentIndex,
            total: this.queue.length,
            percent: this.queue.length > 0 
                ? Math.round((this.currentIndex / this.queue.length) * 100) 
                : 0,
            state: this.stateManager.getState()
        }
    }
    
    isRunning() {
        return this.isProcessing && !this.isPaused
    }
    
    isPausedState() {
        return this.isPaused
    }
    
    getQueue() {
        return this.queue
    }
    
    getStats() {
        return this.stateManager.getSummary()
    }
    
    getState() {
        return this.stateManager.getState()
    }
    
    getCompletedChapters() {
        return this.queue.filter(c => c.analysisStatus === AnalysisStatus.COMPLETED)
    }
    
    getFailedChapters() {
        return this.queue.filter(c => c.analysisStatus === AnalysisStatus.FAILED)
    }
    
    getPendingChapters() {
        return this.queue.filter(c => 
            c.analysisStatus === AnalysisStatus.PENDING || 
            c.analysisStatus === AnalysisStatus.FAILED
        )
    }
    
    clear() {
        this.queue = []
        this.currentIndex = 0
        this.isProcessing = false
        this.isPaused = false
        this.stateManager.reset()
    }
}
