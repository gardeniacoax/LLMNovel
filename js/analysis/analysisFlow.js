import { ChapterSplitter } from './chapter-splitter.js'
import { ChapterAnalyzer } from './chapterAnalyzer.js'
import { AnalysisQueue } from './analysisQueue.js'
import { AnalysisStatus, AnalysisStateManager } from './analysisStatus.js'
import { AnalysisStorage } from './analysisStorage.js'
import { OverallAnalyzer } from './overallAnalyzer.js'

export class AnalysisFlow {
    constructor() {
        this.splitter = new ChapterSplitter()
        this.analyzer = new ChapterAnalyzer()
        this.queue = new AnalysisQueue()
        this.storage = new AnalysisStorage()
        this.overallAnalyzer = new OverallAnalyzer()
        this.stateManager = new AnalysisStateManager()
        
        this.analysisData = {
            novelId: null,
            novelTitle: '',
            totalChapters: 0,
            totalWords: 0,
            chapters: [],
            chapterAnalyses: {},
            overallAnalysis: null,
            analysisType: 'plot',
            status: 'idle',
            startTime: null,
            endTime: null
        }
    }
    
    async importFile(file) {
        try {
            const content = await file.text()
            const chapters = this.splitter.split(content)
            const stats = this.splitter.getSplitStats(chapters)
            
            this.analysisData.novelId = this.generateNovelId(file.name)
            this.analysisData.novelTitle = file.name.replace('.txt', '')
            this.analysisData.totalChapters = stats.totalChapters
            this.analysisData.totalWords = stats.totalWords
            this.analysisData.chapters = chapters
            this.analysisData.status = 'imported'
            
            this.stateManager.reset()
            this.stateManager.setPendingCount(stats.totalChapters)
            
            return {
                success: true,
                stats: stats,
                chapters: chapters
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    async importFromText(content, filename = '未知小说') {
        try {
            const chapters = this.splitter.split(content)
            const stats = this.splitter.getSplitStats(chapters)
            
            this.analysisData.novelId = this.generateNovelId(filename)
            this.analysisData.novelTitle = filename.replace('.txt', '')
            this.analysisData.totalChapters = stats.totalChapters
            this.analysisData.totalWords = stats.totalWords
            this.analysisData.chapters = chapters
            this.analysisData.status = 'imported'
            
            this.stateManager.reset()
            this.stateManager.setPendingCount(stats.totalChapters)
            
            return {
                success: true,
                stats: stats,
                chapters: chapters
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    generateNovelId(filename) {
        return `novel_${Date.now()}_${filename.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}`
    }
    
    setAnalysisType(type) {
        this.analysisData.analysisType = type
        this.analyzer.setAnalysisType(type)
    }
    
    async analyzeSingleChapter(chapterIndex, onProgress) {
        const chapter = this.analysisData.chapters[chapterIndex]
        if (!chapter) {
            throw new Error('章节不存在')
        }
        
        chapter.analysisStatus = AnalysisStatus.ANALYZING
        this.stateManager.setCurrentChapter(chapter.chapterNum)
        
        if (onProgress) onProgress('start', chapter)
        
        try {
            const result = await this.analyzer.analyze(chapter)
            
            chapter.analysisResult = result
            chapter.analysisStatus = AnalysisStatus.COMPLETED
            chapter.analyzedAt = new Date().toISOString()
            
            this.storage.saveChapterAnalysis(chapter.chapterNum, {
                chapterNum: chapter.chapterNum,
                title: chapter.title,
                content: chapter.content,
                wordCount: chapter.wordCount,
                analysisResult: result,
                analyzedAt: chapter.analyzedAt
            })
            
            this.analysisData.chapterAnalyses[chapter.chapterNum] = result
            this.stateManager.incrementCompleted()
            
            if (onProgress) onProgress('complete', chapter, result)
            
            return result
        } catch (error) {
            chapter.analysisStatus = AnalysisStatus.FAILED
            chapter.error = error.message
            this.stateManager.incrementFailed()
            if (onProgress) onProgress('error', chapter, error)
            throw error
        }
    }
    
    async analyzeAllChapters(onProgress, onComplete, onError) {
        this.analysisData.status = 'analyzing'
        this.analysisData.startTime = new Date().toISOString()
        this.stateManager.start()
        
        const pendingChapters = this.analysisData.chapters.filter(c => 
            c.analysisStatus === AnalysisStatus.PENDING || 
            c.analysisStatus === AnalysisStatus.FAILED
        )
        
        this.queue.add(pendingChapters)
        
        this.queue.setCallbacks({
            onProgress: (current, total, chapter) => {
                if (onProgress) {
                    onProgress({
                        current,
                        total,
                        percent: Math.round((current / total) * 100),
                        chapter: chapter
                    })
                }
            },
            onChapterComplete: (chapter, result) => {
                this.storage.saveChapterAnalysis(chapter.chapterNum, {
                    chapterNum: chapter.chapterNum,
                    title: chapter.title,
                    content: chapter.content,
                    wordCount: chapter.wordCount,
                    analysisResult: result,
                    analyzedAt: chapter.analyzedAt
                })
                this.analysisData.chapterAnalyses[chapter.chapterNum] = result
            },
            onComplete: async (chapters, summary) => {
                this.analysisData.status = 'completed'
                this.analysisData.endTime = new Date().toISOString()
                this.stateManager.end()
                
                await this.generateOverallAnalysis()
                
                if (onComplete) {
                    onComplete(this.analysisData, summary)
                }
            },
            onChapterError: (chapter, error) => {
                if (onError) {
                    onError(chapter, error)
                }
            }
        })
        
        await this.queue.process((chapter) => this.analyzer.analyze(chapter))
    }
    
    pauseAnalysis() {
        this.queue.pause()
        this.analysisData.status = 'paused'
    }
    
    resumeAnalysis() {
        this.queue.resume((chapter) => this.analyzer.analyze(chapter))
        this.analysisData.status = 'analyzing'
    }
    
    cancelAnalysis() {
        this.queue.cancel()
        this.analysisData.status = 'cancelled'
    }
    
    async generateOverallAnalysis() {
        const chapterAnalyses = this.storage.getAllChapterAnalysis()
        
        this.analysisData.overallAnalysis = await this.overallAnalyzer.analyze(
            this.analysisData.chapters,
            chapterAnalyses,
            this.analysisData.analysisType
        )
        
        this.storage.saveOverallAnalysis(this.analysisData.overallAnalysis)
        
        return this.analysisData.overallAnalysis
    }
    
    getAnalysisData() {
        return this.analysisData
    }
    
    getChapterAnalysis(chapterNum) {
        return this.storage.getChapterAnalysis(chapterNum)
    }
    
    getAllChapterAnalyses() {
        return this.storage.getAllChapterAnalysis()
    }
    
    getOverallAnalysis() {
        return this.storage.getOverallAnalysis()
    }
    
    getProgress() {
        const completed = this.analysisData.chapters.filter(c => c.analysisStatus === AnalysisStatus.COMPLETED).length
        const total = this.analysisData.totalChapters
        
        return {
            completed,
            total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            status: this.analysisData.status,
            state: this.stateManager.getState()
        }
    }
    
    getStats() {
        return this.stateManager.getSummary()
    }
    
    exportAnalysis() {
        return {
            exportType: 'full_analysis',
            exportVersion: '2.0',
            exportedAt: new Date().toISOString(),
            novelInfo: {
                id: this.analysisData.novelId,
                title: this.analysisData.novelTitle,
                totalChapters: this.analysisData.totalChapters,
                totalWords: this.analysisData.totalWords
            },
            chapterAnalyses: this.storage.getAllChapterAnalysis(),
            overallAnalysis: this.analysisData.overallAnalysis
        }
    }
    
    loadFromStorage() {
        const chapterAnalyses = this.storage.getAllChapterAnalysis()
        const overallAnalysis = this.storage.getOverallAnalysis()
        
        if (Object.keys(chapterAnalyses).length > 0) {
            this.analysisData.chapterAnalyses = chapterAnalyses
            this.analysisData.overallAnalysis = overallAnalysis
            return true
        }
        
        return false
    }
    
    clearAnalysis() {
        this.storage.clearAll()
        this.analysisData = {
            novelId: null,
            novelTitle: '',
            totalChapters: 0,
            totalWords: 0,
            chapters: [],
            chapterAnalyses: {},
            overallAnalysis: null,
            analysisType: 'plot',
            status: 'idle',
            startTime: null,
            endTime: null
        }
        this.stateManager.reset()
    }
    
    isAnalyzing() {
        return this.analysisData.status === 'analyzing'
    }
    
    isPaused() {
        return this.analysisData.status === 'paused'
    }
    
    isComplete() {
        return this.analysisData.status === 'completed'
    }
}
