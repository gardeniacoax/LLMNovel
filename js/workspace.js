import { unifiedDataManager } from './storage/index.js'

const WORKSPACE_KEYS = {
    GLOBAL_CONFIG: 'novel_global_config',
    WORKSPACE_INDEX: 'novel_workspace_index',
    WORKSPACE_META: 'novel_ws_{id}_meta',
    WORKSPACE_ROLES: 'novel_ws_{id}_roles',
    ACTIVE_WORKSPACE: 'novel_active_workspace'
}

const WORKSPACE_COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EF4444',
    '#EC4899',
    '#06B6D4',
    '#84CC16'
]

const DEFAULT_WORD_COUNT_SETTINGS = {
    rewrite: {
        minRatio: 0.8,
        maxRatio: 1.2,
        absoluteMin: 500,
        absoluteMax: 50000
    },
    continue: {
        minWords: 2000,
        maxWords: 10000,
        targetWords: 5000
    }
}

class WorkspaceDataManager {
    static getDefaultGlobalConfig() {
        return {
            version: '2.0',
            updatedAt: Date.now(),
            globalPrompt: {
                content: '',
                updatedAt: Date.now()
            },
            apiConfig: {
                apiUrl: '',
                modelId: 'deepseek-chat',
                apiKey: '',
                maxTokens: 65536,
                temperature: 0.7
            },
            defaultWordCount: DEFAULT_WORD_COUNT_SETTINGS
        }
    }
    
    static getGlobalConfig() {
        const data = localStorage.getItem(WORKSPACE_KEYS.GLOBAL_CONFIG)
        return data ? JSON.parse(data) : this.getDefaultGlobalConfig()
    }
    
    static setGlobalConfig(config) {
        config.updatedAt = Date.now()
        localStorage.setItem(WORKSPACE_KEYS.GLOBAL_CONFIG, JSON.stringify(config))
    }
    
    static getDefaultWorkspaceIndex() {
        return {
            version: '2.0',
            workspaces: [],
            activeWorkspaceId: null
        }
    }
    
    static getWorkspaceIndex() {
        const data = localStorage.getItem(WORKSPACE_KEYS.WORKSPACE_INDEX)
        return data ? JSON.parse(data) : this.getDefaultWorkspaceIndex()
    }
    
    static setWorkspaceIndex(index) {
        localStorage.setItem(WORKSPACE_KEYS.WORKSPACE_INDEX, JSON.stringify(index))
    }
    
    static getDefaultWorkspaceMeta(workspaceId) {
        return {
            workspaceId,
            file: null,
            analysis: { status: 'pending' },
            rewrite: { status: 'pending', completedChapters: 0 },
            continue: { status: 'pending', generatedChapters: 0 },
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
    }
    
    static getWorkspaceMeta(workspaceId) {
        const key = WORKSPACE_KEYS.WORKSPACE_META.replace('{id}', workspaceId)
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : this.getDefaultWorkspaceMeta(workspaceId)
    }
    
    static setWorkspaceMeta(workspaceId, meta) {
        const key = WORKSPACE_KEYS.WORKSPACE_META.replace('{id}', workspaceId)
        meta.updatedAt = Date.now()
        localStorage.setItem(key, JSON.stringify(meta))
    }
    
    static deleteWorkspaceMeta(workspaceId) {
        const key = WORKSPACE_KEYS.WORKSPACE_META.replace('{id}', workspaceId)
        localStorage.removeItem(key)
    }
    
    static getWorkspaceRoles(workspaceId) {
        const key = WORKSPACE_KEYS.WORKSPACE_ROLES.replace('{id}', workspaceId)
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : []
    }
    
    static setWorkspaceRoles(workspaceId, roles) {
        const key = WORKSPACE_KEYS.WORKSPACE_ROLES.replace('{id}', workspaceId)
        localStorage.setItem(key, JSON.stringify(roles))
    }
    
    static deleteWorkspaceRoles(workspaceId) {
        const key = WORKSPACE_KEYS.WORKSPACE_ROLES.replace('{id}', workspaceId)
        localStorage.removeItem(key)
    }
    
    static getActiveWorkspaceId() {
        const index = this.getWorkspaceIndex()
        return index.activeWorkspaceId
    }
    
    static setActiveWorkspaceId(workspaceId) {
        const index = this.getWorkspaceIndex()
        index.activeWorkspaceId = workspaceId
        this.setWorkspaceIndex(index)
    }
    
    static getActiveWorkspaceMeta() {
        const workspaceId = this.getActiveWorkspaceId()
        if (!workspaceId) return null
        return this.getWorkspaceMeta(workspaceId)
    }
}

class WorkspaceManager {
    static generateWorkspaceId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    static init() {
        let index = WorkspaceDataManager.getWorkspaceIndex()
        
        if (!index || !index.workspaces) {
            index = WorkspaceDataManager.getDefaultWorkspaceIndex()
            WorkspaceDataManager.setWorkspaceIndex(index)
        }
        
        if (index.workspaces.length === 0) {
            this.createWorkspace({
                name: '默认工作台',
                description: '自动创建的默认工作台'
            })
        }
        
        const activeId = WorkspaceDataManager.getActiveWorkspaceId()
        if (!activeId || !this.getWorkspace(activeId)) {
            const workspaces = this.getAllWorkspaces()
            if (workspaces.length > 0) {
                this.switchWorkspace(workspaces[0].id)
            }
        }
        
        return this.getCurrentWorkspace()
    }
    
