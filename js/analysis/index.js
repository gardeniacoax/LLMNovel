import { ChapterSplitter, ChapterSplitterUI } from './chapter-splitter.js'
import { RealTimeAnalyzer, AnalysisProgressTracker, PROGRESS_STORAGE_KEY } from './realtime-analyzer.js'
import { 
    AnalysisSummaryGenerator, 
    AnalysisResultManager,
    RoleCardFormatter,
    PlotAnalysisFormatter
} from './analysis-summary.js'
import { AnalysisProgressUI, AnalysisResultUI } from './analysis-ui.js'
import { AnalysisStatus, AnalysisStateManager } from './analysisStatus.js'
import { ChapterAnalyzer } from './chapterAnalyzer.js'
import { AnalysisQueue } from './analysisQueue.js'
import { AnalysisFlow } from './analysisFlow.js'
import { OverallAnalyzer } from './overallAnalyzer.js'
import { AnalysisStorage, analysisStorage } from './analysisStorage.js'
import { TextAnalysis } from './textAnalysis.js'
import { PlotAnalyzer } from './plotAnalyzer.js'
import { CharacterAnalyzer } from './characterAnalyzer.js'
import { StyleAnalyzer } from './styleAnalyzer.js'

class NovelAnalyzer {
    constructor(options = {}) {
        this.workspaceId = options.workspaceId || null
        this.apiClient = options.apiClient || null
        this.novelName = options.novelName || '未知小说'
        
        this.splitter = new ChapterSplitter()
        this.realTimeAnalyzer = new RealTimeAnalyzer({
            workspaceId: this.workspaceId,
            apiClient: this.apiClient
        })
        this.summaryGenerator = new AnalysisSummaryGenerator({
            novelName: this.novelName,
            apiClient: this.apiClient
        })
        
        this.chapters = []
        this.analysisResults = null
    }
    
    setApiClient(client) {
        this.apiClient = client
        this.realTimeAnalyzer.setApiClient(client)
        this.summaryGenerator.setApiClient(client)
    }
    
    setWorkspaceId(id) {
        this.workspaceId = id
        this.realTimeAnalyzer.workspaceId = id
    }
    
    setNovelName(name) {
        this.novelName = name
        this.summaryGenerator.novelName = name
    }
    
    importContent(content, patternType = 'standard', customPattern = null) {
        this.chapters = this.splitter.split(content, patternType, customPattern)
        this.realTimeAnalyzer.setChapters(this.chapters)
        this.summaryGenerator.setChapters(this.chapters)
        
        return {
            chapters: this.chapters,
            stats: this.splitter.getSplitStats(this.chapters)
        }
    }
    
    previewSplit(content, patternType = 'standard', customPattern = null) {
        return this.splitter.previewSplit(content, patternType, customPattern)
    }
    
    detectPatternType(content) {
        return this.splitter.detectPatternType(content)
    }
    
    async startChapterAnalysis(callbacks = {}) {
        if (callbacks.onProgress) this.realTimeAnalyzer.onProgress = callbacks.onProgress
        if (callbacks.onChapterStart) this.realTimeAnalyzer.onChapterStart = callbacks.onChapterStart
        if (callbacks.onChapterComplete) this.realTimeAnalyzer.onChapterComplete = callbacks.onChapterComplete
        if (callbacks.onChapterError) this.realTimeAnalyzer.onChapterError = callbacks.onChapterError
        if (callbacks.onAllComplete) this.realTimeAnalyzer.onAllComplete = callbacks.onAllComplete
        if (callbacks.onStatusChange) this.realTimeAnalyzer.onStatusChange = callbacks.onStatusChange
        
        await this.realTimeAnalyzer.start()
    }
    
    pauseAnalysis() {
        this.realTimeAnalyzer.pause()
    }
    
    resumeAnalysis() {
        this.realTimeAnalyzer.resume()
    }
    
    stopAnalysis() {
        this.realTimeAnalyzer.stop()
    }
    
