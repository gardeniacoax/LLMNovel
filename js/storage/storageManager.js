const StorageKeys = {
    CHAPTER_ANALYSIS: 'llmnovel_chapter_analysis',
    OVERALL_ANALYSIS: 'llmnovel_overall_analysis',
    ANALYSIS_PROGRESS: 'llmnovel_analysis_progress',
    ANALYSIS_SETTINGS: 'llmnovel_analysis_settings',
    REWRITE_DATA: 'llmnovel_rewrite_data',
    CONTINUATION_DATA: 'llmnovel_continuation_data',
    WORKSPACE_DATA: 'llmnovel_workspace',
    USER_PREFERENCES: 'llmnovel_preferences'
}

const STORAGE_LIMITS = {
    MAX_SIZE: 5 * 1024 * 1024,
    WARNING_THRESHOLD: 0.8,
    CHAPTER_LIMIT: 100
}

export class StorageManager {
    constructor() {
        this.storage = localStorage
        this.sessionCache = new Map()
    }
    
    set(key, subKey, value) {
        const fullKey = this.getFullKey(key, subKey)
        
        try {
            const serialized = JSON.stringify(value)
            this.checkStorageSize(serialized.length)
            
            this.storage.setItem(fullKey, serialized)
            this.sessionCache.set(fullKey, value)
            
            return true
        } catch (error) {
            console.error('存储失败:', error)
            this.handleStorageError(error)
            return false
        }
    }
    
    get(key, subKey = null) {
        const fullKey = this.getFullKey(key, subKey)
        
        if (this.sessionCache.has(fullKey)) {
            return this.sessionCache.get(fullKey)
        }
        
        try {
            const data = this.storage.getItem(fullKey)
            if (data) {
                const parsed = JSON.parse(data)
                this.sessionCache.set(fullKey, parsed)
                return parsed
            }
            return null
        } catch (error) {
            console.error('读取失败:', error)
            return null
        }
    }
    
    remove(key, subKey = null) {
        const fullKey = this.getFullKey(key, subKey)
        
        this.storage.removeItem(fullKey)
        this.sessionCache.delete(fullKey)
    }
    
    getFullKey(key, subKey) {
        if (subKey !== null) {
            return `${key}_${subKey}`
        }
        return key
    }
    
    checkStorageSize(additionalSize) {
        const currentSize = this.getCurrentSize()
        const newSize = currentSize + additionalSize
        
        if (newSize > STORAGE_LIMITS.MAX_SIZE * STORAGE_LIMITS.WARNING_THRESHOLD) {
            console.warn('存储空间即将满载，建议清理')
        }
        
        if (newSize > STORAGE_LIMITS.MAX_SIZE) {
            throw new Error('存储空间不足')
        }
    }
    