    static createWorkspace(options = {}) {
        const id = this.generateWorkspaceId()
        const index = WorkspaceDataManager.getWorkspaceIndex()
        
        const workspace = {
            id: id,
            name: options.name || '新工作台',
            description: options.description || '',
            color: options.color || WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'active',
            tags: options.tags || [],
            wordCountSettings: {
                rewrite: { ...DEFAULT_WORD_COUNT_SETTINGS.rewrite, ...(options.wordCountSettings?.rewrite || {}) },
                continue: { ...DEFAULT_WORD_COUNT_SETTINGS.continue, ...(options.wordCountSettings?.continue || {}) }
            },
            stats: {
                totalChapters: 0,
                totalWords: 0,
                lastActivity: Date.now()
            }
        }
        
        index.workspaces.push(workspace)
        index.activeWorkspaceId = workspace.id
        WorkspaceDataManager.setWorkspaceIndex(index)
        
        const meta = WorkspaceDataManager.getDefaultWorkspaceMeta(id)
        meta.name = workspace.name
        WorkspaceDataManager.setWorkspaceMeta(id, meta)
        
        return workspace
    }
    
    static getWorkspace(id) {
        const index = WorkspaceDataManager.getWorkspaceIndex()
        return index.workspaces.find(w => w.id === id) || null
    }
    
    static updateWorkspace(id, data) {
        const index = WorkspaceDataManager.getWorkspaceIndex()
        const workspaceIndex = index.workspaces.findIndex(w => w.id === id)
        
        if (workspaceIndex === -1) return false
        
        const protectedFields = ['id', 'createdAt']
        protectedFields.forEach(field => {
            if (data[field] !== undefined) {
                delete data[field]
            }
        })
        
        index.workspaces[workspaceIndex] = {
            ...index.workspaces[workspaceIndex],
            ...data,
            updatedAt: Date.now()
        }
        
        WorkspaceDataManager.setWorkspaceIndex(index)
        return true
    }
    
    static async deleteWorkspace(id) {
        const index = WorkspaceDataManager.getWorkspaceIndex()
        const filtered = index.workspaces.filter(w => w.id !== id)
        
        if (filtered.length === index.workspaces.length) return false
        
        index.workspaces = filtered
        
        if (index.activeWorkspaceId === id) {
            index.activeWorkspaceId = filtered.length > 0 ? filtered[0].id : null
        }
        
        WorkspaceDataManager.setWorkspaceIndex(index)
        
        WorkspaceDataManager.deleteWorkspaceMeta(id)
        WorkspaceDataManager.deleteWorkspaceRoles(id)
        
        try {
            await unifiedDataManager.deleteWorkspace(id)
        } catch (error) {
            console.error('删除IndexedDB数据失败:', error)
        }
        
        return true
    }
    
    static getAllWorkspaces() {
        const index = WorkspaceDataManager.getWorkspaceIndex()
        return index.workspaces || []
    }
    
    static getActiveWorkspaces() {
        return this.getAllWorkspaces().filter(w => w.status === 'active')
    }
    
