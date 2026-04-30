import { IndexedDBManager, indexedDBManager } from './indexeddb-manager.js'
import { AutoSaveManager } from './auto-save-manager.js'

class UnifiedDataManager {
    constructor() {
        this.indexedDB = indexedDBManager
        this.autoSave = null
        this.cache = new Map()
        this.cacheMaxSize = 50
        this.isInitialized = false
    }
    
    async init() {
        if (this.isInitialized) return
        
        await this.indexedDB.init()
        
        this.autoSave = new AutoSaveManager(this)
        this.autoSave.start()
        
        await this.autoSave.recoverDirtyData()
        
        this.isInitialized = true
        console.log('统一数据管理器初始化完成')
    }
    
    async saveChapter(workspaceId, chapterNum, data) {
        await this.ensureInit()
        
        await this.indexedDB.saveChapter(workspaceId, chapterNum, data)
        
        const cacheKey = `${workspaceId}_${chapterNum}`
        this.updateCache(cacheKey, data)
        
        return data
    }
    
    async getChapter(workspaceId, chapterNum, useCache = true) {
        await this.ensureInit()
        
        const cacheKey = `${workspaceId}_${chapterNum}`
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }
        
        const data = await this.indexedDB.getChapter(workspaceId, chapterNum)
        
        if (data) {
            this.updateCache(cacheKey, data)
        }
        