    getCurrentSize() {
        let total = 0
        
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i)
            if (key && key.startsWith('llmnovel_')) {
                const value = this.storage.getItem(key)
                total += value ? value.length * 2 : 0
            }
        }
        
        return total
    }
    
    getStorageInfo() {
        const size = this.getCurrentSize()
        const keys = this.getStorageKeys()
        
        return {
            totalBytes: size,
            totalKB: (size / 1024).toFixed(2),
            totalMB: (size / 1024 / 1024).toFixed(2),
            percentUsed: ((size / STORAGE_LIMITS.MAX_SIZE) * 100).toFixed(1),
            keyCount: keys.length,
            keys: keys
        }
    }
    
    getStorageKeys() {
        const keys = []
        
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i)
            if (key && key.startsWith('llmnovel_')) {
                keys.push(key)
            }
        }
        
        return keys
    }
    
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            this.cleanupOldData()
        }
    }
    
    cleanupOldData() {
        const progress = this.get(StorageKeys.ANALYSIS_PROGRESS)
        
        if (progress && progress.savedAt) {
            const savedDate = new Date(progress.savedAt)
            const daysSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24)
            
            if (daysSince > 7) {
                this.remove(StorageKeys.ANALYSIS_PROGRESS)
            }
        }
        
        const chapterAnalysis = this.get(StorageKeys.CHAPTER_ANALYSIS)
        if (chapterAnalysis) {
            const chapters = Object.keys(chapterAnalysis)
            if (chapters.length > STORAGE_LIMITS.CHAPTER_LIMIT) {
                const sortedChapters = chapters.sort((a, b) => {
                    const aTime = chapterAnalysis[a].savedAt ? new Date(chapterAnalysis[a].savedAt).getTime() : 0
                    const bTime = chapterAnalysis[b].savedAt ? new Date(chapterAnalysis[b].savedAt).getTime() : 0
                    return aTime - bTime
                })
                
                const toRemove = sortedChapters.slice(0, chapters.length - STORAGE_LIMITS.CHAPTER_LIMIT)
                toRemove.forEach(chapterNum => {
                    delete chapterAnalysis[chapterNum]
                })
                
                this.storage.setItem(StorageKeys.CHAPTER_ANALYSIS, JSON.stringify(chapterAnalysis))
            }
        }
    }
    
    clearAll() {
        const keys = this.getStorageKeys()
        keys.forEach(key => {
            this.storage.removeItem(key)
        })
        this.sessionCache.clear()
    }
    
    clearCache() {
        this.sessionCache.clear()
    }
    
    exportAll() {
        const data = {}
        const keys = this.getStorageKeys()
        
        keys.forEach(key => {
            data[key] = this.storage.getItem(key)
        })
        
        return data
    }
    
    importAll(data) {
        Object.entries(data).forEach(([key, value]) => {
            if (key.startsWith('llmnovel_')) {
                this.storage.setItem(key, value)
            }
        })
        
        this.clearCache()
    }
    
    saveChapterAnalysis(chapterNum, analysisData) {
        const allAnalyses = this.get(StorageKeys.CHAPTER_ANALYSIS) || {}
        allAnalyses[chapterNum] = {
            ...analysisData,
            savedAt: new Date().toISOString()
        }
        return this.set(StorageKeys.CHAPTER_ANALYSIS, null, allAnalyses)
    }
    
    getChapterAnalysis(chapterNum) {
        const allAnalyses = this.get(StorageKeys.CHAPTER_ANALYSIS) || {}
        return allAnalyses[chapterNum] || null
    }
    
    getAllChapterAnalyses() {
        return this.get(StorageKeys.CHAPTER_ANALYSIS) || {}
    }
    
    deleteChapterAnalysis(chapterNum) {
        const allAnalyses = this.get(StorageKeys.CHAPTER_ANALYSIS) || {}
        delete allAnalyses[chapterNum]
        return this.set(StorageKeys.CHAPTER_ANALYSIS, null, allAnalyses)
    }
    
    saveOverallAnalysis(analysisData) {
        return this.set(StorageKeys.OVERALL_ANALYSIS, null, {
            ...analysisData,
            savedAt: new Date().toISOString()
        })
    }
    
    getOverallAnalysis() {
        return this.get(StorageKeys.OVERALL_ANALYSIS)
    }
    
    saveAnalysisProgress(progress) {
        return this.set(StorageKeys.ANALYSIS_PROGRESS, null, {
            ...progress,
            savedAt: new Date().toISOString()
        })
    }
    
    getAnalysisProgress() {
        return this.get(StorageKeys.ANALYSIS_PROGRESS)
    }
    
    saveAnalysisSettings(settings) {
        return this.set(StorageKeys.ANALYSIS_SETTINGS, null, settings)
    }
    
    getAnalysisSettings() {
        return this.get(StorageKeys.ANALYSIS_SETTINGS) || {
            analysisType: 'plot',
            autoSave: true,
            showProgress: true
        }
    }
    
    getChapterAnalysisCount() {
        const allAnalyses = this.getAllChapterAnalyses()
        return Object.keys(allAnalyses).length
    }
    
    hasChapterAnalysis(chapterNum) {
        const allAnalyses = this.getAllChapterAnalyses()
        return !!allAnalyses[chapterNum]
    }
    
    getStorageStats() {
        const info = this.getStorageInfo()
        const chapterCount = this.getChapterAnalysisCount()
        const hasOverall = !!this.getOverallAnalysis()
        
        return {
            ...info,
            chapterAnalysisCount: chapterCount,
            hasOverallAnalysis: hasOverall
        }
    }
}

export const storageManager = new StorageManager()
export { StorageKeys, STORAGE_LIMITS }
