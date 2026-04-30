import { ConfigManager, ApiConfigManager, DEFAULT_PROMPT } from './config.js'
import { UIHelper } from './ui.js'
import { FileHandler } from './file.js'
import { apiClient, ApiClient } from './api.js'
import { RoleCardManager } from './roleCard.js'
import { progressManager, ProgressBar, ProgressRing, StepIndicator, StatusDisplay } from './progress.js'
import { WorkspaceManager, WorkspaceStorage } from './workspace.js'
import { 
    unifiedDataManager, 
    dataMigrator, 
    backupManager, 
    initStorage,
    storageManager,
    StorageKeys,
    exportManager,
    importManager
} from './storage/index.js'
import { StyleCardManager, StyleLibraryView, StyleCardDetail, StyleImportExport } from './style/index.js'
import { 
    ChapterSplitter, 
    ChapterAnalyzer, 
    AnalysisQueue, 
    AnalysisStatus, 
    AnalysisStateManager,
    AnalysisFlow,
    OverallAnalyzer,
    AnalysisStorage,
    analysisStorage,
    TextAnalysis,
    PlotAnalyzer,
    CharacterAnalyzer,
    StyleAnalyzer
} from './analysis/index.js'
import { DataConverter, dataConverter, AnalysisRewriteBridge, analysisRewriteBridge } from './bridge/index.js'
import { AnalysisUI, AnalysisImportUI, AnalysisTypeSelector } from './ui/index.js'
import { PlotCardManager, plotCardManager } from './cards/index.js'
import { PlotCardUI } from './ui/plotCardUI.js'

class App {
    constructor() {
        this.routes = {
            'home': this.renderWorkspaces,
            'workspaces': this.renderWorkspaces,
            'workspace': this.renderWorkspace,
            'config': this.renderConfig,
            'analysis': this.renderAnalysis,
            'text-analysis': this.renderAnalysis,
            'continue': this.renderContinue,
            'rewrite': this.renderRewrite,
            'api': this.renderApi,
            'roles': this.renderRoles,
            'styles': this.renderStyles,
            'plot-cards': this.renderPlotCards
        }
        this.storageReady = false
        
        this.chapterSplitter = new ChapterSplitter()
        this.chapterAnalyzer = new ChapterAnalyzer()
        this.analysisQueue = new AnalysisQueue()
        this.analysisStateManager = new AnalysisStateManager()
        this.analysisFlow = new AnalysisFlow()
        this.overallAnalyzer = new OverallAnalyzer()
        this.analysisStorageInstance = new AnalysisStorage()
        this.dataConverter = new DataConverter()
        this.analysisRewriteBridge = new AnalysisRewriteBridge()
        
        this.textAnalysis = new TextAnalysis()
        
        this.analysisData = {
            chapters: [],
            currentChapterIndex: -1,
            analysisType: 'plot',
            isAnalyzing: false,
            novelTitle: '',
            totalChapters: 0,
            totalWords: 0
        }
        
        this.currentAnalysisUI = null
        
        this.continueData = {
            originalText: null,
            originalChapters: [],
            lastOriginalChapter: null,
            plotData: null,
            styleData: null,
            roleCards: null,
            outline: '',
            userRequirements: '',
            startChapter: 1,
            endChapter: 10,
            outlines: [],
            chapters: [],
            currentStep: 1,
            isGenerating: false,
            generateController: null,
            currentChapterIndex: 0,
            wordCountSettings: {
                targetWords: 5000,
                minWords: 3000,
                maxWords: 8000
            }
        }
        
        this.init()
    }
    