    static switchWorkspace(id) {
        const workspace = this.getWorkspace(id)
        if (!workspace) return false
        
        WorkspaceDataManager.setActiveWorkspaceId(id)
        this.updateWorkspace(id, { 
            updatedAt: Date.now(),
            'stats.lastActivity': Date.now()
        })
        
        return true
    }
    
    static getCurrentWorkspace() {
        const activeId = WorkspaceDataManager.getActiveWorkspaceId()
        if (!activeId) return null
        return this.getWorkspace(activeId)
    }
    
    static getCurrentWorkspaceId() {
        return WorkspaceDataManager.getActiveWorkspaceId()
    }
    
    static updateWorkspaceStats(workspaceId, stats) {
        const index = WorkspaceDataManager.getWorkspaceIndex()
        const workspace = index.workspaces.find(w => w.id === workspaceId)
        
        if (workspace) {
            workspace.stats = { ...workspace.stats, ...stats }
            workspace.stats.lastActivity = Date.now()
            workspace.updatedAt = Date.now()
            WorkspaceDataManager.setWorkspaceIndex(index)
        }
    }
    
    static getWordCountSettings(workspaceId) {
        const workspace = this.getWorkspace(workspaceId)
        if (!workspace) return DEFAULT_WORD_COUNT_SETTINGS
        
        return {
            rewrite: { ...DEFAULT_WORD_COUNT_SETTINGS.rewrite, ...(workspace.wordCountSettings?.rewrite || {}) },
            continue: { ...DEFAULT_WORD_COUNT_SETTINGS.continue, ...(workspace.wordCountSettings?.continue || {}) }
        }
    }
    
    static setWordCountSettings(workspaceId, settings) {
        const workspace = this.getWorkspace(workspaceId)
        if (!workspace) return false
        
        workspace.wordCountSettings = {
            rewrite: { ...workspace.wordCountSettings?.rewrite, ...(settings.rewrite || {}) },
            continue: { ...workspace.wordCountSettings?.continue, ...(settings.continue || {}) }
        }
        workspace.updatedAt = Date.now()
        
        const index = WorkspaceDataManager.getWorkspaceIndex()
        const workspaceIndex = index.workspaces.findIndex(w => w.id === workspaceId)
        if (workspaceIndex !== -1) {
            index.workspaces[workspaceIndex] = workspace
            WorkspaceDataManager.setWorkspaceIndex(index)
        }
        
        return true
    }
    
    static getWorkspaceMeta(workspaceId) {
        const id = workspaceId || this.getCurrentWorkspaceId()
        if (!id) return null
        return WorkspaceDataManager.getWorkspaceMeta(id)
    }
    
    static setWorkspaceMeta(workspaceId, meta) {
        const id = workspaceId || this.getCurrentWorkspaceId()
        if (!id) return false
        WorkspaceDataManager.setWorkspaceMeta(id, meta)
        return true
    }
    
    static getWorkspaceRoles(workspaceId) {
        const id = workspaceId || this.getCurrentWorkspaceId()
        if (!id) return []
        return WorkspaceDataManager.getWorkspaceRoles(id)
    }
    
    static setWorkspaceRoles(workspaceId, roles) {
        const id = workspaceId || this.getCurrentWorkspaceId()
        if (!id) return false
        WorkspaceDataManager.setWorkspaceRoles(id, roles)
        return true
    }
    
    static async getWorkspaceStats(id) {
        const workspace = this.getWorkspace(id)
        if (!workspace) return null
        
        const meta = WorkspaceDataManager.getWorkspaceMeta(id)
        
        let chaptersCount = 0
        let totalWords = 0
        let hasIndexedDBData = false
        
        try {
            const chapters = await unifiedDataManager.getAllChapters(id)
            chaptersCount = chapters.length
            hasIndexedDBData = chaptersCount > 0
            
            totalWords = chapters.reduce((sum, ch) => {
                return sum + (ch.originalWordCount || 0) + (ch.rewriteWordCount || 0)
            }, 0)
        } catch (error) {
            console.error('获取IndexedDB章节数据失败:', error)
        }
        
        return {
            name: workspace.name,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
            hasOriginalFile: !!(meta?.file?.name) || hasIndexedDBData,
            hasAnalysis: meta?.analysis?.status === 'completed',
            analysisStatus: meta?.analysis?.status || 'pending',
            roleCardsCount: (workspace.roleCards || []).length,
            hasContinueData: meta?.continue?.status === 'completed',
            hasRewriteData: meta?.rewrite?.status === 'completed',
            chaptersCount: chaptersCount,
            totalWords: totalWords,
            lastActivity: workspace.stats?.lastActivity || workspace.updatedAt
        }
    }
    
