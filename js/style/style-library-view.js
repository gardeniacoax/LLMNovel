import { StyleCardManager } from './style-card-manager.js'
import { StyleCardApplier } from './style-card-applier.js'
import { StyleCardDetail } from './style-card-detail.js'
import { StyleImportExport } from './style-import-export.js'
import { modal } from '../modal.js'

class StyleLibraryView {
    constructor(containerId) {
        this.container = document.getElementById(containerId)
        this.selectedCardId = null
        this.onCardSelect = null
        this.onCardApply = null
    }
    
    render() {
        if (!this.container) return
        
        this.container.innerHTML = `
            <div class="style-library">
                <div class="style-library-header p-4 border-b border-slate-700">
                    <h2 class="text-xl font-semibold text-white mb-4">文风卡库</h2>
                    <div class="flex space-x-2">
                        <button class="btn btn-primary" id="btn-new-card">
                            <span class="mr-1">+</span> 新建文风卡
                        </button>
                        <button class="btn btn-secondary" id="btn-import-card">
                            <span class="mr-1">📥</span> 导入文风卡
                        </button>
                    </div>
                </div>
                <div class="style-library-search p-4 border-b border-slate-700">
                    <input 
                        type="text" 
                        id="style-search-input"
                        class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        placeholder="搜索文风卡名称或作者..."
                    >
                </div>
                <div class="style-library-list p-4 space-y-3" id="style-card-list">
                </div>
                <div class="style-library-footer p-4 border-t border-slate-700 text-slate-400 text-sm" id="style-library-stats">
                </div>
            </div>
        `
        
        this.bindEvents()
        this.refreshList()
    }
    