    async init() {
        try {
            await initStorage()
            this.storageReady = true
            console.log('存储系统初始化成功')
        } catch (error) {
            console.error('存储系统初始化失败:', error)
        }
        
        WorkspaceManager.init()
        
        window.addEventListener('hashchange', () => this.handleRoute())
        window.addEventListener('load', () => this.handleRoute())
        this.setupGlobalEvents()
        this.updateApiStatus()
    }
    
    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home'
        const route = this.routes[hash] || this.routes['home']
        route.call(this)
        this.updateActiveNav(hash)
    }
    
    updateActiveNav(hash) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-blue-600', 'active')
            if (link.getAttribute('href') === `#${hash}`) {
                link.classList.add('bg-blue-600', 'active')
            }
        })
    }
    
    setupGlobalEvents() {
        const clearDataBtn = document.getElementById('clear-data-btn')
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', async () => {
                const confirmed = await UIHelper.showConfirm(
                    '清除所有数据',
                    '确定要清除所有本地数据吗？此操作不可恢复。'
                )
                if (confirmed) {
                    this.clearAllData()
                }
            })
        }
    }
    
    async clearAllData() {
        try {
            await unifiedDataManager.clearAll()
            const removedCount = WorkspaceManager.clearAllDataExceptConfig()
            UIHelper.showToast(`已清除${removedCount}项数据`, 'success')
            this.updateApiStatus()
            setTimeout(() => {
                window.location.hash = 'home'
                window.location.reload()
            }, 1000)
        } catch (error) {
            console.error('清除数据失败:', error)
            UIHelper.showToast('清除数据失败: ' + error.message, 'error')
        }
    }
    
    updateApiStatus() {
        const statusDiv = document.getElementById('api-status')
        if (!statusDiv) return
        
        const config = ApiConfigManager.getApiConfig()
        if (config.apiKey) {
            statusDiv.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span>已配置</span>
            `
        } else {
            statusDiv.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                <span>未配置</span>
            `
        }
    }
    
    async renderWorkspaces() {
        const main = document.getElementById('main-content')
        const workspaces = WorkspaceManager.getAllWorkspaces()
        
        const workspaceCards = await Promise.all(
            workspaces.map(async (ws) => await this.renderWorkspaceCard(ws))
        )
        
        main.innerHTML = `
            <div class="max-w-6xl mx-auto">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h1 class="text-3xl font-bold mb-2">工作台管理</h1>
                        <p class="text-slate-400">创建和管理您的小说创作项目</p>
                    </div>
                    <button id="create-workspace-btn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        <span>新建工作台</span>
                    </button>
                </div>
                
                <div id="workspaces-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${workspaces.length === 0 ? `
                        <div class="col-span-full text-center py-20 text-slate-400">
                            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                            </svg>
                            <p class="text-lg mb-2">暂无工作台</p>
                            <p class="text-sm">点击上方按钮创建您的第一个工作台</p>
                        </div>
                    ` : workspaceCards.join('')}
                </div>
            </div>
        `
        
        this.setupWorkspaceEvents()
    }
    
    async renderWorkspaceCard(workspace) {
        const stats = await WorkspaceManager.getWorkspaceStats(workspace.id)
        const timeAgo = this.formatTimeAgo(workspace.updatedAt)
        
        return `
            <div class="bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-500 transition-all group" data-workspace-id="${workspace.id}">
                <div class="p-5">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg" style="background-color: ${workspace.color}">
                                📁
                            </div>
                            <div>
                                <h3 class="font-semibold text-lg">${workspace.name}</h3>
                                ${workspace.description ? `<p class="text-sm text-slate-400 truncate max-w-xs">${workspace.description}</p>` : ''}
                            </div>
                        </div>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="delete-workspace-btn p-1 hover:bg-red-600 rounded" data-id="${workspace.id}" title="删除">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${stats.hasOriginalFile ? '<span class="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">已导入原文</span>' : '<span class="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded">未导入原文</span>'}
                        ${stats.hasAnalysis ? '<span class="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">已分析</span>' : ''}
                        ${stats.roleCardsCount > 0 ? `<span class="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">${stats.roleCardsCount}个角色</span>` : ''}
                    </div>
                    
                    <div class="flex items-center justify-between text-sm text-slate-400">
                        <span>最后编辑: ${timeAgo}</span>
                    </div>
                </div>
                
                <div class="border-t border-slate-700 p-3">
                    <button class="enter-workspace-btn w-full bg-slate-700 hover:bg-blue-600 py-2 rounded transition-colors" data-id="${workspace.id}">
                        进入工作台
                    </button>
                </div>
            </div>
        `
    }
    
    formatTimeAgo(timestamp) {
        if (!timestamp) return '未知'
        const seconds = Math.floor((Date.now() - timestamp) / 1000)
        
        if (seconds < 60) return '刚刚'
        if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`
        return new Date(timestamp).toLocaleDateString('zh-CN')
    }
    
    setupWorkspaceEvents() {
        const createBtn = document.getElementById('create-workspace-btn')
        if (createBtn) {
            createBtn.onclick = () => this.showCreateWorkspaceDialog()
        }
        
        document.querySelectorAll('.enter-workspace-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id
                WorkspaceManager.switchWorkspace(id)
                window.location.hash = 'workspace'
            }
        })
        
        document.querySelectorAll('.delete-workspace-btn').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation()
                const id = btn.dataset.id
                const workspace = WorkspaceManager.getWorkspace(id)
                if (workspace) {
                    const confirmed = await UIHelper.showConfirm(
                        '删除工作台',
                        `确定要删除工作台"${workspace.name}"吗？此操作不可恢复！`
                    )
                    if (confirmed) {
                        WorkspaceManager.deleteWorkspace(id)
                        UIHelper.showToast('工作台已删除', 'success')
                        this.renderWorkspaces()
                    }
                }
            }
        })
    }
    
    showCreateWorkspaceDialog() {
        const modal = document.getElementById('modal-container')
        modal.classList.remove('hidden')
        
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div class="bg-slate-800 rounded-lg w-full max-w-md p-6">
                    <h2 class="text-xl font-bold mb-4">新建工作台</h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">工作台名称 *</label>
                            <input type="text" id="new-workspace-name" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" placeholder="输入工作台名称">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">描述（可选）</label>
                            <textarea id="new-workspace-desc" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none resize-none" rows="2" placeholder="输入工作台描述"></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">标识颜色</label>
                            <div class="flex space-x-2">
                                ${['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'].map((color, i) => `
                                    <button type="button" class="workspace-color-btn w-8 h-8 rounded-full border-2 ${i === 0 ? 'border-white' : 'border-transparent'}" data-color="${color}" style="background-color: ${color}"></button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button id="cancel-create-workspace" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">取消</button>
                        <button id="confirm-create-workspace" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">创建</button>
                    </div>
                </div>
            </div>
        `
        
        let selectedColor = '#3B82F6'
        
        modal.querySelectorAll('.workspace-color-btn').forEach(btn => {
            btn.onclick = () => {
                modal.querySelectorAll('.workspace-color-btn').forEach(b => b.classList.remove('border-white'))
                btn.classList.add('border-white')
                selectedColor = btn.dataset.color
            }
        })
        
        document.getElementById('cancel-create-workspace').onclick = () => {
            modal.classList.add('hidden')
        }
        
        document.getElementById('confirm-create-workspace').onclick = () => {
            const name = document.getElementById('new-workspace-name').value.trim()
            const desc = document.getElementById('new-workspace-desc').value.trim()
            
            if (!name) {
                UIHelper.showToast('请输入工作台名称', 'warning')
                return
            }
            
            const workspace = WorkspaceManager.createWorkspace({
                name: name,
                description: desc,
                color: selectedColor
            })
            
            modal.classList.add('hidden')
            UIHelper.showToast('工作台创建成功', 'success')
            this.renderWorkspaces()
        }
        
        modal.onclick = (e) => {
            if (e.target === modal.firstElementChild.parentElement) {
                modal.classList.add('hidden')
            }
        }
    }
    
    async renderWorkspace() {
        const workspace = WorkspaceManager.getCurrentWorkspace()
        
        if (!workspace) {
            window.location.hash = 'home'
            return
        }
        
        const main = document.getElementById('main-content')
        const stats = await WorkspaceManager.getWorkspaceStats(workspace.id)
        
        main.innerHTML = `
            <div class="flex h-full">
                <div class="w-64 bg-slate-800 border-r border-slate-700 flex-shrink-0 flex flex-col">
                    <div class="p-4 border-b border-slate-700">
                        <div class="flex items-center space-x-2 mb-2">
                            <div class="w-8 h-8 rounded flex items-center justify-center text-white text-sm" style="background-color: ${workspace.color}">
                                📁
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-semibold truncate">${workspace.name}</h3>
                            </div>
                        </div>
                        ${workspace.description ? `<p class="text-xs text-slate-400 truncate">${workspace.description}</p>` : ''}
                    </div>
                    
                    <nav class="flex-1 p-2 space-y-1">
                        <a href="#analysis" class="workspace-nav-link flex items-center space-x-3 px-3 py-2 rounded hover:bg-slate-700 transition-colors">
                            <span>📄</span>
                            <span>导入与分析</span>
                        </a>
                        <a href="#roles" class="workspace-nav-link flex items-center space-x-3 px-3 py-2 rounded hover:bg-slate-700 transition-colors">
                            <span>👥</span>
                            <span>角色卡管理</span>
                        </a>
                        <a href="#continue" class="workspace-nav-link flex items-center space-x-3 px-3 py-2 rounded hover:bg-slate-700 transition-colors">
                            <span>✍️</span>
                            <span>续写模块</span>
                        </a>
                        <a href="#rewrite" class="workspace-nav-link flex items-center space-x-3 px-3 py-2 rounded hover:bg-slate-700 transition-colors">
                            <span>🔄</span>
                            <span>改写模块</span>
                        </a>
                    </nav>
                    
                    <div class="p-4 border-t border-slate-700">
                        <div class="text-xs text-slate-400 space-y-1">
                            <div class="flex justify-between">
                                <span>原文:</span>
                                <span class="${stats.hasOriginalFile ? 'text-green-400' : 'text-slate-500'}">${stats.hasOriginalFile ? '已导入' : '未导入'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>分析:</span>
                                <span class="${stats.hasAnalysis ? 'text-green-400' : 'text-slate-500'}">${stats.hasAnalysis ? '已完成' : '未完成'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>角色卡:</span>
                                <span class="${stats.roleCardsCount > 0 ? 'text-green-400' : 'text-slate-500'}">${stats.roleCardsCount}个</span>
                            </div>
                        </div>
                        
                        <button id="back-to-workspaces" class="w-full mt-4 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors">
                            ← 返回工作台列表
                        </button>
                    </div>
                </div>
                
                <div class="flex-1 overflow-y-auto p-6">
                    <div class="max-w-4xl mx-auto">
                        <div class="text-center py-20">
                            <h2 class="text-2xl font-bold mb-4">选择功能开始创作</h2>
                            <p class="text-slate-400 mb-8">从左侧导航选择要使用的功能</p>
                            
                            <div class="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                                <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-blue-500 cursor-pointer transition-colors" onclick="location.hash='analysis'">
                                    <div class="text-3xl mb-2">📄</div>
                                    <h3 class="font-semibold">导入与分析</h3>
                                    <p class="text-sm text-slate-400">导入原文并AI分析</p>
                                </div>
                                <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-blue-500 cursor-pointer transition-colors" onclick="location.hash='continue'">
                                    <div class="text-3xl mb-2">✍️</div>
                                    <h3 class="font-semibold">续写</h3>
                                    <p class="text-sm text-slate-400">AI智能续写</p>
                                </div>
                                <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-blue-500 cursor-pointer transition-colors" onclick="location.hash='rewrite'">
                                    <div class="text-3xl mb-2">🔄</div>
                                    <h3 class="font-semibold">改写</h3>
                                    <p class="text-sm text-slate-400">AI剧情改写</p>
                                </div>
                                <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-blue-500 cursor-pointer transition-colors" onclick="location.hash='roles'">
                                    <div class="text-3xl mb-2">👥</div>
                                    <h3 class="font-semibold">角色卡</h3>
                                    <p class="text-sm text-slate-400">管理角色信息</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
        
        document.getElementById('back-to-workspaces').onclick = () => {
            window.location.hash = 'home'
        }
    }
    
    renderConfig() {
        const main = document.getElementById('main-content')
        const currentPrompt = ConfigManager.getGlobalPrompt()
        const promptInfo = ConfigManager.getPromptInfo()
        
        main.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="mb-6">
                    <h1 class="text-3xl font-bold mb-2">全局配置</h1>
                    <p class="text-slate-400">配置全局Prompt，在所有AI调用中优先使用</p>
                </div>
                
                <div class="card p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-semibold">全局Prompt</h2>
                        <div class="flex items-center space-x-2 text-sm text-slate-400">
                            <span>字数：</span>
                            <span id="prompt-word-count">${currentPrompt.length}</span>
                            <span>/ 2000</span>
                        </div>
                    </div>
                    
                    <textarea 
                        id="global-prompt-input"
                        class="w-full h-40 bg-slate-700 border border-slate-600 rounded-lg p-4 text-slate-100 resize-none focus:border-blue-500 focus:outline-none"
                        placeholder="请输入全局Prompt..."
                        maxlength="2000"
                    >${currentPrompt}</textarea>
                    
                    <div class="flex items-center justify-between mt-4">
                        <div class="text-sm text-slate-400">
                            ${promptInfo.updatedAt ? `上次更新：${new Date(promptInfo.updatedAt).toLocaleString('zh-CN')}` : '尚未保存'}
                        </div>
                        <div class="flex space-x-3">
                            <button id="reset-prompt-btn" class="btn btn-secondary">重置为默认</button>
                            <button id="clear-prompt-btn" class="btn btn-secondary">清空</button>
                            <button id="save-prompt-btn" class="btn btn-primary">保存配置</button>
                        </div>
                    </div>
                </div>
                
                <div class="card p-6">
                    <h2 class="text-xl font-semibold mb-4">预览效果</h2>
                    <div class="bg-slate-700 rounded-lg p-4 text-sm text-slate-300">
                        <div class="text-slate-400 mb-2">API调用时将拼接为：</div>
                        <div class="border-l-2 border-blue-500 pl-4">
                            <div class="text-blue-400 mb-1">[System Message]</div>
                            <div id="preview-content">${currentPrompt}</div>
                            <div class="text-slate-500 mt-2">+ 用户具体指令...</div>
                        </div>
                    </div>
                </div>
            </div>
        `
        
        this.setupConfigEvents()
    }
    
    setupConfigEvents() {
        const input = document.getElementById('global-prompt-input')
        const wordCount = document.getElementById('prompt-word-count')
        const previewContent = document.getElementById('preview-content')
        const saveBtn = document.getElementById('save-prompt-btn')
        const resetBtn = document.getElementById('reset-prompt-btn')
        const clearBtn = document.getElementById('clear-prompt-btn')
        
        let autoSaveTimer = null
        
        input.addEventListener('input', () => {
            const value = input.value
            wordCount.textContent = value.length
            previewContent.textContent = value || '(空)'
            
            clearTimeout(autoSaveTimer)
            autoSaveTimer = setTimeout(() => {
                ConfigManager.setGlobalPrompt(value)
                UIHelper.showToast('已自动保存', 'success')
            }, 500)
        })
        
        saveBtn.addEventListener('click', () => {
            ConfigManager.setGlobalPrompt(input.value)
            UIHelper.showToast('保存成功', 'success')
        })
        
        resetBtn.addEventListener('click', async () => {
            const confirmed = await UIHelper.showConfirm('重置Prompt', '确定要重置为默认Prompt吗？')
            if (confirmed) {
                input.value = DEFAULT_PROMPT
                wordCount.textContent = DEFAULT_PROMPT.length
                previewContent.textContent = DEFAULT_PROMPT
                ConfigManager.resetGlobalPrompt()
                UIHelper.showToast('已重置为默认值', 'success')
            }
        })
        
        clearBtn.addEventListener('click', async () => {
            const confirmed = await UIHelper.showConfirm('清空Prompt', '确定要清空Prompt吗？')
            if (confirmed) {
                input.value = ''
                wordCount.textContent = '0'
                previewContent.textContent = '(空)'
                ConfigManager.setGlobalPrompt('')
                UIHelper.showToast('已清空', 'success')
            }
        })
    }
    
    renderApi() {
        const main = document.getElementById('main-content')
        const config = ApiConfigManager.getApiConfig()
        const maskedKey = ApiConfigManager.maskKey(config.apiKey)
        
        main.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="mb-6">
                    <h1 class="text-3xl font-bold mb-2">API设置</h1>
                    <p class="text-slate-400">配置AI接口参数，确保服务可用</p>
                </div>
                
                <div class="card p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">基础配置</h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">
                                API Key <span class="text-red-500">*</span>
                            </label>
                            <div class="flex space-x-2">
                                <input 
                                    type="password"
                                    id="api-key-input"
                                    class="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                                    placeholder="sk-xxxxxxxxxxxxxxxx"
                                    value="${config.apiKey}"
                                >
                                <button id="toggle-key-btn" class="btn btn-secondary">显示</button>
                            </div>
                            <p class="text-sm text-slate-500 mt-1">当前：${maskedKey}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">
                                API URL <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                id="api-url-input"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="https://api.deepseek.com/v1/chat/completions"
                                value="${config.apiUrl}"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">
                                模型ID <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                id="model-id-input"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="deepseek-chat"
                                value="${config.modelId}"
                            >
                        </div>
                    </div>
                </div>
                
                <div class="card p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">高级配置</h2>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Max Tokens</label>
                            <input 
                                type="number"
                                id="max-tokens-input"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                                min="1"
                                max="8192"
                                value="${config.maxTokens}"
                            >
                            <p class="text-sm text-slate-500 mt-1">范围：1-8192</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Temperature</label>
                            <input 
                                type="number"
                                id="temperature-input"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                                min="0"
                                max="2"
                                step="0.1"
                                value="${config.temperature}"
                            >
                            <p class="text-sm text-slate-500 mt-1">范围：0-2，越高越随机</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button id="test-connection-btn" class="btn btn-secondary">测试连接</button>
                    <button id="save-api-btn" class="btn btn-primary">保存配置</button>
                </div>
                
                <div id="connection-status" class="mt-4 hidden"></div>
            </div>
        `
        
        this.setupApiEvents()
    }
    
    setupApiEvents() {
        const keyInput = document.getElementById('api-key-input')
        const toggleBtn = document.getElementById('toggle-key-btn')
        const testBtn = document.getElementById('test-connection-btn')
        const saveBtn = document.getElementById('save-api-btn')
        
        let isKeyVisible = false
        
        toggleBtn.addEventListener('click', () => {
            isKeyVisible = !isKeyVisible
            keyInput.type = isKeyVisible ? 'text' : 'password'
            toggleBtn.textContent = isKeyVisible ? '隐藏' : '显示'
        })
        
        testBtn.addEventListener('click', async () => {
            const config = this.getApiConfigFromForm()
            const validation = ApiConfigManager.validateConfig(config)
            
            if (!validation.valid) {
                UIHelper.showToast(validation.errors[0], 'error')
                return
            }
            
            testBtn.disabled = true
            testBtn.textContent = '测试中...'
            
            try {
                const result = await this.testApiConnection(config)
                this.showConnectionStatus(result.success, result.message)
            } catch (error) {
                this.showConnectionStatus(false, error.message)
            } finally {
                testBtn.disabled = false
                testBtn.textContent = '测试连接'
            }
        })
        
        saveBtn.addEventListener('click', () => {
            const config = this.getApiConfigFromForm()
            const validation = ApiConfigManager.validateConfig(config)
            
            if (!validation.valid) {
                UIHelper.showToast(validation.errors[0], 'error')
                return
            }
            
            ApiConfigManager.setApiConfig(config)
            this.updateApiStatus()
            UIHelper.showToast('保存成功', 'success')
        })
    }
    
    getApiConfigFromForm() {
        return {
            apiKey: document.getElementById('api-key-input').value.trim(),
            apiUrl: document.getElementById('api-url-input').value.trim(),
            modelId: document.getElementById('model-id-input').value.trim(),
            maxTokens: parseInt(document.getElementById('max-tokens-input').value),
            temperature: parseFloat(document.getElementById('temperature-input').value)
        }
    }
    
    async testApiConnection(config) {
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.modelId,
                messages: [
                    { role: 'user', content: '测试连接，请回复"连接成功"' }
                ],
                max_tokens: 50
            })
        })
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.error?.message || `HTTP ${response.status}`)
        }
        
        const data = await response.json()
        return {
            success: true,
            message: '连接成功！模型响应：' + data.choices[0].message.content
        }
    }
    
    showConnectionStatus(success, message) {
        const statusDiv = document.getElementById('connection-status')
        statusDiv.className = `mt-4 p-4 rounded-lg ${success ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`
        statusDiv.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-lg">${success ? '✓' : '✗'}</span>
                <span>${message}</span>
            </div>
        `
        statusDiv.classList.remove('hidden')
    }
    
    renderAnalysis() {
        const main = document.getElementById('main-content')
        this.renderAnalysisPage(main)
    }
    
    renderAnalysisOld() {
        const main = document.getElementById('main-content')
        main.innerHTML = `
            <div class="max-w-6xl mx-auto">
                <div class="mb-6">
                    <h1 class="text-3xl font-bold mb-2">AI文本分析</h1>
                    <p class="text-slate-400">导入小说原文，AI自动分析剧情和文风</p>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="card p-6">
                        <h2 class="text-xl font-semibold mb-4">步骤1：导入原文</h2>
                        <div id="analysis-drop-zone"></div>
                        <div id="file-info" class="mt-4 hidden">
                            <div class="flex items-center justify-between bg-slate-700 rounded p-3">
                                <div>
                                    <div id="file-name" class="font-medium"></div>
                                    <div id="file-size" class="text-sm text-slate-400"></div>
                                </div>
                                <button id="clear-file-btn" class="text-red-400 hover:text-red-300">清除</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card p-6">
                        <h2 class="text-xl font-semibold mb-4">步骤2：开始分析</h2>
                        <button id="start-analysis-btn" class="btn btn-primary w-full" disabled>
                            开始AI分析
                        </button>
                        <div id="analysis-progress" class="mt-4 hidden"></div>
                    </div>
                </div>
                
                <div id="analysis-results" class="mt-6 hidden"></div>
            </div>
        `
        
        this.setupAnalysisEvents()
    }
    
    setupAnalysisEvents() {
        let currentFile = null
        
        const dropZone = document.getElementById('analysis-drop-zone')
        const fileInfo = document.getElementById('file-info')
        const fileName = document.getElementById('file-name')
        const fileSize = document.getElementById('file-size')
        const clearFileBtn = document.getElementById('clear-file-btn')
        const startBtn = document.getElementById('start-analysis-btn')
        
        const zone = UIHelper.createDropZone({
            accept: '.txt',
            hint: '拖拽TXT文件到此处或点击上传',
            onDrop: async (file) => {
                currentFile = await FileHandler.importTxt(file)
                fileName.textContent = currentFile.filename
                fileSize.textContent = `${(currentFile.size / 1024).toFixed(2)} KB | ${currentFile.encoding}`
                fileInfo.classList.remove('hidden')
                startBtn.disabled = false
            },
            onError: (error) => {
                UIHelper.showToast(error.message, 'error')
            }
        })
        
        dropZone.appendChild(zone)
        
        clearFileBtn.addEventListener('click', () => {
            currentFile = null
            fileInfo.classList.add('hidden')
            startBtn.disabled = true
        })
        
        startBtn.addEventListener('click', async () => {
            if (!currentFile) return
            
            startBtn.disabled = true
            startBtn.textContent = '分析中...'
            
            const progressDiv = document.getElementById('analysis-progress')
            progressDiv.classList.remove('hidden')
            progressDiv.innerHTML = `
                <div class="mb-2 flex justify-between text-sm">
                    <span id="progress-text">准备中...</span>
                    <span id="progress-percent">0%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                    <div id="progress-bar" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            `
            
            try {
                const result = await apiClient.analyzeNovel(currentFile.content, (percent, text) => {
                    document.getElementById('progress-bar').style.width = percent + '%'
                    document.getElementById('progress-percent').textContent = percent + '%'
                    document.getElementById('progress-text').textContent = text
                })
                
                this.saveAnalysisResult(result)
                this.showAnalysisResult(result)
                UIHelper.showToast('分析完成', 'success')
                
            } catch (error) {
                UIHelper.showToast(error.message, 'error')
                progressDiv.classList.add('hidden')
            } finally {
                startBtn.disabled = false
                startBtn.textContent = '开始AI分析'
            }
        })
    }
    
    saveAnalysisResult(result) {
        WorkspaceManager.setWorkspaceData('analysis', {
            plotAnalysis: result.plotAnalysis,
            styleAnalysis: result.styleAnalysis,
            analyzedAt: Date.now()
        })
    }
    
    showAnalysisResult(result) {
        const resultsDiv = document.getElementById('analysis-results')
        resultsDiv.classList.remove('hidden')
        
        resultsDiv.innerHTML = `
            <div class="card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold">分析结果</h2>
                    <div class="flex space-x-2">
                        <button id="export-plot-btn" class="btn btn-secondary text-sm">导出剧情分析</button>
                        <button id="export-style-btn" class="btn btn-secondary text-sm">导出文风分析</button>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <div class="border border-slate-700 rounded-lg">
                        <button class="w-full flex items-center justify-between p-4 hover:bg-slate-700" onclick="this.nextElementSibling.classList.toggle('hidden')">
                            <span class="font-medium">剧情分析</span>
                            <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        <div class="hidden p-4 bg-slate-800 border-t border-slate-700">
                            <pre class="text-sm overflow-auto max-h-96 text-slate-300">${JSON.stringify(result.plotAnalysis, null, 2)}</pre>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg">
                        <button class="w-full flex items-center justify-between p-4 hover:bg-slate-700" onclick="this.nextElementSibling.classList.toggle('hidden')">
                            <span class="font-medium">文风分析</span>
                            <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        <div class="hidden p-4 bg-slate-800 border-t border-slate-700">
                            <pre class="text-sm overflow-auto max-h-96 text-slate-300">${JSON.stringify(result.styleAnalysis, null, 2)}</pre>
                            
                            <div class="mt-4 pt-4 border-t border-slate-600">
                                <h4 class="text-sm font-medium mb-2">📥 下载选项</h4>
                                <div class="flex flex-wrap gap-2">
                                    <button id="export-style-json-btn" class="btn btn-secondary text-sm">导出JSON</button>
                                    <button id="create-style-card-from-analysis-btn" class="btn btn-primary text-sm">🎴 生成文风卡</button>
                                </div>
                                <p class="text-xs text-slate-400 mt-2">生成文风卡后可在"文风卡管理"中查看和使用</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
        
        document.getElementById('export-plot-btn').addEventListener('click', () => {
            FileHandler.exportJson(result.plotAnalysis, '剧情分析.json')
        })
        
        document.getElementById('export-style-btn').addEventListener('click', () => {
            FileHandler.exportJson(result.styleAnalysis, '文风分析.json')
        })
        
        const exportStyleJsonBtn = document.getElementById('export-style-json-btn')
        if (exportStyleJsonBtn) {
            exportStyleJsonBtn.addEventListener('click', () => {
                FileHandler.exportJson(result.styleAnalysis, '文风分析.json')
            })
        }
        
        const createStyleCardBtn = document.getElementById('create-style-card-from-analysis-btn')
        if (createStyleCardBtn) {
            createStyleCardBtn.addEventListener('click', () => {
                this.createStyleCardFromAnalysis(result.styleAnalysis)
            })
        }
    }
    
    createStyleCardFromAnalysis(styleAnalysis) {
        if (!styleAnalysis) {
            UIHelper.showToast('没有文风分析数据', 'error')
            return
        }
        
        const styleData = {
            name: styleAnalysis.style_overview || styleAnalysis.styleOverview || '新文风卡',
            author: styleAnalysis.author || '',
            source: {
                novelName: styleAnalysis.source?.novelName || ''
            },
            style: {
                narrative: styleAnalysis.dimensions?.narrative || styleAnalysis.narrative || {},
                dialogue: styleAnalysis.dimensions?.dialogue || styleAnalysis.dialogue || {},
                description: styleAnalysis.dimensions?.description || styleAnalysis.description || {},
                keywords: styleAnalysis.core_anchors || styleAnalysis.coreAnchors || []
            }
        }
        
        const card = StyleCardManager.createCard(styleData)
        UIHelper.showToast('文风卡已生成，可在文风卡管理中查看', 'success')
    }
    
    renderContinue() {
        const main = document.getElementById('main-content')
        
        if (!this.continueData) {
            this.loadContinueDraft()
        }
        
        const hasData = this.continueData.plotData && this.continueData.styleData
        const chapters = this.continueData.chapters || []
        const currentChapter = chapters[this.continueData.currentChapterIndex] || null
        const completedCount = chapters.filter(c => c.content).length
        const totalChapters = chapters.length
        const progressPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0
        
        main.innerHTML = `
            <div class="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
                <div class="bg-slate-800 border-b border-slate-700 p-3">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">续写进度</span>
                        <span class="text-sm text-slate-400">${completedCount}/${totalChapters}章 (${progressPercent}%)</span>
                    </div>
                    <div class="flex items-center justify-between">
                        ${this.renderContinueProgressBar(completedCount, totalChapters)}
                    </div>
                </div>
                
                <div class="flex flex-1 overflow-hidden">
                    <div class="w-56 min-w-56 bg-slate-800 border-r border-slate-700 flex flex-col">
                        <div class="p-3 border-b border-slate-700">
                            <h3 class="font-medium text-sm">📚 章节列表</h3>
                        </div>
                        <div class="p-2 border-b border-slate-700">
                            <input type="text" id="search-continue-chapter-input" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" placeholder="搜索章节...">
                        </div>
                        <div id="continue-chapter-list-container" class="flex-1 overflow-y-auto p-2 space-y-1">
                            ${this.renderContinueChapterList(chapters)}
                        </div>
                        <div class="p-2 border-t border-slate-700 text-xs text-slate-400">
                            <div>总章节：${chapters.length}</div>
                            <div>已生成：${chapters.filter(c => c.content).length}</div>
                        </div>
                    </div>
                    
                    <div class="flex-1 flex flex-col overflow-hidden">
                        <div class="p-4 border-b border-slate-700 bg-slate-800">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h1 class="text-xl font-bold">续写功能</h1>
                                    <p class="text-sm text-slate-400">${currentChapter ? `当前：第${currentChapter.chapterNum}章 ${currentChapter.title || ''}` : '请先导入数据'}</p>
                                </div>
                                <div class="flex space-x-2">
                                    <button id="save-continue-draft-btn" class="btn btn-secondary text-sm">💾 保存</button>
                                    <button id="load-continue-draft-btn" class="btn btn-secondary text-sm">📂 加载</button>
                                </div>
                            </div>
                        </div>
                        
                        <div id="continue-content-area" class="flex-1 overflow-y-auto p-4">
                            ${hasData ? this.renderContinueContentArea(currentChapter) : this.renderContinueDataImport()}
                        </div>
                    </div>
                    
                    <div class="w-72 min-w-72 bg-slate-800 border-l border-slate-700 flex flex-col overflow-y-auto">
                    <div class="p-3 border-b border-slate-700">
                        <h3 class="font-medium text-sm">⚙️ 续写设置</h3>
                    </div>
                    
                    <div class="p-3 border-b border-slate-700">
                        <h4 class="text-sm font-medium mb-2">📏 字数设置</h4>
                        <div class="space-y-2">
                            <div>
                                <div class="text-xs text-slate-400 mb-1">目标字数</div>
                                <div class="flex items-center space-x-2">
                                    <input type="range" id="target-words-continue" min="1000" max="15000" step="500" value="${this.continueData.wordCountSettings.targetWords}" class="flex-1">
                                    <span id="target-words-value" class="text-xs w-16">${this.continueData.wordCountSettings.targetWords}字</span>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <div class="flex-1">
                                    <div class="text-xs text-slate-400 mb-1">最小字数</div>
                                    <input type="number" id="min-words-continue" value="${this.continueData.wordCountSettings.minWords}" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                                </div>
                                <div class="flex-1">
                                    <div class="text-xs text-slate-400 mb-1">最大字数</div>
                                    <input type="number" id="max-words-continue" value="${this.continueData.wordCountSettings.maxWords}" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                                </div>
                            </div>
                            <div class="flex space-x-1">
                                <button class="preset-btn btn btn-secondary text-xs flex-1" data-target="2000">短篇</button>
                                <button class="preset-btn btn btn-secondary text-xs flex-1" data-target="5000">中篇</button>
                                <button class="preset-btn btn btn-secondary text-xs flex-1" data-target="8000">长篇</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-3 border-b border-slate-700">
                        <h4 class="text-sm font-medium mb-2">📖 章节范围</h4>
                        <div class="flex space-x-2">
                            <div class="flex-1">
                                <div class="text-xs text-slate-400 mb-1">起始章节</div>
                                <input type="number" id="start-chapter" value="${this.continueData.startChapter}" min="1" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                            </div>
                            <div class="flex-1">
                                <div class="text-xs text-slate-400 mb-1">结束章节</div>
                                <input type="number" id="end-chapter" value="${this.continueData.endChapter}" min="1" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-3 border-b border-slate-700">
                        <h4 class="text-sm font-medium mb-2">🎯 续写方向</h4>
                        <div class="space-y-2">
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="keep-style" checked class="rounded bg-slate-700 border-slate-600">
                                <span class="text-sm">保持原有风格</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="add-conflict" class="rounded bg-slate-700 border-slate-600">
                                <span class="text-sm">增加冲突</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="add-emotion" class="rounded bg-slate-700 border-slate-600">
                                <span class="text-sm">增加情感描写</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="p-3 border-b border-slate-700">
                        <h4 class="text-sm font-medium mb-2">📋 续写大纲</h4>
                        <textarea id="continue-outline" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm h-24 resize-none" placeholder="输入整体续写大纲...">${this.continueData.outline || ''}</textarea>
                    </div>
                    
                    <div class="p-3 flex-1">
                        <div class="space-y-2">
                            <button id="generate-outline-btn" class="btn btn-secondary w-full text-sm" ${!hasData ? 'disabled' : ''}>📝 生成章节梗概</button>
                            <button id="continue-single-btn" class="btn btn-primary w-full text-sm" ${!hasData ? 'disabled' : ''}>▶️ 续写当前章节</button>
                            <button id="continue-all-btn" class="btn btn-secondary w-full text-sm" ${!hasData ? 'disabled' : ''}>⏩ 一键续写全部</button>
                            <button id="stop-continue-btn" class="btn btn-secondary w-full text-sm hidden">⏹️ 停止任务</button>
                        </div>
                    </div>
                    
                    <div class="p-3 border-t border-slate-700">
                        <div class="space-y-2">
                            <button id="export-continue-btn" class="btn btn-secondary w-full text-sm" ${chapters.filter(c => c.content).length === 0 ? 'disabled' : ''}>📤 导出结果</button>
                        </div>
                    </div>
                </div>
            </div>
        `
        
        this.setupContinueNewEvents()
    }
    
    renderContinueProgressBar(completed, total) {
        if (total === 0) {
            return '<div class="text-slate-400 text-sm">暂无章节数据</div>'
        }
        
        const percent = Math.round((completed / total) * 100)
        
        return `
            <div class="flex items-center space-x-1 flex-1">
                <div class="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div class="bg-blue-500 h-full transition-all duration-300" style="width: ${percent}%"></div>
                </div>
            </div>
            <div class="flex items-center space-x-3 text-xs ml-4">
                <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>已完成 ${completed}</span>
                <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-slate-500 mr-1"></span>待生成 ${total - completed}</span>
            </div>
        `
    }
    
    renderContinueChapterList(chapters) {
        if (!chapters || chapters.length === 0) {
            return '<div class="text-center text-slate-400 text-sm py-4">暂无章节数据</div>'
        }
        
        return chapters.map((chapter, index) => {
            const hasContent = chapter.content && chapter.content.length > 0
            const status = hasContent ? 'success' : 'pending'
            const statusColor = status === 'success' ? 'bg-green-500' : 'bg-slate-500'
            const isSelected = index === this.continueData.currentChapterIndex
            
            return `
                <div class="continue-chapter-item p-2 rounded cursor-pointer hover:bg-slate-700 transition-colors ${isSelected ? 'bg-blue-900 border border-blue-500' : 'border border-transparent'}" data-index="${index}">
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 rounded-full ${statusColor}"></div>
                        <div class="flex-1 truncate">
                            <div class="text-sm font-medium">第${chapter.chapterNum}章</div>
                            <div class="text-xs text-slate-400 truncate">${chapter.title || '无标题'}</div>
                        </div>
                        <div class="text-xs text-slate-500">${chapter.wordCount || 0}字</div>
                    </div>
                </div>
            `
        }).join('')
    }
    
    renderContinueDataImport() {
        return `
            <div class="card p-6 max-w-3xl mx-auto">
                <h2 class="text-xl font-semibold mb-4">导入数据</h2>
                <p class="text-slate-400 mb-6">请导入原文（用于承接）、剧情分析、文风分析数据，这些数据将用于AI续写</p>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">📄 原文TXT（重要）</h3>
                            <span id="continue-original-status-badge" class="text-xs px-2 py-1 rounded ${this.continueData.originalText ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.continueData.originalText ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <p class="text-xs text-slate-400 mb-2">导入原文用于分析最后一章，确保续写第一章能自然承接</p>
                        <button id="import-continue-original-btn" class="btn btn-secondary text-sm w-full">导入TXT文件</button>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">📊 剧情分析</h3>
                            <span id="continue-plot-status-badge" class="text-xs px-2 py-1 rounded ${this.continueData.plotData ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.continueData.plotData ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-continue-plot-btn" class="btn btn-secondary text-sm flex-1">使用分析</button>
                            <button id="import-continue-plot-btn" class="btn btn-secondary text-sm flex-1">导入文件</button>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">🎨 文风分析</h3>
                            <span id="continue-style-status-badge" class="text-xs px-2 py-1 rounded ${this.continueData.styleData ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.continueData.styleData ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-continue-style-btn" class="btn btn-secondary text-sm flex-1">使用分析</button>
                            <button id="import-continue-style-btn" class="btn btn-secondary text-sm flex-1">导入文件</button>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">👤 角色卡</h3>
                            <span id="continue-role-status-badge" class="text-xs px-2 py-1 rounded ${this.continueData.roleCards ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.continueData.roleCards ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-continue-role-btn" class="btn btn-secondary text-sm flex-1">使用已有</button>
                            <button id="import-continue-role-btn" class="btn btn-secondary text-sm flex-1">导入文件</button>
                        </div>
                    </div>
                </div>
                
                <div class="border border-slate-700 rounded-lg p-4 mb-6">
                    <h3 class="font-medium mb-3">📝 续写需求说明</h3>
                    <p class="text-xs text-slate-400 mb-2">描述您希望续写的方向、风格变化、情节发展等要求</p>
                    <textarea id="continue-user-requirements" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm h-24 resize-none focus:border-blue-500 focus:outline-none" placeholder="例如：&#10;1. 延续原文的悬疑风格，增加更多转折&#10;2. 主角需要面对新的挑战&#10;3. 保持原有角色性格，增加新角色...">${this.continueData.userRequirements || ''}</textarea>
                </div>
                
                ${this.continueData.lastOriginalChapter ? `
                <div class="bg-slate-700/50 rounded-lg p-4 mb-4">
                    <h4 class="text-sm font-medium mb-2">📖 已识别原文最后一章</h4>
                    <div class="text-xs text-slate-400">
                        <p>章节：第${this.continueData.lastOriginalChapter.chapterNum}章 ${this.continueData.lastOriginalChapter.title || ''}</p>
                        <p>字数：${this.continueData.lastOriginalChapter.content?.length || 0}字</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `
    }
    
    renderContinueContentArea(chapter) {
        if (!chapter) {
            return '<div class="text-center text-slate-400 py-12">请选择章节</div>'
        }
        
        return `
            <div class="flex flex-col h-full">
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium">📖 第${chapter.chapterNum}章 ${chapter.title || ''}</h3>
                        <span class="text-sm text-slate-400">${chapter.wordCount || 0}字</span>
                    </div>
                    ${chapter.outline ? `
                        <div class="bg-slate-700 rounded p-3 text-sm text-slate-300">
                            <span class="text-slate-400">梗概：</span>${chapter.outline}
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex-1 flex flex-col">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium">✏️ 续写内容</h3>
                        <span class="text-sm text-slate-400">${chapter.content ? chapter.content.length + '字' : '待生成'}</span>
                    </div>
                    <div class="flex-1 bg-slate-700 rounded-lg p-4 overflow-y-auto">
                        ${chapter.content ? 
                            `<textarea id="continue-content-textarea" class="w-full h-full bg-transparent border-none resize-none focus:outline-none text-sm">${chapter.content}</textarea>` : 
                            '<div class="text-slate-400 text-sm">点击"续写当前章节"开始生成</div>'
                        }
                    </div>
                </div>
                
                <div class="mt-4 bg-slate-700 rounded-lg p-3">
                    <div class="flex items-center justify-between text-sm">
                        <div>
                            <span class="text-slate-400">目标字数：</span>
                            <span>${this.continueData.wordCountSettings.targetWords}字</span>
                            <span class="mx-2">|</span>
                            <span class="text-slate-400">范围：</span>
                            <span>${this.continueData.wordCountSettings.minWords} ~ ${this.continueData.wordCountSettings.maxWords}字</span>
                        </div>
                        <div>
                            ${chapter.content ? `<span class="${chapter.content.length >= this.continueData.wordCountSettings.minWords && chapter.content.length <= this.continueData.wordCountSettings.maxWords ? 'text-green-400' : 'text-yellow-400'}">${chapter.content.length >= this.continueData.wordCountSettings.minWords && chapter.content.length <= this.continueData.wordCountSettings.maxWords ? '✓ 达标' : '⚠ 未达标'}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    setupContinueNewEvents() {
        const chapterItems = document.querySelectorAll('.continue-chapter-item')
        const searchInput = document.getElementById('search-continue-chapter-input')
        
        chapterItems.forEach(item => {
            item.onclick = () => {
                const index = parseInt(item.dataset.index)
                this.continueData.currentChapterIndex = index
                this.renderContinue()
            }
        })
        
        if (searchInput) {
            searchInput.oninput = (e) => {
                const keyword = e.target.value.toLowerCase()
                chapterItems.forEach(item => {
                    const text = item.textContent.toLowerCase()
                    item.style.display = text.includes(keyword) ? '' : 'none'
                })
            }
        }
        
        const targetWordsInput = document.getElementById('target-words-continue')
        const minWordsInput = document.getElementById('min-words-continue')
        const maxWordsInput = document.getElementById('max-words-continue')
        
        if (targetWordsInput) {
            targetWordsInput.oninput = () => {
                this.continueData.wordCountSettings.targetWords = parseInt(targetWordsInput.value)
                document.getElementById('target-words-value').textContent = targetWordsInput.value + '字'
            }
        }
        
        if (minWordsInput) {
            minWordsInput.onchange = () => {
                this.continueData.wordCountSettings.minWords = parseInt(minWordsInput.value)
            }
        }
        
        if (maxWordsInput) {
            maxWordsInput.onchange = () => {
                this.continueData.wordCountSettings.maxWords = parseInt(maxWordsInput.value)
            }
        }
        
        const presetBtns = document.querySelectorAll('.preset-btn')
        presetBtns.forEach(btn => {
            btn.onclick = () => {
                const target = parseInt(btn.dataset.target)
                this.continueData.wordCountSettings.targetWords = target
                this.continueData.wordCountSettings.minWords = Math.floor(target * 0.6)
                this.continueData.wordCountSettings.maxWords = Math.floor(target * 1.6)
                this.renderContinue()
            }
        })
        
        const startChapterInput = document.getElementById('start-chapter')
        const endChapterInput = document.getElementById('end-chapter')
        
        if (startChapterInput) {
            startChapterInput.onchange = () => {
                this.continueData.startChapter = parseInt(startChapterInput.value)
                this.initContinueChapters()
            }
        }
        
        if (endChapterInput) {
            endChapterInput.onchange = () => {
                this.continueData.endChapter = parseInt(endChapterInput.value)
                this.initContinueChapters()
            }
        }
        
        const outlineTextarea = document.getElementById('continue-outline')
        if (outlineTextarea) {
            outlineTextarea.oninput = () => {
                this.continueData.outline = outlineTextarea.value
            }
        }
        
        const saveBtn = document.getElementById('save-continue-draft-btn')
        if (saveBtn) {
            saveBtn.onclick = () => this.saveContinueDraft()
        }
        
        const loadBtn = document.getElementById('load-continue-draft-btn')
        if (loadBtn) {
            loadBtn.onclick = () => {
                this.loadContinueDraft()
                this.renderContinue()
            }
        }
        
        const usePlotBtn = document.getElementById('use-continue-plot-btn')
        if (usePlotBtn) {
            usePlotBtn.onclick = () => this.useContinuePlotData()
        }
        
        const importPlotBtn = document.getElementById('import-continue-plot-btn')
        if (importPlotBtn) {
            importPlotBtn.onclick = () => this.importContinuePlotFile()
        }
        
        const useStyleBtn = document.getElementById('use-continue-style-btn')
        if (useStyleBtn) {
            useStyleBtn.onclick = () => this.useContinueStyleData()
        }
        
        const importStyleBtn = document.getElementById('import-continue-style-btn')
        if (importStyleBtn) {
            importStyleBtn.onclick = () => this.importContinueStyleFile()
        }
        
        const useRoleBtn = document.getElementById('use-continue-role-btn')
        if (useRoleBtn) {
            useRoleBtn.onclick = () => this.useContinueRoleData()
        }
        
        const importRoleBtn = document.getElementById('import-continue-role-btn')
        if (importRoleBtn) {
            importRoleBtn.onclick = () => this.importContinueRoleFile()
        }
        
        const importOriginalBtn = document.getElementById('import-continue-original-btn')
        if (importOriginalBtn) {
            importOriginalBtn.onclick = () => this.importContinueOriginalText()
        }
        
        const userRequirementsTextarea = document.getElementById('continue-user-requirements')
        if (userRequirementsTextarea) {
            userRequirementsTextarea.oninput = () => {
                this.continueData.userRequirements = userRequirementsTextarea.value
            }
        }
        
        const generateOutlineBtn = document.getElementById('generate-outline-btn')
        if (generateOutlineBtn) {
            generateOutlineBtn.onclick = () => this.generateOutlines()
        }
        
        const continueSingleBtn = document.getElementById('continue-single-btn')
        if (continueSingleBtn) {
            continueSingleBtn.onclick = () => this.continueSingleChapter()
        }
        
        const continueAllBtn = document.getElementById('continue-all-btn')
        if (continueAllBtn) {
            continueAllBtn.onclick = () => this.continueAllChapters()
        }
        
        const exportBtn = document.getElementById('export-continue-btn')
        if (exportBtn) {
            exportBtn.onclick = () => this.exportContinueResults()
        }
    }
    
    initContinueChapters() {
        const start = this.continueData.startChapter
        const end = this.continueData.endChapter
        
        if (!this.continueData.chapters) {
            this.continueData.chapters = []
        }
        
        for (let i = start; i <= end; i++) {
            if (!this.continueData.chapters.find(c => c.chapterNum === i)) {
                this.continueData.chapters.push({
                    chapterNum: i,
                    title: `第${i}章`,
                    outline: '',
                    content: '',
                    wordCount: 0
                })
            }
        }
        
        this.continueData.chapters = this.continueData.chapters
            .filter(c => c.chapterNum >= start && c.chapterNum <= end)
            .sort((a, b) => a.chapterNum - b.chapterNum)
    }
    
    useContinuePlotData() {
        const analysisData = WorkspaceManager.getWorkspaceData('analysis')
        if (!analysisData || !analysisData.plotAnalysis) {
            UIHelper.showToast('没有找到分析数据，请先进行AI分析', 'warning')
            return
        }
        
        this.continueData.plotData = analysisData.plotAnalysis
        document.getElementById('continue-plot-status-badge').textContent = '已导入'
        document.getElementById('continue-plot-status-badge').classList.remove('bg-slate-700')
        document.getElementById('continue-plot-status-badge').classList.add('bg-green-600')
        UIHelper.showToast('剧情分析数据已导入', 'success')
        this.checkContinueDataReady()
    }
    
    useContinueStyleData() {
        const analysisData = WorkspaceManager.getWorkspaceData('analysis')
        if (!analysisData || !analysisData.styleAnalysis) {
            UIHelper.showToast('没有找到分析数据，请先进行AI分析', 'warning')
            return
        }
        
        this.continueData.styleData = analysisData.styleAnalysis
        document.getElementById('continue-style-status-badge').textContent = '已导入'
        document.getElementById('continue-style-status-badge').classList.remove('bg-slate-700')
        document.getElementById('continue-style-status-badge').classList.add('bg-green-600')
        UIHelper.showToast('文风分析数据已导入', 'success')
        this.checkContinueDataReady()
    }
    
    useContinueRoleData() {
        const cards = RoleCardManager.getRoleCards()
        if (!cards || cards.length === 0) {
            UIHelper.showToast('没有找到角色卡数据', 'warning')
            return
        }
        
        this.continueData.roleCards = cards
        document.getElementById('continue-role-status-badge').textContent = '已导入'
        document.getElementById('continue-role-status-badge').classList.remove('bg-slate-700')
        document.getElementById('continue-role-status-badge').classList.add('bg-green-600')
        UIHelper.showToast('角色卡数据已导入', 'success')
    }
    
    importContinuePlotFile() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                const result = await FileHandler.importJson(file)
                const plotData = result.plotAnalysis || result.data?.plotAnalysis || result
                
                if (!plotData) {
                    UIHelper.showToast('剧情分析数据格式不正确', 'error')
                    return
                }
                
                this.continueData.plotData = plotData
                const badge = document.getElementById('continue-plot-status-badge')
                if (badge) {
                    badge.textContent = '已导入'
                    badge.classList.remove('bg-slate-700')
                    badge.classList.add('bg-green-600')
                }
                UIHelper.showToast('剧情分析数据已导入', 'success')
                this.checkContinueDataReady()
            } catch (error) {
                UIHelper.showToast('导入失败：' + error.message, 'error')
            }
        }
        input.click()
    }
    
    importContinueStyleFile() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                const result = await FileHandler.importJson(file)
                const styleData = result.styleAnalysis || result.data?.styleAnalysis || result
                
                if (!styleData) {
                    UIHelper.showToast('文风分析数据格式不正确', 'error')
                    return
                }
                
                this.continueData.styleData = styleData
                const badge = document.getElementById('continue-style-status-badge')
                if (badge) {
                    badge.textContent = '已导入'
                    badge.classList.remove('bg-slate-700')
                    badge.classList.add('bg-green-600')
                }
                UIHelper.showToast('文风分析数据已导入', 'success')
                this.checkContinueDataReady()
            } catch (error) {
                UIHelper.showToast('导入失败：' + error.message, 'error')
            }
        }
        input.click()
    }
    
    importContinueRoleFile() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                const result = await FileHandler.importJson(file)
                const roleCards = result.roleCards || result.data?.roleCards || (Array.isArray(result) ? result : null)
                
                if (!roleCards || !Array.isArray(roleCards)) {
                    UIHelper.showToast('角色卡数据格式不正确', 'error')
                    return
                }
                
                this.continueData.roleCards = roleCards
                const badge = document.getElementById('continue-role-status-badge')
                if (badge) {
                    badge.textContent = '已导入'
                    badge.classList.remove('bg-slate-700')
                    badge.classList.add('bg-green-600')
                }
                UIHelper.showToast('角色卡数据已导入', 'success')
            } catch (error) {
                UIHelper.showToast('导入失败：' + error.message, 'error')
            }
        }
        input.click()
    }
    
    checkContinueDataReady() {
        if (this.continueData.plotData && this.continueData.styleData) {
            this.initContinueChapters()
            this.renderContinue()
        }
    }
    
    async generateOutlines() {
        if (!this.continueData.plotData || !this.continueData.styleData) {
            UIHelper.showToast('请先导入剧情分析和文风分析数据', 'warning')
            return
        }
        
        const btn = document.getElementById('generate-outline-btn')
        btn.disabled = true
        btn.textContent = '⏳ 生成中...'
        
        try {
            for (let chapter of this.continueData.chapters) {
                const outline = await this.generateChapterOutline(chapter.chapterNum)
                chapter.outline = outline
            }
            this.renderContinue()
            UIHelper.showToast('梗概生成完成', 'success')
        } catch (error) {
            UIHelper.showToast('生成失败：' + error.message, 'error')
        } finally {
            btn.disabled = false
            btn.textContent = '📝 生成章节梗概'
        }
    }
    
    async generateChapterOutline(chapterNum) {
        const isFirstChapter = chapterNum === this.continueData.startChapter
        const chapterIndex = this.continueData.chapters.findIndex(c => c.chapterNum === chapterNum)
        
        let previousChapterInfo = ''
        let contextInfo = ''
        
        if (isFirstChapter) {
            if (this.continueData.lastOriginalChapter) {
                previousChapterInfo = `
## 原文最后一章内容（续写第一章需要承接此内容）
章节：第${this.continueData.lastOriginalChapter.chapterNum}章 ${this.continueData.lastOriginalChapter.title || ''}
内容摘要：${this.continueData.lastOriginalChapter.content ? this.continueData.lastOriginalChapter.content.substring(0, 1500) + '...' : '无'}
结尾状态：${this.continueData.lastOriginalChapter.endingStatus || '未知'}
`
            }
        } else {
            const prevChapter = this.continueData.chapters[chapterIndex - 1]
            if (prevChapter && prevChapter.outline) {
                previousChapterInfo = `
## 前一章（第${prevChapter.chapterNum}章）梗概
${prevChapter.outline}

## 前一章结尾内容
${prevChapter.content ? prevChapter.content.substring(Math.max(0, prevChapter.content.length - 800)) : '无'}
`
            }
        }
        
        const plotAnalysisSummary = this.continueData.plotData ? `
## 原文剧情分析
- 主要角色：${this.continueData.plotData.mainCharacters?.map(c => c.name || c).join('、') || '未知'}
- 核心冲突：${this.continueData.plotData.coreConflict || this.continueData.plotData.mainConflict || '未知'}
- 故事走向：${this.continueData.plotData.storyDirection || this.continueData.plotData.plotTrend || '未知'}
- 关键事件：${this.continueData.plotData.keyEvents?.slice(0, 5).map(e => e.description || e).join('；') || '未知'}
- 未解决线索：${this.continueData.plotData.unresolvedThreads?.join('；') || '未知'}
- 原文结局状态：${this.continueData.plotData.endingStatus || '开放式结局'}
` : '暂无剧情分析数据'

        const styleGuide = this.continueData.styleData ? `
## 文风要求
- 叙事风格：${this.continueData.styleData.narrativeStyle || this.continueData.styleData.narrative?.style || '保持原文风格'}
- 对话风格：${this.continueData.styleData.dialogueStyle || this.continueData.styleData.dialogue?.style || '自然流畅'}
- 描写特点：${this.continueData.styleData.descriptionStyle || this.continueData.styleData.description?.style || '细腻生动'}
- 语言特点：${this.continueData.styleData.languageFeatures?.join('、') || '简洁明快'}
- 禁忌事项：${this.continueData.styleData.taboos?.join('、') || '无'}
` : '保持原文风格'

        const taskInstructions = `你是一位专业的小说续写专家。请根据提供的原文信息、剧情分析和用户要求，为续写的第${chapterNum}章创作一个全新的续写梗概。

## 续写要求
${this.continueData.userRequirements || this.continueData.outline || '延续原剧情走向，创造新的故事发展'}

## 字数要求
目标字数：${this.continueData.wordCountSettings.targetWords}字
字数范围：${this.continueData.wordCountSettings.minWords} ~ ${this.continueData.wordCountSettings.maxWords}字

${previousChapterInfo}

${plotAnalysisSummary}

${styleGuide}

## 角色信息
${this.continueData.roleCards?.map(r => `- ${r.name}：${r.personality || r.description || ''}`).join('\n') || '参考剧情分析中的角色信息'}

## 续写创作原则
1. **承接性**：${isFirstChapter ? '续写第一章必须自然承接原文最后一章的剧情和氛围' : '必须承接前一章的剧情发展和人物状态'}
2. **创新性**：续写内容应该是全新的故事发展，不是重复原文内容
3. **合理性**：剧情发展要符合人物性格和故事逻辑
4. **连贯性**：保持原文的叙事节奏和文风特点
5. **吸引力**：设置适当的悬念和冲突，保持读者兴趣

请直接输出第${chapterNum}章的续写梗概（150-250字），包含：
- 本章主要事件
- 人物行动和变化
- 情节转折点
- 与前文的承接关系

不要包含任何解释或说明，只输出梗概内容。`

        const messages = [
            { role: 'user', content: taskInstructions }
        ]
        const response = await apiClient.chat(messages)
        return response
    }
    
    async continueSingleChapter() {
        const chapter = this.continueData.chapters[this.continueData.currentChapterIndex]
        if (!chapter) {
            UIHelper.showToast('请先选择章节', 'warning')
            return
        }
        
        if (!this.continueData.plotData || !this.continueData.styleData) {
            UIHelper.showToast('请先导入剧情分析和文风分析数据', 'warning')
            return
        }
        
        const btn = document.getElementById('continue-single-btn')
        btn.disabled = true
        btn.textContent = '⏳ 生成中...'
        
        try {
            const content = await this.generateChapterContent(chapter)
            chapter.content = content
            chapter.wordCount = content.length
            this.renderContinue()
            UIHelper.showToast('续写完成', 'success')
        } catch (error) {
            UIHelper.showToast('续写失败：' + error.message, 'error')
        } finally {
            btn.disabled = false
            btn.textContent = '▶️ 续写当前章节'
        }
    }
    
    async generateChapterContent(chapter) {
        const chapterNum = chapter.chapterNum
        const isFirstChapter = chapterNum === this.continueData.startChapter
        const chapterIndex = this.continueData.chapters.findIndex(c => c.chapterNum === chapterNum)
        
        let previousContentInfo = ''
        
        if (isFirstChapter) {
            if (this.continueData.lastOriginalChapter) {
                previousContentInfo = `
## 原文最后一章（续写第一章需要自然承接）
第${this.continueData.lastOriginalChapter.chapterNum}章 ${this.continueData.lastOriginalChapter.title || ''}

${this.continueData.lastOriginalChapter.content ? this.continueData.lastOriginalChapter.content.substring(Math.max(0, this.continueData.lastOriginalChapter.content.length - 2000)) : '无内容'}

【续写要求：第一章开头必须自然承接上文，保持人物状态、场景氛围和叙事节奏的连贯性】
`
            }
        } else {
            const prevChapter = this.continueData.chapters[chapterIndex - 1]
            if (prevChapter && prevChapter.content) {
                previousContentInfo = `
## 前一章（第${prevChapter.chapterNum}章）结尾内容

${prevChapter.content.substring(Math.max(0, prevChapter.content.length - 1500))}

【续写要求：本章开头必须承接前一章结尾的人物状态和剧情发展】
`
            }
        }

        const styleGuide = this.continueData.styleData ? `
## 文风指南
- 叙事风格：${this.continueData.styleData.narrativeStyle || this.continueData.styleData.narrative?.style || '保持原文风格'}
- 对话风格：${this.continueData.styleData.dialogueStyle || this.continueData.styleData.dialogue?.style || '自然流畅'}
- 描写特点：${this.continueData.styleData.descriptionStyle || this.continueData.styleData.description?.style || '细腻生动'}
- 语言特点：${this.continueData.styleData.languageFeatures?.join('、') || '简洁明快'}
- 常用句式：${this.continueData.styleData.commonSentencePatterns?.slice(0, 3).join('；') || '无特殊要求'}
- 禁忌事项：${this.continueData.styleData.taboos?.join('、') || '无'}
` : '保持原文风格'

        const characterGuide = this.continueData.roleCards?.length > 0 ? `
## 主要角色设定
${this.continueData.roleCards.map(r => `
### ${r.name}
- 性格：${r.personality || '未知'}
- 外貌：${r.appearance || '未描述'}
- 说话风格：${r.speakingStyle || r.catchphrases?.join('、') || '自然'}
- 行为特点：${r.behaviorTraits?.join('、') || '无特殊设定'}
- 禁忌：${r.taboos?.join('、') || '无'}
`).join('\n')}
` : ''

        const taskInstructions = `你是一位专业的小说作家。请根据提供的章节梗概、上下文信息和文风要求，撰写完整的续写章节内容。

## 章节信息
章节：第${chapterNum}章
标题：${chapter.title || `第${chapterNum}章`}

## 章节梗概
${chapter.outline || `第${chapterNum}章的续写内容`}

${previousContentInfo}

## 字数要求
目标字数：${this.continueData.wordCountSettings.targetWords}字
字数范围：${this.continueData.wordCountSettings.minWords} ~ ${this.continueData.wordCountSettings.maxWords}字
【重要：字数必须在此范围内，不足或超出都不合格】

${styleGuide}

${characterGuide}

## 写作要求
1. **承接自然**：${isFirstChapter ? '开头必须自然承接原文最后一章的结尾' : '开头必须承接前一章的结尾'}
2. **情节发展**：严格按照梗概发展剧情，但可以适当丰富细节
3. **人物塑造**：保持人物性格一致性，对话要符合人物特点
4. **文风统一**：保持与原文相似的叙事风格和语言特点
5. **节奏把控**：注意叙事节奏，张弛有度
6. **细节描写**：适当加入环境、心理、动作等细节描写
7. **悬念设置**：章节结尾可以设置悬念，吸引读者继续阅读

请直接输出章节正文内容，不要包含章节标题、解释或说明。内容要完整，有开头、发展和结尾。`

        const messages = [
            { role: 'user', content: taskInstructions }
        ]
        const response = await apiClient.chat(messages)
        return response
    }
    
    async continueAllChapters() {
        if (!this.continueData.chapters || this.continueData.chapters.length === 0) {
            UIHelper.showToast('没有章节数据', 'warning')
            return
        }
        
        const btn = document.getElementById('continue-all-btn')
        const stopBtn = document.getElementById('stop-continue-btn')
        
        btn.disabled = true
        btn.classList.add('hidden')
        stopBtn.classList.remove('hidden')
        
        this.continueData.isGenerating = true
        
        for (let i = 0; i < this.continueData.chapters.length; i++) {
            if (!this.continueData.isGenerating) break
            
            this.continueData.currentChapterIndex = i
            const chapter = this.continueData.chapters[i]
            
            try {
                const content = await this.generateChapterContent(chapter)
                chapter.content = content
                chapter.wordCount = content.length
                this.renderContinue()
            } catch (error) {
                console.error(`第${chapter.chapterNum}章生成失败:`, error)
            }
        }
        
        this.continueData.isGenerating = false
        btn.disabled = false
        btn.classList.remove('hidden')
        stopBtn.classList.add('hidden')
        
        UIHelper.showToast('批量续写完成', 'success')
    }
    
    exportContinueResults() {
        const chaptersWithContent = this.continueData.chapters.filter(c => c.content)
        if (chaptersWithContent.length === 0) {
            UIHelper.showToast('没有续写结果可导出', 'warning')
            return
        }
        
        let content = ''
        chaptersWithContent
            .sort((a, b) => a.chapterNum - b.chapterNum)
            .forEach(chapter => {
                content += `第${chapter.chapterNum}章 ${chapter.title || ''}\n\n`
                content += chapter.content
                content += '\n\n'
            })
        
        const filename = `续写结果_${new Date().toISOString().slice(0, 10)}.txt`
        FileHandler.exportTxt(content, filename)
    }
    
    importContinueOriginalText() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.txt'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                const text = await file.text()
                this.continueData.originalText = text
                this.parseOriginalChapters(text)
                
                const badge = document.getElementById('continue-original-status-badge')
                if (badge) {
                    badge.textContent = '已导入'
                    badge.classList.remove('bg-slate-700')
                    badge.classList.add('bg-green-600')
                }
                
                UIHelper.showToast('原文导入成功，已识别最后一章', 'success')
                this.renderContinue()
            } catch (error) {
                UIHelper.showToast('导入失败：' + error.message, 'error')
            }
        }
        input.click()
    }
    
    parseOriginalChapters(text) {
        const chapterPattern = /第[一二三四五六七八九十百千万零\d]+章[^\n]*/g
        const matches = [...text.matchAll(chapterPattern)]
        
        this.continueData.originalChapters = []
        
        if (matches.length === 0) {
            this.continueData.originalChapters.push({
                chapterNum: 1,
                title: '全文',
                content: text,
                wordCount: text.length
            })
        } else {
            for (let i = 0; i < matches.length; i++) {
                const start = matches[i].index
                const end = i < matches.length - 1 ? matches[i + 1].index : text.length
                const content = text.substring(start, end).trim()
                
                this.continueData.originalChapters.push({
                    chapterNum: i + 1,
                    title: matches[i][0].trim(),
                    content: content,
                    wordCount: content.length
                })
            }
        }
        
        if (this.continueData.originalChapters.length > 0) {
            this.continueData.lastOriginalChapter = this.continueData.originalChapters[this.continueData.originalChapters.length - 1]
            
            const lastChapter = this.continueData.lastOriginalChapter
            const lastContent = lastChapter.content || ''
            
            if (lastContent.length > 200) {
                const lastParagraphs = lastContent.split('\n').filter(p => p.trim()).slice(-3)
                lastChapter.endingStatus = this.analyzeEndingStatus(lastParagraphs.join('\n'))
            }
        }
    }
    
    analyzeEndingStatus(endingText) {
        const suspenseKeywords = ['悬念', '未完待续', '究竟', '到底', '如何', '怎样', '？', '...', '待续']
        const openEndingKeywords = ['未来', '也许', '可能', '或许', '不知道', '不确定']
        const closedEndingKeywords = ['结束', '完结', '终于', '最后', '从此', '幸福']
        
        let suspenseScore = 0
        let openScore = 0
        let closedScore = 0
        
        suspenseKeywords.forEach(kw => {
            if (endingText.includes(kw)) suspenseScore++
        })
        openEndingKeywords.forEach(kw => {
            if (endingText.includes(kw)) openScore++
        })
        closedEndingKeywords.forEach(kw => {
            if (endingText.includes(kw)) closedScore++
        })
        
        if (suspenseScore > closedScore && suspenseScore > openScore) {
            return '悬念结尾，留有伏笔'
        } else if (closedScore > openScore) {
            return '完整结尾，故事告一段落'
        } else if (openScore > 0) {
            return '开放式结尾，留有余地'
        }
        return '自然过渡'
    }
    
    loadContinueDraft() {
        const draft = WorkspaceManager.getWorkspaceData('drafts.continue')
        if (draft) {
            try {
                this.continueData = draft
                UIHelper.showToast('已加载上次保存的草稿', 'info')
            } catch (error) {
                this.initContinueData()
            }
        } else {
            this.initContinueData()
        }
    }
    
    initContinueData() {
        this.continueData = {
            originalText: null,
            originalChapters: [],
            lastOriginalChapter: null,
            plotData: null,
            styleData: null,
            roleCards: null,
            outline: '',
            userRequirements: '',
            startChapter: 1,
            endChapter: 10,
            outlines: [],
            chapters: [],
            currentStep: 1,
            isGenerating: false,
            generateController: null,
            currentChapterIndex: 0,
            wordCountSettings: {
                targetWords: 5000,
                minWords: 3000,
                maxWords: 8000
            }
        }
    }
    
    saveContinueDraft() {
        WorkspaceManager.setWorkspaceData('drafts.continue', this.continueData)
        UIHelper.showToast('草稿已保存', 'success')
    }
    
    renderStepIndicator(currentStep) {
        const steps = [
            { num: 1, name: '导入数据' },
            { num: 2, name: '填写需求' },
            { num: 3, name: '生成梗概' },
            { num: 4, name: '编辑确认' },
            { num: 5, name: '生成正文' },
            { num: 6, name: '预览导出' }
        ]
        
        return `
            <div class="flex items-center justify-between">
                ${steps.map((step, index) => `
                    <div class="flex items-center">
                        <div class="flex flex-col items-center">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                step.num < currentStep ? 'bg-green-500 text-white' :
                                step.num === currentStep ? 'bg-blue-500 text-white' :
                                'bg-slate-700 text-slate-400'
                            }">
                                ${step.num < currentStep ? '✓' : step.num}
                            </div>
                            <span class="text-xs mt-1 ${step.num === currentStep ? 'text-blue-400' : 'text-slate-500'}">${step.name}</span>
                        </div>
                        ${index < steps.length - 1 ? `
                            <div class="w-16 h-1 mx-2 ${step.num < currentStep ? 'bg-green-500' : 'bg-slate-700'}"></div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `
    }
    
    renderContinueStep1() {
        return `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤1：导入数据</h2>
                <p class="text-slate-400 mb-6">请导入剧情分析、文风分析和角色卡数据，这些数据将用于AI续写</p>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">剧情分析JSON</h3>
                            <span id="plot-status-badge" class="text-xs px-2 py-1 rounded ${this.continueData.plotData ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.continueData.plotData ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div id="plot-data-status" class="text-sm text-slate-400 mb-3 min-h-[40px]">
                            ${this.continueData.plotData ? 
                                `${this.continueData.plotData.totalChapters || 0}章 | ${this.continueData.plotData.characters ? this.continueData.plotData.characters.length : 0}角色` : 
                                '点击下方按钮导入数据'}
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-analysis-plot-btn" class="btn btn-secondary text-sm flex-1">
                                使用分析结果
                            </button>
                            <button id="import-plot-btn" class="btn btn-secondary text-sm flex-1">
                                导入文件
                            </button>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">文风分析JSON</h3>
                            <span id="style-status-badge" class="text-xs px-2 py-1 rounded ${this.continueData.styleData ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.continueData.styleData ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div id="style-data-status" class="text-sm text-slate-400 mb-3 min-h-[40px]">
                            ${this.continueData.styleData ? 
                                `${this.continueData.styleData.rhythm?.pace || '未知'}节奏` : 
                                '点击下方按钮导入数据'}
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-analysis-style-btn" class="btn btn-secondary text-sm flex-1">
                                使用分析结果
                            </button>
                            <button id="import-style-btn" class="btn btn-secondary text-sm flex-1">
                                导入文件
                            </button>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">角色卡</h3>
                            <span id="role-status-badge" class="text-xs px-2 py-1 rounded ${this.continueData.roleCards ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.continueData.roleCards ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div id="role-data-status" class="text-sm text-slate-400 mb-3 min-h-[40px]">
                            ${this.continueData.roleCards ? 
                                `${this.continueData.roleCards.length}个角色` : 
                                '点击下方按钮导入数据'}
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-role-cards-btn" class="btn btn-secondary text-sm flex-1">
                                使用已有角色
                            </button>
                            <button id="import-role-btn" class="btn btn-secondary text-sm flex-1">
                                导入文件
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="bg-slate-700 rounded-lg p-4 mb-4">
                    <h3 class="font-medium mb-2">数据要求说明</h3>
                    <ul class="text-sm text-slate-400 space-y-1">
                        <li>• 剧情分析：包含章节摘要、角色列表、剧情走向等信息</li>
                        <li>• 文风分析：包含叙事节奏、对话风格、描写特点等信息</li>
                        <li>• 角色卡：包含角色姓名、性格、外貌、人际关系等信息</li>
                    </ul>
                </div>
                
                <div class="flex justify-end">
                    <button id="next-step-1-btn" class="btn btn-primary" disabled>
                        下一步：填写需求
                    </button>
                </div>
            </div>
        `
    }
    
    setupContinueEvents() {
        const nextBtn = document.getElementById('next-step-1-btn')
        
        const saveDraftBtn = document.getElementById('save-draft-btn')
        if (saveDraftBtn) {
            saveDraftBtn.onclick = () => this.saveContinueDraft()
        }
        
        const loadDraftBtn = document.getElementById('load-draft-btn')
        if (loadDraftBtn) {
            loadDraftBtn.onclick = () => {
                if (confirm('加载草稿将覆盖当前进度，确定继续吗？')) {
                    this.loadContinueDraft()
                    this.renderContinue()
                }
            }
        }
        
        const importOriginalBtn = document.getElementById('import-continue-original-btn')
        if (importOriginalBtn) {
            importOriginalBtn.onclick = () => this.importContinueOriginalText()
        }
        
        const userRequirementsTextarea = document.getElementById('continue-user-requirements')
        if (userRequirementsTextarea) {
            userRequirementsTextarea.oninput = () => {
                this.continueData.userRequirements = userRequirementsTextarea.value
            }
        }
        
        document.getElementById('use-analysis-plot-btn').onclick = () => {
            const analysisData = WorkspaceManager.getWorkspaceData('analysis')
            if (!analysisData || !analysisData.plotAnalysis) {
                UIHelper.showToast('请先进行AI文本分析', 'warning')
                return
            }
            
            try {
                const plotData = analysisData.plotAnalysis
                
                if (!this.validatePlotData(plotData)) {
                    UIHelper.showToast('剧情分析数据格式不正确', 'error')
                    return
                }
                
                this.continueData.plotData = plotData
                this.updateContinueDataStatus('plot', this.continueData.plotData)
                UIHelper.showToast('剧情分析数据已导入', 'success')
            } catch (error) {
                UIHelper.showToast('数据解析失败：' + error.message, 'error')
            }
        }
        
        document.getElementById('import-plot-btn').onclick = () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                try {
                    const result = await FileHandler.importJson(file)
                    const plotData = result.data.plotAnalysis || result.data
                    
                    if (!this.validatePlotData(plotData)) {
                        UIHelper.showToast('剧情分析数据格式不正确', 'error')
                        return
                    }
                    
                    this.continueData.plotData = plotData
                    this.updateContinueDataStatus('plot', this.continueData.plotData)
                    UIHelper.showToast('剧情分析数据已导入', 'success')
                } catch (error) {
                    UIHelper.showToast('导入失败：' + error.message, 'error')
                }
            }
            input.click()
        }
        
        document.getElementById('use-analysis-style-btn').onclick = () => {
            const analysisData = WorkspaceManager.getWorkspaceData('analysis')
            if (!analysisData || !analysisData.styleAnalysis) {
                UIHelper.showToast('请先进行AI文本分析', 'warning')
                return
            }
            
            try {
                const styleData = analysisData.styleAnalysis
                
                if (!this.validateStyleData(styleData)) {
                    UIHelper.showToast('文风分析数据格式不正确', 'error')
                    return
                }
                
                this.continueData.styleData = styleData
                this.updateContinueDataStatus('style', this.continueData.styleData)
                UIHelper.showToast('文风分析数据已导入', 'success')
            } catch (error) {
                UIHelper.showToast('数据解析失败：' + error.message, 'error')
            }
        }
        
        document.getElementById('import-style-btn').onclick = () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                try {
                    const result = await FileHandler.importJson(file)
                    const styleData = result.data.styleAnalysis || result.data
                    
                    if (!this.validateStyleData(styleData)) {
                        UIHelper.showToast('文风分析数据格式不正确', 'error')
                        return
                    }
                    
                    this.continueData.styleData = styleData
                    this.updateContinueDataStatus('style', this.continueData.styleData)
                    UIHelper.showToast('文风分析数据已导入', 'success')
                } catch (error) {
                    UIHelper.showToast('导入失败：' + error.message, 'error')
                }
            }
            input.click()
        }
        
        document.getElementById('use-role-cards-btn').onclick = () => {
            const cards = RoleCardManager.getRoleCards()
            if (cards.length === 0) {
                UIHelper.showToast('没有角色卡，请先创建或导入', 'warning')
                return
            }
            
            this.continueData.roleCards = cards
            this.updateContinueDataStatus('role', cards)
            UIHelper.showToast(`已导入${cards.length}个角色卡`, 'success')
        }
        
        document.getElementById('import-role-btn').onclick = () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                try {
                    const result = await FileHandler.importJson(file)
                    const cards = result.data.roleCards || result.data
                    if (Array.isArray(cards)) {
                        this.continueData.roleCards = cards
                        this.updateContinueDataStatus('role', cards)
                        UIHelper.showToast(`已导入${cards.length}个角色卡`, 'success')
                    } else {
                        throw new Error('角色卡数据格式错误')
                    }
                } catch (error) {
                    UIHelper.showToast('导入失败：' + error.message, 'error')
                }
            }
            input.click()
        }
        
        nextBtn.onclick = () => {
            this.continueData.currentStep = 2
            this.renderContinueStep2()
        }
        
        this.checkContinueStep1Complete()
    }
    
    validatePlotData(data) {
        return data && (data.totalChapters || data.chapters || data.characters)
    }
    
    validateStyleData(data) {
        return data && (data.rhythm || data.dialogue || data.description)
    }
    
    updateContinueDataStatus(type, data) {
        const statusMap = {
            plot: 'plot-data-status',
            style: 'style-data-status',
            role: 'role-data-status'
        }
        
        const badgeMap = {
            plot: 'plot-status-badge',
            style: 'style-status-badge',
            role: 'role-status-badge'
        }
        
        const statusDiv = document.getElementById(statusMap[type])
        const badgeDiv = document.getElementById(badgeMap[type])
        
        if (data) {
            badgeDiv.className = 'text-xs px-2 py-1 rounded bg-green-600'
            badgeDiv.textContent = '已导入'
            
            if (type === 'plot') {
                statusDiv.innerHTML = `
                    <span class="text-green-400">✓ 已导入</span>
                    <span class="text-slate-500 ml-2">
                        ${data.totalChapters || 0}章 | ${data.characters ? data.characters.length : 0}角色
                    </span>
                `
            } else if (type === 'style') {
                statusDiv.innerHTML = `
                    <span class="text-green-400">✓ 已导入</span>
                    <span class="text-slate-500 ml-2">
                        ${data.rhythm?.pace || '未知'}节奏
                    </span>
                `
            } else if (type === 'role') {
                statusDiv.innerHTML = `
                    <span class="text-green-400">✓ 已导入</span>
                    <span class="text-slate-500 ml-2">
                        ${data.length}个角色
                    </span>
                `
            }
        }
        
        this.checkContinueStep1Complete()
    }
    
    checkContinueStep1Complete() {
        const complete = this.continueData.plotData && 
                        this.continueData.styleData && 
                        this.continueData.roleCards
        
        const nextBtn = document.getElementById('next-step-1-btn')
        if (nextBtn) {
            nextBtn.disabled = !complete
        }
    }
    
    renderContinueStep2() {
        const stepIndicator = document.getElementById('step-indicator')
        stepIndicator.innerHTML = this.renderStepIndicator(2)
        
        const stepsContainer = document.getElementById('continue-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤2：填写续写需求</h2>
                <p class="text-slate-400 mb-6">请描述您希望续写的剧情走向和章节范围</p>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">
                            续写剧情梗概 <span class="text-red-500">*</span>
                        </label>
                        <textarea 
                            id="continue-outline"
                            class="w-full h-40 bg-slate-700 border border-slate-600 rounded-lg p-4 text-slate-100 resize-none focus:border-blue-500 focus:outline-none"
                            placeholder="请描述您希望续写的剧情走向、主要事件、角色发展等..."
                            maxlength="2000"
                        >${this.continueData.outline || ''}</textarea>
                        <div class="flex justify-between text-sm text-slate-400 mt-1">
                            <span>建议详细描述，帮助AI更好地理解您的需求</span>
                            <span><span id="outline-count">${this.continueData.outline ? this.continueData.outline.length : 0}</span> / 2000</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">
                                起始章节 <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="number"
                                id="start-chapter"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="1"
                                min="1"
                                value="${this.continueData.startChapter || 1}"
                            >
                            <p class="text-sm text-slate-500 mt-1">
                                原文共 ${this.continueData.plotData?.totalChapters || 0} 章
                            </p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">
                                结束章节 <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="number"
                                id="end-chapter"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="10"
                                min="1"
                                value="${this.continueData.endChapter || 10}"
                            >
                            <p class="text-sm text-slate-500 mt-1">
                                建议每次续写5-20章
                            </p>
                        </div>
                    </div>
                    
                    <div class="bg-slate-700 rounded-lg p-4">
                        <h3 class="font-medium mb-2">参考信息</h3>
                        <div class="text-sm text-slate-400 space-y-1">
                            <p>• 原文总字数：${this.continueData.plotData?.totalWords || 0}字</p>
                            <p>• 主要角色：${this.continueData.roleCards.map(r => r.name).slice(0, 5).join('、') || '无'}</p>
                            <p>• 文风特点：${this.continueData.styleData?.rhythm?.pace || '未知'}节奏</p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-step-2-btn" class="btn btn-secondary">
                        上一步
                    </button>
                    <button id="next-step-2-btn" class="btn btn-primary" disabled>
                        下一步：生成梗概
                    </button>
                </div>
            </div>
        `
        
        this.setupContinueStep2Events()
    }
    
    setupContinueStep2Events() {
        const outlineInput = document.getElementById('continue-outline')
        const outlineCount = document.getElementById('outline-count')
        const startInput = document.getElementById('start-chapter')
        const endInput = document.getElementById('end-chapter')
        const nextBtn = document.getElementById('next-step-2-btn')
        const prevBtn = document.getElementById('prev-step-2-btn')
        
        outlineInput.addEventListener('input', () => {
            outlineCount.textContent = outlineInput.value.length
            this.validateContinueStep2()
        })
        
        startInput.addEventListener('input', () => this.validateContinueStep2())
        endInput.addEventListener('input', () => this.validateContinueStep2())
        
        prevBtn.onclick = () => {
            this.continueData.currentStep = 1
            this.renderContinue()
        }
        
        nextBtn.onclick = () => {
            this.continueData.outline = outlineInput.value.trim()
            this.continueData.startChapter = parseInt(startInput.value)
            this.continueData.endChapter = parseInt(endInput.value)
            this.continueData.currentStep = 3
            this.renderContinueStep3()
        }
        
        this.validateContinueStep2()
    }
    
    validateContinueStep2() {
        const outline = document.getElementById('continue-outline').value.trim()
        const start = parseInt(document.getElementById('start-chapter').value)
        const end = parseInt(document.getElementById('end-chapter').value)
        
        let valid = true
        
        if (!outline) {
            valid = false
        }
        
        if (!start || start < 1) {
            valid = false
        }
        
        if (!end || end < start) {
            valid = false
        }
        
        if (end - start + 1 > 50) {
            valid = false
        }
        
        document.getElementById('next-step-2-btn').disabled = !valid
        
        return valid
    }
    
    renderContinueStep3() {
        const stepIndicator = document.getElementById('step-indicator')
        stepIndicator.innerHTML = this.renderStepIndicator(3)
        
        const totalChapters = this.continueData.endChapter - this.continueData.startChapter + 1
        
        const stepsContainer = document.getElementById('continue-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤3：生成单章梗概</h2>
                <p class="text-slate-400 mb-6">AI将逐章生成续写梗概，您可以稍后编辑确认</p>
                
                <div class="bg-slate-700 rounded-lg p-4 mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span>生成进度</span>
                        <span id="generate-progress-text">准备中...</span>
                    </div>
                    <div class="w-full bg-slate-600 rounded-full h-3">
                        <div id="generate-progress-bar" class="bg-blue-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-slate-400 mt-2">
                        <span>当前章节：<span id="current-chapter">-</span></span>
                        <span>剩余时间：<span id="remaining-time">计算中...</span></span>
                    </div>
                </div>
                
                <div id="outline-list" class="space-y-2 max-h-96 overflow-y-auto mb-4">
                    <div class="text-center text-slate-400 py-8">
                        <p>等待开始生成...</p>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-step-3-btn" class="btn btn-secondary" disabled>
                        上一步
                    </button>
                    <div class="flex space-x-2">
                        <button id="cancel-generate-btn" class="btn btn-secondary hidden">
                            取消生成
                        </button>
                        <button id="start-generate-btn" class="btn btn-primary">
                            开始生成梗概
                        </button>
                    </div>
                    <button id="next-step-3-btn" class="btn btn-primary hidden">
                        下一步：编辑确认
                    </button>
                </div>
            </div>
        `
        
        this.setupContinueStep3Events()
    }
    
    setupContinueStep3Events() {
        const startBtn = document.getElementById('start-generate-btn')
        const cancelBtn = document.getElementById('cancel-generate-btn')
        const prevBtn = document.getElementById('prev-step-3-btn')
        const nextBtn = document.getElementById('next-step-3-btn')
        
        startBtn.onclick = () => {
            startBtn.disabled = true
            startBtn.textContent = '生成中...'
            cancelBtn.classList.remove('hidden')
            this.continueData.isGenerating = true
            this.startGenerateOutlines()
        }
        
        cancelBtn.onclick = () => {
            if (confirm('确定要取消生成吗？已生成的内容将保留。')) {
                this.continueData.isGenerating = false
                cancelBtn.classList.add('hidden')
                startBtn.disabled = false
                startBtn.textContent = '继续生成'
                UIHelper.showToast('已取消生成', 'warning')
            }
        }
        
        prevBtn.onclick = () => {
            this.continueData.currentStep = 2
            this.renderContinueStep2()
        }
        
        nextBtn.onclick = () => {
            this.continueData.currentStep = 4
            this.renderContinueStep4()
        }
    }
    
    async startGenerateOutlines() {
        const { startChapter, endChapter } = this.continueData
        const totalChapters = endChapter - startChapter + 1
        
        if (!this.continueData.outlines) {
            this.continueData.outlines = []
        }
        
        const startTime = Date.now()
        const outlineList = document.getElementById('outline-list')
        
        if (this.continueData.outlines.length === 0) {
            outlineList.innerHTML = ''
        }
        
        for (let i = this.continueData.outlines.length; i < totalChapters; i++) {
            if (!this.continueData.isGenerating) {
                break
            }
            
            const chapterNum = startChapter + i
            const progress = ((i + 1) / totalChapters) * 100
            
            this.updateGenerateProgress(progress, chapterNum, startTime, i + 1, totalChapters)
            
            let retries = 3
            let success = false
            
            while (retries > 0 && !success && this.continueData.isGenerating) {
                try {
                    const chapterOutline = await this.generateSingleOutline(chapterNum)
                    
                    this.continueData.outlines.push({
                        chapterNum: chapterNum,
                        outline: chapterOutline,
                        status: 'completed'
                    })
                    
                    this.addOutlineToList(chapterNum, chapterOutline)
                    success = true
                    
                } catch (error) {
                    retries--
                    if (retries > 0) {
                        this.addOutlineErrorToList(chapterNum, `生成失败，正在重试...（剩余${retries}次）`)
                        await new Promise(resolve => setTimeout(resolve, 2000))
                    } else {
                        this.continueData.outlines.push({
                            chapterNum: chapterNum,
                            outline: '',
                            status: 'error',
                            error: error.message
                        })
                        
                        this.addOutlineErrorToList(chapterNum, error.message, true)
                    }
                }
            }
        }
        
        if (this.continueData.isGenerating) {
            document.getElementById('generate-progress-text').textContent = '生成完成'
            this.saveContinueDraft()
        } else {
            document.getElementById('generate-progress-text').textContent = '已取消'
        }
        
        document.getElementById('prev-step-3-btn').disabled = false
        document.getElementById('cancel-generate-btn').classList.add('hidden')
        document.getElementById('start-generate-btn').classList.add('hidden')
        document.getElementById('next-step-3-btn').classList.remove('hidden')
        
        UIHelper.showToast('梗概生成完成', 'success')
    }
    
    async generateSingleOutline(chapterNum) {
        const taskInstructions = `你是一位专业的小说续写助手。请根据提供的剧情分析、文风分析和角色信息，生成第${chapterNum}章的续写梗概。

要求：
1. 保持与原文一致的文风
2. 符合角色性格设定
3. 剧情连贯合理

请直接输出梗概内容，不要添加其他说明。`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            taskInstructions,
            JSON.stringify({
                plotData: this.continueData.plotData,
                styleData: this.continueData.styleData,
                roleCards: this.continueData.roleCards,
                userOutline: this.continueData.outline,
                chapterNum: chapterNum
            }, null, 2)
        )
        
        const response = await apiClient.request(messages, {
            maxTokens: 8192,
            temperature: 0.7
        })
        
        return response.choices[0].message.content.trim()
    }
    
    updateGenerateProgress(progress, chapterNum, startTime, completed, total) {
        document.getElementById('generate-progress-bar').style.width = progress + '%'
        document.getElementById('generate-progress-text').textContent = `${completed}/${total}`
        document.getElementById('current-chapter').textContent = `第${chapterNum}章`
        
        const elapsed = (Date.now() - startTime) / 1000
        const avgTime = elapsed / completed
        const remaining = (total - completed) * avgTime
        
        document.getElementById('remaining-time').textContent = 
            remaining < 60 ? `${Math.round(remaining)}秒` : `${Math.round(remaining / 60)}分钟`
    }
    
    addOutlineToList(chapterNum, outline) {
        const list = document.getElementById('outline-list')
        const item = document.createElement('div')
        item.className = 'bg-slate-700 rounded p-3 border border-slate-600'
        item.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <span class="font-medium">第${chapterNum}章</span>
                <span class="text-green-400 text-sm">✓ 已生成</span>
            </div>
            <p class="text-sm text-slate-300 line-clamp-2">${outline}</p>
        `
        list.appendChild(item)
    }
    
    addOutlineErrorToList(chapterNum, error, showRetry = false) {
        const list = document.getElementById('outline-list')
        const item = document.createElement('div')
        item.className = 'bg-slate-700 rounded p-3 border border-red-600'
        item.id = `outline-error-${chapterNum}`
        item.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <span class="font-medium">第${chapterNum}章</span>
                <div class="flex items-center space-x-2">
                    <span class="text-red-400 text-sm">✗ 生成失败</span>
                    ${showRetry ? `
                        <button class="btn btn-secondary text-xs retry-outline-btn" data-chapter="${chapterNum}">
                            重试
                        </button>
                    ` : ''}
                </div>
            </div>
            <p class="text-sm text-red-400">${error}</p>
        `
        list.appendChild(item)
        
        if (showRetry) {
            const retryBtn = item.querySelector('.retry-outline-btn')
            retryBtn.onclick = async () => {
                retryBtn.disabled = true
                retryBtn.textContent = '重试中...'
                
                try {
                    const outline = await this.generateSingleOutline(chapterNum)
                    
                    const index = this.continueData.outlines.findIndex(o => o.chapterNum === chapterNum)
                    if (index !== -1) {
                        this.continueData.outlines[index] = {
                            chapterNum: chapterNum,
                            outline: outline,
                            status: 'completed'
                        }
                    }
                    
                    item.className = 'bg-slate-700 rounded p-3 border border-green-600'
                    item.innerHTML = `
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-medium">第${chapterNum}章</span>
                            <span class="text-green-400 text-sm">✓ 已生成</span>
                        </div>
                        <p class="text-sm text-slate-300">${outline}</p>
                    `
                    
                    UIHelper.showToast(`第${chapterNum}章重试成功`, 'success')
                    
                } catch (err) {
                    retryBtn.disabled = false
                    retryBtn.textContent = '重试'
                    UIHelper.showToast(`重试失败：${err.message}`, 'error')
                }
            }
        }
    }
    
    renderContinueStep4() {
        const stepIndicator = document.getElementById('step-indicator')
        stepIndicator.innerHTML = this.renderStepIndicator(4)
        
        const stepsContainer = document.getElementById('continue-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤4：编辑确认梗概</h2>
                <p class="text-slate-400 mb-6">点击梗概可展开编辑，确认无误后进入下一步</p>
                
                <div id="outline-edit-list" class="space-y-3 mb-4">
                    ${this.renderOutlineEditList()}
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-step-4-btn" class="btn btn-secondary">
                        上一步
                    </button>
                    <button id="next-step-4-btn" class="btn btn-primary">
                        下一步：生成正文
                    </button>
                </div>
            </div>
        `
        
        this.setupContinueStep4Events()
    }
    
    renderOutlineEditList() {
        return this.continueData.outlines.map((item, index) => `
            <div class="border border-slate-700 rounded-lg" data-index="${index}">
                <div class="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700 outline-toggle" data-index="${index}">
                    <div class="flex items-center space-x-3">
                        <span class="font-medium">第${item.chapterNum}章</span>
                        <span class="text-sm text-slate-400">${item.outline.length}字</span>
                    </div>
                    <svg class="w-5 h-5 transform transition-transform outline-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
                <div class="hidden p-3 border-t border-slate-700 bg-slate-800 outline-content" data-index="${index}">
                    <textarea 
                        class="outline-edit-textarea w-full h-32 bg-slate-700 border border-slate-600 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                        data-index="${index}"
                    >${item.outline}</textarea>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs text-slate-400">
                            字数：<span class="outline-word-count">${item.outline.length}</span>
                        </span>
                        <button class="btn btn-secondary text-sm save-outline-btn" data-index="${index}">
                            保存修改
                        </button>
                    </div>
                </div>
            </div>
        `).join('')
    }
    
    setupContinueStep4Events() {
        document.querySelectorAll('.outline-toggle').forEach(toggle => {
            toggle.onclick = () => {
                const index = toggle.dataset.index
                const content = document.querySelector(`.outline-content[data-index="${index}"]`)
                const arrow = toggle.querySelector('.outline-arrow')
                
                content.classList.toggle('hidden')
                arrow.classList.toggle('rotate-180')
            }
        })
        
        document.querySelectorAll('.outline-edit-textarea').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const count = e.target.value.length
                e.target.parentElement.querySelector('.outline-word-count').textContent = count
            })
        })
        
        document.querySelectorAll('.save-outline-btn').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index)
                const textarea = document.querySelector(`.outline-edit-textarea[data-index="${index}"]`)
                const newOutline = textarea.value.trim()
                
                this.continueData.outlines[index].outline = newOutline
                UIHelper.showToast('已保存', 'success')
            }
        })
        
        document.getElementById('prev-step-4-btn').onclick = () => {
            this.continueData.currentStep = 3
            this.renderContinueStep3()
        }
        
        document.getElementById('next-step-4-btn').onclick = () => {
            this.continueData.currentStep = 5
            this.renderContinueStep5()
        }
    }
    
    renderContinueStep5() {
        const stepIndicator = document.getElementById('step-indicator')
        stepIndicator.innerHTML = this.renderStepIndicator(5)
        
        const stepsContainer = document.getElementById('continue-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤5：生成续写正文</h2>
                <p class="text-slate-400 mb-6">AI将逐章生成完整正文，请耐心等待</p>
                
                <div class="bg-slate-700 rounded-lg p-4 mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span>生成进度</span>
                        <span id="content-progress-text">准备中...</span>
                    </div>
                    <div class="w-full bg-slate-600 rounded-full h-3">
                        <div id="content-progress-bar" class="bg-green-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-slate-400 mt-2">
                        <span>总字数：<span id="total-words">0</span></span>
                        <span>剩余时间：<span id="content-remaining-time">计算中...</span></span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                        <h3 class="font-medium mb-2">生成日志</h3>
                        <div id="content-log" class="bg-slate-700 rounded p-3 h-64 overflow-y-auto text-sm">
                            <p class="text-slate-400">等待开始...</p>
                        </div>
                    </div>
                    <div>
                        <h3 class="font-medium mb-2">实时预览</h3>
                        <div id="content-preview" class="bg-slate-700 rounded p-3 h-64 overflow-y-auto text-sm">
                            <p class="text-slate-400">等待生成...</p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-step-5-btn" class="btn btn-secondary" disabled>
                        上一步
                    </button>
                    <div class="flex space-x-2">
                        <button id="cancel-content-btn" class="btn btn-secondary hidden">
                            取消生成
                        </button>
                        <button id="start-content-btn" class="btn btn-primary">
                            开始生成正文
                        </button>
                    </div>
                    <button id="next-step-5-btn" class="btn btn-primary hidden">
                        下一步：预览导出
                    </button>
                </div>
            </div>
        `
        
        this.setupContinueStep5Events()
    }
    
    setupContinueStep5Events() {
        const startBtn = document.getElementById('start-content-btn')
        const cancelBtn = document.getElementById('cancel-content-btn')
        const prevBtn = document.getElementById('prev-step-5-btn')
        const nextBtn = document.getElementById('next-step-5-btn')
        
        startBtn.onclick = () => {
            startBtn.disabled = true
            startBtn.textContent = '生成中...'
            cancelBtn.classList.remove('hidden')
            this.continueData.isGenerating = true
            this.startGenerateContent()
        }
        
        cancelBtn.onclick = () => {
            if (confirm('确定要取消生成吗？已生成的内容将保留。')) {
                this.continueData.isGenerating = false
                cancelBtn.classList.add('hidden')
                startBtn.disabled = false
                startBtn.textContent = '继续生成'
                UIHelper.showToast('已取消生成', 'warning')
            }
        }
        
        prevBtn.onclick = () => {
            this.continueData.currentStep = 4
            this.renderContinueStep4()
        }
        
        nextBtn.onclick = () => {
            this.continueData.currentStep = 6
            this.renderContinueStep6()
        }
    }
    
    async startGenerateContent() {
        if (!this.continueData.chapters) {
            this.continueData.chapters = []
        }
        
        const totalChapters = this.continueData.outlines.length
        const startTime = Date.now()
        let totalWords = this.continueData.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
        
        const log = document.getElementById('content-log')
        const preview = document.getElementById('content-preview')
        
        if (this.continueData.chapters.length === 0) {
            log.innerHTML = ''
            preview.innerHTML = ''
        } else {
            this.continueData.chapters.forEach(ch => {
                this.updateContentPreview(ch.chapterNum, ch.content)
            })
        }
        
        for (let i = this.continueData.chapters.length; i < totalChapters; i++) {
            if (!this.continueData.isGenerating) {
                break
            }
            
            const outline = this.continueData.outlines[i]
            const progress = ((i + 1) / totalChapters) * 100
            
            this.updateContentProgress(progress, totalWords, startTime, i + 1, totalChapters)
            
            this.addContentLog(`正在生成第${outline.chapterNum}章...`, 'info')
            
            let retries = 3
            let success = false
            
            while (retries > 0 && !success && this.continueData.isGenerating) {
                try {
                    const content = await this.generateChapterContent(outline)
                    
                    this.continueData.chapters.push({
                        chapterNum: outline.chapterNum,
                        outline: outline.outline,
                        content: content,
                        wordCount: content.length
                    })
                    
                    totalWords += content.length
                    
                    this.updateContentPreview(outline.chapterNum, content)
                    
                    this.addContentLog(`第${outline.chapterNum}章生成完成，${content.length}字`, 'success')
                    
                    if (i % 5 === 0) {
                        this.saveContinueDraft()
                    }
                    
                    success = true
                    
                } catch (error) {
                    retries--
                    if (retries > 0) {
                        this.addContentLog(`第${outline.chapterNum}章生成失败，正在重试...（剩余${retries}次）`, 'warning')
                        await new Promise(resolve => setTimeout(resolve, 3000))
                    } else {
                        this.continueData.chapters.push({
                            chapterNum: outline.chapterNum,
                            outline: outline.outline,
                            content: '',
                            wordCount: 0,
                            status: 'error',
                            error: error.message
                        })
                        
                        this.addContentLog(`第${outline.chapterNum}章生成失败：${error.message}`, 'error')
                    }
                }
            }
        }
        
        if (this.continueData.isGenerating) {
            document.getElementById('content-progress-text').textContent = '生成完成'
            this.saveContinueDraft()
        } else {
            document.getElementById('content-progress-text').textContent = '已取消'
        }
        
        document.getElementById('total-words').textContent = totalWords
        document.getElementById('prev-step-5-btn').disabled = false
        document.getElementById('cancel-content-btn').classList.add('hidden')
        document.getElementById('start-content-btn').classList.add('hidden')
        document.getElementById('next-step-5-btn').classList.remove('hidden')
        
        UIHelper.showToast(`正文生成完成，共${totalWords}字`, 'success')
    }
    
    async generateChapterContent(outline) {
        const taskInstructions = `你是一位专业的小说作家。请根据提供的章节梗概、文风分析和角色信息，撰写完整的章节内容。

要求：
1. 严格保持原文文风
2. 角色行为符合人设
3. 对话自然生动
4. 段落分明，节奏合理

请直接输出章节正文，不要添加标题或其他说明。`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            taskInstructions,
            JSON.stringify({
                styleData: this.continueData.styleData,
                roleCards: this.continueData.roleCards,
                chapterNum: outline.chapterNum,
                outline: outline.outline
            }, null, 2)
        )
        
        const response = await apiClient.request(messages, {
            maxTokens: 65536,
            temperature: 0.8
        })
        
        return response.choices[0].message.content.trim()
    }
    
    updateContentProgress(progress, totalWords, startTime, completed, total) {
        document.getElementById('content-progress-bar').style.width = progress + '%'
        document.getElementById('content-progress-text').textContent = `${completed}/${total}`
        document.getElementById('total-words').textContent = totalWords
        
        const elapsed = (Date.now() - startTime) / 1000
        const avgTime = elapsed / completed
        const remaining = (total - completed) * avgTime
        
        document.getElementById('content-remaining-time').textContent = 
            remaining < 60 ? `${Math.round(remaining)}秒` : `${Math.round(remaining / 60)}分钟`
    }
    
    addContentLog(message, type = 'info') {
        const log = document.getElementById('content-log')
        const colors = {
            info: 'text-blue-400',
            success: 'text-green-400',
            error: 'text-red-400'
        }
        
        const time = new Date().toLocaleTimeString('zh-CN')
        log.innerHTML += `<p class="${colors[type]}">[${time}] ${message}</p>`
        log.scrollTop = log.scrollHeight
    }
    
    updateContentPreview(chapterNum, content) {
        const preview = document.getElementById('content-preview')
        preview.innerHTML += `
            <div class="mb-4">
                <h4 class="font-medium text-blue-400 mb-1">第${chapterNum}章</h4>
                <p class="text-slate-300 line-clamp-3">${content.substring(0, 200)}...</p>
            </div>
        `
        preview.scrollTop = preview.scrollHeight
    }
    
    renderContinueStep6() {
        const stepIndicator = document.getElementById('step-indicator')
        stepIndicator.innerHTML = this.renderStepIndicator(6)
        
        const totalWords = this.continueData.chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
        
        const stepsContainer = document.getElementById('continue-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤6：预览与导出</h2>
                <p class="text-slate-400 mb-6">查看生成结果，编辑或导出TXT文件</p>
                
                <div class="bg-slate-700 rounded-lg p-4 mb-4">
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-2xl font-bold text-blue-400">${this.continueData.chapters.length}</div>
                            <div class="text-sm text-slate-400">章节数</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-green-400">${totalWords}</div>
                            <div class="text-sm text-slate-400">总字数</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-yellow-400">${Math.round(totalWords / this.continueData.chapters.length)}</div>
                            <div class="text-sm text-slate-400">平均字数</div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium">全文预览</h3>
                        <div class="flex space-x-2">
                            <button id="edit-content-btn" class="btn btn-secondary text-sm">编辑模式</button>
                            <button id="export-txt-btn" class="btn btn-primary text-sm">导出TXT</button>
                        </div>
                    </div>
                    <div id="content-viewer" class="bg-slate-700 rounded p-4 max-h-96 overflow-y-auto">
                        ${this.renderContentViewer()}
                    </div>
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-step-6-btn" class="btn btn-secondary">
                        上一步
                    </button>
                    <button id="restart-btn" class="btn btn-primary">
                        开始新的续写
                    </button>
                </div>
            </div>
        `
        
        this.setupContinueStep6Events()
    }
    
    renderContentViewer() {
        return this.continueData.chapters.map(chapter => `
            <div class="mb-6 chapter-item" data-chapter="${chapter.chapterNum}">
                <h3 class="text-lg font-semibold text-blue-400 mb-2">第${chapter.chapterNum}章</h3>
                <div class="text-slate-300 whitespace-pre-wrap">${chapter.content}</div>
            </div>
        `).join('<hr class="border-slate-600 my-4">')
    }
    
    setupContinueStep6Events() {
        let isEditMode = false
        
        document.getElementById('edit-content-btn').onclick = () => {
            isEditMode = !isEditMode
            const viewer = document.getElementById('content-viewer')
            const btn = document.getElementById('edit-content-btn')
            
            if (isEditMode) {
                btn.textContent = '保存修改'
                btn.classList.remove('btn-secondary')
                btn.classList.add('btn-success')
                
                viewer.innerHTML = this.continueData.chapters.map(chapter => `
                    <div class="mb-6" data-chapter="${chapter.chapterNum}">
                        <h3 class="text-lg font-semibold text-blue-400 mb-2">第${chapter.chapterNum}章</h3>
                        <textarea 
                            class="chapter-edit-textarea w-full h-64 bg-slate-600 border border-slate-500 rounded p-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                            data-chapter="${chapter.chapterNum}"
                        >${chapter.content}</textarea>
                    </div>
                `).join('<hr class="border-slate-600 my-4">')
            } else {
                btn.textContent = '编辑模式'
                btn.classList.remove('btn-success')
                btn.classList.add('btn-secondary')
                
                document.querySelectorAll('.chapter-edit-textarea').forEach(textarea => {
                    const chapterNum = parseInt(textarea.dataset.chapter)
                    const chapter = this.continueData.chapters.find(ch => ch.chapterNum === chapterNum)
                    if (chapter) {
                        chapter.content = textarea.value
                        chapter.wordCount = textarea.value.length
                    }
                })
                
                viewer.innerHTML = this.renderContentViewer()
                UIHelper.showToast('修改已保存', 'success')
            }
        }
        
        document.getElementById('export-txt-btn').onclick = () => {
            let content = ''
            this.continueData.chapters.forEach(chapter => {
                content += `第${chapter.chapterNum}章\n\n`
                content += chapter.content
                content += '\n\n'
            })
            
            const filename = `续写_${this.continueData.startChapter}-${this.continueData.endChapter}章_${new Date().toISOString().slice(0, 10)}.txt`
            FileHandler.exportTxt(content, filename)
        }
        
        document.getElementById('prev-step-6-btn').onclick = () => {
            this.continueData.currentStep = 5
            this.renderContinueStep5()
        }
        
        document.getElementById('restart-btn').onclick = () => {
            this.continueData = {
                plotData: null,
                styleData: null,
                roleCards: null,
                outline: '',
                startChapter: 1,
                endChapter: 10,
                outlines: [],
                chapters: [],
                currentStep: 1
            }
            this.renderContinue()
        }
    }
    
    renderRewrite() {
        const main = document.getElementById('main-content')
        
        if (!this.rewriteData) {
            this.loadRewriteDraft()
        }
        
        const hasData = this.rewriteData.plotData && this.rewriteData.styleData
        const chapters = this.rewriteData.chapters || []
        const currentChapter = chapters[this.rewriteData.currentChapterIndex] || null
        const rewrittenCount = this.rewriteData.rewrittenChapters.length
        const totalChapters = chapters.length
        const progressPercent = totalChapters > 0 ? Math.round((rewrittenCount / totalChapters) * 100) : 0
        
        main.innerHTML = `
            <div class="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
                <div class="bg-slate-800 border-b border-slate-700 p-3">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">改写进度</span>
                        <span class="text-sm text-slate-400">${rewrittenCount}/${totalChapters}章 (${progressPercent}%)</span>
                    </div>
                    <div class="flex items-center justify-between">
                        ${this.renderRewriteProgressBar(rewrittenCount, totalChapters, chapters)}
                    </div>
                </div>
                
                <div class="flex flex-1 overflow-hidden">
                    <div class="w-56 min-w-56 bg-slate-800 border-r border-slate-700 flex flex-col">
                        <div class="p-3 border-b border-slate-700">
                            <h3 class="font-medium text-sm">📚 章节列表</h3>
                        </div>
                        <div class="p-2 border-b border-slate-700">
                            <input type="text" id="search-chapter-input" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm focus:border-purple-500 focus:outline-none" placeholder="搜索章节...">
                        </div>
                        <div id="chapter-list-container" class="flex-1 overflow-y-auto p-2 space-y-1">
                            ${this.renderRewriteChapterList(chapters)}
                        </div>
                        <div class="p-2 border-t border-slate-700 text-xs text-slate-400">
                            <div>总章节：${chapters.length}</div>
                            <div>已改写：${this.rewriteData.rewrittenChapters.length}</div>
                        </div>
                    </div>
                    
                    <div class="flex-1 flex flex-col overflow-hidden">
                        <div class="p-4 border-b border-slate-700 bg-slate-800">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h1 class="text-xl font-bold">改写功能</h1>
                                    <p class="text-sm text-slate-400">${currentChapter ? `当前：第${currentChapter.chapterNum}章 ${currentChapter.title || ''}` : '请先导入数据'}</p>
                                </div>
                                <div class="flex space-x-2">
                                    <button id="toggle-compare-mode-btn" class="btn btn-secondary text-sm ${!hasData ? 'opacity-50' : ''}" ${!hasData ? 'disabled' : ''}>📊 对比校对</button>
                                    <button id="save-rewrite-draft-btn" class="btn btn-secondary text-sm">💾 保存</button>
                                    <button id="load-rewrite-draft-btn" class="btn btn-secondary text-sm">📂 加载</button>
                                </div>
                            </div>
                        </div>
                        
                        <div id="rewrite-content-area" class="flex-1 overflow-y-auto p-4">
                            ${hasData ? this.renderRewriteContentArea(currentChapter) : this.renderRewriteDataImport()}
                        </div>
                    </div>
                    
                    <div class="w-72 min-w-72 bg-slate-800 border-l border-slate-700 flex flex-col overflow-y-auto">
                    <div class="p-3 border-b border-slate-700">
                        <h3 class="font-medium text-sm">⚙️ 改写设置</h3>
                    </div>
                    
                    <div class="p-3 border-b border-slate-700">
                        <h4 class="text-sm font-medium mb-2">📏 字数控制</h4>
                        <div class="space-y-2">
                            <div>
                                <label class="text-xs text-slate-400">控制模式</label>
                                <select id="word-count-mode" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm mt-1">
                                    <option value="ratio" ${this.rewriteData.wordCountMode === 'ratio' ? 'selected' : ''}>按比例</option>
                                    <option value="absolute" ${this.rewriteData.wordCountMode === 'absolute' ? 'selected' : ''}>绝对字数</option>
                                    <option value="reference" ${this.rewriteData.wordCountMode === 'reference' ? 'selected' : ''}>参考原文</option>
                                </select>
                            </div>
                            
                            <div id="ratio-settings" class="${this.rewriteData.wordCountMode === 'ratio' ? '' : 'hidden'}">
                                <div class="text-xs text-slate-400 mb-1">最小比例</div>
                                <div class="flex items-center space-x-2">
                                    <input type="range" id="min-ratio" min="0.5" max="1" step="0.1" value="${this.rewriteData.wordCountSettings.minRatio}" class="flex-1">
                                    <span id="min-ratio-value" class="text-xs w-12">${Math.round(this.rewriteData.wordCountSettings.minRatio * 100)}%</span>
                                </div>
                                <div class="text-xs text-slate-400 mb-1 mt-2">最大比例</div>
                                <div class="flex items-center space-x-2">
                                    <input type="range" id="max-ratio" min="1" max="2" step="0.1" value="${this.rewriteData.wordCountSettings.maxRatio}" class="flex-1">
                                    <span id="max-ratio-value" class="text-xs w-12">${Math.round(this.rewriteData.wordCountSettings.maxRatio * 100)}%</span>
                                </div>
                            </div>
                            
                            <div id="absolute-settings" class="${this.rewriteData.wordCountMode === 'absolute' ? '' : 'hidden'}">
                                <div class="text-xs text-slate-400 mb-1">目标字数</div>
                                <input type="number" id="target-words" value="${this.rewriteData.wordCountSettings.targetWords}" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                                <div class="flex space-x-2 mt-2">
                                    <div class="flex-1">
                                        <div class="text-xs text-slate-400 mb-1">最小</div>
                                        <input type="number" id="min-words" value="${this.rewriteData.wordCountSettings.minWords}" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                                    </div>
                                    <div class="flex-1">
                                        <div class="text-xs text-slate-400 mb-1">最大</div>
                                        <input type="number" id="max-words" value="${this.rewriteData.wordCountSettings.maxWords}" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                                    </div>
                                </div>
                            </div>
                            
                            <div id="reference-settings" class="${this.rewriteData.wordCountMode === 'reference' ? '' : 'hidden'}">
                                <div class="text-xs text-slate-400 mb-1">允许偏差</div>
                                <div class="flex items-center space-x-2">
                                    <input type="range" id="tolerance" min="0.05" max="0.3" step="0.05" value="${this.rewriteData.wordCountSettings.tolerance}" class="flex-1">
                                    <span id="tolerance-value" class="text-xs w-12">±${Math.round(this.rewriteData.wordCountSettings.tolerance * 100)}%</span>
                                </div>
                            </div>
                            
                            <div id="word-count-preview" class="bg-slate-700 rounded p-2 text-xs">
                                ${this.renderWordCountPreview(currentChapter)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-3 border-b border-slate-700">
                        <h4 class="text-sm font-medium mb-2">🎨 改写幅度</h4>
                        <div class="flex items-center space-x-2">
                            <input type="range" id="rewrite-intensity" min="1" max="5" value="${this.rewriteData.rewriteIntensity}" class="flex-1">
                            <span id="intensity-label" class="text-xs w-12">${this.getIntensityLabel(this.rewriteData.rewriteIntensity)}</span>
                        </div>
                    </div>
                    
                    <div class="p-3 border-b border-slate-700">
                        <h4 class="text-sm font-medium mb-2">📝 改写类型</h4>
                        <select id="rewrite-type" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                            <option value="plot" ${this.rewriteData.rewriteType === 'plot' ? 'selected' : ''}>剧情改写</option>
                            <option value="character" ${this.rewriteData.rewriteType === 'character' ? 'selected' : ''}>角色改写</option>
                            <option value="ending" ${this.rewriteData.rewriteType === 'ending' ? 'selected' : ''}>结局改写</option>
                            <option value="dialogue" ${this.rewriteData.rewriteType === 'dialogue' ? 'selected' : ''}>对话改写</option>
                            <option value="description" ${this.rewriteData.rewriteType === 'description' ? 'selected' : ''}>描写改写</option>
                            <option value="custom" ${this.rewriteData.rewriteType === 'custom' ? 'selected' : ''}>自定义改写</option>
                        </select>
                    </div>
                    
                    <div class="p-3 border-b border-slate-700">
                        <h4 class="text-sm font-medium mb-2">📋 改写需求</h4>
                        <textarea id="rewrite-requirements" class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm h-24 resize-none" placeholder="描述改写需求...">${this.rewriteData.rewriteRequirements}</textarea>
                    </div>
                    
                    <div class="p-3 flex-1">
                        <div class="space-y-2">
                            <button id="rewrite-single-btn" class="btn btn-primary w-full text-sm" ${!hasData ? 'disabled' : ''}>▶️ 改写当前章节</button>
                            <button id="rewrite-all-btn" class="btn btn-secondary w-full text-sm" ${!hasData ? 'disabled' : ''}>⏩ 一键改写全部</button>
                            <button id="stop-rewrite-btn" class="btn btn-secondary w-full text-sm hidden">⏹️ 停止任务</button>
                            <button id="retry-failed-btn" class="btn btn-secondary w-full text-sm" ${!hasData ? 'disabled' : ''}>🔄 重试失败章节</button>
                        </div>
                    </div>
                    
                    <div class="p-3 border-t border-slate-700">
                        <div class="space-y-2">
                            <button id="export-rewrite-btn" class="btn btn-secondary w-full text-sm" ${this.rewriteData.rewrittenChapters.length === 0 ? 'disabled' : ''}>📤 导出结果</button>
                        </div>
                    </div>
                </div>
            </div>
        `
        
        this.setupRewriteNewEvents()
    }
    
    renderRewriteProgressBar(completed, total, chapters) {
        if (total === 0) {
            return '<div class="text-slate-400 text-sm">暂无章节数据</div>'
        }
        
        const successCount = this.rewriteData.rewrittenChapters.filter(r => r.status === 'success').length
        const failedCount = this.rewriteData.rewrittenChapters.filter(r => r.status === 'failed').length
        const pendingCount = total - completed
        
        return `
            <div class="flex items-center space-x-1 flex-1">
                <div class="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden flex">
                    <div class="bg-green-500 h-full transition-all duration-300" style="width: ${total > 0 ? (successCount / total) * 100 : 0}%"></div>
                    <div class="bg-red-500 h-full transition-all duration-300" style="width: ${total > 0 ? (failedCount / total) * 100 : 0}%"></div>
                </div>
            </div>
            <div class="flex items-center space-x-3 text-xs ml-4">
                <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-green-500 mr-1"></span>成功 ${successCount}</span>
                <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-red-500 mr-1"></span>失败 ${failedCount}</span>
                <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-slate-500 mr-1"></span>待处理 ${pendingCount}</span>
            </div>
        `
    }
    
    renderRewriteChapterList(chapters) {
        if (!chapters || chapters.length === 0) {
            return '<div class="text-center text-slate-400 text-sm py-4">暂无章节数据</div>'
        }
        
        return chapters.map((chapter, index) => {
            const rewritten = this.rewriteData.rewrittenChapters.find(r => r.chapterNum === chapter.chapterNum)
            const status = rewritten ? (rewritten.status === 'success' ? 'success' : 'failed') : 'pending'
            const statusColor = status === 'success' ? 'bg-green-500' : status === 'failed' ? 'bg-red-500' : 'bg-slate-500'
            const isSelected = index === this.rewriteData.currentChapterIndex
            
            return `
                <div class="chapter-item p-2 rounded cursor-pointer hover:bg-slate-700 transition-colors ${isSelected ? 'bg-purple-900 border border-purple-500' : 'border border-transparent'}" data-index="${index}">
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 rounded-full ${statusColor}"></div>
                        <div class="flex-1 truncate">
                            <div class="text-sm font-medium">第${chapter.chapterNum}章</div>
                            <div class="text-xs text-slate-400 truncate">${chapter.title || '无标题'}</div>
                        </div>
                        <div class="text-xs text-slate-500">${chapter.wordCount || 0}字</div>
                    </div>
                </div>
            `
        }).join('')
    }
    
    renderWordCountPreview(chapter) {
        if (!chapter || !chapter.wordCount) {
            return '<span class="text-slate-400">选择章节后显示预览</span>'
        }
        
        const originalWords = chapter.wordCount
        let minWords, maxWords
        
        switch (this.rewriteData.wordCountMode) {
            case 'ratio':
                minWords = Math.floor(originalWords * this.rewriteData.wordCountSettings.minRatio)
                maxWords = Math.ceil(originalWords * this.rewriteData.wordCountSettings.maxRatio)
                break
            case 'absolute':
                minWords = this.rewriteData.wordCountSettings.minWords
                maxWords = this.rewriteData.wordCountSettings.maxWords
                break
            case 'reference':
                minWords = Math.floor(originalWords * (1 - this.rewriteData.wordCountSettings.tolerance))
                maxWords = Math.ceil(originalWords * (1 + this.rewriteData.wordCountSettings.tolerance))
                break
        }
        
        return `
            <div class="text-slate-300">
                <div>原文：${originalWords}字</div>
                <div>目标：${minWords} ~ ${maxWords}字</div>
            </div>
        `
    }
    
    renderRewriteDataImport() {
        return `
            <div class="card p-6 max-w-2xl mx-auto">
                <h2 class="text-xl font-semibold mb-4">导入数据</h2>
                <p class="text-slate-400 mb-6">请导入原文、剧情分析、文风分析和角色卡数据</p>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">原文TXT</h3>
                            <span id="original-status-badge" class="text-xs px-2 py-1 rounded ${this.rewriteData.originalText ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.rewriteData.originalText ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <button id="import-original-btn" class="btn btn-secondary text-sm w-full">导入TXT文件</button>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">剧情分析</h3>
                            <span id="plot-status-badge" class="text-xs px-2 py-1 rounded ${this.rewriteData.plotData ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.rewriteData.plotData ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-analysis-plot-btn" class="btn btn-secondary text-sm flex-1">使用分析</button>
                            <button id="import-plot-btn" class="btn btn-secondary text-sm flex-1">导入文件</button>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">文风分析</h3>
                            <span id="style-status-badge" class="text-xs px-2 py-1 rounded ${this.rewriteData.styleData ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.rewriteData.styleData ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-analysis-style-btn" class="btn btn-secondary text-sm flex-1">使用分析</button>
                            <button id="import-style-btn" class="btn btn-secondary text-sm flex-1">导入文件</button>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">角色卡</h3>
                            <span id="role-status-badge" class="text-xs px-2 py-1 rounded ${this.rewriteData.roleCards ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.rewriteData.roleCards ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-role-cards-btn" class="btn btn-secondary text-sm flex-1">使用已有</button>
                            <button id="import-role-btn" class="btn btn-secondary text-sm flex-1">导入文件</button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    renderRewriteContentArea(chapter) {
        if (!chapter) {
            return '<div class="text-center text-slate-400 py-12">请选择章节</div>'
        }
        
        const rewritten = this.rewriteData.rewrittenChapters.find(r => r.chapterNum === chapter.chapterNum)
        
        return `
            <div class="grid grid-cols-2 gap-4 h-full">
                <div class="flex flex-col">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium">📖 原文内容</h3>
                        <span class="text-sm text-slate-400">${chapter.wordCount || 0}字</span>
                    </div>
                    <div class="flex-1 bg-slate-700 rounded-lg p-4 overflow-y-auto">
                        <div class="text-sm whitespace-pre-wrap">${chapter.content || '无内容'}</div>
                    </div>
                </div>
                
                <div class="flex flex-col">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium">✏️ 改写内容</h3>
                        <span class="text-sm text-slate-400">${rewritten ? `${rewritten.wordCount || 0}字` : '待改写'}</span>
                    </div>
                    <div class="flex-1 bg-slate-700 rounded-lg p-4 overflow-y-auto">
                        ${rewritten && rewritten.content ? 
                            `<textarea id="rewritten-content" class="w-full h-full bg-transparent border-none resize-none focus:outline-none text-sm">${rewritten.content}</textarea>` : 
                            '<div class="text-slate-400 text-sm">点击"改写当前章节"开始</div>'
                        }
                    </div>
                </div>
            </div>
            
            <div class="mt-4 bg-slate-700 rounded-lg p-3">
                <div class="flex items-center justify-between text-sm">
                    <div>
                        <span class="text-slate-400">原文：</span>
                        <span>${chapter.wordCount || 0}字</span>
                        <span class="mx-2">|</span>
                        <span class="text-slate-400">改写：</span>
                        <span>${rewritten ? (rewritten.wordCount || 0) : 0}字</span>
                        <span class="mx-2">|</span>
                        <span class="text-slate-400">变化：</span>
                        <span class="${rewritten && rewritten.wordCount > chapter.wordCount ? 'text-green-400' : rewritten && rewritten.wordCount < chapter.wordCount ? 'text-red-400' : ''}">${rewritten ? (rewritten.wordCount - chapter.wordCount >= 0 ? '+' : '') + (rewritten.wordCount - chapter.wordCount) : 0}字</span>
                    </div>
                    <div>
                        ${rewritten ? `<span class="${this.isWordCountInRange(rewritten.wordCount, chapter.wordCount) ? 'text-green-400' : 'text-yellow-400'}">${this.isWordCountInRange(rewritten.wordCount, chapter.wordCount) ? '✓ 达标' : '⚠ 未达标'}</span>` : ''}
                    </div>
                </div>
            </div>
        `
    }
    
    isWordCountInRange(actualWords, originalWords) {
        let minWords, maxWords
        
        switch (this.rewriteData.wordCountMode) {
            case 'ratio':
                minWords = Math.floor(originalWords * this.rewriteData.wordCountSettings.minRatio)
                maxWords = Math.ceil(originalWords * this.rewriteData.wordCountSettings.maxRatio)
                break
            case 'absolute':
                minWords = this.rewriteData.wordCountSettings.minWords
                maxWords = this.rewriteData.wordCountSettings.maxWords
                break
            case 'reference':
                minWords = Math.floor(originalWords * (1 - this.rewriteData.wordCountSettings.tolerance))
                maxWords = Math.ceil(originalWords * (1 + this.rewriteData.wordCountSettings.tolerance))
                break
        }
        
        return actualWords >= minWords && actualWords <= maxWords
    }
    
    setupRewriteNewEvents() {
        const chapterItems = document.querySelectorAll('.chapter-item')
        const searchInput = document.getElementById('search-chapter-input')
        
        chapterItems.forEach(item => {
            item.onclick = () => {
                const index = parseInt(item.dataset.index)
                this.rewriteData.currentChapterIndex = index
                this.renderRewrite()
            }
        })
        
        if (searchInput) {
            searchInput.oninput = (e) => {
                const keyword = e.target.value.toLowerCase()
                chapterItems.forEach(item => {
                    const text = item.textContent.toLowerCase()
                    item.style.display = text.includes(keyword) ? '' : 'none'
                })
            }
        }
        
        const wordCountMode = document.getElementById('word-count-mode')
        if (wordCountMode) {
            wordCountMode.onchange = () => {
                this.rewriteData.wordCountMode = wordCountMode.value
                document.getElementById('ratio-settings').classList.toggle('hidden', wordCountMode.value !== 'ratio')
                document.getElementById('absolute-settings').classList.toggle('hidden', wordCountMode.value !== 'absolute')
                document.getElementById('reference-settings').classList.toggle('hidden', wordCountMode.value !== 'reference')
                this.updateWordCountPreview()
            }
        }
        
        const minRatio = document.getElementById('min-ratio')
        const maxRatio = document.getElementById('max-ratio')
        const tolerance = document.getElementById('tolerance')
        const targetWords = document.getElementById('target-words')
        const minWords = document.getElementById('min-words')
        const maxWords = document.getElementById('max-words')
        
        if (minRatio) {
            minRatio.oninput = () => {
                this.rewriteData.wordCountSettings.minRatio = parseFloat(minRatio.value)
                document.getElementById('min-ratio-value').textContent = Math.round(minRatio.value * 100) + '%'
                this.updateWordCountPreview()
            }
        }
        
        if (maxRatio) {
            maxRatio.oninput = () => {
                this.rewriteData.wordCountSettings.maxRatio = parseFloat(maxRatio.value)
                document.getElementById('max-ratio-value').textContent = Math.round(maxRatio.value * 100) + '%'
                this.updateWordCountPreview()
            }
        }
        
        if (tolerance) {
            tolerance.oninput = () => {
                this.rewriteData.wordCountSettings.tolerance = parseFloat(tolerance.value)
                document.getElementById('tolerance-value').textContent = '±' + Math.round(tolerance.value * 100) + '%'
                this.updateWordCountPreview()
            }
        }
        
        if (targetWords) {
            targetWords.onchange = () => {
                this.rewriteData.wordCountSettings.targetWords = parseInt(targetWords.value)
            }
        }
        
        if (minWords) {
            minWords.onchange = () => {
                this.rewriteData.wordCountSettings.minWords = parseInt(minWords.value)
            }
        }
        
        if (maxWords) {
            maxWords.onchange = () => {
                this.rewriteData.wordCountSettings.maxWords = parseInt(maxWords.value)
            }
        }
        
        const intensityInput = document.getElementById('rewrite-intensity')
        if (intensityInput) {
            intensityInput.oninput = () => {
                this.rewriteData.rewriteIntensity = parseInt(intensityInput.value)
                document.getElementById('intensity-label').textContent = this.getIntensityLabel(intensityInput.value)
            }
        }
        
        const typeSelect = document.getElementById('rewrite-type')
        if (typeSelect) {
            typeSelect.onchange = () => {
                this.rewriteData.rewriteType = typeSelect.value
            }
        }
        
        const requirementsTextarea = document.getElementById('rewrite-requirements')
        if (requirementsTextarea) {
            requirementsTextarea.oninput = () => {
                this.rewriteData.rewriteRequirements = requirementsTextarea.value
            }
        }
        
        const saveBtn = document.getElementById('save-rewrite-draft-btn')
        if (saveBtn) {
            saveBtn.onclick = () => this.saveRewriteDraft()
        }
        
        const loadBtn = document.getElementById('load-rewrite-draft-btn')
        if (loadBtn) {
            loadBtn.onclick = () => {
                this.loadRewriteDraft()
                this.renderRewrite()
            }
        }
        
        const importOriginalBtn = document.getElementById('import-original-btn')
        if (importOriginalBtn) {
            importOriginalBtn.onclick = () => this.importOriginalText()
        }
        
        const useAnalysisPlotBtn = document.getElementById('use-analysis-plot-btn')
        if (useAnalysisPlotBtn) {
            useAnalysisPlotBtn.onclick = () => this.useAnalysisPlotData()
        }
        
        const useAnalysisStyleBtn = document.getElementById('use-analysis-style-btn')
        if (useAnalysisStyleBtn) {
            useAnalysisStyleBtn.onclick = () => this.useAnalysisStyleData()
        }
        
        const useRoleCardsBtn = document.getElementById('use-role-cards-btn')
        if (useRoleCardsBtn) {
            useRoleCardsBtn.onclick = () => this.useRoleCardsData()
        }
        
        const importPlotBtn = document.getElementById('import-plot-btn')
        if (importPlotBtn) {
            importPlotBtn.onclick = () => this.importRewritePlotFile()
        }
        
        const importStyleBtn = document.getElementById('import-style-btn')
        if (importStyleBtn) {
            importStyleBtn.onclick = () => this.importRewriteStyleFile()
        }
        
        const importRoleBtn = document.getElementById('import-role-btn')
        if (importRoleBtn) {
            importRoleBtn.onclick = () => this.importRewriteRoleFile()
        }
        
        const rewriteSingleBtn = document.getElementById('rewrite-single-btn')
        if (rewriteSingleBtn) {
            rewriteSingleBtn.onclick = () => this.rewriteSingleChapter()
        }
        
        const rewriteAllBtn = document.getElementById('rewrite-all-btn')
        if (rewriteAllBtn) {
            rewriteAllBtn.onclick = () => this.rewriteAllChapters()
        }
        
        const exportBtn = document.getElementById('export-rewrite-btn')
        if (exportBtn) {
            exportBtn.onclick = () => this.exportRewriteResults()
        }
        
        const toggleCompareBtn = document.getElementById('toggle-compare-mode-btn')
        if (toggleCompareBtn) {
            toggleCompareBtn.onclick = () => this.toggleCompareMode()
        }
    }
    
    toggleCompareMode() {
        const currentChapter = this.rewriteData.chapters[this.rewriteData.currentChapterIndex]
        if (!currentChapter) {
            UIHelper.showToast('请先选择章节', 'warning')
            return
        }
        
        const rewritten = this.rewriteData.rewrittenChapters.find(r => r.chapterNum === currentChapter.chapterNum)
        if (!rewritten || !rewritten.content) {
            UIHelper.showToast('该章节尚未改写', 'warning')
            return
        }
        
        this.showCompareModal(currentChapter, rewritten)
    }
    
    showCompareModal(original, rewritten) {
        const modal = document.getElementById('modal-container')
        modal.classList.remove('hidden')
        
        const diffResult = this.computeDiff(original.content || '', rewritten.content || '')
        
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div class="bg-slate-800 rounded-lg w-full max-w-6xl h-[85vh] flex flex-col">
                    <div class="p-4 border-b border-slate-700 flex items-center justify-between">
                        <div>
                            <h2 class="text-xl font-bold">对比校对模式</h2>
                            <p class="text-sm text-slate-400">第${original.chapterNum}章 ${original.title || ''}</p>
                        </div>
                        <div class="flex items-center space-x-4">
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="show-highlight" checked class="rounded bg-slate-700 border-slate-600">
                                <span class="text-sm">显示高亮</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="sync-scroll" checked class="rounded bg-slate-700 border-slate-600">
                                <span class="text-sm">同步滚动</span>
                            </label>
                            <button id="close-compare-modal" class="btn btn-secondary text-sm">关闭</button>
                        </div>
                    </div>
                    
                    <div class="flex-1 flex overflow-hidden">
                        <div class="flex-1 flex flex-col border-r border-slate-700">
                            <div class="p-2 bg-slate-700 text-sm font-medium">📖 原文内容 (${original.wordCount || 0}字)</div>
                            <div id="original-scroll-area" class="flex-1 overflow-y-auto p-4 text-sm whitespace-pre-wrap">${original.content || ''}</div>
                        </div>
                        
                        <div class="flex-1 flex flex-col">
                            <div class="p-2 bg-slate-700 text-sm font-medium">✏️ 改写内容 (${rewritten.wordCount || 0}字)</div>
                            <div id="rewritten-scroll-area" class="flex-1 overflow-y-auto p-4 text-sm whitespace-pre-wrap">
                                <div id="diff-content">${diffResult}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-3 border-t border-slate-700 flex items-center justify-between">
                        <div class="flex items-center space-x-4 text-sm">
                            <span class="flex items-center"><span class="w-3 h-3 bg-green-500/30 border border-green-500 mr-1"></span>新增内容</span>
                            <span class="flex items-center"><span class="w-3 h-3 bg-yellow-500/30 border border-yellow-500 mr-1"></span>修改内容</span>
                            <span class="flex items-center"><span class="w-3 h-3 bg-red-500/30 border border-red-500 mr-1"></span>删除内容</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-slate-400">字数变化：${rewritten.wordCount - original.wordCount >= 0 ? '+' : ''}${rewritten.wordCount - original.wordCount}字</span>
                        </div>
                    </div>
                </div>
            </div>
        `
        
        document.getElementById('close-compare-modal').onclick = () => {
            modal.classList.add('hidden')
        }
        
        const showHighlight = document.getElementById('show-highlight')
        const diffContent = document.getElementById('diff-content')
        let originalDiffHtml = diffContent.innerHTML
        
        showHighlight.onchange = () => {
            if (showHighlight.checked) {
                diffContent.innerHTML = originalDiffHtml
            } else {
                diffContent.innerHTML = rewritten.content || ''
            }
        }
        
        const syncScroll = document.getElementById('sync-scroll')
        const originalArea = document.getElementById('original-scroll-area')
        const rewrittenArea = document.getElementById('rewritten-scroll-area')
        
        if (syncScroll) {
            originalArea.onscroll = () => {
                if (syncScroll.checked) {
                    const ratio = originalArea.scrollTop / (originalArea.scrollHeight - originalArea.clientHeight)
                    rewrittenArea.scrollTop = ratio * (rewrittenArea.scrollHeight - rewrittenArea.clientHeight)
                }
            }
            
            rewrittenArea.onscroll = () => {
                if (syncScroll.checked) {
                    const ratio = rewrittenArea.scrollTop / (rewrittenArea.scrollHeight - rewrittenArea.clientHeight)
                    originalArea.scrollTop = ratio * (originalArea.scrollHeight - originalArea.clientHeight)
                }
            }
        }
        
        modal.onclick = (e) => {
            if (e.target === modal.firstElementChild.parentElement) {
                modal.classList.add('hidden')
            }
        }
    }
    
    computeDiff(original, rewritten) {
        const origLines = original.split('\n')
        const rewrLines = rewritten.split('\n')
        
        let result = []
        const maxLen = Math.max(origLines.length, rewrLines.length)
        
        for (let i = 0; i < maxLen; i++) {
            const origLine = origLines[i] || ''
            const rewrLine = rewrLines[i] || ''
            
            if (origLine === rewrLine) {
                result.push(rewrLine)
            } else if (!origLine && rewrLine) {
                result.push(`<span class="bg-green-500/30 border-l-2 border-green-500 px-1">${rewrLine}</span>`)
            } else if (origLine && !rewrLine) {
                result.push(`<span class="bg-red-500/30 border-l-2 border-red-500 px-1 line-through text-slate-400">${origLine}</span>`)
            } else {
                result.push(`<span class="bg-yellow-500/30 border-l-2 border-yellow-500 px-1">${rewrLine}</span>`)
            }
        }
        
        return result.join('\n')
    }
    
    updateWordCountPreview() {
        const preview = document.getElementById('word-count-preview')
        const chapter = this.rewriteData.chapters[this.rewriteData.currentChapterIndex]
        if (preview && chapter) {
            preview.innerHTML = this.renderWordCountPreview(chapter)
        }
    }
    
    importOriginalText() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.txt'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                const text = await file.text()
                this.rewriteData.originalText = text
                this.parseChaptersFromText(text)
                document.getElementById('original-status-badge').textContent = '已导入'
                document.getElementById('original-status-badge').classList.remove('bg-slate-700')
                document.getElementById('original-status-badge').classList.add('bg-green-600')
                UIHelper.showToast('原文导入成功', 'success')
                this.renderRewrite()
            } catch (error) {
                UIHelper.showToast('导入失败：' + error.message, 'error')
            }
        }
        input.click()
    }
    
    parseChaptersFromText(text) {
        const chapterPattern = /第[一二三四五六七八九十百千万零\d]+章[^\n]*/g
        const matches = [...text.matchAll(chapterPattern)]
        
        this.rewriteData.chapters = []
        
        if (matches.length === 0) {
            this.rewriteData.chapters.push({
                chapterNum: 1,
                title: '全文',
                content: text,
                wordCount: text.length
            })
        } else {
            for (let i = 0; i < matches.length; i++) {
                const start = matches[i].index
                const end = i < matches.length - 1 ? matches[i + 1].index : text.length
                const content = text.substring(start, end).trim()
                
                this.rewriteData.chapters.push({
                    chapterNum: i + 1,
                    title: matches[i][0].trim(),
                    content: content,
                    wordCount: content.length
                })
            }
        }
    }
    
    useAnalysisPlotData() {
        const analysisData = WorkspaceManager.getWorkspaceData('analysis')
        if (!analysisData || !analysisData.plotAnalysis) {
            UIHelper.showToast('没有找到分析数据，请先进行AI分析', 'warning')
            return
        }
        
        this.rewriteData.plotData = analysisData.plotAnalysis
        document.getElementById('plot-status-badge').textContent = '已导入'
        document.getElementById('plot-status-badge').classList.remove('bg-slate-700')
        document.getElementById('plot-status-badge').classList.add('bg-green-600')
        UIHelper.showToast('剧情分析数据已导入', 'success')
        this.checkRewriteDataReady()
    }
    
    useAnalysisStyleData() {
        const analysisData = WorkspaceManager.getWorkspaceData('analysis')
        if (!analysisData || !analysisData.styleAnalysis) {
            UIHelper.showToast('没有找到分析数据，请先进行AI分析', 'warning')
            return
        }
        
        this.rewriteData.styleData = analysisData.styleAnalysis
        document.getElementById('style-status-badge').textContent = '已导入'
        document.getElementById('style-status-badge').classList.remove('bg-slate-700')
        document.getElementById('style-status-badge').classList.add('bg-green-600')
        UIHelper.showToast('文风分析数据已导入', 'success')
        this.checkRewriteDataReady()
    }
    
    useRoleCardsData() {
        const cards = RoleCardManager.getRoleCards()
        if (!cards || cards.length === 0) {
            UIHelper.showToast('没有找到角色卡数据', 'warning')
            return
        }
        
        this.rewriteData.roleCards = cards
        document.getElementById('role-status-badge').textContent = '已导入'
        document.getElementById('role-status-badge').classList.remove('bg-slate-700')
        document.getElementById('role-status-badge').classList.add('bg-green-600')
        UIHelper.showToast('角色卡数据已导入', 'success')
        this.checkRewriteDataReady()
    }
    
    importRewritePlotFile() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                const result = await FileHandler.importJson(file)
                const plotData = result.plotAnalysis || result.data?.plotAnalysis || result
                
                if (!plotData) {
                    UIHelper.showToast('剧情分析数据格式不正确', 'error')
                    return
                }
                
                this.rewriteData.plotData = plotData
                const badge = document.getElementById('plot-status-badge')
                if (badge) {
                    badge.textContent = '已导入'
                    badge.classList.remove('bg-slate-700')
                    badge.classList.add('bg-green-600')
                }
                UIHelper.showToast('剧情分析数据已导入', 'success')
                this.checkRewriteDataReady()
            } catch (error) {
                UIHelper.showToast('导入失败：' + error.message, 'error')
            }
        }
        input.click()
    }
    
    importRewriteStyleFile() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                const result = await FileHandler.importJson(file)
                const styleData = result.styleAnalysis || result.data?.styleAnalysis || result
                
                if (!styleData) {
                    UIHelper.showToast('文风分析数据格式不正确', 'error')
                    return
                }
                
                this.rewriteData.styleData = styleData
                const badge = document.getElementById('style-status-badge')
                if (badge) {
                    badge.textContent = '已导入'
                    badge.classList.remove('bg-slate-700')
                    badge.classList.add('bg-green-600')
                }
                UIHelper.showToast('文风分析数据已导入', 'success')
                this.checkRewriteDataReady()
            } catch (error) {
                UIHelper.showToast('导入失败：' + error.message, 'error')
            }
        }
        input.click()
    }
    
    importRewriteRoleFile() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                const result = await FileHandler.importJson(file)
                const roleCards = result.roleCards || result.data?.roleCards || (Array.isArray(result) ? result : null)
                
                if (!roleCards || !Array.isArray(roleCards)) {
                    UIHelper.showToast('角色卡数据格式不正确', 'error')
                    return
                }
                
                this.rewriteData.roleCards = roleCards
                const badge = document.getElementById('role-status-badge')
                if (badge) {
                    badge.textContent = '已导入'
                    badge.classList.remove('bg-slate-700')
                    badge.classList.add('bg-green-600')
                }
                UIHelper.showToast('角色卡数据已导入', 'success')
            } catch (error) {
                UIHelper.showToast('导入失败：' + error.message, 'error')
            }
        }
        input.click()
    }
    
    checkRewriteDataReady() {
        if (this.rewriteData.plotData && this.rewriteData.styleData) {
            this.renderRewrite()
        }
    }
    
    loadRewriteDraft() {
        const draft = WorkspaceManager.getWorkspaceData('drafts.rewrite')
        if (draft) {
            try {
                this.rewriteData = draft
                UIHelper.showToast('已加载上次保存的草稿', 'info')
            } catch (error) {
                this.initRewriteData()
            }
        } else {
            this.initRewriteData()
        }
    }
    
    initRewriteData() {
        this.rewriteData = {
            originalText: null,
            plotData: null,
            styleData: null,
            roleCards: null,
            chapters: [],
            rewrittenChapters: [],
            currentChapterIndex: 0,
            wordCountMode: 'ratio',
            wordCountSettings: {
                minRatio: 0.8,
                maxRatio: 1.2,
                targetWords: 5000,
                minWords: 3000,
                maxWords: 8000,
                tolerance: 0.1
            },
            rewriteIntensity: 3,
            rewriteType: 'plot',
            rewriteRequirements: ''
        }
    }
    
    saveRewriteDraft() {
        WorkspaceManager.setWorkspaceData('drafts.rewrite', this.rewriteData)
        UIHelper.showToast('草稿已保存', 'success')
    }
    
    async rewriteSingleChapter() {
        const chapter = this.rewriteData.chapters[this.rewriteData.currentChapterIndex]
        if (!chapter) {
            UIHelper.showToast('请先选择章节', 'warning')
            return
        }
        
        if (!this.rewriteData.plotData || !this.rewriteData.styleData) {
            UIHelper.showToast('请先导入剧情分析和文风分析数据', 'warning')
            return
        }
        
        const btn = document.getElementById('rewrite-single-btn')
        btn.disabled = true
        btn.textContent = '⏳ 改写中...'
        
        try {
            const result = await this.executeRewriteChapter(chapter)
            
            const existingIndex = this.rewriteData.rewrittenChapters.findIndex(r => r.chapterNum === chapter.chapterNum)
            if (existingIndex > -1) {
                this.rewriteData.rewrittenChapters[existingIndex] = result
            } else {
                this.rewriteData.rewrittenChapters.push(result)
            }
            
            this.renderRewrite()
            UIHelper.showToast('改写完成', 'success')
        } catch (error) {
            UIHelper.showToast('改写失败：' + error.message, 'error')
        } finally {
            btn.disabled = false
            btn.textContent = '▶️ 改写当前章节'
        }
    }
    
    async executeRewriteChapter(chapter) {
        const wordCountInstruction = this.buildWordCountInstruction(chapter.wordCount)
        
        const taskInstructions = `你是一位专业的小说编辑。请根据提供的原文、文风分析、角色信息和改写需求，改写指定的章节内容。

${wordCountInstruction}

## 改写类型
${this.rewriteData.rewriteType}

## 改写强度
${this.getIntensityLabel(this.rewriteData.rewriteIntensity)}（${this.getIntensityDescription(this.rewriteData.rewriteIntensity)}）

## 改写需求
${this.rewriteData.rewriteRequirements || '按照改写类型和强度进行改写'}

## 文风分析
${JSON.stringify(this.rewriteData.styleData, null, 2)}

## 角色信息
${JSON.stringify(this.rewriteData.roleCards || [], null, 2)}

## 原章节内容
${chapter.content}

请直接输出改写后的章节内容，不要包含任何解释或说明。`

        const messages = [
            { role: 'user', content: taskInstructions }
        ]
        const response = await apiClient.chat(messages)
        
        return {
            chapterNum: chapter.chapterNum,
            title: chapter.title,
            originalContent: chapter.content,
            originalWordCount: chapter.wordCount,
            content: response,
            wordCount: response.length,
            status: 'success',
            rewrittenAt: Date.now()
        }
    }
    
    buildWordCountInstruction(originalWords) {
        let minWords, maxWords
        
        switch (this.rewriteData.wordCountMode) {
            case 'ratio':
                minWords = Math.floor(originalWords * this.rewriteData.wordCountSettings.minRatio)
                maxWords = Math.ceil(originalWords * this.rewriteData.wordCountSettings.maxRatio)
                return `字数要求：改写后的章节字数应在${minWords}至${maxWords}字之间（原章节${originalWords}字的${Math.round(this.rewriteData.wordCountSettings.minRatio * 100)}%至${Math.round(this.rewriteData.wordCountSettings.maxRatio * 100)}%）。`
                
            case 'absolute':
                minWords = this.rewriteData.wordCountSettings.minWords
                maxWords = this.rewriteData.wordCountSettings.maxWords
                return `字数要求：改写后的章节字数应在${minWords}至${maxWords}字之间，目标字数为${this.rewriteData.wordCountSettings.targetWords}字。`
                
            case 'reference':
                const tolerance = this.rewriteData.wordCountSettings.tolerance
                minWords = Math.floor(originalWords * (1 - tolerance))
                maxWords = Math.ceil(originalWords * (1 + tolerance))
                return `字数要求：改写后的章节字数应接近原章节字数（${originalWords}字），允许${Math.round(tolerance * 100)}%的偏差，即${minWords}至${maxWords}字之间。`
        }
    }
    
    async rewriteAllChapters() {
        if (!this.rewriteData.chapters || this.rewriteData.chapters.length === 0) {
            UIHelper.showToast('没有章节数据', 'warning')
            return
        }
        
        const btn = document.getElementById('rewrite-all-btn')
        const stopBtn = document.getElementById('stop-rewrite-btn')
        
        btn.disabled = true
        btn.classList.add('hidden')
        stopBtn.classList.remove('hidden')
        
        this.rewriteData.isGenerating = true
        
        for (let i = 0; i < this.rewriteData.chapters.length; i++) {
            if (!this.rewriteData.isGenerating) break
            
            this.rewriteData.currentChapterIndex = i
            const chapter = this.rewriteData.chapters[i]
            
            try {
                const result = await this.executeRewriteChapter(chapter)
                
                const existingIndex = this.rewriteData.rewrittenChapters.findIndex(r => r.chapterNum === chapter.chapterNum)
                if (existingIndex > -1) {
                    this.rewriteData.rewrittenChapters[existingIndex] = result
                } else {
                    this.rewriteData.rewrittenChapters.push(result)
                }
                
                this.renderRewrite()
            } catch (error) {
                this.rewriteData.rewrittenChapters.push({
                    chapterNum: chapter.chapterNum,
                    title: chapter.title,
                    status: 'failed',
                    error: error.message
                })
            }
        }
        
        this.rewriteData.isGenerating = false
        btn.disabled = false
        btn.classList.remove('hidden')
        stopBtn.classList.add('hidden')
        
        UIHelper.showToast('批量改写完成', 'success')
    }
    
    exportRewriteResults() {
        if (this.rewriteData.rewrittenChapters.length === 0) {
            UIHelper.showToast('没有改写结果可导出', 'warning')
            return
        }
        
        let content = ''
        this.rewriteData.rewrittenChapters
            .filter(r => r.status === 'success')
            .sort((a, b) => a.chapterNum - b.chapterNum)
            .forEach(chapter => {
                content += chapter.content
                content += '\n\n'
            })
        
        const filename = `改写结果_${new Date().toISOString().slice(0, 10)}.txt`
        FileHandler.exportTxt(content, filename)
    }
    
    renderRewriteStepIndicator(currentStep) {
        const steps = [
            { num: 1, name: '导入数据' },
            { num: 2, name: '选择范围' },
            { num: 3, name: '填写需求' },
            { num: 4, name: '生成改写' },
            { num: 5, name: '编辑调整' },
            { num: 6, name: '导出预览' }
        ]
        
        return `
            <div class="flex items-center justify-between">
                ${steps.map((step, index) => `
                    <div class="flex items-center">
                        <div class="flex flex-col items-center">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                step.num < currentStep ? 'bg-green-500 text-white' :
                                step.num === currentStep ? 'bg-purple-500 text-white' :
                                'bg-slate-700 text-slate-400'
                            }">
                                ${step.num < currentStep ? '✓' : step.num}
                            </div>
                            <span class="text-xs mt-1 ${step.num === currentStep ? 'text-purple-400' : 'text-slate-500'}">${step.name}</span>
                        </div>
                        ${index < steps.length - 1 ? `
                            <div class="w-16 h-1 mx-2 ${step.num < currentStep ? 'bg-green-500' : 'bg-slate-700'}"></div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `
    }
    
    renderRewriteStep1() {
        return `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤1：导入数据</h2>
                <p class="text-slate-400 mb-6">请导入原文、剧情分析、文风分析和角色卡数据</p>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">原文TXT</h3>
                            <span id="original-status-badge" class="text-xs px-2 py-1 rounded ${this.rewriteData.originalText ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.rewriteData.originalText ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div id="original-data-status" class="text-sm text-slate-400 mb-3 min-h-[40px]">
                            ${this.rewriteData.originalText ? 
                                `${this.rewriteData.originalText.length}字` : 
                                '点击下方按钮导入原文'}
                        </div>
                        <div class="flex space-x-2">
                            <button id="import-original-btn" class="btn btn-secondary text-sm flex-1">
                                导入TXT文件
                            </button>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">剧情分析JSON</h3>
                            <span id="rewrite-plot-status-badge" class="text-xs px-2 py-1 rounded ${this.rewriteData.plotData ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.rewriteData.plotData ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div id="rewrite-plot-data-status" class="text-sm text-slate-400 mb-3 min-h-[40px]">
                            ${this.rewriteData.plotData ? 
                                `${this.rewriteData.plotData.totalChapters || 0}章 | ${this.rewriteData.plotData.characters ? this.rewriteData.plotData.characters.length : 0}角色` : 
                                '点击下方按钮导入数据'}
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-analysis-rewrite-plot-btn" class="btn btn-secondary text-sm flex-1">
                                使用分析结果
                            </button>
                            <button id="import-rewrite-plot-btn" class="btn btn-secondary text-sm flex-1">
                                导入文件
                            </button>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">文风分析JSON</h3>
                            <span id="rewrite-style-status-badge" class="text-xs px-2 py-1 rounded ${this.rewriteData.styleData ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.rewriteData.styleData ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div id="rewrite-style-data-status" class="text-sm text-slate-400 mb-3 min-h-[40px]">
                            ${this.rewriteData.styleData ? 
                                `${this.rewriteData.styleData.rhythm?.pace || '未知'}节奏` : 
                                '点击下方按钮导入数据'}
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-analysis-rewrite-style-btn" class="btn btn-secondary text-sm flex-1">
                                使用分析结果
                            </button>
                            <button id="import-rewrite-style-btn" class="btn btn-secondary text-sm flex-1">
                                导入文件
                            </button>
                        </div>
                    </div>
                    
                    <div class="border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium">角色卡</h3>
                            <span id="rewrite-role-status-badge" class="text-xs px-2 py-1 rounded ${this.rewriteData.roleCards ? 'bg-green-600' : 'bg-slate-700'}">
                                ${this.rewriteData.roleCards ? '已导入' : '未导入'}
                            </span>
                        </div>
                        <div id="rewrite-role-data-status" class="text-sm text-slate-400 mb-3 min-h-[40px]">
                            ${this.rewriteData.roleCards ? 
                                `${this.rewriteData.roleCards.length}个角色` : 
                                '点击下方按钮导入数据'}
                        </div>
                        <div class="flex space-x-2">
                            <button id="use-rewrite-role-cards-btn" class="btn btn-secondary text-sm flex-1">
                                使用已有角色
                            </button>
                            <button id="import-rewrite-role-btn" class="btn btn-secondary text-sm flex-1">
                                导入文件
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="bg-purple-900 border border-purple-700 rounded-lg p-4 mb-4">
                    <h3 class="font-medium mb-2">改写说明</h3>
                    <ul class="text-sm text-slate-300 space-y-1">
                        <li>• 改写将保持原文的文风和角色设定</li>
                        <li>• 可以改写特定章节或剧情片段</li>
                        <li>• AI会根据您的需求调整剧情走向</li>
                        <li>• 改写结果可以手动编辑调整</li>
                    </ul>
                </div>
                
                <div class="flex justify-end">
                    <button id="next-rewrite-step-1-btn" class="btn btn-primary" disabled>
                        下一步：选择范围
                    </button>
                </div>
            </div>
        `
    }
    
    setupRewriteEvents() {
        const saveDraftBtn = document.getElementById('save-rewrite-draft-btn')
        if (saveDraftBtn) {
            saveDraftBtn.onclick = () => this.saveRewriteDraft()
        }
        
        const loadDraftBtn = document.getElementById('load-rewrite-draft-btn')
        if (loadDraftBtn) {
            loadDraftBtn.onclick = () => {
                if (confirm('加载草稿将覆盖当前进度，确定继续吗？')) {
                    this.loadRewriteDraft()
                    this.renderRewrite()
                }
            }
        }
        
        document.getElementById('import-original-btn').onclick = () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.txt'
            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                try {
                    const result = await FileHandler.importTxt(file)
                    this.rewriteData.originalText = result.content
                    this.updateRewriteDataStatus('original', result.content)
                    UIHelper.showToast('原文导入成功', 'success')
                } catch (error) {
                    UIHelper.showToast('导入失败：' + error.message, 'error')
                }
            }
            input.click()
        }
        
        document.getElementById('use-analysis-rewrite-plot-btn').onclick = () => {
            const analysisData = WorkspaceManager.getWorkspaceData('analysis')
            if (!analysisData || !analysisData.plotAnalysis) {
                UIHelper.showToast('请先进行AI文本分析', 'warning')
                return
            }
            
            try {
                const plotData = analysisData.plotAnalysis
                
                if (!this.validatePlotData(plotData)) {
                    UIHelper.showToast('剧情分析数据格式不正确', 'error')
                    return
                }
                
                this.rewriteData.plotData = plotData
                this.updateRewriteDataStatus('plot', plotData)
                UIHelper.showToast('剧情分析数据已导入', 'success')
            } catch (error) {
                UIHelper.showToast('数据解析失败：' + error.message, 'error')
            }
        }
        
        document.getElementById('import-rewrite-plot-btn').onclick = () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                try {
                    const result = await FileHandler.importJson(file)
                    const plotData = result.data.plotAnalysis || result.data
                    
                    if (!this.validatePlotData(plotData)) {
                        UIHelper.showToast('剧情分析数据格式不正确', 'error')
                        return
                    }
                    
                    this.rewriteData.plotData = plotData
                    this.updateRewriteDataStatus('plot', plotData)
                    UIHelper.showToast('剧情分析数据已导入', 'success')
                } catch (error) {
                    UIHelper.showToast('导入失败：' + error.message, 'error')
                }
            }
            input.click()
        }
        
        document.getElementById('use-analysis-rewrite-style-btn').onclick = () => {
            const analysisData = WorkspaceManager.getWorkspaceData('analysis')
            if (!analysisData || !analysisData.styleAnalysis) {
                UIHelper.showToast('请先进行AI文本分析', 'warning')
                return
            }
            
            try {
                const styleData = analysisData.styleAnalysis
                
                if (!this.validateStyleData(styleData)) {
                    UIHelper.showToast('文风分析数据格式不正确', 'error')
                    return
                }
                
                this.rewriteData.styleData = styleData
                this.updateRewriteDataStatus('style', styleData)
                UIHelper.showToast('文风分析数据已导入', 'success')
            } catch (error) {
                UIHelper.showToast('数据解析失败：' + error.message, 'error')
            }
        }
        
        document.getElementById('import-rewrite-style-btn').onclick = () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                try {
                    const result = await FileHandler.importJson(file)
                    const styleData = result.data.styleAnalysis || result.data
                    
                    if (!this.validateStyleData(styleData)) {
                        UIHelper.showToast('文风分析数据格式不正确', 'error')
                        return
                    }
                    
                    this.rewriteData.styleData = styleData
                    this.updateRewriteDataStatus('style', styleData)
                    UIHelper.showToast('文风分析数据已导入', 'success')
                } catch (error) {
                    UIHelper.showToast('导入失败：' + error.message, 'error')
                }
            }
            input.click()
        }
        
        document.getElementById('use-rewrite-role-cards-btn').onclick = () => {
            const cards = RoleCardManager.getRoleCards()
            if (cards.length === 0) {
                UIHelper.showToast('没有角色卡，请先创建或导入', 'warning')
                return
            }
            
            this.rewriteData.roleCards = cards
            this.updateRewriteDataStatus('role', cards)
            UIHelper.showToast(`已导入${cards.length}个角色卡`, 'success')
        }
        
        document.getElementById('import-rewrite-role-btn').onclick = () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                try {
                    const result = await FileHandler.importJson(file)
                    const cards = result.data.roleCards || result.data
                    if (Array.isArray(cards)) {
                        this.rewriteData.roleCards = cards
                        this.updateRewriteDataStatus('role', cards)
                        UIHelper.showToast(`已导入${cards.length}个角色卡`, 'success')
                    } else {
                        throw new Error('角色卡数据格式错误')
                    }
                } catch (error) {
                    UIHelper.showToast('导入失败：' + error.message, 'error')
                }
            }
            input.click()
        }
        
        document.getElementById('next-rewrite-step-1-btn').onclick = () => {
            this.rewriteData.currentStep = 2
            this.renderRewriteStep2()
        }
        
        this.checkRewriteStep1Complete()
    }
    
    updateRewriteDataStatus(type, data) {
        const statusMap = {
            'original': {
                badge: 'original-status-badge',
                status: 'original-data-status',
                getText: (d) => `${d.length}字`
            },
            'plot': {
                badge: 'rewrite-plot-status-badge',
                status: 'rewrite-plot-data-status',
                getText: (d) => `${d.totalChapters || 0}章 | ${d.characters ? d.characters.length : 0}角色`
            },
            'style': {
                badge: 'rewrite-style-status-badge',
                status: 'rewrite-style-data-status',
                getText: (d) => `${d.rhythm?.pace || '未知'}节奏`
            },
            'role': {
                badge: 'rewrite-role-status-badge',
                status: 'rewrite-role-data-status',
                getText: (d) => `${d.length}个角色`
            }
        }
        
        const config = statusMap[type]
        if (!config) return
        
        const badge = document.getElementById(config.badge)
        const status = document.getElementById(config.status)
        
        if (badge) {
            badge.className = 'text-xs px-2 py-1 rounded bg-green-600'
            badge.textContent = '已导入'
        }
        
        if (status) {
            status.textContent = config.getText(data)
        }
        
        this.checkRewriteStep1Complete()
    }
    
    checkRewriteStep1Complete() {
        const nextBtn = document.getElementById('next-rewrite-step-1-btn')
        if (!nextBtn) return
        
        const hasOriginal = this.rewriteData.originalText !== null
        const hasPlot = this.rewriteData.plotData !== null
        const hasStyle = this.rewriteData.styleData !== null
        
        nextBtn.disabled = !(hasOriginal && hasPlot && hasStyle)
    }
    
    renderRewriteStep2() {
        const stepIndicator = document.getElementById('rewrite-step-indicator')
        stepIndicator.innerHTML = this.renderRewriteStepIndicator(2)
        
        const totalChapters = this.rewriteData.plotData?.totalChapters || 0
        const chapters = this.rewriteData.plotData?.chapters || []
        
        const stepsContainer = document.getElementById('rewrite-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤2：选择改写范围</h2>
                <p class="text-slate-400 mb-6">选择需要改写的章节，可以多选</p>
                
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium">章节列表</h3>
                        <div class="flex space-x-2">
                            <button id="select-all-chapters-btn" class="btn btn-secondary text-sm">
                                全选
                            </button>
                            <button id="deselect-all-chapters-btn" class="btn btn-secondary text-sm">
                                取消全选
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-slate-700 rounded-lg p-4 mb-4">
                        <div class="text-sm text-slate-400 mb-2">
                            已选择：<span id="selected-count">${this.rewriteData.selectedChapters.length}</span> / ${totalChapters} 章
                        </div>
                        <div class="w-full bg-slate-600 rounded-full h-2">
                            <div id="selection-progress" class="bg-purple-500 h-2 rounded-full transition-all duration-300" style="width: ${(this.rewriteData.selectedChapters.length / totalChapters) * 100}%"></div>
                        </div>
                    </div>
                    
                    <div id="chapter-list" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-96 overflow-y-auto">
                        ${this.renderChapterSelectionList(chapters)}
                    </div>
                </div>
                
                <div class="bg-slate-700 rounded-lg p-4 mb-4">
                    <h3 class="font-medium mb-2">快速选择</h3>
                    <div class="flex space-x-2">
                        <button id="select-range-btn" class="btn btn-secondary text-sm">
                            选择区间
                        </button>
                        <button id="select-odd-btn" class="btn btn-secondary text-sm">
                            选择奇数章
                        </button>
                        <button id="select-even-btn" class="btn btn-secondary text-sm">
                            选择偶数章
                        </button>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-rewrite-step-2-btn" class="btn btn-secondary">
                        上一步
                    </button>
                    <button id="next-rewrite-step-2-btn" class="btn btn-primary" disabled>
                        下一步：填写需求
                    </button>
                </div>
            </div>
        `
        
        this.setupRewriteStep2Events()
    }
    
    renderChapterSelectionList(chapters) {
        if (!chapters || chapters.length === 0) {
            return '<div class="col-span-full text-center text-slate-400 py-8">暂无章节数据</div>'
        }
        
        return chapters.map((chapter, index) => `
            <div class="chapter-select-item border border-slate-700 rounded p-2 cursor-pointer hover:border-purple-500 transition-colors ${this.rewriteData.selectedChapters.includes(index + 1) ? 'border-purple-500 bg-purple-900' : ''}" data-chapter="${index + 1}">
                <div class="text-sm font-medium">第${index + 1}章</div>
                <div class="text-xs text-slate-400 truncate">${chapter.title || '无标题'}</div>
            </div>
        `).join('')
    }
    
    setupRewriteStep2Events() {
        const chapterItems = document.querySelectorAll('.chapter-select-item')
        const selectedCount = document.getElementById('selected-count')
        const selectionProgress = document.getElementById('selection-progress')
        const totalChapters = this.rewriteData.plotData?.totalChapters || 0
        const nextBtn = document.getElementById('next-rewrite-step-2-btn')
        
        const updateSelection = () => {
            const count = this.rewriteData.selectedChapters.length
            selectedCount.textContent = count
            selectionProgress.style.width = `${(count / totalChapters) * 100}%`
            nextBtn.disabled = count === 0
        }
        
        chapterItems.forEach(item => {
            item.onclick = () => {
                const chapterNum = parseInt(item.dataset.chapter)
                const index = this.rewriteData.selectedChapters.indexOf(chapterNum)
                
                if (index > -1) {
                    this.rewriteData.selectedChapters.splice(index, 1)
                    item.classList.remove('border-purple-500', 'bg-purple-900')
                } else {
                    this.rewriteData.selectedChapters.push(chapterNum)
                    item.classList.add('border-purple-500', 'bg-purple-900')
                }
                
                updateSelection()
            }
        })
        
        document.getElementById('select-all-chapters-btn').onclick = () => {
            this.rewriteData.selectedChapters = Array.from({length: totalChapters}, (_, i) => i + 1)
            document.querySelectorAll('.chapter-select-item').forEach(item => {
                item.classList.add('border-purple-500', 'bg-purple-900')
            })
            updateSelection()
        }
        
        document.getElementById('deselect-all-chapters-btn').onclick = () => {
            this.rewriteData.selectedChapters = []
            document.querySelectorAll('.chapter-select-item').forEach(item => {
                item.classList.remove('border-purple-500', 'bg-purple-900')
            })
            updateSelection()
        }
        
        document.getElementById('select-odd-btn').onclick = () => {
            this.rewriteData.selectedChapters = Array.from({length: totalChapters}, (_, i) => i + 1).filter(n => n % 2 === 1)
            document.querySelectorAll('.chapter-select-item').forEach(item => {
                const num = parseInt(item.dataset.chapter)
                if (num % 2 === 1) {
                    item.classList.add('border-purple-500', 'bg-purple-900')
                } else {
                    item.classList.remove('border-purple-500', 'bg-purple-900')
                }
            })
            updateSelection()
        }
        
        document.getElementById('select-even-btn').onclick = () => {
            this.rewriteData.selectedChapters = Array.from({length: totalChapters}, (_, i) => i + 1).filter(n => n % 2 === 0)
            document.querySelectorAll('.chapter-select-item').forEach(item => {
                const num = parseInt(item.dataset.chapter)
                if (num % 2 === 0) {
                    item.classList.add('border-purple-500', 'bg-purple-900')
                } else {
                    item.classList.remove('border-purple-500', 'bg-purple-900')
                }
            })
            updateSelection()
        }
        
        document.getElementById('select-range-btn').onclick = () => {
            const start = prompt('请输入起始章节号：')
            const end = prompt('请输入结束章节号：')
            
            if (start && end) {
                const startNum = parseInt(start)
                const endNum = parseInt(end)
                
                if (startNum > 0 && endNum <= totalChapters && startNum <= endNum) {
                    this.rewriteData.selectedChapters = Array.from({length: endNum - startNum + 1}, (_, i) => startNum + i)
                    document.querySelectorAll('.chapter-select-item').forEach(item => {
                        const num = parseInt(item.dataset.chapter)
                        if (num >= startNum && num <= endNum) {
                            item.classList.add('border-purple-500', 'bg-purple-900')
                        } else {
                            item.classList.remove('border-purple-500', 'bg-purple-900')
                        }
                    })
                    updateSelection()
                } else {
                    UIHelper.showToast('请输入有效的章节范围', 'error')
                }
            }
        }
        
        document.getElementById('prev-rewrite-step-2-btn').onclick = () => {
            this.rewriteData.currentStep = 1
            this.renderRewrite()
        }
        
        nextBtn.onclick = () => {
            this.rewriteData.selectedChapters.sort((a, b) => a - b)
            this.rewriteData.currentStep = 3
            this.renderRewriteStep3()
        }
        
        updateSelection()
    }
    
    renderRewriteStep3() {
        const stepIndicator = document.getElementById('rewrite-step-indicator')
        stepIndicator.innerHTML = this.renderRewriteStepIndicator(3)
        
        const stepsContainer = document.getElementById('rewrite-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤3：填写改写需求</h2>
                <p class="text-slate-400 mb-6">描述您希望如何改写选中的章节</p>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">
                            改写类型 <span class="text-red-500">*</span>
                        </label>
                        <select id="rewrite-type" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none">
                            <option value="plot" ${this.rewriteData.rewriteType === 'plot' ? 'selected' : ''}>剧情改写</option>
                            <option value="character" ${this.rewriteData.rewriteType === 'character' ? 'selected' : ''}>角色改写</option>
                            <option value="ending" ${this.rewriteData.rewriteType === 'ending' ? 'selected' : ''}>结局改写</option>
                            <option value="dialogue" ${this.rewriteData.rewriteType === 'dialogue' ? 'selected' : ''}>对话改写</option>
                            <option value="description" ${this.rewriteData.rewriteType === 'description' ? 'selected' : ''}>描写改写</option>
                            <option value="custom" ${this.rewriteData.rewriteType === 'custom' ? 'selected' : ''}>自定义改写</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">
                            改写强度 <span class="text-red-500">*</span>
                        </label>
                        <div class="flex items-center space-x-4">
                            <input 
                                type="range" 
                                id="rewrite-intensity" 
                                min="1" 
                                max="5" 
                                value="${this.rewriteData.rewriteIntensity}"
                                class="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                            >
                            <span id="intensity-label" class="text-sm font-medium w-20 text-center">
                                ${this.getIntensityLabel(this.rewriteData.rewriteIntensity)}
                            </span>
                        </div>
                        <div class="flex justify-between text-xs text-slate-500 mt-1">
                            <span>微调</span>
                            <span>大幅改写</span>
                        </div>
                        <div id="intensity-description" class="mt-2 text-xs text-slate-400 bg-slate-700 rounded p-2">
                            ${this.getIntensityDescription(this.rewriteData.rewriteIntensity)}
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">
                            改写需求 <span class="text-red-500">*</span>
                        </label>
                        <textarea 
                            id="rewrite-requirements" 
                            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none min-h-[150px]"
                            placeholder="请详细描述您的改写需求，例如：&#10;• 改变剧情走向，让主角选择不同的道路&#10;• 调整角色性格，使其更加果断&#10;• 修改结局，让故事有一个圆满的结尾"
                        >${this.rewriteData.rewriteRequirements}</textarea>
                        <div class="flex justify-between text-xs text-slate-500 mt-1">
                            <span>建议详细描述，AI会根据您的需求进行改写</span>
                            <span id="requirements-count">${this.rewriteData.rewriteRequirements.length}字</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-purple-900 border border-purple-700 rounded-lg p-4 mt-4 mb-4">
                    <h3 class="font-medium mb-2">改写类型说明</h3>
                    <div class="text-sm text-slate-300 space-y-1">
                        <p><strong>剧情改写：</strong>改变剧情走向、情节发展</p>
                        <p><strong>角色改写：</strong>调整角色行为、性格表现</p>
                        <p><strong>结局改写：</strong>重新设计故事结局</p>
                        <p><strong>对话改写：</strong>优化对话内容、语气</p>
                        <p><strong>描写改写：</strong>改进场景描写、细节描写</p>
                        <p><strong>自定义改写：</strong>完全自定义改写需求</p>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-rewrite-step-3-btn" class="btn btn-secondary">
                        上一步
                    </button>
                    <button id="next-rewrite-step-3-btn" class="btn btn-primary">
                        下一步：生成改写
                    </button>
                </div>
            </div>
        `
        
        this.setupRewriteStep3Events()
    }
    
    getIntensityLabel(intensity) {
        const labels = {
            1: '微调',
            2: '轻度',
            3: '适中',
            4: '较强',
            5: '大幅'
        }
        return labels[intensity] || '适中'
    }
    
    getIntensityDescription(intensity) {
        const descriptions = {
            1: '微调：保持原文大部分内容，仅做细微调整。适合修正小瑕疵或优化个别词句。',
            2: '轻度：在原文基础上做适度修改。适合调整部分情节或优化表达方式。',
            3: '适中：按照需求进行中等程度的改写。适合改变部分剧情走向或角色表现。',
            4: '较强：进行较大幅度的改写。适合重新设计情节发展或角色性格。',
            5: '大幅：完全按照需求重新创作。适合彻底改变剧情走向或结局。'
        }
        return descriptions[intensity] || descriptions[3]
    }
    
    setupRewriteStep3Events() {
        const typeSelect = document.getElementById('rewrite-type')
        const intensityInput = document.getElementById('rewrite-intensity')
        const intensityLabel = document.getElementById('intensity-label')
        const intensityDescription = document.getElementById('intensity-description')
        const requirementsTextarea = document.getElementById('rewrite-requirements')
        const requirementsCount = document.getElementById('requirements-count')
        const nextBtn = document.getElementById('next-rewrite-step-3-btn')
        
        typeSelect.onchange = () => {
            this.rewriteData.rewriteType = typeSelect.value
        }
        
        intensityInput.oninput = () => {
            const value = parseInt(intensityInput.value)
            this.rewriteData.rewriteIntensity = value
            intensityLabel.textContent = this.getIntensityLabel(value)
            intensityDescription.textContent = this.getIntensityDescription(value)
        }
        
        requirementsTextarea.oninput = () => {
            this.rewriteData.rewriteRequirements = requirementsTextarea.value
            requirementsCount.textContent = `${requirementsTextarea.value.length}字`
        }
        
        document.getElementById('prev-rewrite-step-3-btn').onclick = () => {
            this.rewriteData.currentStep = 2
            this.renderRewriteStep2()
        }
        
        nextBtn.onclick = () => {
            if (!this.rewriteData.rewriteRequirements.trim()) {
                UIHelper.showToast('请填写改写需求', 'warning')
                return
            }
            
            this.rewriteData.currentStep = 4
            this.renderRewriteStep4()
        }
    }
    
    renderRewriteStep4() {
        const stepIndicator = document.getElementById('rewrite-step-indicator')
        stepIndicator.innerHTML = this.renderRewriteStepIndicator(4)
        
        const stepsContainer = document.getElementById('rewrite-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤4：生成改写内容</h2>
                <p class="text-slate-400 mb-6">AI将逐章改写选中的章节，请耐心等待</p>
                
                <div class="bg-slate-700 rounded-lg p-4 mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span>改写进度</span>
                        <span id="rewrite-progress-text">准备中...</span>
                    </div>
                    <div class="w-full bg-slate-600 rounded-full h-3">
                        <div id="rewrite-progress-bar" class="bg-purple-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-slate-400 mt-2">
                        <span>当前章节：<span id="current-rewrite-chapter">-</span></span>
                        <span>剩余时间：<span id="rewrite-remaining-time">计算中...</span></span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                        <h3 class="font-medium mb-2">改写日志</h3>
                        <div id="rewrite-log" class="bg-slate-700 rounded p-3 h-64 overflow-y-auto text-sm">
                            <p class="text-slate-400">等待开始...</p>
                        </div>
                    </div>
                    <div>
                        <h3 class="font-medium mb-2">实时预览</h3>
                        <div id="rewrite-preview" class="bg-slate-700 rounded p-3 h-64 overflow-y-auto text-sm">
                            <p class="text-slate-400">等待改写...</p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-rewrite-step-4-btn" class="btn btn-secondary" disabled>
                        上一步
                    </button>
                    <div class="flex space-x-2">
                        <button id="cancel-rewrite-btn" class="btn btn-secondary hidden">
                            取消改写
                        </button>
                        <button id="start-rewrite-btn" class="btn btn-primary">
                            开始改写
                        </button>
                    </div>
                    <button id="next-rewrite-step-4-btn" class="btn btn-primary hidden">
                        下一步：编辑调整
                    </button>
                </div>
            </div>
        `
        
        this.setupRewriteStep4Events()
    }
    
    setupRewriteStep4Events() {
        const startBtn = document.getElementById('start-rewrite-btn')
        const cancelBtn = document.getElementById('cancel-rewrite-btn')
        const prevBtn = document.getElementById('prev-rewrite-step-4-btn')
        const nextBtn = document.getElementById('next-rewrite-step-4-btn')
        
        startBtn.onclick = () => {
            startBtn.disabled = true
            startBtn.textContent = '改写中...'
            cancelBtn.classList.remove('hidden')
            this.rewriteData.isGenerating = true
            this.startRewriteGeneration()
        }
        
        cancelBtn.onclick = () => {
            if (confirm('确定要取消改写吗？已改写的内容将保留。')) {
                this.rewriteData.isGenerating = false
                cancelBtn.classList.add('hidden')
                startBtn.disabled = false
                startBtn.textContent = '继续改写'
                UIHelper.showToast('已取消改写', 'warning')
            }
        }
        
        prevBtn.onclick = () => {
            this.rewriteData.currentStep = 3
            this.renderRewriteStep3()
        }
        
        nextBtn.onclick = () => {
            this.rewriteData.currentStep = 5
            this.renderRewriteStep5()
        }
    }
    
    async startRewriteGeneration() {
        if (!this.rewriteData.rewrittenChapters) {
            this.rewriteData.rewrittenChapters = []
        }
        
        const totalChapters = this.rewriteData.selectedChapters.length
        const startTime = Date.now()
        
        const log = document.getElementById('rewrite-log')
        const preview = document.getElementById('rewrite-preview')
        
        if (this.rewriteData.rewrittenChapters.length === 0) {
            log.innerHTML = ''
            preview.innerHTML = ''
        } else {
            this.rewriteData.rewrittenChapters.forEach(ch => {
                this.updateRewritePreview(ch.chapterNum, ch.rewrittenContent)
            })
        }
        
        for (let i = this.rewriteData.rewrittenChapters.length; i < totalChapters; i++) {
            if (!this.rewriteData.isGenerating) {
                break
            }
            
            const chapterNum = this.rewriteData.selectedChapters[i]
            const progress = ((i + 1) / totalChapters) * 100
            
            this.updateRewriteProgress(progress, chapterNum, startTime, i + 1, totalChapters)
            
            this.addRewriteLog(`正在改写第${chapterNum}章...`, 'info')
            
            let retries = 3
            let success = false
            
            while (retries > 0 && !success && this.rewriteData.isGenerating) {
                try {
                    const rewrittenContent = await this.generateRewrittenChapter(chapterNum)
                    
                    this.rewriteData.rewrittenChapters.push({
                        chapterNum: chapterNum,
                        originalContent: this.getChapterContent(chapterNum),
                        rewrittenContent: rewrittenContent,
                        wordCount: rewrittenContent.length
                    })
                    
                    this.updateRewritePreview(chapterNum, rewrittenContent)
                    
                    this.addRewriteLog(`第${chapterNum}章改写完成，${rewrittenContent.length}字`, 'success')
                    
                    if (i % 3 === 0) {
                        this.saveRewriteDraft()
                    }
                    
                    success = true
                    
                } catch (error) {
                    retries--
                    if (retries > 0) {
                        this.addRewriteLog(`第${chapterNum}章改写失败，正在重试...（剩余${retries}次）`, 'warning')
                        await new Promise(resolve => setTimeout(resolve, 3000))
                    } else {
                        this.rewriteData.rewrittenChapters.push({
                            chapterNum: chapterNum,
                            originalContent: this.getChapterContent(chapterNum),
                            rewrittenContent: '',
                            wordCount: 0,
                            status: 'error',
                            error: error.message
                        })
                        
                        this.addRewriteLog(`第${chapterNum}章改写失败：${error.message}`, 'error')
                    }
                }
            }
        }
        
        if (this.rewriteData.isGenerating) {
            document.getElementById('rewrite-progress-text').textContent = '改写完成'
            this.saveRewriteDraft()
        } else {
            document.getElementById('rewrite-progress-text').textContent = '已取消'
        }
        
        document.getElementById('prev-rewrite-step-4-btn').disabled = false
        document.getElementById('cancel-rewrite-btn').classList.add('hidden')
        document.getElementById('start-rewrite-btn').classList.add('hidden')
        document.getElementById('next-rewrite-step-4-btn').classList.remove('hidden')
        
        UIHelper.showToast('改写完成', 'success')
    }
    
    updateRewriteProgress(progress, currentChapter, startTime, current, total) {
        const progressBar = document.getElementById('rewrite-progress-bar')
        const progressText = document.getElementById('rewrite-progress-text')
        const currentChapterSpan = document.getElementById('current-rewrite-chapter')
        const remainingTimeSpan = document.getElementById('rewrite-remaining-time')
        
        progressBar.style.width = `${progress}%`
        progressText.textContent = `${current}/${total}章`
        currentChapterSpan.textContent = `第${currentChapter}章`
        
        const elapsed = Date.now() - startTime
        const avgTimePerChapter = elapsed / current
        const remaining = (total - current) * avgTimePerChapter
        
        remainingTimeSpan.textContent = this.formatTime(remaining)
    }
    
    addRewriteLog(message, type = 'info') {
        const log = document.getElementById('rewrite-log')
        const timestamp = new Date().toLocaleTimeString()
        
        const colorMap = {
            'info': 'text-blue-400',
            'success': 'text-green-400',
            'warning': 'text-yellow-400',
            'error': 'text-red-400'
        }
        
        const logEntry = document.createElement('p')
        logEntry.className = colorMap[type] || 'text-slate-300'
        logEntry.innerHTML = `<span class="text-slate-500">[${timestamp}]</span> ${message}`
        
        log.appendChild(logEntry)
        log.scrollTop = log.scrollHeight
    }
    
    updateRewritePreview(chapterNum, content) {
        const preview = document.getElementById('rewrite-preview')
        
        const chapterDiv = document.createElement('div')
        chapterDiv.className = 'mb-4'
        chapterDiv.innerHTML = `
            <h4 class="font-medium mb-2 text-purple-400">第${chapterNum}章</h4>
            <div class="text-slate-300 text-xs leading-relaxed">
                ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}
            </div>
        `
        
        preview.appendChild(chapterDiv)
        preview.scrollTop = preview.scrollHeight
    }
    
    getChapterContent(chapterNum) {
        if (!this.rewriteData.originalText) return ''
        
        const text = typeof this.rewriteData.originalText === 'string' 
            ? this.rewriteData.originalText 
            : String(this.rewriteData.originalText)
        
        const chineseNum = this.numberToChinese(chapterNum)
        const nextChapterNum = chapterNum + 1
        const nextChineseNum = this.numberToChinese(nextChapterNum)
        
        const patterns = [
            new RegExp(`第(${chapterNum}|${chineseNum})章[^]*?(?=第(${nextChapterNum}|${nextChineseNum})章|$)`, 'i'),
            new RegExp(`Chapter\\s*${chapterNum}[^]*?(?=Chapter\\s*${nextChapterNum}|$)`, 'i'),
            new RegExp(`【第(${chapterNum}|${chineseNum})章】[^]*?(?=【第(${nextChapterNum}|${nextChineseNum})章】|$)`, 'i')
        ]
        
        for (const pattern of patterns) {
            const match = text.match(pattern)
            if (match && match[0].trim().length > 100) {
                return match[0].trim()
            }
        }
        
        const lines = text.split('\n')
        let chapterStart = -1
        let chapterEnd = lines.length
        
        const chapterRegex = new RegExp(`第(${chapterNum}|${chineseNum})章`, 'i')
        const nextChapterRegex = new RegExp(`第(${nextChapterNum}|${nextChineseNum})章`, 'i')
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (chapterRegex.test(line)) {
                chapterStart = i
            } else if (chapterStart !== -1 && nextChapterRegex.test(line)) {
                chapterEnd = i
                break
            }
        }
        
        if (chapterStart !== -1) {
            return lines.slice(chapterStart, chapterEnd).join('\n').trim()
        }
        
        return ''
    }
    
    numberToChinese(num) {
        const chineseNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
        if (num <= 10) return chineseNums[num]
        if (num < 20) return '十' + (num % 10 === 0 ? '' : chineseNums[num % 10])
        if (num < 100) {
            const tens = Math.floor(num / 10)
            const ones = num % 10
            return chineseNums[tens] + '十' + (ones === 0 ? '' : chineseNums[ones])
        }
        return num.toString()
    }
    
    async generateRewrittenChapter(chapterNum) {
        const originalContent = this.getChapterContent(chapterNum)
        
        if (!originalContent || originalContent.trim().length === 0) {
            throw new Error(`第${chapterNum}章内容为空，无法改写`)
        }
        
        const taskInstructions = `你是一位专业的小说编辑。请根据提供的原文、文风分析、角色信息和改写需求，改写指定的章节内容。

要求：
1. 保持原文的文风特点
2. 角色行为符合人设
3. 按照改写类型和强度进行调整
4. 段落分明，节奏合理

请直接输出改写后的章节正文，不要添加标题或其他说明。`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            taskInstructions,
            JSON.stringify({
                styleData: this.rewriteData.styleData,
                roleCards: this.rewriteData.roleCards,
                chapterNum: chapterNum,
                originalContent: originalContent,
                rewriteType: this.rewriteData.rewriteType,
                rewriteIntensity: this.rewriteData.rewriteIntensity,
                rewriteRequirements: this.rewriteData.rewriteRequirements
            }, null, 2)
        )
        
        try {
            const response = await apiClient.chat(messages, {
                maxTokens: 65536,
                temperature: 0.8
            })
            return response
        } catch (error) {
            console.error('改写API调用失败:', error)
            throw new Error(`API调用失败: ${error.message}`)
        }
    }
    
    formatTime(ms) {
        if (ms < 0) return '计算中...'
        
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        
        if (hours > 0) {
            return `${hours}小时${minutes % 60}分`
        } else if (minutes > 0) {
            return `${minutes}分${seconds % 60}秒`
        } else {
            return `${seconds}秒`
        }
    }
    
    renderRewriteStep5() {
        const stepIndicator = document.getElementById('rewrite-step-indicator')
        stepIndicator.innerHTML = this.renderRewriteStepIndicator(5)
        
        const stepsContainer = document.getElementById('rewrite-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤5：编辑调整</h2>
                <p class="text-slate-400 mb-6">点击章节可展开编辑改写内容</p>
                
                <div id="rewrite-edit-list" class="space-y-3 mb-4">
                    ${this.renderRewriteEditList()}
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-rewrite-step-5-btn" class="btn btn-secondary">
                        上一步
                    </button>
                    <button id="next-rewrite-step-5-btn" class="btn btn-primary">
                        下一步：导出预览
                    </button>
                </div>
            </div>
        `
        
        this.setupRewriteStep5Events()
    }
    
    renderRewriteEditList() {
        if (!this.rewriteData.rewrittenChapters || this.rewriteData.rewrittenChapters.length === 0) {
            return '<div class="text-center text-slate-400 py-8">暂无改写内容</div>'
        }
        
        return this.rewriteData.rewrittenChapters.map((chapter, index) => `
            <div class="border border-slate-700 rounded-lg overflow-hidden">
                <div class="bg-slate-700 p-3 flex items-center justify-between cursor-pointer rewrite-chapter-header" data-index="${index}">
                    <div class="flex items-center space-x-3">
                        <span class="font-medium">第${chapter.chapterNum}章</span>
                        <span class="text-sm text-slate-400">${chapter.wordCount}字</span>
                        ${chapter.status === 'error' ? '<span class="text-xs text-red-400">生成失败</span>' : '<span class="text-xs text-green-400">已完成</span>'}
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="btn btn-secondary text-xs retry-failed-btn ${chapter.status === 'error' ? '' : 'hidden'}" data-index="${index}" data-chapter="${chapter.chapterNum}">
                            重试
                        </button>
                        <svg class="w-5 h-5 transform transition-transform rewrite-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
                <div class="rewrite-chapter-content hidden p-4 bg-slate-800">
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium">对比模式</label>
                            <div class="flex space-x-2">
                                <button class="btn btn-secondary text-xs compare-mode-btn active" data-mode="split" data-index="${index}">
                                    左右对比
                                </button>
                                <button class="btn btn-secondary text-xs compare-mode-btn" data-mode="unified" data-index="${index}">
                                    统一视图
                                </button>
                            </div>
                        </div>
                        
                        <div id="compare-view-${index}" class="compare-split-view">
                            <div class="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                    <h4 class="text-sm font-medium mb-2 text-blue-400">原文</h4>
                                    <div class="bg-slate-700 rounded p-3 text-xs text-slate-300 h-64 overflow-y-auto">
                                        ${chapter.originalContent.substring(0, 1000)}${chapter.originalContent.length > 1000 ? '...' : ''}
                                    </div>
                                </div>
                                <div>
                                    <h4 class="text-sm font-medium mb-2 text-purple-400">改写</h4>
                                    <div class="bg-slate-700 rounded p-3 text-xs text-slate-300 h-64 overflow-y-auto">
                                        ${chapter.rewrittenContent.substring(0, 1000)}${chapter.rewrittenContent.length > 1000 ? '...' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="block text-sm font-medium mb-2">编辑改写内容</label>
                        <textarea 
                            class="rewrite-textarea w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none min-h-[300px]"
                            data-index="${index}"
                        >${chapter.rewrittenContent}</textarea>
                    </div>
                    <div class="flex justify-between text-xs text-slate-500">
                        <span>字数：<span class="rewrite-word-count">${chapter.rewrittenContent.length}</span></span>
                        <div class="flex space-x-2">
                            <button class="btn btn-secondary text-xs copy-original-btn" data-index="${index}">
                                复制原文
                            </button>
                            <button class="btn btn-secondary text-xs reset-rewrite-btn" data-index="${index}">
                                恢复原文
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('')
    }
    
    setupRewriteStep5Events() {
        const headers = document.querySelectorAll('.rewrite-chapter-header')
        
        headers.forEach(header => {
            header.onclick = () => {
                const content = header.nextElementSibling
                const chevron = header.querySelector('.rewrite-chevron')
                
                content.classList.toggle('hidden')
                chevron.classList.toggle('rotate-180')
            }
        })
        
        const retryBtns = document.querySelectorAll('.retry-failed-btn')
        retryBtns.forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation()
                const index = parseInt(btn.dataset.index)
                const chapterNum = parseInt(btn.dataset.chapter)
                
                btn.disabled = true
                btn.textContent = '重试中...'
                
                try {
                    const rewrittenContent = await this.generateRewrittenChapter(chapterNum)
                    
                    this.rewriteData.rewrittenChapters[index] = {
                        chapterNum: chapterNum,
                        originalContent: this.getChapterContent(chapterNum),
                        rewrittenContent: rewrittenContent,
                        wordCount: rewrittenContent.length,
                        status: 'completed'
                    }
                    
                    this.renderRewriteStep5()
                    UIHelper.showToast(`第${chapterNum}章重试成功`, 'success')
                    
                } catch (error) {
                    btn.disabled = false
                    btn.textContent = '重试'
                    UIHelper.showToast(`重试失败：${error.message}`, 'error')
                }
            }
        })
        
        const compareModeBtns = document.querySelectorAll('.compare-mode-btn')
        compareModeBtns.forEach(btn => {
            btn.onclick = () => {
                const mode = btn.dataset.mode
                const index = btn.dataset.index
                const chapter = this.rewriteData.rewrittenChapters[index]
                
                compareModeBtns.forEach(b => b.classList.remove('active'))
                btn.classList.add('active')
                
                const compareView = document.getElementById(`compare-view-${index}`)
                
                if (mode === 'split') {
                    compareView.innerHTML = `
                        <div class="grid grid-cols-2 gap-4 mb-3">
                            <div>
                                <h4 class="text-sm font-medium mb-2 text-blue-400">原文</h4>
                                <div class="bg-slate-700 rounded p-3 text-xs text-slate-300 h-64 overflow-y-auto">
                                    ${chapter.originalContent.substring(0, 1000)}${chapter.originalContent.length > 1000 ? '...' : ''}
                                </div>
                            </div>
                            <div>
                                <h4 class="text-sm font-medium mb-2 text-purple-400">改写</h4>
                                <div class="bg-slate-700 rounded p-3 text-xs text-slate-300 h-64 overflow-y-auto">
                                    ${chapter.rewrittenContent.substring(0, 1000)}${chapter.rewrittenContent.length > 1000 ? '...' : ''}
                                </div>
                            </div>
                        </div>
                    `
                } else {
                    compareView.innerHTML = `
                        <div class="bg-slate-700 rounded p-3 text-xs text-slate-300 h-64 overflow-y-auto mb-3">
                            <div class="mb-4">
                                <h4 class="font-medium mb-2 text-blue-400">【原文】</h4>
                                <div class="leading-relaxed">${chapter.originalContent.substring(0, 500)}${chapter.originalContent.length > 500 ? '...' : ''}</div>
                            </div>
                            <div>
                                <h4 class="font-medium mb-2 text-purple-400">【改写】</h4>
                                <div class="leading-relaxed">${chapter.rewrittenContent.substring(0, 500)}${chapter.rewrittenContent.length > 500 ? '...' : ''}</div>
                            </div>
                        </div>
                    `
                }
            }
        })
        
        const textareas = document.querySelectorAll('.rewrite-textarea')
        textareas.forEach(textarea => {
            textarea.oninput = () => {
                const index = parseInt(textarea.dataset.index)
                this.rewriteData.rewrittenChapters[index].rewrittenContent = textarea.value
                this.rewriteData.rewrittenChapters[index].wordCount = textarea.value.length
                
                const wordCount = textarea.parentElement.querySelector('.rewrite-word-count')
                wordCount.textContent = textarea.value.length
            }
        })
        
        const copyBtns = document.querySelectorAll('.copy-original-btn')
        copyBtns.forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index)
                const chapter = this.rewriteData.rewrittenChapters[index]
                
                navigator.clipboard.writeText(chapter.originalContent).then(() => {
                    UIHelper.showToast('原文已复制到剪贴板', 'success')
                }).catch(() => {
                    UIHelper.showToast('复制失败', 'error')
                })
            }
        })
        
        const resetBtns = document.querySelectorAll('.reset-rewrite-btn')
        resetBtns.forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index)
                const chapter = this.rewriteData.rewrittenChapters[index]
                
                if (confirm('确定要恢复原文吗？这将覆盖当前的改写内容。')) {
                    const textarea = document.querySelector(`.rewrite-textarea[data-index="${index}"]`)
                    textarea.value = chapter.originalContent
                    chapter.rewrittenContent = chapter.originalContent
                    chapter.wordCount = chapter.originalContent.length
                    
                    const wordCount = textarea.parentElement.querySelector('.rewrite-word-count')
                    wordCount.textContent = chapter.originalContent.length
                    
                    UIHelper.showToast('已恢复原文', 'success')
                }
            }
        })
        
        document.getElementById('prev-rewrite-step-5-btn').onclick = () => {
            this.rewriteData.currentStep = 4
            this.renderRewriteStep4()
        }
        
        document.getElementById('next-rewrite-step-5-btn').onclick = () => {
            this.rewriteData.currentStep = 6
            this.renderRewriteStep6()
        }
    }
    
    renderRewriteStep6() {
        const stepIndicator = document.getElementById('rewrite-step-indicator')
        stepIndicator.innerHTML = this.renderRewriteStepIndicator(6)
        
        const totalWords = this.rewriteData.rewrittenChapters.reduce((sum, ch) => sum + ch.wordCount, 0)
        
        const stepsContainer = document.getElementById('rewrite-steps')
        stepsContainer.innerHTML = `
            <div class="card p-6">
                <h2 class="text-xl font-semibold mb-4">步骤6：预览导出</h2>
                <p class="text-slate-400 mb-6">预览改写结果并导出文件</p>
                
                <div class="bg-slate-700 rounded-lg p-4 mb-4">
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-2xl font-bold text-purple-400">${this.rewriteData.rewrittenChapters.length}</div>
                            <div class="text-sm text-slate-400">改写章节</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-purple-400">${totalWords}</div>
                            <div class="text-sm text-slate-400">总字数</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-purple-400">${this.getIntensityLabel(this.rewriteData.rewriteIntensity)}</div>
                            <div class="text-sm text-slate-400">改写强度</div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <h3 class="font-medium mb-2">改写预览</h3>
                    <div id="final-rewrite-preview" class="bg-slate-700 rounded p-4 h-64 overflow-y-auto text-sm">
                        ${this.renderFinalRewritePreview()}
                    </div>
                </div>
                
                <div class="bg-purple-900 border border-purple-700 rounded-lg p-4 mb-4">
                    <h3 class="font-medium mb-2">导出选项</h3>
                    <div class="space-y-2">
                        <label class="flex items-center space-x-2">
                            <input type="radio" name="export-type" value="rewrite" checked class="text-purple-500">
                            <span class="text-sm">仅导出改写内容</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="radio" name="export-type" value="compare" class="text-purple-500">
                            <span class="text-sm">导出对比版（原文+改写）</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="radio" name="export-type" value="json" class="text-purple-500">
                            <span class="text-sm">导出JSON格式（包含元数据）</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="radio" name="export-type" value="report" class="text-purple-500">
                            <span class="text-sm">导出统计报告</span>
                        </label>
                    </div>
                </div>
                
                <div class="bg-slate-700 border border-slate-600 rounded-lg p-4 mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium">改写历史</h3>
                        <button id="view-history-btn" class="btn btn-secondary text-xs">
                            查看历史记录
                        </button>
                    </div>
                    <p class="text-xs text-slate-400">系统会自动保存改写历史，方便您随时查看和恢复</p>
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button id="prev-rewrite-step-6-btn" class="btn btn-secondary">
                        上一步
                    </button>
                    <div class="flex space-x-2">
                        <button id="export-rewrite-btn" class="btn btn-primary">
                            导出文件
                        </button>
                        <button id="restart-rewrite-btn" class="btn btn-secondary">
                            重新开始
                        </button>
                    </div>
                </div>
            </div>
        `
        
        this.setupRewriteStep6Events()
    }
    
    renderFinalRewritePreview() {
        return this.rewriteData.rewrittenChapters.map(chapter => `
            <div class="mb-4">
                <h4 class="font-medium mb-2 text-purple-400">第${chapter.chapterNum}章</h4>
                <div class="text-slate-300 text-xs leading-relaxed">
                    ${chapter.rewrittenContent.substring(0, 300)}${chapter.rewrittenContent.length > 300 ? '...' : ''}
                </div>
            </div>
        `).join('')
    }
    
    setupRewriteStep6Events() {
        document.getElementById('prev-rewrite-step-6-btn').onclick = () => {
            this.rewriteData.currentStep = 5
            this.renderRewriteStep5()
        }
        
        document.getElementById('export-rewrite-btn').onclick = () => {
            const exportType = document.querySelector('input[name="export-type"]:checked').value
            
            let content = ''
            let filename = ''
            const timestamp = new Date().toISOString().slice(0, 10)
            
            switch (exportType) {
                case 'rewrite':
                    content = this.rewriteData.rewrittenChapters
                        .map(ch => `第${ch.chapterNum}章\n\n${ch.rewrittenContent}`)
                        .join('\n\n---\n\n')
                    filename = `改写版_${timestamp}.txt`
                    FileHandler.exportTxt(content, filename)
                    break
                    
                case 'compare':
                    content = this.rewriteData.rewrittenChapters
                        .map(ch => `【原文】第${ch.chapterNum}章\n\n${ch.originalContent}\n\n【改写】第${ch.chapterNum}章\n\n${ch.rewrittenContent}`)
                        .join('\n\n====================\n\n')
                    filename = `对比版_${timestamp}.txt`
                    FileHandler.exportTxt(content, filename)
                    break
                    
                case 'json':
                    const jsonData = {
                        metadata: {
                            exportTime: new Date().toISOString(),
                            totalChapters: this.rewriteData.rewrittenChapters.length,
                            totalWords: this.rewriteData.rewrittenChapters.reduce((sum, ch) => sum + ch.wordCount, 0),
                            rewriteType: this.rewriteData.rewriteType,
                            rewriteIntensity: this.rewriteData.rewriteIntensity,
                            rewriteRequirements: this.rewriteData.rewriteRequirements
                        },
                        chapters: this.rewriteData.rewrittenChapters.map(ch => ({
                            chapterNum: ch.chapterNum,
                            originalContent: ch.originalContent,
                            rewrittenContent: ch.rewrittenContent,
                            wordCount: ch.wordCount,
                            status: ch.status || 'completed'
                        }))
                    }
                    filename = `改写数据_${timestamp}.json`
                    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = filename
                    a.click()
                    URL.revokeObjectURL(url)
                    break
                    
                case 'report':
                    const totalOriginalWords = this.rewriteData.rewrittenChapters.reduce((sum, ch) => sum + ch.originalContent.length, 0)
                    const totalRewrittenWords = this.rewriteData.rewrittenChapters.reduce((sum, ch) => sum + ch.wordCount, 0)
                    const avgWordsPerChapter = Math.round(totalRewrittenWords / this.rewriteData.rewrittenChapters.length)
                    
                    content = `小说改写统计报告
==================

导出时间：${new Date().toLocaleString()}

一、改写概况
-----------
• 改写章节：${this.rewriteData.rewrittenChapters.length}章
• 改写类型：${this.getRewriteTypeLabel(this.rewriteData.rewriteType)}
• 改写强度：${this.getIntensityLabel(this.rewriteData.rewriteIntensity)}

二、字数统计
-----------
• 原文总字数：${totalOriginalWords}字
• 改写总字数：${totalRewrittenWords}字
• 平均每章：${avgWordsPerChapter}字
• 字数变化：${totalRewrittenWords - totalOriginalWords > 0 ? '+' : ''}${totalRewrittenWords - totalOriginalWords}字

三、改写需求
-----------
${this.rewriteData.rewriteRequirements}

四、章节详情
-----------
${this.rewriteData.rewrittenChapters.map(ch => `
第${ch.chapterNum}章：
  原文字数：${ch.originalContent.length}字
  改写字数：${ch.wordCount}字
  状态：${ch.status === 'error' ? '失败' : '成功'}
`).join('\n')}

五、改写说明
-----------
${this.getIntensityDescription(this.rewriteData.rewriteIntensity)}
`
                    filename = `改写报告_${timestamp}.txt`
                    FileHandler.exportTxt(content, filename)
                    break
            }
            
            this.saveRewriteHistory()
            UIHelper.showToast('导出成功', 'success')
        }
        
        document.getElementById('view-history-btn').onclick = () => {
            this.showRewriteHistory()
        }
        
        document.getElementById('restart-rewrite-btn').onclick = () => {
            if (confirm('确定要重新开始吗？当前进度将被清空。')) {
                localStorage.removeItem('novel_rewrite_draft')
                this.rewriteData = null
                this.renderRewrite()
            }
        }
    }
    
    saveRewriteHistory() {
        const history = WorkspaceManager.getWorkspaceData('history') || []
        
        const record = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            totalChapters: this.rewriteData.rewrittenChapters.length,
            totalWords: this.rewriteData.rewrittenChapters.reduce((sum, ch) => sum + ch.wordCount, 0),
            rewriteType: this.rewriteData.rewriteType,
            rewriteIntensity: this.rewriteData.rewriteIntensity,
            rewriteRequirements: this.rewriteData.rewriteRequirements,
            chapters: this.rewriteData.rewrittenChapters.map(ch => ({
                chapterNum: ch.chapterNum,
                rewrittenContent: ch.rewrittenContent,
                wordCount: ch.wordCount
            }))
        }
        
        history.unshift(record)
        
        if (history.length > 20) {
            history.pop()
        }
        
        WorkspaceManager.setWorkspaceData('history', history)
    }
    
    showRewriteHistory() {
        const history = WorkspaceManager.getWorkspaceData('history') || []
        
        if (history.length === 0) {
            UIHelper.showToast('暂无历史记录', 'warning')
            return
        }
        
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold">改写历史记录</h2>
                    <button id="close-history-modal" class="text-slate-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-3">
                    ${history.map(record => `
                        <div class="bg-slate-700 rounded-lg p-4 border border-slate-600">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center space-x-3">
                                    <span class="text-sm text-slate-400">${new Date(record.timestamp).toLocaleString()}</span>
                                    <span class="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded">${this.getRewriteTypeLabel(record.rewriteType)}</span>
                                    <span class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">${this.getIntensityLabel(record.rewriteIntensity)}</span>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="btn btn-secondary text-xs view-history-detail" data-id="${record.id}">
                                        查看详情
                                    </button>
                                    <button class="btn btn-secondary text-xs delete-history" data-id="${record.id}">
                                        删除
                                    </button>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span class="text-slate-400">章节：</span>
                                    <span class="font-medium">${record.totalChapters}章</span>
                                </div>
                                <div>
                                    <span class="text-slate-400">字数：</span>
                                    <span class="font-medium">${record.totalWords}字</span>
                                </div>
                                <div>
                                    <span class="text-slate-400">需求：</span>
                                    <span class="font-medium">${record.rewriteRequirements.substring(0, 20)}...</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        modal.querySelector('#close-history-modal').onclick = () => {
            modal.remove()
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove()
            }
        }
        
        modal.querySelectorAll('.view-history-detail').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id)
                const record = history.find(r => r.id === id)
                if (record) {
                    this.showHistoryDetail(record)
                }
            }
        })
        
        modal.querySelectorAll('.delete-history').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id)
                if (confirm('确定要删除这条历史记录吗？')) {
                    const newHistory = history.filter(r => r.id !== id)
                    WorkspaceManager.setWorkspaceData('history', newHistory)
                    modal.remove()
                    this.showRewriteHistory()
                    UIHelper.showToast('删除成功', 'success')
                }
            }
        })
    }
    
    showHistoryDetail(record) {
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold">历史记录详情</h2>
                    <button id="close-detail-modal" class="text-slate-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-slate-700 rounded-lg p-4">
                        <h3 class="font-medium mb-2">基本信息</h3>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-slate-400">时间：</span>
                                <span>${new Date(record.timestamp).toLocaleString()}</span>
                            </div>
                            <div>
                                <span class="text-slate-400">类型：</span>
                                <span>${this.getRewriteTypeLabel(record.rewriteType)}</span>
                            </div>
                            <div>
                                <span class="text-slate-400">强度：</span>
                                <span>${this.getIntensityLabel(record.rewriteIntensity)}</span>
                            </div>
                            <div>
                                <span class="text-slate-400">字数：</span>
                                <span>${record.totalWords}字</span>
                            </div>
                        </div>
                        <div class="mt-2 text-sm">
                            <span class="text-slate-400">需求：</span>
                            <span>${record.rewriteRequirements}</span>
                        </div>
                    </div>
                    
                    <div class="bg-slate-700 rounded-lg p-4">
                        <h3 class="font-medium mb-2">章节列表</h3>
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            ${record.chapters.map(ch => `
                                <div class="border border-slate-600 rounded p-3">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="font-medium">第${ch.chapterNum}章</span>
                                        <span class="text-xs text-slate-400">${ch.wordCount}字</span>
                                    </div>
                                    <div class="text-xs text-slate-300 bg-slate-800 rounded p-2 max-h-32 overflow-y-auto">
                                        ${ch.rewrittenContent.substring(0, 300)}${ch.rewrittenContent.length > 300 ? '...' : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        modal.querySelector('#close-detail-modal').onclick = () => {
            modal.remove()
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove()
            }
        }
    }
    
    getRewriteTypeLabel(type) {
        const labels = {
            'plot': '剧情改写',
            'character': '角色改写',
            'ending': '结局改写',
            'dialogue': '对话改写',
            'description': '描写改写',
            'custom': '自定义改写'
        }
        return labels[type] || '未知'
    }
    
    renderRoles() {
        const main = document.getElementById('main-content')
        const cards = RoleCardManager.getRoleCards()
        
        main.innerHTML = `
            <div class="max-w-6xl mx-auto">
                <div class="mb-6 flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold mb-2">角色卡管理</h1>
                        <p class="text-slate-400">管理小说中的角色信息</p>
                    </div>
                    <div class="flex space-x-2">
                        <button id="import-from-analysis-btn" class="btn btn-secondary">从分析导入</button>
                        <button id="import-role-file-btn" class="btn btn-secondary">导入文件</button>
                        <button id="export-role-btn" class="btn btn-secondary">导出</button>
                        <button id="add-role-btn" class="btn btn-primary">新增角色</button>
                    </div>
                </div>
                
                <div class="mb-4">
                    <input 
                        type="text"
                        id="search-role-input"
                        class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="搜索角色（按姓名或性格）..."
                    >
                </div>
                
                <div id="role-cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${this.renderRoleCardList(cards)}
                </div>
            </div>
        `
        
        this.setupRoleCardEvents()
    }
    
    renderRoleCardList(cards) {
        if (cards.length === 0) {
            return `
                <div class="col-span-full text-center py-12 text-slate-400">
                    <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <p class="text-lg mb-2">暂无角色卡</p>
                    <p class="text-sm">点击"新增角色"手动添加，或点击"从分析导入"自动生成</p>
                </div>
            `
        }
        
        return cards.map(card => `
            <div class="card p-4 border border-slate-700 hover:border-blue-500 transition-colors" data-id="${card.id}">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="text-lg font-semibold">${card.name || '未命名角色'}</h3>
                    <div class="flex space-x-1">
                        <button class="edit-role-btn text-blue-400 hover:text-blue-300 p-1" data-id="${card.id}" title="编辑">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button class="delete-role-btn text-red-400 hover:text-red-300 p-1" data-id="${card.id}" title="删除">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="text-sm text-slate-400 line-clamp-2 mb-2">${card.personality || '暂无性格描述'}</p>
                ${card.appearance ? `<p class="text-xs text-slate-500 line-clamp-1 mb-2">外貌：${card.appearance}</p>` : ''}
                <div class="flex flex-wrap gap-1">
                    ${(card.relationships || []).slice(0, 3).map(r => `
                        <span class="text-xs bg-slate-700 px-2 py-1 rounded">${r}</span>
                    `).join('')}
                    ${(card.relationships || []).length > 3 ? `<span class="text-xs text-slate-500">+${card.relationships.length - 3}</span>` : ''}
                </div>
            </div>
        `).join('')
    }
    
    setupRoleCardEvents() {
        const searchInput = document.getElementById('search-role-input')
        const addBtn = document.getElementById('add-role-btn')
        const importBtn = document.getElementById('import-from-analysis-btn')
        const importFileBtn = document.getElementById('import-role-file-btn')
        const exportBtn = document.getElementById('export-role-btn')
        
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value
            const cards = RoleCardManager.searchRoleCards(keyword)
            document.getElementById('role-cards-container').innerHTML = this.renderRoleCardList(cards)
            this.bindRoleCardButtons()
        })
        
        addBtn.addEventListener('click', () => {
            this.showRoleEditor(null)
        })
        
        importBtn.addEventListener('click', () => {
            const analysisData = WorkspaceManager.getWorkspaceData('analysis')
            if (!analysisData || !analysisData.plotAnalysis) {
                UIHelper.showToast('请先进行AI文本分析', 'warning')
                return
            }
            
            try {
                const data = analysisData.plotAnalysis
                const cards = RoleCardManager.importFromAnalysis(data)
                document.getElementById('role-cards-container').innerHTML = this.renderRoleCardList(cards)
                this.bindRoleCardButtons()
                UIHelper.showToast(`成功导入${cards.length}个角色`, 'success')
            } catch (error) {
                UIHelper.showToast('导入失败：' + error.message, 'error')
            }
        })
        
        importFileBtn.addEventListener('click', () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                try {
                    const result = await FileHandler.importJson(file)
                    const cards = RoleCardManager.importRoleCards(result.data)
                    document.getElementById('role-cards-container').innerHTML = this.renderRoleCardList(cards)
                    this.bindRoleCardButtons()
                    UIHelper.showToast(`成功导入${cards.length}个角色`, 'success')
                } catch (error) {
                    UIHelper.showToast('导入失败：' + error.message, 'error')
                }
            }
            input.click()
        })
        
        exportBtn.addEventListener('click', () => {
            const cards = RoleCardManager.getRoleCards()
            if (cards.length === 0) {
                UIHelper.showToast('没有角色卡可导出', 'warning')
                return
            }
            const data = RoleCardManager.exportRoleCards()
            FileHandler.exportJson(data, '角色卡.json')
        })
        
        this.bindRoleCardButtons()
    }
    
    bindRoleCardButtons() {
        document.querySelectorAll('.edit-role-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id
                const cards = RoleCardManager.getRoleCards()
                const card = cards.find(c => c.id === id)
                this.showRoleEditor(card)
            }
        })
        
        document.querySelectorAll('.delete-role-btn').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id
                const confirmed = await UIHelper.showConfirm('删除角色', '确定要删除这个角色吗？此操作不可恢复。')
                if (confirmed) {
                    RoleCardManager.deleteRoleCard(id)
                    const cards = RoleCardManager.getRoleCards()
                    document.getElementById('role-cards-container').innerHTML = this.renderRoleCardList(cards)
                    this.bindRoleCardButtons()
                    UIHelper.showToast('已删除', 'success')
                }
            }
        })
    }
    
    showRoleEditor(card) {
        const modal = document.createElement('div')
        modal.id = 'role-editor-modal'
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
                <h3 class="text-xl font-bold mb-4">${card ? '编辑角色' : '新增角色'}</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">角色名 <span class="text-red-500">*</span></label>
                        <input type="text" id="role-name" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none" value="${card?.name || ''}" placeholder="请输入角色名">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">外貌描写</label>
                        <textarea id="role-appearance" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="描述角色的外貌特征">${card?.appearance || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">身材特征</label>
                        <input type="text" id="role-body" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none" value="${card?.bodyFeatures || ''}" placeholder="描述角色的身材特征">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">性格特质</label>
                        <textarea id="role-personality" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="描述角色的性格特点">${card?.personality || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">背景故事</label>
                        <textarea id="role-background" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="角色的背景故事">${card?.background || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">人际关系（每行一个）</label>
                        <textarea id="role-relationships" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="例如：&#10;与主角是好友&#10;与反派是宿敌">${(card?.relationships || []).join('\n')}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">剧情变化轨迹（每行一个）</label>
                        <textarea id="role-plot-changes" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="角色在剧情中的变化">${(card?.plotChanges || []).join('\n')}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">口头禅（每行一个）</label>
                        <textarea id="role-catchphrases" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="角色的口头禅">${(card?.catchphrases || []).join('\n')}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">禁忌（每行一个）</label>
                        <textarea id="role-taboos" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="角色不会做的事或说的话">${(card?.taboos || []).join('\n')}</textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button id="cancel-role-btn" class="btn btn-secondary">取消</button>
                    <button id="save-role-btn" class="btn btn-primary">保存</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        modal.querySelector('#cancel-role-btn').onclick = () => modal.remove()
        
        modal.querySelector('#save-role-btn').onclick = () => {
            const name = document.getElementById('role-name').value.trim()
            if (!name) {
                UIHelper.showToast('角色名不能为空', 'error')
                return
            }
            
            const data = {
                name: name,
                appearance: document.getElementById('role-appearance').value.trim(),
                bodyFeatures: document.getElementById('role-body').value.trim(),
                personality: document.getElementById('role-personality').value.trim(),
                background: document.getElementById('role-background').value.trim(),
                relationships: document.getElementById('role-relationships').value.split('\n').filter(s => s.trim()),
                plotChanges: document.getElementById('role-plot-changes').value.split('\n').filter(s => s.trim()),
                catchphrases: document.getElementById('role-catchphrases').value.split('\n').filter(s => s.trim()),
                taboos: document.getElementById('role-taboos').value.split('\n').filter(s => s.trim())
            }
            
            if (card) {
                RoleCardManager.updateRoleCard(card.id, data)
            } else {
                RoleCardManager.addRoleCard(data)
            }
            
            const cards = RoleCardManager.getRoleCards()
            document.getElementById('role-cards-container').innerHTML = this.renderRoleCardList(cards)
            this.bindRoleCardButtons()
            modal.remove()
            UIHelper.showToast('保存成功', 'success')
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove()
        }
    }
    
    renderStyles() {
        const main = document.getElementById('main-content')
        const cards = StyleCardManager.getAllCards()
        
        main.innerHTML = `
            <div class="max-w-6xl mx-auto">
                <div class="mb-6 flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold mb-2">文风卡管理</h1>
                        <p class="text-slate-400">管理和应用小说写作风格</p>
                    </div>
                    <div class="flex space-x-2">
                        <button id="import-style-btn" class="btn btn-secondary">导入</button>
                        <button id="export-style-btn" class="btn btn-secondary">导出</button>
                        <button id="create-style-btn" class="btn btn-primary">新建文风卡</button>
                    </div>
                </div>
                
                <div class="mb-4">
                    <input 
                        type="text"
                        id="search-style-input"
                        class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="搜索文风卡..."
                    >
                </div>
                
                <div id="style-cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${this.renderStyleCardList(cards)}
                </div>
            </div>
        `
        
        this.setupStyleCardEvents()
    }
    
    renderStyleCardList(cards) {
        if (cards.length === 0) {
            return `
                <div class="col-span-full text-center py-12 text-slate-400">
                    <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                    </svg>
                    <p class="text-lg mb-2">暂无文风卡</p>
                    <p class="text-sm">点击"新建文风卡"创建，或在文本分析时自动生成</p>
                </div>
            `
        }
        
        return cards.map(card => `
            <div class="card p-4 border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer" data-id="${card.id}">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="text-lg font-semibold">${card.name || '未命名文风'}</h3>
                    <div class="flex space-x-1">
                        <button class="edit-style-btn text-blue-400 hover:text-blue-300 p-1" data-id="${card.id}" title="编辑">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button class="delete-style-btn text-red-400 hover:text-red-300 p-1" data-id="${card.id}" title="删除">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
                ${card.author ? `<p class="text-sm text-slate-400 mb-2">作者：${card.author}</p>` : ''}
                ${card.source?.novelName ? `<p class="text-xs text-slate-500 mb-2">来源：${card.source.novelName}</p>` : ''}
                <div class="flex items-center justify-between text-xs text-slate-500">
                    <span>使用次数：${card.usage?.usageCount || 0}</span>
                    <span>${card.updatedAt ? new Date(card.updatedAt).toLocaleDateString() : ''}</span>
                </div>
            </div>
        `).join('')
    }
    
    setupStyleCardEvents() {
        const searchInput = document.getElementById('search-style-input')
        const createBtn = document.getElementById('create-style-btn')
        const importBtn = document.getElementById('import-style-btn')
        const exportBtn = document.getElementById('export-style-btn')
        
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value
            const cards = StyleCardManager.searchCards(keyword)
            document.getElementById('style-cards-container').innerHTML = this.renderStyleCardList(cards)
            this.bindStyleCardButtons()
        })
        
        createBtn.addEventListener('click', () => {
            this.showStyleEditor(null)
        })
        
        importBtn.addEventListener('click', () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                try {
                    const text = await file.text()
                    const data = JSON.parse(text)
                    const result = StyleImportExport.importCards(data)
                    document.getElementById('style-cards-container').innerHTML = this.renderStyleCardList(StyleCardManager.getAllCards())
                    this.bindStyleCardButtons()
                    UIHelper.showToast(`成功导入${result.imported}个文风卡`, 'success')
                } catch (error) {
                    UIHelper.showToast('导入失败：' + error.message, 'error')
                }
            }
            input.click()
        })
        
        exportBtn.addEventListener('click', () => {
            const cards = StyleCardManager.getAllCards()
            if (cards.length === 0) {
                UIHelper.showToast('没有文风卡可导出', 'warning')
                return
            }
            const data = StyleImportExport.exportCards(cards)
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = '文风卡.json'
            a.click()
            URL.revokeObjectURL(url)
        })
        
        this.bindStyleCardButtons()
    }
    
    bindStyleCardButtons() {
        document.querySelectorAll('#style-cards-container .card').forEach(card => {
            card.onclick = (e) => {
                if (e.target.closest('.edit-style-btn') || e.target.closest('.delete-style-btn')) return
                const id = card.dataset.id
                this.showStyleDetail(id)
            }
        })
        
        document.querySelectorAll('.edit-style-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation()
                const id = btn.dataset.id
                const card = StyleCardManager.getCard(id)
                this.showStyleEditor(card)
            }
        })
        
        document.querySelectorAll('.delete-style-btn').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation()
                const id = btn.dataset.id
                const confirmed = await UIHelper.showConfirm('删除文风卡', '确定要删除这个文风卡吗？此操作不可恢复。')
                if (confirmed) {
                    StyleCardManager.deleteCard(id)
                    document.getElementById('style-cards-container').innerHTML = this.renderStyleCardList(StyleCardManager.getAllCards())
                    this.bindStyleCardButtons()
                    UIHelper.showToast('已删除', 'success')
                }
            }
        })
    }
    
    showStyleEditor(card) {
        const modal = document.createElement('div')
        modal.id = 'style-editor-modal'
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
                <h3 class="text-xl font-bold mb-4">${card ? '编辑文风卡' : '新建文风卡'}</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">文风名称 <span class="text-red-500">*</span></label>
                        <input type="text" id="style-name" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none" value="${card?.name || ''}" placeholder="请输入文风名称">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">作者</label>
                        <input type="text" id="style-author" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none" value="${card?.author || ''}" placeholder="原作者">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">来源小说</label>
                        <input type="text" id="style-source" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none" value="${card?.source?.novelName || ''}" placeholder="来源小说名称">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">叙事风格</label>
                        <textarea id="style-narrative" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="描述叙事风格">${card?.style?.narrative ? JSON.stringify(card.style.narrative, null, 2) : ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">对话风格</label>
                        <textarea id="style-dialogue" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="描述对话风格">${card?.style?.dialogue ? JSON.stringify(card.style.dialogue, null, 2) : ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">描写风格</label>
                        <textarea id="style-description" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none h-20" placeholder="描述描写风格">${card?.style?.description ? JSON.stringify(card.style.description, null, 2) : ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">关键词（逗号分隔）</label>
                        <input type="text" id="style-keywords" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none" value="${(card?.style?.keywords || []).join(', ')}" placeholder="关键词1, 关键词2, ...">
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button id="cancel-style-btn" class="btn btn-secondary">取消</button>
                    <button id="save-style-btn" class="btn btn-primary">保存</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        modal.querySelector('#cancel-style-btn').onclick = () => modal.remove()
        
        modal.querySelector('#save-style-btn').onclick = () => {
            const name = document.getElementById('style-name').value.trim()
            if (!name) {
                UIHelper.showToast('文风名称不能为空', 'error')
                return
            }
            
            const narrativeText = document.getElementById('style-narrative').value.trim()
            const dialogueText = document.getElementById('style-dialogue').value.trim()
            const descriptionText = document.getElementById('style-description').value.trim()
            
            let narrative = {}, dialogue = {}, description = {}
            try {
                if (narrativeText) narrative = JSON.parse(narrativeText)
            } catch (e) {
                narrative = { description: narrativeText }
            }
            try {
                if (dialogueText) dialogue = JSON.parse(dialogueText)
            } catch (e) {
                dialogue = { description: dialogueText }
            }
            try {
                if (descriptionText) description = JSON.parse(descriptionText)
            } catch (e) {
                description = { description: descriptionText }
            }
            
            const data = {
                name: name,
                author: document.getElementById('style-author').value.trim(),
                source: {
                    novelName: document.getElementById('style-source').value.trim()
                },
                style: {
                    narrative: narrative,
                    dialogue: dialogue,
                    description: description,
                    keywords: document.getElementById('style-keywords').value.split(',').map(s => s.trim()).filter(s => s)
                }
            }
            
            if (card) {
                StyleCardManager.updateCard(card.id, data)
            } else {
                StyleCardManager.createCard(data)
            }
            
            document.getElementById('style-cards-container').innerHTML = this.renderStyleCardList(StyleCardManager.getAllCards())
            this.bindStyleCardButtons()
            modal.remove()
            UIHelper.showToast('保存成功', 'success')
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove()
        }
    }
    
    showStyleDetail(id) {
        const card = StyleCardManager.getCard(id)
        if (!card) return
        
        const modal = document.createElement('div')
        modal.id = 'style-detail-modal'
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold">${card.name || '未命名文风'}</h3>
                    <button id="close-detail-btn" class="text-slate-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    ${card.author ? `<div><span class="text-slate-400">作者：</span>${card.author}</div>` : ''}
                    ${card.source?.novelName ? `<div><span class="text-slate-400">来源：</span>${card.source.novelName}</div>` : ''}
                    
                    ${card.style?.narrative ? `
                        <div>
                            <h4 class="font-semibold mb-2">叙事风格</h4>
                            <pre class="bg-slate-700 p-3 rounded text-sm overflow-x-auto">${JSON.stringify(card.style.narrative, null, 2)}</pre>
                        </div>
                    ` : ''}
                    
                    ${card.style?.dialogue ? `
                        <div>
                            <h4 class="font-semibold mb-2">对话风格</h4>
                            <pre class="bg-slate-700 p-3 rounded text-sm overflow-x-auto">${JSON.stringify(card.style.dialogue, null, 2)}</pre>
                        </div>
                    ` : ''}
                    
                    ${card.style?.description ? `
                        <div>
                            <h4 class="font-semibold mb-2">描写风格</h4>
                            <pre class="bg-slate-700 p-3 rounded text-sm overflow-x-auto">${JSON.stringify(card.style.description, null, 2)}</pre>
                        </div>
                    ` : ''}
                    
                    ${card.style?.keywords?.length ? `
                        <div>
                            <h4 class="font-semibold mb-2">关键词</h4>
                            <div class="flex flex-wrap gap-2">
                                ${card.style.keywords.map(k => `<span class="bg-slate-700 px-2 py-1 rounded text-sm">${k}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button id="edit-detail-btn" class="btn btn-secondary">编辑</button>
                    <button id="close-detail-btn-2" class="btn btn-primary">关闭</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        modal.querySelector('#close-detail-btn').onclick = () => modal.remove()
        modal.querySelector('#close-detail-btn-2').onclick = () => modal.remove()
        modal.querySelector('#edit-detail-btn').onclick = () => {
            modal.remove()
            this.showStyleEditor(card)
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove()
        }
    }
    
    renderPlotCards() {
        const main = document.getElementById('main-content')
        
        const cardUI = new PlotCardUI(main, {
            onEdit: (card) => {
                this.showPlotCardEditor(card)
            },
            onCreate: () => {
                this.showPlotCardEditor(null)
            },
            onUseForContinuation: (cardData) => {
                this.usePlotCardForContinuation(cardData)
            },
            onToast: (message, type) => {
                UIHelper.showToast(message, type)
            }
        })
        
        cardUI.render()
    }
    
    showPlotCardEditor(card) {
        const isEdit = !!card
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
        
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold">${isEdit ? '编辑剧情卡' : '新建剧情卡'}</h3>
                    <button id="close-editor-btn" class="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <form id="plot-card-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">卡片名称</label>
                        <input type="text" name="name" value="${card?.name || ''}" 
                            class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="输入剧情卡名称">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">来源小说</label>
                        <input type="text" name="novel_name" value="${card?.source?.novel_name || ''}"
                            class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="输入小说名称">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">开端</label>
                        <textarea name="opening" rows="2"
                            class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="描述故事开端">${card?.plot_overview?.opening || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">发展</label>
                        <textarea name="development" rows="2"
                            class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="描述故事发展">${card?.plot_overview?.development || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">高潮</label>
                        <textarea name="climax" rows="2"
                            class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="描述故事高潮">${card?.plot_overview?.climax || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">当前进度</label>
                        <textarea name="current_progress" rows="2"
                            class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="描述当前剧情进度">${card?.plot_overview?.current_progress || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">续写约束（每行一条）</label>
                        <textarea name="constraints" rows="3"
                            class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="输入续写约束，每行一条">${(card?.continuation_constraints || []).join('\n')}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">标签（逗号分隔）</label>
                        <input type="text" name="tags" value="${(card?.tags || []).join(', ')}"
                            class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="输入标签，用逗号分隔">
                    </div>
                </form>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button id="cancel-editor-btn" class="btn btn-secondary">取消</button>
                    <button id="save-plot-card-btn" class="btn btn-primary">保存</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        const closeBtn = modal.querySelector('#close-editor-btn')
        const cancelBtn = modal.querySelector('#cancel-editor-btn')
        const saveBtn = modal.querySelector('#save-plot-card-btn')
        
        const closeModal = () => modal.remove()
        
        closeBtn.onclick = closeModal
        cancelBtn.onclick = closeModal
        
        saveBtn.onclick = () => {
            const form = modal.querySelector('#plot-card-form')
            const formData = new FormData(form)
            
            const data = {
                name: formData.get('name') || '未命名剧情卡',
                source: {
                    novel_name: formData.get('novel_name') || ''
                },
                plot_overview: {
                    opening: formData.get('opening') || '',
                    development: formData.get('development') || '',
                    climax: formData.get('climax') || '',
                    current_progress: formData.get('current_progress') || ''
                },
                continuation_constraints: formData.get('constraints')
                    ? formData.get('constraints').split('\n').filter(c => c.trim())
                    : [],
                tags: formData.get('tags')
                    ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t)
                    : []
            }
            
            if (isEdit) {
                plotCardManager.updateCard(card.id, data)
                UIHelper.showToast('更新成功', 'success')
            } else {
                plotCardManager.createCard(data)
                UIHelper.showToast('创建成功', 'success')
            }
            
            closeModal()
            this.renderPlotCards()
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) closeModal()
        }
    }
    
    usePlotCardForContinuation(cardData) {
        this.selectedPlotCard = cardData
        UIHelper.showToast(`已选择剧情卡：${cardData.name}，正在跳转到续写模块...`, 'info')
        setTimeout(() => {
            window.location.hash = 'continue'
        }, 500)
    }
    
    async importAnalysisFile(file) {
        try {
            const content = await file.text()
            const chapters = this.chapterSplitter.split(content)
            const stats = this.chapterSplitter.getSplitStats(chapters)
            
            this.analysisData.chapters = chapters
            this.analysisData.novelTitle = file.name.replace('.txt', '')
            this.analysisData.totalChapters = stats.totalChapters
            this.analysisData.totalWords = stats.totalWords
            this.analysisData.currentChapterIndex = -1
            
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
    
    setAnalysisType(type) {
        this.analysisData.analysisType = type
        this.chapterAnalyzer.setAnalysisType(type)
        this.textAnalysis.setSubModule(type)
    }
    
    switchAnalysisSubModule(moduleName) {
        const validModules = ['plot', 'character', 'style']
        if (!validModules.includes(moduleName)) {
            UIHelper.showToast('无效的分析模块', 'error')
            return false
        }
        
        this.analysisData.analysisType = moduleName
        this.textAnalysis.setSubModule(moduleName)
        
        if (this.currentAnalysisUI) {
            this.currentAnalysisUI.updateModule(moduleName)
        }
        
        UIHelper.showToast(`已切换到${moduleName === 'plot' ? '剧情' : moduleName === 'character' ? '角色' : '文风'}分析`, 'info')
        return true
    }
    
    async analyzeWithTextAnalysis(chapterIndex, analysisType) {
        if (!this.textAnalysis) {
            UIHelper.showToast('文本分析模块未初始化', 'error')
            return null
        }
        
        try {
            const result = await this.textAnalysis.analyzeChapter(chapterIndex, analysisType)
            return result
        } catch (error) {
            UIHelper.showToast(`分析失败: ${error.message}`, 'error')
            return null
        }
    }
    
    async analyzeAllWithTextAnalysis(callbacks) {
        if (!this.textAnalysis) {
            UIHelper.showToast('文本分析模块未初始化', 'error')
            return null
        }
        
        try {
            const result = await this.textAnalysis.analyzeAllChapters(
                this.analysisData.analysisType,
                callbacks
            )
            return result
        } catch (error) {
            UIHelper.showToast(`批量分析失败: ${error.message}`, 'error')
            return null
        }
    }
    
    async exportToPlotCard() {
        if (!this.textAnalysis) {
            UIHelper.showToast('文本分析模块未初始化', 'error')
            return null
        }
        
        try {
            const plotCard = await this.textAnalysis.exportToPlotCard()
            UIHelper.showToast('剧情卡导出成功', 'success')
            return plotCard
        } catch (error) {
            UIHelper.showToast(`导出失败: ${error.message}`, 'error')
            return null
        }
    }
    
    async exportToRoleCards() {
        if (!this.textAnalysis) {
            UIHelper.showToast('文本分析模块未初始化', 'error')
            return null
        }
        
        try {
            const roleCards = await this.textAnalysis.exportToRoleCards()
            UIHelper.showToast(`角色卡导出成功，共${roleCards.length}个`, 'success')
            return roleCards
        } catch (error) {
            UIHelper.showToast(`导出失败: ${error.message}`, 'error')
            return null
        }
    }
    
    async exportToStyleCard() {
        if (!this.textAnalysis) {
            UIHelper.showToast('文本分析模块未初始化', 'error')
            return null
        }
        
        try {
            const styleCard = await this.textAnalysis.exportToStyleCard()
            UIHelper.showToast('文风卡导出成功', 'success')
            return styleCard
        } catch (error) {
            UIHelper.showToast(`导出失败: ${error.message}`, 'error')
            return null
        }
    }
    
    getTextAnalysisProgress() {
        if (!this.textAnalysis) {
            return { total: 0, completed: 0, percentage: 0 }
        }
        return this.textAnalysis.getProgress()
    }
    
    async analyzeCurrentChapter() {
        if (this.analysisData.currentChapterIndex < 0) {
            UIHelper.showToast('请先选择章节', 'warning')
            return null
        }
        
        const chapter = this.analysisData.chapters[this.analysisData.currentChapterIndex]
        if (!chapter) {
            UIHelper.showToast('章节不存在', 'error')
            return null
        }
        
        chapter.analysisStatus = AnalysisStatus.ANALYZING
        
        try {
            const result = await this.chapterAnalyzer.analyze(chapter)
            
            chapter.analysisResult = result
            chapter.analysisStatus = AnalysisStatus.COMPLETED
            chapter.analyzedAt = new Date().toISOString()
            
            this.saveChapterAnalysis(chapter)
            
            return result
        } catch (error) {
            chapter.analysisStatus = AnalysisStatus.FAILED
            chapter.error = error.message
            UIHelper.showToast(`分析失败: ${error.message}`, 'error')
            return null
        }
    }
    
    async analyzeAllChapters(onProgress, onComplete, onError) {
        if (this.analysisData.isAnalyzing) {
            UIHelper.showToast('分析正在进行中', 'warning')
            return
        }
        
        this.analysisData.isAnalyzing = true
        
        const pendingChapters = this.analysisData.chapters.filter(c => 
            c.analysisStatus === AnalysisStatus.PENDING || 
            c.analysisStatus === AnalysisStatus.FAILED
        )
        
        this.analysisQueue.add(pendingChapters)
        
        this.analysisQueue.setCallbacks({
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
                this.saveChapterAnalysis(chapter)
            },
            onComplete: (chapters, summary) => {
                this.analysisData.isAnalyzing = false
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
        
        await this.analysisQueue.process((chapter) => this.chapterAnalyzer.analyze(chapter))
    }
    
    pauseAnalysis() {
        this.analysisQueue.pause()
    }
    
    resumeAnalysis() {
        this.analysisQueue.resume((chapter) => this.chapterAnalyzer.analyze(chapter))
    }
    
    cancelAnalysis() {
        this.analysisQueue.cancel()
        this.analysisData.isAnalyzing = false
    }
    
    saveChapterAnalysis(chapter) {
        const analysisData = WorkspaceManager.getWorkspaceData('chapterAnalysis') || {}
        analysisData[chapter.chapterNum] = {
            chapterNum: chapter.chapterNum,
            title: chapter.title,
            content: chapter.content,
            wordCount: chapter.wordCount,
            analysisResult: chapter.analysisResult,
            analyzedAt: chapter.analyzedAt,
            savedAt: new Date().toISOString()
        }
        WorkspaceManager.setWorkspaceData('chapterAnalysis', analysisData)
    }
    
    getChapterAnalysis(chapterNum) {
        const analysisData = WorkspaceManager.getWorkspaceData('chapterAnalysis') || {}
        return analysisData[chapterNum] || null
    }
    
    getAllChapterAnalyses() {
        return WorkspaceManager.getWorkspaceData('chapterAnalysis') || {}
    }
    
    getAnalysisProgress() {
        const completed = this.analysisData.chapters.filter(c => c.analysisStatus === AnalysisStatus.COMPLETED).length
        const total = this.analysisData.totalChapters
        
        return {
            completed,
            total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            status: this.analysisData.isAnalyzing ? 'analyzing' : 'idle'
        }
    }
    
    selectChapter(index) {
        if (index < 0 || index >= this.analysisData.chapters.length) return
        
        this.analysisData.currentChapterIndex = index
        const chapter = this.analysisData.chapters[index]
        
        const savedAnalysis = this.getChapterAnalysis(chapter.chapterNum)
        if (savedAnalysis && !chapter.analysisResult) {
            chapter.analysisResult = savedAnalysis.analysisResult
            chapter.analysisStatus = AnalysisStatus.COMPLETED
            chapter.analyzedAt = savedAnalysis.analyzedAt
        }
        
        return chapter
    }
    
    getSelectedChapter() {
        if (this.analysisData.currentChapterIndex < 0) return null
        return this.analysisData.chapters[this.analysisData.currentChapterIndex]
    }
    
    exportChapterAnalysis(chapterNum) {
        const analysis = this.getChapterAnalysis(chapterNum)
        if (!analysis) {
            UIHelper.showToast('该章节暂无分析数据', 'warning')
            return null
        }
        
        return {
            exportType: 'chapter_analysis',
            exportVersion: '2.0',
            exportedAt: new Date().toISOString(),
            chapterNum: chapterNum,
            data: analysis
        }
    }
    
    exportAllChapterAnalyses() {
        const allAnalyses = this.getAllChapterAnalyses()
        
        return {
            exportType: 'all_chapter_analyses',
            exportVersion: '2.0',
            exportedAt: new Date().toISOString(),
            chapterCount: Object.keys(allAnalyses).length,
            data: allAnalyses
        }
    }
    
    async importAndAnalyze(file) {
        const result = await this.analysisFlow.importFile(file)
        
        if (result.success) {
            this.analysisData.chapters = result.chapters
            this.analysisData.novelTitle = this.analysisFlow.analysisData.novelTitle
            this.analysisData.totalChapters = result.stats.totalChapters
            this.analysisData.totalWords = result.stats.totalWords
        }
        
        return result
    }
    
    async startFullAnalysis(onProgress, onComplete, onError) {
        await this.analysisFlow.analyzeAllChapters(onProgress, onComplete, onError)
    }
    
    pauseFullAnalysis() {
        this.analysisFlow.pauseAnalysis()
    }
    
    resumeFullAnalysis() {
        this.analysisFlow.resumeAnalysis()
    }
    
    cancelFullAnalysis() {
        this.analysisFlow.cancelAnalysis()
    }
    
    async generateOverallAnalysisFromFlow() {
        return await this.analysisFlow.generateOverallAnalysis()
    }
    
    getAnalysisFlowData() {
        return this.analysisFlow.getAnalysisData()
    }
    
    getAnalysisFlowProgress() {
        return this.analysisFlow.getProgress()
    }
    
    getAnalysisFlowStats() {
        return this.analysisFlow.getStats()
    }
    
    exportFullAnalysisFromFlow() {
        return this.analysisFlow.exportAnalysis()
    }
    
    loadAnalysisFromStorage() {
        return this.analysisFlow.loadFromStorage()
    }
    
    clearAnalysisFlow() {
        this.analysisFlow.clearAnalysis()
        this.analysisData = {
            chapters: [],
            currentChapterIndex: -1,
            analysisType: 'plot',
            isAnalyzing: false,
            novelTitle: '',
            totalChapters: 0,
            totalWords: 0
        }
    }
    
    isAnalysisFlowAnalyzing() {
        return this.analysisFlow.isAnalyzing()
    }
    
    isAnalysisFlowPaused() {
        return this.analysisFlow.isPaused()
    }
    
    isAnalysisFlowComplete() {
        return this.analysisFlow.isComplete()
    }
    
    getChapterAnalysisForRewrite(chapterNum) {
        return this.analysisRewriteBridge.getChapterAnalysisForRewrite(chapterNum)
    }
    
    getBatchChapterAnalysis(startChapter, endChapter) {
        return this.analysisRewriteBridge.getBatchChapterAnalysis(startChapter, endChapter)
    }
    
    getPlotOverviewForRewrite(chapterNum) {
        return this.analysisRewriteBridge.getPlotOverviewForRewrite(chapterNum)
    }
    
    getCharacterInfoForRewrite(chapterNum, characterName) {
        return this.analysisRewriteBridge.getCharacterInfoForRewrite(chapterNum, characterName)
    }
    
    getAllCharactersForRewrite() {
        return this.analysisRewriteBridge.getAllCharactersForRewrite()
    }
    
    getOverallPlotForRewrite() {
        return this.analysisRewriteBridge.getOverallPlotForRewrite()
    }
    
    getStyleGuideForRewrite() {
        return this.analysisRewriteBridge.getStyleGuideForRewrite()
    }
    
    buildRewritePromptContext(chapterNum) {
        return this.analysisRewriteBridge.buildRewritePromptContext(chapterNum)
    }
    
    getRewriteHints(chapterNum) {
        return this.analysisRewriteBridge.getRewriteHints(chapterNum)
    }
    
    syncAnalysisToRewriteModule(rewriteModule) {
        return this.analysisRewriteBridge.syncToRewriteModule(rewriteModule)
    }
    
    getBridgeStatus() {
        return this.analysisRewriteBridge.getBridgeStatus()
    }
    
    exportAnalysisForRewrite() {
        return this.analysisRewriteBridge.exportForRewrite()
    }
    
    convertDataToRewriteFormat(analysisData) {
        return this.dataConverter.toRewriteFormat(analysisData)
    }
    
    convertDataToRewriteOverallFormat(plotAnalysis) {
        return this.dataConverter.toRewriteOverallFormat(plotAnalysis)
    }
    
    convertDataToRewriteStyleFormat(styleAnalysis) {
        return this.dataConverter.toRewriteStyleFormat(styleAnalysis)
    }
    
    formatDataForPrompt(data, type) {
        return this.dataConverter.formatForPrompt(data, type)
    }
    
    createAnalysisUI(container, options = {}) {
        const ui = new AnalysisUI(container, {
            onChapterSelect: (index, chapter) => {
                this.selectChapter(index)
                if (options.onChapterSelect) {
                    options.onChapterSelect(index, chapter)
                }
            },
            onAnalyze: async (index) => {
                ui.showAnalyzing(index)
                try {
                    const result = await this.analyzeCurrentChapter()
                    ui.updateChapterStatus(index, result ? AnalysisStatus.COMPLETED : AnalysisStatus.FAILED)
                    ui.updateProgress(this.analysisData)
                    if (result) {
                        ui.updateContentPanel(this.analysisData.chapters[index])
                        UIHelper.showToast('分析完成', 'success')
                    }
                } catch (error) {
                    ui.updateChapterStatus(index, AnalysisStatus.FAILED)
                    UIHelper.showToast(`分析失败: ${error.message}`, 'error')
                } finally {
                    ui.hideAnalyzingAll()
                }
            },
            onAnalyzeAll: async () => {
                ui.showAnalyzingAll()
                await this.analyzeAllChapters(
                    (progress) => {
                        ui.updateAnalyzingProgress(progress)
                    },
                    (data) => {
                        ui.updateProgress(data)
                        ui.hideAnalyzingAll()
                        UIHelper.showToast('全部章节分析完成', 'success')
                    },
                    (chapter, error) => {
                        UIHelper.showToast(`第${chapter.chapterNum}章分析失败: ${error.message}`, 'error')
                    }
                )
            },
            onPause: () => {
                this.pauseAnalysis()
                UIHelper.showToast('分析已暂停', 'info')
                ui.updatePauseState(true)
            },
            onResume: () => {
                this.resumeAnalysis()
                UIHelper.showToast('分析已恢复', 'info')
                ui.updatePauseState(false)
            },
            onCancel: () => {
                this.cancelAnalysis()
                ui.hideAnalyzingAll()
                UIHelper.showToast('分析已取消', 'warning')
            },
            onExport: () => {
                this.exportAnalysisResults()
            },
            onExportRoleCard: () => {
                this.exportAnalysisToRoleCard()
            },
            onExportStyleCard: () => {
                this.exportAnalysisToStyleCard()
            },
            ...options
        })
        
        return ui
    }
    
    createAnalysisImportUI(container, options = {}) {
        const ui = new AnalysisImportUI(container, {
            onImport: async (file) => {
                const result = await this.importAnalysisFile(file)
                if (result.success) {
                    UIHelper.showToast('导入成功', 'success')
                    if (options.onImportSuccess) {
                        options.onImportSuccess(result)
                    }
                } else {
                    UIHelper.showToast(`导入失败: ${result.error}`, 'error')
                }
            },
            ...options
        })
        
        return ui
    }
    
    createAnalysisTypeSelector(container, options = {}) {
        const selector = new AnalysisTypeSelector(container, {
            onTypeChange: (type) => {
                this.setAnalysisType(type)
                if (options.onTypeChange) {
                    options.onTypeChange(type)
                }
            },
            ...options
        })
        
        return selector
    }
    
    renderAnalysisPage(container) {
        const wrapper = document.createElement('div')
        wrapper.className = 'analysis-page h-full flex flex-col'
        
        const header = document.createElement('div')
        header.className = 'p-4 border-b border-slate-700'
        header.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold">小说分析</h2>
                    <p class="text-slate-400 mt-1">导入小说文件，进行智能分析</p>
                </div>
                <div class="flex space-x-2">
                    <select id="analysis-type-select" class="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm">
                        <option value="plot">📖 剧情分析</option>
                        <option value="character">👤 角色分析</option>
                        <option value="style">✍ 文风分析</option>
                    </select>
                </div>
            </div>
        `
        wrapper.appendChild(header)
        
        const mainContent = document.createElement('div')
        mainContent.className = 'flex-1 flex'
        
        if (this.analysisData.chapters.length > 0) {
            const analysisUI = this.createAnalysisUI(mainContent)
            analysisUI.render(this.analysisData)
            this.currentAnalysisUI = analysisUI
        } else {
            const importContainer = document.createElement('div')
            importContainer.className = 'flex-1 flex items-center justify-center'
            mainContent.appendChild(importContainer)
            
            const importUI = this.createAnalysisImportUI(importContainer, {
                onImportSuccess: (result) => {
                    this.renderAnalysisPage(container)
                }
            })
            importUI.render()
        }
        
        wrapper.appendChild(mainContent)
        
        container.innerHTML = ''
        container.appendChild(wrapper)
        
        const typeSelect = document.getElementById('analysis-type-select')
        if (typeSelect) {
            typeSelect.value = this.analysisData.analysisType || 'plot'
            typeSelect.addEventListener('change', (e) => {
                this.setAnalysisType(e.target.value)
                UIHelper.showToast(`已切换到${e.target.options[e.target.selectedIndex].text}`, 'info')
            })
        }
    }
    
    exportAnalysisResults() {
        const exportData = this.exportFullAnalysisFromFlow()
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analysis_${this.analysisData.novelTitle}_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        
        UIHelper.showToast('导出成功', 'success')
    }
    
    exportAnalysisToRoleCard() {
        const completedChapters = this.analysisData.chapters.filter(c => c.analysisStatus === AnalysisStatus.COMPLETED)
        
        if (completedChapters.length === 0) {
            UIHelper.showToast('请先完成至少一个章节的分析', 'warning')
            return
        }
        
        const allCharacters = []
        
        completedChapters.forEach(chapter => {
            if (chapter.analysisResult && chapter.analysisResult.character_performances) {
                chapter.analysisResult.character_performances.forEach(char => {
                    const existing = allCharacters.find(c => c.name === char.name)
                    if (existing) {
                        if (char.speech) existing.speeches.push(char.speech)
                        if (char.body_language) {
                            const bodyLang = Array.isArray(char.body_language) ? char.body_language : [char.body_language]
                            existing.bodyLanguages.push(...bodyLang)
                        }
                    } else {
                        allCharacters.push({
                            name: char.name,
                            speeches: char.speech ? [char.speech] : [],
                            bodyLanguages: char.body_language ? (Array.isArray(char.body_language) ? char.body_language : [char.body_language]) : [],
                            clothing: char.clothing_change || ''
                        })
                    }
                })
            }
        })
        
        if (allCharacters.length === 0) {
            UIHelper.showToast('分析结果中未找到角色信息，请先进行剧情或角色分析', 'warning')
            return
        }
        
        const createdCards = []
        allCharacters.forEach(char => {
            const roleCard = {
                name: char.name,
                novel: this.analysisData.novelTitle,
                description: `出自《${this.analysisData.novelTitle}》`,
                personality: '',
                speechStyle: char.speeches.slice(0, 3).join('；'),
                bodyLanguage: char.bodyLanguages.slice(0, 5).join('；'),
                clothing: char.clothing,
                background: '',
                relationships: [],
                tags: ['AI分析生成']
            }
            
            const card = RoleCardManager.createCard(roleCard)
            if (card) createdCards.push(char.name)
        })
        
        this.showRoleCardResult(createdCards)
    }
    
    showRoleCardResult(characters) {
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex items-center space-x-3 mb-4">
                    <span class="text-3xl">👤</span>
                    <div>
                        <h3 class="text-lg font-bold">角色卡生成完成</h3>
                        <p class="text-sm text-slate-400">共生成 ${characters.length} 个角色卡</p>
                    </div>
                </div>
                <div class="max-h-60 overflow-y-auto mb-4">
                    <div class="space-y-2">
                        ${characters.map(name => `
                            <div class="flex items-center space-x-2 bg-slate-700 rounded p-2">
                                <span class="text-green-400">✓</span>
                                <span>${name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button id="view-role-cards-btn" class="flex-1 btn btn-primary">查看角色卡</button>
                    <button id="close-role-modal-btn" class="flex-1 btn btn-secondary">关闭</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        modal.querySelector('#view-role-cards-btn').onclick = () => {
            modal.remove()
            window.location.hash = 'roles'
        }
        
        modal.querySelector('#close-role-modal-btn').onclick = () => modal.remove()
        modal.onclick = (e) => { if (e.target === modal) modal.remove() }
    }
    
    exportAnalysisToStyleCard() {
        const completedChapters = this.analysisData.chapters.filter(c => c.analysisStatus === AnalysisStatus.COMPLETED)
        
        if (completedChapters.length === 0) {
            UIHelper.showToast('请先完成至少一个章节的分析', 'warning')
            return
        }
        
        const styleFeatures = {
            narrativeStyle: [],
            dialogueStyle: [],
            descriptionStyle: [],
            highFrequencyWords: [],
            rhetoric: []
        }
        
        completedChapters.forEach(chapter => {
            if (chapter.analysisResult && chapter.analysisResult.style_features) {
                const sf = chapter.analysisResult.style_features
                if (sf.sentence_ratio) styleFeatures.narrativeStyle.push(sf.sentence_ratio)
                if (sf.description_style) styleFeatures.descriptionStyle.push(sf.description_style)
                if (sf.dialogue_style) styleFeatures.dialogueStyle.push(sf.dialogue_style)
                if (sf.high_frequency_words) styleFeatures.highFrequencyWords.push(...sf.high_frequency_words)
                if (sf.rhetoric) styleFeatures.rhetoric.push(...sf.rhetoric)
            }
        })
        
        if (styleFeatures.narrativeStyle.length === 0 && styleFeatures.dialogueStyle.length === 0) {
            UIHelper.showToast('分析结果中未找到文风信息，请先进行文风分析', 'warning')
            return
        }
        
        const uniqueWords = [...new Set(styleFeatures.highFrequencyWords)].slice(0, 20)
        const uniqueRhetoric = [...new Set(styleFeatures.rhetoric)].slice(0, 10)
        
        const styleCard = {
            name: `${this.analysisData.novelTitle}文风`,
            author: '',
            source: {
                novelName: this.analysisData.novelTitle
            },
            style: {
                narrative: {
                    description: styleFeatures.narrativeStyle.slice(0, 3).join('；') || '标准叙事风格'
                },
                dialogue: {
                    description: styleFeatures.dialogueStyle.slice(0, 3).join('；') || '自然对话风格'
                },
                description: {
                    description: styleFeatures.descriptionStyle.slice(0, 3).join('；') || '细腻描写风格'
                },
                keywords: uniqueWords,
                rhetoric: uniqueRhetoric
            },
            tags: ['AI分析生成']
        }
        
        const card = StyleCardManager.createCard(styleCard)
        
        this.showStyleCardResult(styleCard, uniqueWords, uniqueRhetoric)
    }
    
    showStyleCardResult(styleCard, keywords, rhetoric) {
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 max-w-lg w-full mx-4">
                <div class="flex items-center space-x-3 mb-4">
                    <span class="text-3xl">✍</span>
                    <div>
                        <h3 class="text-lg font-bold">文风卡生成完成</h3>
                        <p class="text-sm text-slate-400">${styleCard.name}</p>
                    </div>
                </div>
                <div class="space-y-4 mb-4">
                    <div>
                        <h4 class="text-sm font-medium text-slate-300 mb-2">叙事风格</h4>
                        <p class="text-sm text-slate-400">${styleCard.style.narrative.description}</p>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-slate-300 mb-2">对话风格</h4>
                        <p class="text-sm text-slate-400">${styleCard.style.dialogue.description}</p>
                    </div>
                    ${keywords.length > 0 ? `
                    <div>
                        <h4 class="text-sm font-medium text-slate-300 mb-2">高频词汇</h4>
                        <div class="flex flex-wrap gap-1">
                            ${keywords.slice(0, 10).map(w => `<span class="px-2 py-1 bg-slate-700 rounded text-xs">${w}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    ${rhetoric.length > 0 ? `
                    <div>
                        <h4 class="text-sm font-medium text-slate-300 mb-2">修辞手法</h4>
                        <div class="flex flex-wrap gap-1">
                            ${rhetoric.map(r => `<span class="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs">${r}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="flex space-x-2">
                    <button id="view-style-cards-btn" class="flex-1 btn btn-primary">查看文风卡</button>
                    <button id="close-style-modal-btn" class="flex-1 btn btn-secondary">关闭</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        modal.querySelector('#view-style-cards-btn').onclick = () => {
            modal.remove()
            window.location.hash = 'styles'
        }
        
        modal.querySelector('#close-style-modal-btn').onclick = () => modal.remove()
        modal.onclick = (e) => { if (e.target === modal) modal.remove() }
    }
    
    saveChapterAnalysisToStorage(chapterNum, data) {
        return storageManager.saveChapterAnalysis(chapterNum, data)
    }
    
    getChapterAnalysisFromStorage(chapterNum) {
        return storageManager.getChapterAnalysis(chapterNum)
    }
    
    getAllChapterAnalysesFromStorage() {
        return storageManager.getAllChapterAnalyses()
    }
    
    deleteChapterAnalysisFromStorage(chapterNum) {
        return storageManager.deleteChapterAnalysis(chapterNum)
    }
    
    saveOverallAnalysisToStorage(data) {
        return storageManager.saveOverallAnalysis(data)
    }
    
    getOverallAnalysisFromStorage() {
        return storageManager.getOverallAnalysis()
    }
    
    saveAnalysisProgressToStorage(progress) {
        return storageManager.saveAnalysisProgress(progress)
    }
    
    getAnalysisProgressFromStorage() {
        return storageManager.getAnalysisProgress()
    }
    
    saveAnalysisSettingsToStorage(settings) {
        return storageManager.saveAnalysisSettings(settings)
    }
    
    getAnalysisSettingsFromStorage() {
        return storageManager.getAnalysisSettings()
    }
    
    getStorageInfo() {
        return storageManager.getStorageInfo()
    }
    
    getStorageStats() {
        return storageManager.getStorageStats()
    }
    
    clearAllStorage() {
        storageManager.clearAll()
        UIHelper.showToast('存储已清空', 'success')
    }
    
    exportChapterAnalysisAsJSON(chapterNum) {
        const data = this.getChapterAnalysisFromStorage(chapterNum)
        if (!data) {
            UIHelper.showToast('章节分析数据不存在', 'error')
            return null
        }
        
        const exportData = exportManager.exportChapterAnalysis(chapterNum, data)
        const blob = exportManager.exportAsJSON(exportData)
        const filename = exportManager.generateFilename('chapter', chapterNum)
        
        exportManager.downloadFile(blob, filename)
        UIHelper.showToast('导出成功', 'success')
        
        return exportData
    }
    
    exportAllChapterAnalysesAsJSON() {
        const allAnalyses = this.getAllChapterAnalysesFromStorage()
        
        const exportData = exportManager.exportAllChapterAnalyses(allAnalyses)
        const blob = exportManager.exportAsJSON(exportData)
        const filename = exportManager.generateFilename('all_chapters')
        
        exportManager.downloadFile(blob, filename)
        UIHelper.showToast('导出成功', 'success')
        
        return exportData
    }
    
    exportFullAnalysisAsJSON() {
        const chapterAnalyses = this.getAllChapterAnalysesFromStorage()
        const overallAnalysis = this.getOverallAnalysisFromStorage()
        
        const exportData = exportManager.exportFullAnalysis(chapterAnalyses, overallAnalysis, {
            title: this.analysisData.novelTitle,
            totalChapters: this.analysisData.totalChapters,
            totalWords: this.analysisData.totalWords
        })
        
        const blob = exportManager.exportAsJSON(exportData)
        const filename = exportManager.generateFilename('full', null, this.analysisData.novelTitle)
        
        exportManager.downloadFile(blob, filename)
        UIHelper.showToast('导出成功', 'success')
        
        return exportData
    }
    
    exportAnalysisAsMarkdown(type = 'full') {
        let data
        let filename
        
        switch (type) {
            case 'chapter':
                if (this.selectedChapter === null) {
                    UIHelper.showToast('请先选择章节', 'warning')
                    return null
                }
                data = exportManager.exportChapterAnalysis(
                    this.selectedChapter + 1,
                    this.getChapterAnalysisFromStorage(this.selectedChapter + 1)
                )
                filename = exportManager.generateFilename('markdown', this.selectedChapter + 1)
                break
            default:
                data = this.exportFullAnalysisAsJSON()
                filename = exportManager.generateFilename('markdown')
        }
        
        const blob = exportManager.exportAsMarkdown(data, type)
        exportManager.downloadFile(blob, filename)
        UIHelper.showToast('导出成功', 'success')
        
        return blob
    }
    
    exportAnalysisAsCSV() {
        const chapterAnalyses = this.getAllChapterAnalysesFromStorage()
        
        if (Object.keys(chapterAnalyses).length === 0) {
            UIHelper.showToast('没有可导出的数据', 'warning')
            return null
        }
        
        const blob = exportManager.exportToCSV(chapterAnalyses)
        const filename = `章节分析_${new Date().toISOString().split('T')[0]}.csv`
        
        exportManager.downloadFile(blob, filename)
        UIHelper.showToast('导出成功', 'success')
        
        return blob
    }
    
    async importAnalysisDataFile(file) {
        try {
            const result = await importManager.importFile(file)
            
            if (!result.success) {
                UIHelper.showToast(`导入失败: ${result.error}`, 'error')
                return result
            }
            
            const processResult = await importManager.processImport(result)
            
            if (processResult.success) {
                UIHelper.showToast(processResult.message, 'success')
            } else {
                UIHelper.showToast(`导入失败: ${processResult.error}`, 'error')
            }
            
            return processResult
        } catch (error) {
            UIHelper.showToast(`导入失败: ${error.message}`, 'error')
            return { success: false, error: error.message }
        }
    }
    
    async getImportPreview(file) {
        try {
            const preview = await importManager.getImportPreview(file)
            return preview
        } catch (error) {
            return { error: error.message }
        }
    }
}

const app = new App()
