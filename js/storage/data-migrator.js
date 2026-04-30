import { unifiedDataManager } from './unified-data-manager.js'

class DataMigrator {
    constructor() {
        this.migrationVersion = 1
        this.migrationKey = 'novel_migration_version'
    }
    
    async checkAndMigrate() {
        const currentVersion = this.getCurrentVersion()
        
        if (currentVersion < this.migrationVersion) {
            console.log('开始数据迁移，当前版本:', currentVersion, '目标版本:', this.migrationVersion)
            
            for (let v = currentVersion + 1; v <= this.migrationVersion; v++) {
                await this.runMigration(v)
            }
            
            this.setCurrentVersion(this.migrationVersion)
            console.log('数据迁移完成')
        }
    }
    
    getCurrentVersion() {
        const version = localStorage.getItem(this.migrationKey)
        return version ? parseInt(version) : 0
    }
    
    setCurrentVersion(version) {
        localStorage.setItem(this.migrationKey, version.toString())
    }
    
    async runMigration(version) {
        switch (version) {
            case 1:
                await this.migrationV1()
                break
            default:
                console.warn('未知的迁移版本:', version)
        }
    }
    
    async migrationV1() {
        console.log('执行迁移 V1: 从 localStorage 迁移章节数据到 IndexedDB')
        
        const workspaceKeys = Object.keys(localStorage).filter(k => 
            k.startsWith('novel_ws_') && !k.includes('_meta') && !k.includes('_roles')
        )
        
        for (const key of workspaceKeys) {
            try {
                const data = JSON.parse(localStorage.getItem(key))
                
                if (data && data.originalFile && data.originalFile.chapters) {
                    const workspaceId = data.workspaceId || key.replace('novel_ws_', '')
                    
                    for (const chapter of data.originalFile.chapters) {
                        await unifiedDataManager.saveChapter(workspaceId, chapter.chapterNum, {
                            title: chapter.title,
                            originalContent: chapter.content,
                            originalWordCount: chapter.wordCount,
                            startIndex: chapter.startLine,
                            endIndex: chapter.endLine
                        })
                    }
                    
                    if (data.analysis) {
                        await unifiedDataManager.saveAnalysis(workspaceId, data.analysis)
                    }
                    
                    console.log(`迁移工作台 ${workspaceId} 数据完成`)
                }
            } catch (error) {
                console.error(`迁移 ${key} 失败:`, error)
            }
        }
        
        const continueDraft = localStorage.getItem('novel_continue_draft')
        if (continueDraft) {
            try {
                const draft = JSON.parse(continueDraft)
                if (draft.workspaceId) {
                    await unifiedDataManager.saveAnalysis(draft.workspaceId, {
                        continueDraft: draft
                    })
                }
            } catch (error) {
                console.error('迁移续写草稿失败:', error)
            }
        }
        
        const rewriteDraft = localStorage.getItem('novel_rewrite_draft')
        if (rewriteDraft) {
            try {
                const draft = JSON.parse(rewriteDraft)
                if (draft.workspaceId) {
                    await unifiedDataManager.saveAnalysis(draft.workspaceId, {
                        rewriteDraft: draft
                    })
                }
            } catch (error) {
                console.error('迁移改写草稿失败:', error)
            }
        }
    }
    
    async exportAllData() {
        await unifiedDataManager.init()
        
        const workspaceIndex = localStorage.getItem('novel_workspace_index')
        const workspaces = workspaceIndex ? JSON.parse(workspaceIndex) : { workspaces: [] }
        
        const exportData = {
            version: this.migrationVersion,
            exportedAt: Date.now(),
            workspaces: [],
            globalConfig: localStorage.getItem('novel_global_config')
        }
        
        for (const ws of workspaces.workspaces || []) {
            const chapters = await unifiedDataManager.getAllChapters(ws.id)
            const analysis = await unifiedDataManager.getAnalysis(ws.id)
            const meta = localStorage.getItem(`novel_ws_${ws.id}_meta`)
            const roles = localStorage.getItem(`novel_ws_${ws.id}_roles`)
            
            exportData.workspaces.push({
                info: ws,
                meta: meta ? JSON.parse(meta) : null,
                roles: roles ? JSON.parse(roles) : null,
                chapters,
                analysis
            })
        }
        
        return exportData
    }
    
    async importAllData(exportData) {
        await unifiedDataManager.init()
        
        if (!exportData.version || !exportData.workspaces) {
            throw new Error('无效的导出数据格式')
        }
        
        const existingIndex = localStorage.getItem('novel_workspace_index')
        const existing = existingIndex ? JSON.parse(existingIndex) : { workspaces: [] }
        
        for (const wsData of exportData.workspaces) {
            const existingWs = existing.workspaces.find(w => w.id === wsData.info.id)
            if (!existingWs) {
                existing.workspaces.push(wsData.info)
            }
            
            if (wsData.meta) {
                localStorage.setItem(`novel_ws_${wsData.info.id}_meta`, JSON.stringify(wsData.meta))
            }
            
            if (wsData.roles) {
                localStorage.setItem(`novel_ws_${wsData.info.id}_roles`, JSON.stringify(wsData.roles))
            }
            
            if (wsData.chapters) {
                for (const chapter of wsData.chapters) {
                    await unifiedDataManager.saveChapter(wsData.info.id, chapter.chapterNum, chapter)
                }
            }
            
            if (wsData.analysis) {
                await unifiedDataManager.saveAnalysis(wsData.info.id, wsData.analysis)
            }
        }
        
        localStorage.setItem('novel_workspace_index', JSON.stringify(existing))
        
        if (exportData.globalConfig) {
            localStorage.setItem('novel_global_config', exportData.globalConfig)
        }
        
        return true
    }
    
    async downloadExport() {
        const data = await this.exportAllData()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `novel_backup_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        
        URL.revokeObjectURL(url)
    }
    
    async uploadImport(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result)
                    await this.importAllData(data)
                    resolve(true)
                } catch (error) {
                    reject(error)
                }
            }
            
            reader.onerror = () => reject(new Error('文件读取失败'))
            reader.readAsText(file)
        })
    }
}

const dataMigrator = new DataMigrator()

export { DataMigrator, dataMigrator }