    bindEvents() {
        const newCardBtn = document.getElementById('btn-new-card')
        if (newCardBtn) {
            newCardBtn.addEventListener('click', () => this.showCreateDialog())
        }
        
        const importBtn = document.getElementById('btn-import-card')
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportDialog())
        }
        
        const searchInput = document.getElementById('style-search-input')
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCards(e.target.value)
            })
        }
    }
    
    refreshList() {
        const listContainer = document.getElementById('style-card-list')
        if (!listContainer) return
        
        const cards = StyleCardManager.getAllCards()
        
        if (cards.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center text-slate-400 py-8">
                    <p class="text-lg mb-2">暂无文风卡</p>
                    <p class="text-sm">点击"新建文风卡"或"导入文风卡"开始使用</p>
                </div>
            `
        } else {
            listContainer.innerHTML = cards.map(card => this.renderCardItem(card)).join('')
            this.bindCardEvents()
        }
        
        this.updateStats()
    }
    
    renderCardItem(card) {
        const lastUsed = card.usageCount > 0 
            ? this.formatRelativeTime(card.usageCount) 
            : '从未使用'
        
        return `
            <div class="style-card-item bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors cursor-pointer" data-card-id="${card.id}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h3 class="text-white font-medium mb-1">
                            <span class="mr-2">📝</span>${card.name}
                        </h3>
                        <p class="text-slate-400 text-sm mb-2">作者：${card.author}</p>
                        <div class="flex items-center text-xs text-slate-500 space-x-4">
                            <span>使用 ${card.usageCount || 0} 次</span>
                            <span>${lastUsed}</span>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="btn btn-sm btn-secondary card-view-btn" data-card-id="${card.id}" title="查看详情">
                            查看
                        </button>
                        <button class="btn btn-sm btn-secondary card-export-btn" data-card-id="${card.id}" title="导出">
                            导出
                        </button>
                        <button class="btn btn-sm btn-danger card-delete-btn" data-card-id="${card.id}" title="删除">
                            删除
                        </button>
                    </div>
                </div>
            </div>
        `
    }
    
    bindCardEvents() {
        document.querySelectorAll('.style-card-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn')) {
                    const cardId = item.dataset.cardId
                    this.selectCard(cardId)
                }
            })
        })
        
        document.querySelectorAll('.card-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation()
                const cardId = btn.dataset.cardId
                this.showCardDetail(cardId)
            })
        })
        
        document.querySelectorAll('.card-export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation()
                const cardId = btn.dataset.cardId
                this.exportCard(cardId)
            })
        })
        
        document.querySelectorAll('.card-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation()
                const cardId = btn.dataset.cardId
                await this.deleteCard(cardId)
            })
        })
    }
    
    selectCard(cardId) {
        document.querySelectorAll('.style-card-item').forEach(item => {
            item.classList.remove('ring-2', 'ring-blue-500')
        })
        
        const selectedItem = document.querySelector(`.style-card-item[data-card-id="${cardId}"]`)
        if (selectedItem) {
            selectedItem.classList.add('ring-2', 'ring-blue-500')
        }
        
        this.selectedCardId = cardId
        
        if (this.onCardSelect) {
            this.onCardSelect(cardId)
        }
    }
    
    async showCreateDialog() {
        const result = await modal.prompt('请输入文风卡名称：', {
            title: '新建文风卡',
            placeholder: '例如：作者A文风卡',
            required: true
        })
        
        if (result) {
            const authorResult = await modal.prompt('请输入作者名称：', {
                title: '作者信息',
                placeholder: '例如：作者A',
                required: true
            })
            
            if (authorResult) {
                const card = StyleCardManager.createCard({
                    name: result,
                    author: authorResult,
                    style: {
                        style_overview: '新创建的文风卡，请编辑完善文风规则',
                        dimensions: {},
                        forbidden_list: { words: [], sentence_patterns: [], rhetoric: [], tone: [] },
                        mandatory_rules: [],
                        core_anchors: []
                    }
                })
                
                this.refreshList()
                this.showCardDetail(card.id)
            }
        }
    }
    
    showImportDialog() {
        StyleImportExport.showImportDialog((card) => {
            if (card) {
                this.refreshList()
                modal.alert('文风卡导入成功！', { title: '成功', type: 'success' })
            }
        })
    }
    
    showCardDetail(cardId) {
        StyleCardDetail.show(cardId, {
            onSave: () => {
                this.refreshList()
            },
            onApply: (workspaceId) => {
                if (this.onCardApply) {
                    this.onCardApply(cardId, workspaceId)
                }
            }
        })
    }
    
    exportCard(cardId) {
        StyleImportExport.exportCardToFile(cardId)
    }
    
    async deleteCard(cardId) {
        const confirmed = await modal.confirm('确定要删除这张文风卡吗？此操作不可恢复。', {
            title: '删除确认',
            type: 'danger',
            confirmText: '删除',
            cancelText: '取消'
        })
        
        if (confirmed) {
            StyleCardManager.deleteCard(cardId)
            this.refreshList()
            
            if (this.selectedCardId === cardId) {
                this.selectedCardId = null
            }
        }
    }
    
    filterCards(query) {
        const listContainer = document.getElementById('style-card-list')
        if (!listContainer) return
        
        if (!query.trim()) {
            this.refreshList()
            return
        }
        
        const cards = StyleCardManager.searchCards(query)
        
        if (cards.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center text-slate-400 py-8">
                    <p>未找到匹配的文风卡</p>
                </div>
            `
        } else {
            listContainer.innerHTML = cards.map(card => this.renderCardItem(card)).join('')
            this.bindCardEvents()
        }
    }
    
    updateStats() {
        const statsContainer = document.getElementById('style-library-stats')
        if (!statsContainer) return
        
        const stats = StyleCardManager.getCardStats()
        statsContainer.innerHTML = `
            共 ${stats.total} 张文风卡 | 累计使用 ${stats.totalUsage} 次
        `
    }
    
    formatRelativeTime(usageCount) {
        if (usageCount === 0) return '从未使用'
        return `已使用 ${usageCount} 次`
    }
    
    showApplyDialog(cardId) {
        const card = StyleCardManager.getCard(cardId)
        if (!card) return
        
        const workspaces = this.getAvailableWorkspaces()
        
        if (workspaces.length === 0) {
            modal.alert('没有可用的工作台，请先创建工作台。', { title: '提示', type: 'warning' })
            return
        }
        
        const content = `
            <div class="space-y-2">
                <p class="text-slate-300 mb-4">选择要应用文风卡"${card.name}"的工作台：</p>
                ${workspaces.map(ws => `
                    <div class="workspace-option p-3 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer" data-workspace-id="${ws.id}">
                        <span class="text-white">${ws.name}</span>
                        ${ws.styleCard ? `<span class="text-xs text-yellow-400 ml-2">(已应用: ${ws.styleCard.name})</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `
        
        const dialogModal = modal.show({
            title: '应用到工作台',
            content,
            footer: `
                <button class="btn btn-secondary modal-cancel">取消</button>
            `
        })
        
        dialogModal.querySelectorAll('.workspace-option').forEach(option => {
            option.addEventListener('click', () => {
                const workspaceId = option.dataset.workspaceId
                const result = StyleCardApplier.applyToWorkspace(cardId, workspaceId)
                
                if (result.success) {
                    modal.close(dialogModal)
                    modal.alert(`文风卡已成功应用到工作台！`, { title: '成功', type: 'success' })
                    this.refreshList()
                    
                    if (this.onCardApply) {
                        this.onCardApply(cardId, workspaceId)
                    }
                } else {
                    modal.alert(`应用失败：${result.error}`, { title: '错误', type: 'error' })
                }
            })
        })
        
        dialogModal.querySelector('.modal-cancel').addEventListener('click', () => {
            modal.close(dialogModal)
        })
    }
    
    getAvailableWorkspaces() {
        return []
    }
    
    setWorkspaceProvider(provider) {
        this.getAvailableWorkspaces = provider
    }
}

export { StyleLibraryView }
