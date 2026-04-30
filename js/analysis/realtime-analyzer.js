import { getTemplatePrompt } from '../prompt/templates.js'
import { ConfigManager } from '../config.js'

const PROGRESS_STORAGE_KEY = 'novel_analysis_progress'

class RealTimeAnalyzer {
    constructor(options = {}) {
        this.chapters = options.chapters || []
        this.currentIndex = 0
        this.isRunning = false
        this.isPaused = false
        this.apiClient = options.apiClient || null
        
        this.onProgress = options.onProgress || null
        this.onChapterStart = options.onChapterStart || null
        this.onChapterComplete = options.onChapterComplete || null
        this.onChapterError = options.onChapterError || null
        this.onAllComplete = options.onAllComplete || null
        this.onStatusChange = options.onStatusChange || null
        
        this.results = []
        this.errors = []
        this.startTime = null
        this.workspaceId = options.workspaceId || null
    }
    
    setApiClient(client) {
        this.apiClient = client
    }
    
    setChapters(chapters) {
        this.chapters = chapters.map(ch => ({
            ...ch,
            analysisStatus: ch.analysisStatus || 'pending',
            analysisResult: ch.analysisResult || null
        }))
        this.currentIndex = 0
        this.results = []
        this.errors = []
    }
    
    async start() {
        if (this.isRunning) return
        
        this.isRunning = true
        this.isPaused = false
        this.startTime = Date.now()
        
        this.notifyStatusChange('running')
        
        for (let i = this.currentIndex; i < this.chapters.length; i++) {
            if (!this.isRunning) {
                this.notifyStatusChange('stopped')
                return
            }
            
            while (this.isPaused) {
                await this.sleep(500)
                if (!this.isRunning) {
                    this.notifyStatusChange('stopped')
                    return
                }
            }
            
            this.currentIndex = i
            const chapter = this.chapters[i]
            
            this.notifyProgress({
                current: i + 1,
                total: this.chapters.length,
                chapter: chapter,
                percentage: Math.round((i + 1) / this.chapters.length * 100),
                status: 'analyzing'
            })
            
            this.notifyChapterStart(chapter, i)
            
            try {
                const result = await this.analyzeChapter(chapter)
                
                chapter.analysisStatus = 'completed'
                chapter.analysisResult = result
                
                this.results.push({
                    chapterNum: chapter.chapterNum,
                    result: result
                })
                
                this.notifyChapterComplete(chapter, result, i)
                
            } catch (error) {
                chapter.analysisStatus = 'error'
                chapter.error = error.message
                
                this.errors.push({
                    chapterNum: chapter.chapterNum,
                    error: error.message
                })
                
                this.notifyChapterError(chapter, error, i)
            }
            
            this.saveProgress()
        }
        
        if (this.currentIndex >= this.chapters.length - 1) {
            this.isRunning = false
            this.notifyStatusChange('completed')
            this.notifyAllComplete(this.chapters, this.results, this.errors)
            this.clearProgress()
        }
    }
    
    pause() {
        this.isPaused = true
        this.notifyStatusChange('paused')
    }
    
    resume() {
        this.isPaused = false
        this.notifyStatusChange('running')
    }
    
    stop() {
        this.isRunning = false
        this.isPaused = false
        this.notifyStatusChange('stopped')
    }
    
    async analyzeChapter(chapter) {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        const systemPrompt = getTemplatePrompt('chapter_analysis')
        
        const userPrompt = `请分析以下章节内容：

章节标题：${chapter.title}
章节字数：${chapter.wordCount}

章节内容：
${chapter.content}`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            systemPrompt,
            userPrompt
        )
        
        const response = await this.apiClient.request(messages, {
            maxTokens: 4096,
            temperature: 0.7
        })
        
        const content = response.choices[0].message.content.trim()
        