        return data
    }
    
    async getAllChapters(workspaceId, useCache = true) {
        await this.ensureInit()
        
        const cacheKey = `all_${workspaceId}`
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }
        
        const chapters = await this.indexedDB.getAllChapters(workspaceId)
        
        this.updateCache(cacheKey, chapters)
        
        return chapters
    }
    
    async deleteChapter(workspaceId, chapterNum) {
        await this.ensureInit()
        
        await this.indexedDB.deleteChapter(workspaceId, chapterNum)
        
        const cacheKey = `${workspaceId}_${chapterNum}`
        this.cache.delete(cacheKey)
        
        this.cache.delete(`all_${workspaceId}`)
        
        return true
    }
    
    async saveAnalysis(workspaceId, analysisData) {
        await this.ensureInit()
        
        await this.indexedDB.saveAnalysis(workspaceId, analysisData)
        
        const cacheKey = `analysis_${workspaceId}`
        this.updateCache(cacheKey, analysisData)
        
        return analysisData
    }
    
    async getAnalysis(workspaceId, useCache = true) {
        await this.ensureInit()
        
        const cacheKey = `analysis_${workspaceId}`
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }
        
        const data = await this.indexedDB.getAnalysis(workspaceId)
        
        if (data) {
            this.updateCache(cacheKey, data)
        }
        
        return data
    }
    
    async deleteAnalysis(workspaceId) {
        await this.ensureInit()
        
        await this.indexedDB.deleteAnalysis(workspaceId)
        
        this.cache.delete(`analysis_${workspaceId}`)
        
        return true
    }
    
    async saveRewrite(workspaceId, chapterNum, data) {
        await this.ensureInit()
        
        await this.indexedDB.saveRewrite(workspaceId, chapterNum, data)
        
        const cacheKey = `rewrite_${workspaceId}_${chapterNum}`
        this.updateCache(cacheKey, data)
        
        return data
    }
    
    async getRewrite(workspaceId, chapterNum, useCache = true) {
        await this.ensureInit()
        
        const cacheKey = `rewrite_${workspaceId}_${chapterNum}`
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }
        
        const data = await this.indexedDB.getRewrite(workspaceId, chapterNum)
        
        if (data) {
            this.updateCache(cacheKey, data)
        }
        
        return data
    }
    
    async getAllRewrites(workspaceId, useCache = true) {
        await this.ensureInit()
        
        const cacheKey = `all_rewrites_${workspaceId}`
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }
        
        const rewrites = await this.indexedDB.getAllRewrites(workspaceId)
        
        this.updateCache(cacheKey, rewrites)
        
        return rewrites
    }
    
    async deleteRewrite(workspaceId, chapterNum) {
        await this.ensureInit()
        
        await this.indexedDB.deleteRewrite(workspaceId, chapterNum)
        
        const cacheKey = `rewrite_${workspaceId}_${chapterNum}`
        this.cache.delete(cacheKey)
        
        this.cache.delete(`all_rewrites_${workspaceId}`)
        
        return true
    }
    
    async saveContinue(workspaceId, chapterNum, data) {
        await this.ensureInit()
        
        await this.indexedDB.saveContinue(workspaceId, chapterNum, data)
        
        const cacheKey = `continue_${workspaceId}_${chapterNum}`
        this.updateCache(cacheKey, data)
        
        return data
    }
    
    async getContinue(workspaceId, chapterNum, useCache = true) {
        await this.ensureInit()
        
        const cacheKey = `continue_${workspaceId}_${chapterNum}`
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }
        
        const data = await this.indexedDB.getContinue(workspaceId, chapterNum)
        
        if (data) {
            this.updateCache(cacheKey, data)
        }
        
        return data
    }
    
    async getAllContinues(workspaceId, useCache = true) {
        await this.ensureInit()
        
        const cacheKey = `all_continues_${workspaceId}`
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }
        
        const continues = await this.indexedDB.getAllContinues(workspaceId)
        
        this.updateCache(cacheKey, continues)
        
        return continues
    }
    
    async deleteContinue(workspaceId, chapterNum) {
        await this.ensureInit()
        
        await this.indexedDB.deleteContinue(workspaceId, chapterNum)
        
        const cacheKey = `continue_${workspaceId}_${chapterNum}`
        this.cache.delete(cacheKey)
        
        this.cache.delete(`all_continues_${workspaceId}`)
        
        return true
    }
    
    async createBackup(workspaceId, description = '') {
        await this.ensureInit()
        
        const chapters = await this.getAllChapters(workspaceId)
        const analysis = await this.getAnalysis(workspaceId)
        const rewrites = await this.getAllRewrites(workspaceId)
        const continues = await this.getAllContinues(workspaceId)
        
        const backupData = {
            chapters,
            analysis,
            rewrites,
            continues,
            timestamp: Date.now()
        }
        
        return await this.indexedDB.createBackup(workspaceId, backupData, description)
    }
    
    async getBackups(workspaceId) {
        await this.ensureInit()
        return await this.indexedDB.getBackups(workspaceId)
    }
    
    async getBackup(backupId) {
        await this.ensureInit()
        return await this.indexedDB.getBackup(backupId)
    }
    
    async restoreBackup(backupId) {
        await this.ensureInit()
        
        const backup = await this.getBackup(backupId)
        if (!backup) {
            throw new Error('备份不存在')
        }
        
        const { workspaceId, data } = backup
        
        if (data.chapters) {
            for (const chapter of data.chapters) {
                await this.saveChapter(workspaceId, chapter.chapterNum, chapter)
            }
        }
        
        if (data.analysis) {
            await this.saveAnalysis(workspaceId, data.analysis)
        }
        
        if (data.rewrites) {
            for (const rewrite of data.rewrites) {
                await this.saveRewrite(workspaceId, rewrite.chapterNum, rewrite)
            }
        }
        
        if (data.continues) {
            for (const cont of data.continues) {
                await this.saveContinue(workspaceId, cont.chapterNum, cont)
            }
        }
        
        return true
    }
    
    async deleteBackup(backupId) {
        await this.ensureInit()
        return await this.indexedDB.deleteBackup(backupId)
    }
    
    async deleteWorkspace(workspaceId) {
        await this.ensureInit()
        
        await this.indexedDB.deleteWorkspace(workspaceId)
        
        for (const key of this.cache.keys()) {
            if (key.includes(workspaceId)) {
                this.cache.delete(key)
            }
        }
        
        return true
    }
    
    markChapterDirty(workspaceId, chapterNum, data) {
        if (this.autoSave) {
            this.autoSave.markChapterDirty(workspaceId, chapterNum, data)
        }
    }
    
    markAnalysisDirty(workspaceId, data) {
        if (this.autoSave) {
            this.autoSave.markAnalysisDirty(workspaceId, data)
        }
    }
    
    async forceSave() {
        if (this.autoSave) {
            return await this.autoSave.forceSave()
        }
        return { success: 0, failed: 0, errors: [] }
    }
    
    getAutoSaveStatus() {
        if (this.autoSave) {
            return this.autoSave.getStatus()
        }
        return null
    }
    
    updateCache(key, data) {
        if (this.cache.size >= this.cacheMaxSize) {
            const firstKey = this.cache.keys().next().value
            this.cache.delete(firstKey)
        }
        this.cache.set(key, data)
    }
    
    clearCache() {
        this.cache.clear()
    }
    
    async ensureInit() {
        if (!this.isInitialized) {
            await this.init()
        }
    }
    
    async getStorageStats() {
        await this.ensureInit()
        return await this.indexedDB.getStorageStats()
    }
    
    async clearAll() {
        await this.ensureInit()
        await this.indexedDB.clearAll()
        this.clearCache()
        return true
    }
}

const unifiedDataManager = new UnifiedDataManager()

export { UnifiedDataManager, unifiedDataManager }
