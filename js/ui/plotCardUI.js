import { PlotCardManager, plotCardManager } from '../cards/plotCardManager.js'

class PlotCardUI {
    constructor(container, options = {}) {
        this.container = container
        this.options = options
        this.manager = plotCardManager
        this.selectedCardId = null
    }

    render() {
        this.container.innerHTML = this.getHTML()
        this.bindEvents()
    }

    getHTML() {
        const cards = this.manager.getAllCards()
        
        return `
            <div class="plot-card-manager h-full flex flex-col">
                <div class="card-header p-4 border-b border-slate-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold">剧情卡管理</h2>
                            <p class="text-slate-400 mt-1">管理小说剧情分析结果，用于续写参考</p>
                        </div>
                        <div class="flex space-x-2">
                            <button class="btn btn-secondary" id="import-plot-card">
                                📥 导入剧情卡
                            </button>
                            <button class="btn btn-primary" id="create-plot-card">
                                ➕ 新建剧情卡
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4">
                    ${cards.length === 0 ? `
                        <div class="empty-state text-center py-20">
                            <div class="text-6xl mb-4">📚</div>
                            <p class="text-xl text-slate-400">暂无剧情卡</p>
                            <p class="text-slate-500 mt-2">从文本分析模块导出剧情卡，或点击上方按钮新建</p>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${cards.map(card => this.renderCardItem(card)).join('')}
                        </div>
                    `}
                </div>
                
                <input type="file" id="import-plot-card-input" accept=".json" class="hidden">
            </div>
        `
    }