        return this.parseAnalysisResult(content)
    }
    
    parseAnalysisResult(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                
                if (parsed.chapters && Array.isArray(parsed.chapters)) {
                    return parsed.chapters[0] || parsed
                }
                
                return parsed
            }
        } catch (error) {
            console.error('解析分析结果失败:', error)
        }
        
        return {
            summary: response.slice(0, 200),
            key_events: [],
            character_performances: [],
            chapter_function: [],
            raw: response
        }
    }
    
    saveProgress() {
        if (!this.workspaceId) return
        
        const progress = {
            workspaceId: this.workspaceId,
            currentIndex: this.currentIndex,
            chapters: this.chapters.map(ch => ({
                chapterNum: ch.chapterNum,
                title: ch.title,
                analysisStatus: ch.analysisStatus,
                analysisResult: ch.analysisResult,
                error: ch.error
            })),
            results: this.results,
            errors: this.errors,
            startTime: this.startTime,
            savedAt: Date.now()
        }
        
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
    }
    
    loadProgress() {
        const data = localStorage.getItem(PROGRESS_STORAGE_KEY)
        if (!data) return false
        
        try {
            const progress = JSON.parse(data)
            
            if (progress.workspaceId !== this.workspaceId) {
                return false
            }
            
            this.currentIndex = progress.currentIndex
            this.results = progress.results || []
            this.errors = progress.errors || []
            this.startTime = progress.startTime
            
            progress.chapters.forEach(saved => {
                const chapter = this.chapters.find(ch => ch.chapterNum === saved.chapterNum)
                if (chapter) {
                    chapter.analysisStatus = saved.analysisStatus
                    chapter.analysisResult = saved.analysisResult
                    chapter.error = saved.error
                }
            })
            
            return true
        } catch (error) {
            console.error('加载分析进度失败:', error)
            return false
        }
    }
    
    clearProgress() {
        localStorage.removeItem(PROGRESS_STORAGE_KEY)
    }
    
    hasProgress() {
        const data = localStorage.getItem(PROGRESS_STORAGE_KEY)
        if (!data) return false
        
        try {
            const progress = JSON.parse(data)
            return progress.workspaceId === this.workspaceId
        } catch {
            return false
        }
    }
    
    getStats() {
        const completed = this.chapters.filter(ch => ch.analysisStatus === 'completed').length
        const pending = this.chapters.filter(ch => ch.analysisStatus === 'pending').length
        const error = this.chapters.filter(ch => ch.analysisStatus === 'error').length
        const analyzing = this.chapters.filter(ch => ch.analysisStatus === 'analyzing').length
        
        const elapsed = this.startTime ? Date.now() - this.startTime : 0
        const avgTimePerChapter = completed > 0 ? elapsed / completed : 0
        const estimatedRemaining = avgTimePerChapter * pending
        
        return {
            total: this.chapters.length,
            completed,
            pending,
            error,
            analyzing,
            percentage: this.chapters.length > 0 ? Math.round((completed / this.chapters.length) * 100) : 0,
            elapsed,
            avgTimePerChapter,
            estimatedRemaining,
            currentIndex: this.currentIndex
        }
    }
    
    getStatus() {
        if (!this.isRunning && !this.isPaused) {
            if (this.currentIndex >= this.chapters.length - 1) {
                return 'completed'
            }
            return 'idle'
        }
        
        if (this.isPaused) {
            return 'paused'
        }
        
        return 'running'
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    notifyProgress(data) {
        if (this.onProgress) {
            this.onProgress(data)
        }
    }
    
    notifyChapterStart(chapter, index) {
        if (this.onChapterStart) {
            this.onChapterStart(chapter, index)
        }
    }
    
    notifyChapterComplete(chapter, result, index) {
        if (this.onChapterComplete) {
            this.onChapterComplete(chapter, result, index)
        }
    }
    
    notifyChapterError(chapter, error, index) {
        if (this.onChapterError) {
            this.onChapterError(chapter, error, index)
        }
    }
    
    notifyAllComplete(chapters, results, errors) {
        if (this.onAllComplete) {
            this.onAllComplete(chapters, results, errors)
        }
    }
    
    notifyStatusChange(status) {
        if (this.onStatusChange) {
            this.onStatusChange(status)
        }
    }
    
    retryChapter(chapterNum) {
        const chapter = this.chapters.find(ch => ch.chapterNum === chapterNum)
        if (chapter) {
            chapter.analysisStatus = 'pending'
            chapter.error = null
            
            const errorIndex = this.errors.findIndex(e => e.chapterNum === chapterNum)
            if (errorIndex !== -1) {
                this.errors.splice(errorIndex, 1)
            }
        }
    }
    
    retryAllErrors() {
        this.chapters.forEach(chapter => {
            if (chapter.analysisStatus === 'error') {
                chapter.analysisStatus = 'pending'
                chapter.error = null
            }
        })
        this.errors = []
    }
}

class AnalysisProgressTracker {
    constructor() {
        this.startTime = null
        this.chapterTimes = []
    }
    
    start() {
        this.startTime = Date.now()
        this.chapterTimes = []
    }
    
    recordChapter() {
        this.chapterTimes.push(Date.now())
    }
    
    getElapsedTime() {
        if (!this.startTime) return 0
        return Date.now() - this.startTime
    }
    
    getAverageChapterTime() {
        if (this.chapterTimes.length === 0) return 0
        
        const times = []
        let prevTime = this.startTime
        
        for (const time of this.chapterTimes) {
            times.push(time - prevTime)
            prevTime = time
        }
        
        return times.reduce((sum, t) => sum + t, 0) / times.length
    }
    
    estimateRemaining(chaptersRemaining) {
        const avgTime = this.getAverageChapterTime()
        return avgTime * chaptersRemaining
    }
    
    formatTime(ms) {
        if (ms < 1000) return `${ms}ms`
        if (ms < 60000) return `${Math.round(ms / 1000)}秒`
        
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.round((ms % 60000) / 1000)
        
        if (minutes < 60) {
            return `${minutes}分${seconds}秒`
        }
        
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return `${hours}小时${remainingMinutes}分`
    }
}

export { RealTimeAnalyzer, AnalysisProgressTracker, PROGRESS_STORAGE_KEY }
