import { WorkspaceManager } from '../workspace.js'

const StorageKeys = {
    CHAPTER_ANALYSIS: 'chapterAnalysis',
    OVERALL_ANALYSIS: 'overallAnalysis',
    ANALYSIS_PROGRESS: 'analysisProgress',
    ANALYSIS_SETTINGS: 'analysisSettings'
}

export class AnalysisStorage {
    constructor() {
        this.storageKey = 'analysis'
    }
    
    saveChapterAnalysis(chapterNum, data) {
        const all = this.getAllChapterAnalysis()
        all[chapterNum] = {
            ...data,
            savedAt: new Date().toISOString()
        }
        WorkspaceManager.setWorkspaceData(StorageKeys.CHAPTER_ANALYSIS, all)
    }
    
    getChapterAnalysis(chapterNum) {
        const all = this.getAllChapterAnalysis()
        return all[chapterNum] || null
    }
    
    getAllChapterAnalysis() {
        const data = WorkspaceManager.getWorkspaceData(StorageKeys.CHAPTER_ANALYSIS)
        return data || {}
    }
    
    deleteChapterAnalysis(chapterNum) {
        const all = this.getAllChapterAnalysis()
        delete all[chapterNum]
        WorkspaceManager.setWorkspaceData(StorageKeys.CHAPTER_ANALYSIS, all)
    }
    
    saveOverallAnalysis(data) {
        WorkspaceManager.setWorkspaceData(StorageKeys.OVERALL_ANALYSIS, {
            ...data,
            savedAt: new Date().toISOString()
        })
    }
    
    getOverallAnalysis() {
        return WorkspaceManager.getWorkspaceData(StorageKeys.OVERALL_ANALYSIS) || null
    }
    
    deleteOverallAnalysis() {
        WorkspaceManager.setWorkspaceData(StorageKeys.OVERALL_ANALYSIS, null)
    }
    
    saveProgress(progress) {
        WorkspaceManager.setWorkspaceData(StorageKeys.ANALYSIS_PROGRESS, {
            ...progress,
            savedAt: new Date().toISOString()
        })
    }
    
    getProgress() {
        return WorkspaceManager.getWorkspaceData(StorageKeys.ANALYSIS_PROGRESS) || null
    }
    
    clearProgress() {
        WorkspaceManager.setWorkspaceData(StorageKeys.ANALYSIS_PROGRESS, null)
    }
    
    saveSettings(settings) {
        WorkspaceManager.setWorkspaceData(StorageKeys.ANALYSIS_SETTINGS, settings)
    }
    
    getSettings() {
        const defaultSettings = {
            analysisType: 'plot',
            autoSave: true,
            showProgress: true,
            maxRetries: 3
        }
        const saved = WorkspaceManager.getWorkspaceData(StorageKeys.ANALYSIS_SETTINGS)
        return saved ? { ...defaultSettings, ...saved } : defaultSettings
    }
    
    clearAll() {
        WorkspaceManager.setWorkspaceData(StorageKeys.CHAPTER_ANALYSIS, {})
        WorkspaceManager.setWorkspaceData(StorageKeys.OVERALL_ANALYSIS, null)
        WorkspaceManager.setWorkspaceData(StorageKeys.ANALYSIS_PROGRESS, null)
    }
    
    exportAll() {
        return {
            chapterAnalyses: this.getAllChapterAnalysis(),
            overallAnalysis: this.getOverallAnalysis(),
            progress: this.getProgress(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        }
    }
    
    importAll(data) {
        if (data.chapterAnalyses) {
            WorkspaceManager.setWorkspaceData(StorageKeys.CHAPTER_ANALYSIS, data.chapterAnalyses)
        }
        if (data.overallAnalysis) {
            WorkspaceManager.setWorkspaceData(StorageKeys.OVERALL_ANALYSIS, data.overallAnalysis)
        }
        if (data.progress) {
            WorkspaceManager.setWorkspaceData(StorageKeys.ANALYSIS_PROGRESS, data.progress)
        }
        if (data.settings) {
            WorkspaceManager.setWorkspaceData(StorageKeys.ANALYSIS_SETTINGS, data.settings)
        }
    }
    
    getStorageSize() {
        const chapterAnalyses = this.getAllChapterAnalysis()
        const overallAnalysis = this.getOverallAnalysis()
        
        let total = 0
        
        const chapterStr = JSON.stringify(chapterAnalyses)
        total += chapterStr.length * 2
        
        if (overallAnalysis) {
            const overallStr = JSON.stringify(overallAnalysis)
            total += overallStr.length * 2
        }
        
        return {
            bytes: total,
            kb: (total / 1024).toFixed(2),
            mb: (total / 1024 / 1024).toFixed(2),
            chapterCount: Object.keys(chapterAnalyses).length
        }
    }
    
    hasChapterAnalysis(chapterNum) {
        const all = this.getAllChapterAnalysis()
        return !!all[chapterNum]
    }
    
    hasOverallAnalysis() {
        return !!this.getOverallAnalysis()
    }
    
    getChapterAnalysisCount() {
        const all = this.getAllChapterAnalysis()
        return Object.keys(all).length
    }
    
    getChapterAnalysisList() {
        const all = this.getAllChapterAnalysis()
        return Object.values(all).sort((a, b) => a.chapterNum - b.chapterNum)
    }
    
    getCompletedChapterNums() {
        const all = this.getAllChapterAnalysis()
        return Object.keys(all).map(Number).sort((a, b) => a - b)
    }
    
    updateChapterAnalysis(chapterNum, updates) {
        const existing = this.getChapterAnalysis(chapterNum)
        if (!existing) return false
        
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
        }
        
        this.saveChapterAnalysis(chapterNum, updated)
        return true
    }
    
    batchSaveChapterAnalyses(analyses) {
        const all = this.getAllChapterAnalysis()
        
        analyses.forEach(analysis => {
            all[analysis.chapterNum] = {
                ...analysis,
                savedAt: new Date().toISOString()
            }
        })
        
        WorkspaceManager.setWorkspaceData(StorageKeys.CHAPTER_ANALYSIS, all)
    }
    
    getAnalysisSummary() {
        const chapterAnalyses = this.getAllChapterAnalysis()
        const overallAnalysis = this.getOverallAnalysis()
        
        return {
            hasChapterAnalyses: Object.keys(chapterAnalyses).length > 0,
            chapterCount: Object.keys(chapterAnalyses).length,
            hasOverallAnalysis: !!overallAnalysis,
            storageSize: this.getStorageSize()
        }
    }
}

export const analysisStorage = new AnalysisStorage()