    renderCardItem(card) {
        const chapterCount = card.chapter_summaries?.length || 0
        const conflictCount = (card.core_conflicts?.internal?.length || 0) + (card.core_conflicts?.external?.length || 0)
        const foreshadowingCount = card.foreshadowing?.length || 0
        
        return `
            <div class="card-item bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-colors" data-id="${card.id}">
                <div class="card-info mb-3">
                    <h4 class="text-lg font-bold text-white mb-1">${card.name}</h4>
                    <p class="text-sm text-slate-400">
                        来源：${card.source?.novel_name || '未知'}
                    </p>
                    <div class="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                        <span>📖 ${chapterCount} 章</span>
                        <span>⚔️ ${conflictCount} 冲突</span>
                        <span>🔍 ${foreshadowingCount} 伏笔</span>
                    </div>
                    <div class="card-tags mt-2 flex flex-wrap gap-1">
                        ${(card.tags || []).map(tag => `<span class="tag text-xs bg-slate-700 px-2 py-1 rounded">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="card-actions flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-info flex-1" data-action="view" data-id="${card.id}">查看</button>
                    <button class="btn btn-sm btn-warning flex-1" data-action="edit" data-id="${card.id}">编辑</button>
                    <button class="btn btn-sm btn-success flex-1" data-action="export" data-id="${card.id}">导出</button>
                    <button class="btn btn-sm btn-primary flex-1" data-action="use" data-id="${card.id}">用于续写</button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${card.id}">🗑️</button>
                </div>
            </div>
        `
    }

    renderCardDetail(card) {
        const overview = card.plot_overview || {}
        const internalConflicts = card.core_conflicts?.internal || []
        const externalConflicts = card.core_conflicts?.external || []
        const foreshadowing = card.foreshadowing || []
        const constraints = card.continuation_constraints || []
        const chapters = card.chapter_summaries || []
        
        return `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="card-detail-modal">
                <div class="bg-slate-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="detail-header p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 class="text-xl font-bold">${card.name}</h3>
                        <button class="btn btn-sm btn-secondary" id="close-detail">✕ 关闭</button>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-4">
                        <div class="detail-section mb-6">
                            <h4 class="text-lg font-bold mb-3 text-blue-400">📊 剧情总览</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-slate-700 rounded p-3">
                                    <label class="text-sm text-slate-400">开端</label>
                                    <p class="mt-1">${overview.opening || '未设置'}</p>
                                </div>
                                <div class="bg-slate-700 rounded p-3">
                                    <label class="text-sm text-slate-400">发展</label>
                                    <p class="mt-1">${overview.development || '未设置'}</p>
                                </div>
                                <div class="bg-slate-700 rounded p-3">
                                    <label class="text-sm text-slate-400">高潮</label>
                                    <p class="mt-1">${overview.climax || '未设置'}</p>
                                </div>
                                <div class="bg-slate-700 rounded p-3">
                                    <label class="text-sm text-slate-400">当前进度</label>
                                    <p class="mt-1">${overview.current_progress || '未设置'}</p>
                                </div>
                            </div>
                            ${overview.completion_percentage ? `
                                <div class="mt-3 bg-slate-700 rounded p-3">
                                    <label class="text-sm text-slate-400">完成度</label>
                                    <div class="mt-2 h-2 bg-slate-600 rounded-full overflow-hidden">
                                        <div class="h-full bg-blue-500 rounded-full" style="width: ${overview.completion_percentage}%"></div>
                                    </div>
                                    <p class="text-right text-sm mt-1">${overview.completion_percentage}%</p>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="detail-section mb-6">
                            <h4 class="text-lg font-bold mb-3 text-red-400">⚔️ 核心冲突</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-slate-700 rounded p-3">
                                    <h5 class="font-bold mb-2 text-yellow-400">内在冲突</h5>
                                    ${internalConflicts.length > 0 ? internalConflicts.map(c => `
                                        <div class="mb-2 p-2 bg-slate-600 rounded">
                                            <strong class="text-blue-300">${c.character}：</strong>${c.conflict}
                                            ${c.manifestation ? `<br><small class="text-slate-400">表现：${c.manifestation}</small>` : ''}
                                        </div>
                                    `).join('') : '<p class="text-slate-500">无</p>'}
                                </div>
                                <div class="bg-slate-700 rounded p-3">
                                    <h5 class="font-bold mb-2 text-orange-400">外在冲突</h5>
                                    ${externalConflicts.length > 0 ? externalConflicts.map(c => `
                                        <div class="mb-2 p-2 bg-slate-600 rounded">
                                            <strong class="text-green-300">${c.parties?.join(' vs ') || '未知'}：</strong>${c.description}
                                        </div>
                                    `).join('') : '<p class="text-slate-500">无</p>'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section mb-6">
                            <h4 class="text-lg font-bold mb-3 text-purple-400">🔍 伏笔铺垫</h4>
                            ${foreshadowing.length > 0 ? `
                                <div class="space-y-2">
                                    ${foreshadowing.map(f => `
                                        <div class="bg-slate-700 rounded p-3">
                                            <div class="flex items-start">
                                                <span class="text-purple-400 mr-2">📌</span>
                                                <div>
                                                    <strong>第${f.source_chapter || '?'}章：</strong>${f.hint}
                                                    ${f.expected_resolution ? `<br><small class="text-slate-400">预期揭示：${f.expected_resolution}</small>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-slate-500">无伏笔记录</p>'}
                        </div>
                        
                        <div class="detail-section mb-6">
                            <h4 class="text-lg font-bold mb-3 text-green-400">📝 续写约束</h4>
                            ${constraints.length > 0 ? `
                                <ul class="space-y-1">
                                    ${constraints.map(c => `<li class="flex items-start"><span class="text-green-400 mr-2">✓</span>${c}</li>`).join('')}
                                </ul>
                            ` : '<p class="text-slate-500">无约束</p>'}
                        </div>
                        
                        ${chapters.length > 0 ? `
                            <div class="detail-section">
                                <h4 class="text-lg font-bold mb-3 text-cyan-400">📖 章节摘要</h4>
                                <div class="max-h-60 overflow-y-auto space-y-2">
                                    ${chapters.slice(-10).map(ch => `
                                        <div class="bg-slate-700 rounded p-2">
                                            <strong>第${ch.chapter_num}章：</strong>${ch.summary || '无摘要'}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `
    }

    bindEvents() {
        this.container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action
                const id = e.target.dataset.id
                this.handleAction(action, id)
            })
        })

        this.container.querySelector('#import-plot-card')?.addEventListener('click', () => {
            const input = this.container.querySelector('#import-plot-card-input')
            if (input) input.click()
        })

        this.container.querySelector('#import-plot-card-input')?.addEventListener('change', async (e) => {
            const file = e.target.files[0]
            if (file) {
                await this.importCard(file)
            }
            e.target.value = ''
        })

        this.container.querySelector('#create-plot-card')?.addEventListener('click', () => {
            this.createCard()
        })
    }

    handleAction(action, id) {
        switch (action) {
            case 'view':
                this.viewCard(id)
                break
            case 'edit':
                this.editCard(id)
                break
            case 'export':
                this.exportCard(id)
                break
            case 'use':
                this.useForContinuation(id)
                break
            case 'delete':
                this.deleteCard(id)
                break
        }
    }

    viewCard(id) {
        const card = this.manager.getCard(id)
        if (card) {
            const modal = document.createElement('div')
            modal.innerHTML = this.renderCardDetail(card)
            document.body.appendChild(modal.firstElementChild)
            
            const modalElement = document.getElementById('card-detail-modal')
            modalElement.querySelector('#close-detail')?.addEventListener('click', () => {
                modalElement.remove()
            })
            
            modalElement.addEventListener('click', (e) => {
                if (e.target === modalElement) {
                    modalElement.remove()
                }
            })
        }
    }

    editCard(id) {
        const card = this.manager.getCard(id)
        if (card && this.options.onEdit) {
            this.options.onEdit(card)
        }
    }

    exportCard(id) {
        try {
            this.manager.exportCard(id)
            if (this.options.onToast) {
                this.options.onToast('导出成功', 'success')
            }
        } catch (error) {
            if (this.options.onToast) {
                this.options.onToast(`导出失败: ${error.message}`, 'error')
            }
        }
    }

    async importCard(file) {
        try {
            await this.manager.importCard(file)
            this.render()
            if (this.options.onToast) {
                this.options.onToast('导入成功', 'success')
            }
        } catch (error) {
            if (this.options.onToast) {
                this.options.onToast(`导入失败: ${error.message}`, 'error')
            }
        }
    }

    createCard() {
        if (this.options.onCreate) {
            this.options.onCreate()
        }
    }

    useForContinuation(id) {
        const cardData = this.manager.getCardForContinuation(id)
        if (cardData && this.options.onUseForContinuation) {
            this.options.onUseForContinuation(cardData)
        }
    }

    deleteCard(id) {
        if (confirm('确定要删除这张剧情卡吗？此操作不可恢复。')) {
            this.manager.deleteCard(id)
            this.render()
            if (this.options.onToast) {
                this.options.onToast('删除成功', 'success')
            }
        }
    }

    refresh() {
        this.manager.loadCards()
        this.render()
    }
}

export { PlotCardUI }