    hasAnalysisProgress() {
        return this.realTimeAnalyzer.hasProgress()
    }
    
    loadAnalysisProgress() {
        return this.realTimeAnalyzer.loadProgress()
    }
    
    getAnalysisStats() {
        return this.realTimeAnalyzer.getStats()
    }
    
    async generateSummary(callbacks = {}) {
        if (callbacks.onProgress) this.summaryGenerator.onProgress = callbacks.onProgress
        if (callbacks.onComplete) this.summaryGenerator.onComplete = callbacks.onComplete
        if (callbacks.onError) this.summaryGenerator.onError = callbacks.onError
        
        this.analysisResults = await this.summaryGenerator.generateAll()
        return this.analysisResults
    }
    
    saveResults() {
        if (this.workspaceId && this.analysisResults) {
            AnalysisResultManager.saveResults(this.workspaceId, this.analysisResults)
        }
    }
    
    loadResults() {
        if (this.workspaceId) {
            this.analysisResults = AnalysisResultManager.loadResults(this.workspaceId)
            return this.analysisResults
        }
        return null
    }
    
    hasResults() {
        if (this.workspaceId) {
            return AnalysisResultManager.hasResults(this.workspaceId)
        }
        return false
    }
    
    exportResults(filename) {
        if (this.workspaceId) {
            return AnalysisResultManager.exportToFile(this.workspaceId, filename)
        }
        return false
    }
    
    async importResultsFromFile(file) {
        const results = await AnalysisResultManager.importFromFile(file)
        this.analysisResults = results
        return results
    }
    
    getChapters() {
        return this.chapters
    }
    
    getResults() {
        return this.analysisResults
    }
    
    getRoleCardPrompt() {
        if (!this.analysisResults || !this.analysisResults.roleCard) return ''
        return RoleCardFormatter.toPrompt(this.analysisResults.roleCard)
    }
    
    getPlotAnalysisPrompt() {
        if (!this.analysisResults || !this.analysisResults.plotAnalysis) return ''
        return PlotAnalysisFormatter.toPrompt(this.analysisResults.plotAnalysis)
    }
    
    getStyleCard() {
        if (!this.analysisResults) return null
        return this.analysisResults.styleCard
    }
    
    mergeChapters(startIndex, endIndex) {
        this.chapters = this.splitter.mergeChapters(this.chapters, startIndex, endIndex)
        this.realTimeAnalyzer.setChapters(this.chapters)
        this.summaryGenerator.setChapters(this.chapters)
        return this.chapters
    }
    
    splitChapter(chapterIndex, splitPosition) {
        this.chapters = this.splitter.splitChapter(this.chapters, chapterIndex, splitPosition)
        this.realTimeAnalyzer.setChapters(this.chapters)
        this.summaryGenerator.setChapters(this.chapters)
        return this.chapters
    }
    
    validateChapters(minWords = 100, maxWords = 50000) {
        return this.splitter.validateChapters(this.chapters, minWords, maxWords)
    }
    
    retryChapter(chapterNum) {
        this.realTimeAnalyzer.retryChapter(chapterNum)
    }
    
    retryAllErrors() {
        this.realTimeAnalyzer.retryAllErrors()
    }
}

export {
    NovelAnalyzer,
    ChapterSplitter,
    ChapterSplitterUI,
    RealTimeAnalyzer,
    AnalysisProgressTracker,
    AnalysisSummaryGenerator,
    AnalysisResultManager,
    RoleCardFormatter,
    PlotAnalysisFormatter,
    AnalysisProgressUI,
    AnalysisResultUI,
    PROGRESS_STORAGE_KEY,
    AnalysisStatus,
    AnalysisStateManager,
    ChapterAnalyzer,
    AnalysisQueue,
    AnalysisFlow,
    OverallAnalyzer,
    AnalysisStorage,
    analysisStorage,
    TextAnalysis,
    PlotAnalyzer,
    CharacterAnalyzer,
    StyleAnalyzer
}