    static exportWorkspace(id) {
        const workspace = this.getWorkspace(id)
        if (!workspace) return null
        
        const meta = WorkspaceDataManager.getWorkspaceMeta(id)
        const roles = WorkspaceDataManager.getWorkspaceRoles(id)
        
        return {
            metadata: workspace,
            meta: meta,
            roles: roles,
            exportedAt: Date.now(),
            version: 2
        }
    }
    
    static async importWorkspace(exportData) {
        if (!exportData || !exportData.metadata) {
            throw new Error('无效的工作台数据格式')
        }
        
        const newId = this.generateWorkspaceId()
        const index = WorkspaceDataManager.getWorkspaceIndex()
        
        const workspace = {
            ...exportData.metadata,
            id: newId,
            name: exportData.metadata.name + ' (导入)',
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        
        index.workspaces.push(workspace)
        WorkspaceDataManager.setWorkspaceIndex(index)
        
        if (exportData.meta) {
            const meta = {
                ...exportData.meta,
                workspaceId: newId
            }
            WorkspaceDataManager.setWorkspaceMeta(newId, meta)
        }
        
        if (exportData.roles) {
            WorkspaceDataManager.setWorkspaceRoles(newId, exportData.roles)
        }
        
        return workspace
    }
    
    static clearAllDataExceptConfig() {
        const keysToPreserve = [
            WORKSPACE_KEYS.GLOBAL_CONFIG
        ]
        
        const keysToRemove = []
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && !keysToPreserve.includes(key)) {
                keysToRemove.push(key)
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key)
        })
        
        return keysToRemove.length
    }
    
    static getWorkspaceData(path, workspaceId = null) {
        const id = workspaceId || this.getCurrentWorkspaceId()
        if (!id) return null
        
        const meta = WorkspaceDataManager.getWorkspaceMeta(id)
        if (!meta) return null
        
        if (!path) return meta
        
        const keys = path.split('.')
        let value = meta
        
        for (const key of keys) {
            if (value === null || value === undefined) return null
            value = value[key]
        }
        
        return value
    }
    
    static setWorkspaceData(path, data, workspaceId = null) {
        const id = workspaceId || this.getCurrentWorkspaceId()
        if (!id) return false
        
        const meta = WorkspaceDataManager.getWorkspaceMeta(id) || {}
        
        if (!path) {
            WorkspaceDataManager.setWorkspaceMeta(id, data)
            return true
        }
        
        const keys = path.split('.')
        let current = meta
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i]
            if (current[key] === undefined || current[key] === null) {
                current[key] = {}
            }
            current = current[key]
        }
        
        current[keys[keys.length - 1]] = data
        
        WorkspaceDataManager.setWorkspaceMeta(id, meta)
        return true
    }
}

class WorkspaceStorage {
    constructor(workspaceId) {
        this.workspaceId = workspaceId
    }
    
    getMeta() {
        return WorkspaceDataManager.getWorkspaceMeta(this.workspaceId)
    }
    
    setMeta(meta) {
        return WorkspaceDataManager.setWorkspaceMeta(this.workspaceId, meta)
    }
    
    getRoles() {
        return WorkspaceDataManager.getWorkspaceRoles(this.workspaceId)
    }
    
    setRoles(roles) {
        return WorkspaceDataManager.setWorkspaceRoles(this.workspaceId, roles)
    }
    
    async getChapters() {
        return await unifiedDataManager.getAllChapters(this.workspaceId)
    }
    
    async getAnalysis() {
        return await unifiedDataManager.getAnalysis(this.workspaceId)
    }
    
    async saveChapter(chapterNum, data) {
        return await unifiedDataManager.saveChapter(this.workspaceId, chapterNum, data)
    }
    
    async saveAnalysis(analysisData) {
        return await unifiedDataManager.saveAnalysis(this.workspaceId, analysisData)
    }
}

export { 
    WorkspaceManager, 
    WorkspaceStorage, 
    WorkspaceDataManager,
    WORKSPACE_KEYS, 
    WORKSPACE_COLORS,
    DEFAULT_WORD_COUNT_SETTINGS
}
