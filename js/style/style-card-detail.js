import { StyleCardManager } from './style-card-manager.js'
import { StyleCardApplier } from './style-card-applier.js'
import { modal } from '../modal.js'

class StyleCardDetail {
    static currentModal = null
    static currentCardId = null
    static callbacks = {}
    
    static show(cardId, callbacks = {}) {
        const card = StyleCardManager.getCard(cardId)
        if (!card) {
            modal.alert('文风卡不存在', { title: '错误', type: 'error' })
            return
        }
        
        this.currentCardId = cardId
        this.callbacks = callbacks
        
        const content = this.renderCardContent(card)
        
        this.currentModal = modal.show({
            title: card.name,
            content,
            width: 'max-w-4xl',
            closable: true,
            onClose: () => {
                this.currentModal = null
                this.currentCardId = null
            }
        })
        
        this.bindEvents()
    }
    
    static renderCardContent(card) {
        const style = card.style || {}
        const dimensions = style.dimensions || {}
        
        return `
            <div class="style-card-detail">
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-700 rounded-lg p-3">
                        <span class="text-slate-400 text-sm">作者</span>
                        <p class="text-white">${card.author || '未知'}</p>
                    </div>
                    <div class="bg-slate-700 rounded-lg p-3">
                        <span class="text-slate-400 text-sm">创建时间</span>
                        <p class="text-white">${this.formatDate(card.createdAt)}</p>
                    </div>
                    <div class="bg-slate-700 rounded-lg p-3">
                        <span class="text-slate-400 text-sm">来源小说</span>
                        <p class="text-white">${card.source?.novelName || '未指定'}</p>
                    </div>
                    <div class="bg-slate-700 rounded-lg p-3">
                        <span class="text-slate-400 text-sm">使用次数</span>
                        <p class="text-white">${card.usage?.usageCount || 0} 次</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">文风概述</h4>
                    <textarea 
                        id="style-overview" 
                        class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                        rows="2"
                        placeholder="一句话概括文风特点..."
                    >${style.style_overview || ''}</textarea>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">遣词用词</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">书面/口语比例</label>
                            <input 
                                type="text" 
                                id="wording-ratio"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.wording?.formal_casual_ratio || ''}"
                                placeholder="例如：书面80%+口语20%"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">形容词密度</label>
                            <input 
                                type="text" 
                                id="wording-density"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.wording?.adjective_density || ''}"
                                placeholder="例如：极简，每句不超过1个"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">高频词汇（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="wording-freq-words"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.wording?.high_frequency_words || []).join('，')}"
                                placeholder="例如：心绪，攥紧，淡淡的"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">固定搭配（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="wording-collocations"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.wording?.fixed_collocations || []).join('，')}"
                                placeholder="例如：指尖泛白，喉间发紧"
                            >
                        </div>
                        <div class="col-span-2">
                            <label class="text-slate-400 text-sm mb-1 block">禁用词汇（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="wording-forbidden"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.wording?.forbidden_words || []).join('，')}"
                                placeholder="例如：网络用语，生僻字"
                            >
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">句式节奏</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">长短句比例</label>
                            <input 
                                type="text" 
                                id="sentence-ratio"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.sentence_structure?.length_ratio || ''}"
                                placeholder="例如：长句30%+中句50%+短句20%"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">段落长度</label>
                            <input 
                                type="text" 
                                id="sentence-paragraph"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.sentence_structure?.paragraph_length || ''}"
                                placeholder="例如：每段3-5句"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">惯用句型（分号分隔）</label>
                            <input 
                                type="text" 
                                id="sentence-patterns"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.sentence_structure?.common_patterns || []).join('；')}"
                                placeholder="例如：主语+轻动作+情绪暗示"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">连接词偏好（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="sentence-conjunctions"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.sentence_structure?.conjunctions || []).join('，')}"
                                placeholder="例如：而，却，便"
                            >
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">标点习惯</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">省略号用法</label>
                            <input 
                                type="text" 
                                id="punctuation-ellipsis"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.punctuation?.ellipsis_usage || ''}"
                                placeholder="例如：仅用于未尽之意，必用6个点"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">停顿逻辑</label>
                            <input 
                                type="text" 
                                id="punctuation-pause"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.punctuation?.pause_logic || ''}"
                                placeholder="例如：长句每8-10字用1个逗号"
                            >
                        </div>
                        <div class="col-span-2">
                            <label class="text-slate-400 text-sm mb-1 block">禁用标点组合（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="punctuation-forbidden"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.punctuation?.forbidden_combos || []).join('，')}"
                                placeholder="例如：……？，——！"
                            >
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">叙事手法</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">叙事视角</label>
                            <input 
                                type="text" 
                                id="narrative-perspective"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.narrative?.perspective || ''}"
                                placeholder="例如：第三人称限知"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">节奏控制</label>
                            <input 
                                type="text" 
                                id="narrative-pacing"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.narrative?.pacing || ''}"
                                placeholder="例如：冲突场景用短句快节奏"
                            >
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">描写风格</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">肢体动作（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="description-body"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.description?.character?.body_language || []).join('，')}"
                                placeholder="例如：垂眼，攥衣角，指尖泛白"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">氛围烘托</label>
                            <input 
                                type="text" 
                                id="description-atmosphere"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.description?.environment?.atmosphere_logic || ''}"
                                placeholder="例如：用冷光、空荡烘托孤寂"
                            >
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">情感表达</h4>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">整体基调</label>
                            <input 
                                type="text" 
                                id="emotion-tone"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.emotion?.tone || ''}"
                                placeholder="例如：孤寂内敛"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">表达方式</label>
                            <input 
                                type="text" 
                                id="emotion-expression"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.emotion?.expression || ''}"
                                placeholder="例如：含蓄，借景物暗示"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">情绪收束</label>
                            <input 
                                type="text" 
                                id="emotion-closure"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${dimensions.emotion?.closure || ''}"
                                placeholder="例如：结尾留白"
                            >
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">作者烙印</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">专属动作（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="signature-actions"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.signature?.trademark_actions || []).join('，')}"
                                placeholder="例如：垂眼，攥衣角"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">高频语气词（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="signature-particles"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.signature?.common_particles || []).join('，')}"
                                placeholder="例如：罢了，也好，呢"
                            >
                        </div>
                        <div class="col-span-2">
                            <label class="text-slate-400 text-sm mb-1 block">专属结尾句式（分号分隔）</label>
                            <input 
                                type="text" 
                                id="signature-endings"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(dimensions.signature?.trademark_endings || []).join('；')}"
                                placeholder="例如：XX着，便也释然了"
                            >
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">禁止事项</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">禁用词汇（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="forbidden-words"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(style.forbidden_list?.words || []).join('，')}"
                                placeholder="例如：突然，居然，竟然"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">禁用句式（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="forbidden-patterns"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(style.forbidden_list?.sentence_patterns || []).join('，')}"
                                placeholder="例如：感叹句连续使用"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">禁用修辞（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="forbidden-rhetoric"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(style.forbidden_list?.rhetoric || []).join('，')}"
                                placeholder="例如：排比，夸张"
                            >
                        </div>
                        <div>
                            <label class="text-slate-400 text-sm mb-1 block">禁用语调（逗号分隔）</label>
                            <input 
                                type="text" 
                                id="forbidden-tone"
                                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                value="${(style.forbidden_list?.tone || []).join('，')}"
                                placeholder="例如：直白煽情"
                            >
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">强制规则</h4>
                    <textarea 
                        id="mandatory-rules" 
                        class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                        rows="4"
                        placeholder="每行一条规则..."
                    >${(style.mandatory_rules || []).join('\n')}</textarea>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-white mb-3">核心锚点</h4>
                    <input 
                        type="text" 
                        id="core-anchors"
                        class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        value="${(style.core_anchors || []).join('，')}"
                        placeholder="例如：短句，肢体细节，衣着质感"
                    >
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                    <button class="btn btn-secondary" id="btn-cancel">取消</button>
                    <button class="btn btn-primary" id="btn-save">保存修改</button>
                </div>
            </div>
        `
    }
    
    static bindEvents() {
        if (!this.currentModal) return
        
        const cancelBtn = this.currentModal.querySelector('#btn-cancel')
        const saveBtn = this.currentModal.querySelector('#btn-save')
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.close(this.currentModal)
            })
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveChanges()
            })
        }
    }
    
    static saveChanges() {
        if (!this.currentCardId) return
        
        const getValue = (id) => {
            const el = this.currentModal.querySelector(`#${id}`)
            return el ? el.value.trim() : ''
        }
        
        const getList = (id, separator = '，') => {
            const value = getValue(id)
            return value ? value.split(separator).map(s => s.trim()).filter(s => s) : []
        }
        
        const getLines = (id) => {
            const value = getValue(id)
            return value ? value.split('\n').map(s => s.trim()).filter(s => s) : []
        }
        
        const styleData = {
            style_overview: getValue('style-overview'),
            dimensions: {
                wording: {
                    formal_casual_ratio: getValue('wording-ratio'),
                    high_frequency_words: getList('wording-freq-words'),
                    fixed_collocations: getList('wording-collocations'),
                    forbidden_words: getList('wording-forbidden'),
                    adjective_density: getValue('wording-density')
                },
                sentence_structure: {
                    length_ratio: getValue('sentence-ratio'),
                    common_patterns: getList('sentence-patterns', '；'),
                    conjunctions: getList('sentence-conjunctions'),
                    paragraph_length: getValue('sentence-paragraph')
                },
                punctuation: {
                    ellipsis_usage: getValue('punctuation-ellipsis'),
                    pause_logic: getValue('punctuation-pause'),
                    forbidden_combos: getList('punctuation-forbidden')
                },
                narrative: {
                    perspective: getValue('narrative-perspective'),
                    pacing: getValue('narrative-pacing')
                },
                description: {
                    character: {
                        body_language: getList('description-body')
                    },
                    environment: {
                        atmosphere_logic: getValue('description-atmosphere')
                    }
                },
                emotion: {
                    tone: getValue('emotion-tone'),
                    expression: getValue('emotion-expression'),
                    closure: getValue('emotion-closure')
                },
                signature: {
                    trademark_actions: getList('signature-actions'),
                    trademark_endings: getList('signature-endings', '；'),
                    common_particles: getList('signature-particles')
                }
            },
            forbidden_list: {
                words: getList('forbidden-words'),
                sentence_patterns: getList('forbidden-patterns'),
                rhetoric: getList('forbidden-rhetoric'),
                tone: getList('forbidden-tone')
            },
            mandatory_rules: getLines('mandatory-rules'),
            core_anchors: getList('core-anchors')
        }
        
        StyleCardManager.updateCard(this.currentCardId, { style: styleData })
        
        modal.alert('文风卡已保存', { title: '成功', type: 'success' })
        
        if (this.callbacks.onSave) {
            this.callbacks.onSave()
        }
    }
    
    static formatDate(timestamp) {
        if (!timestamp) return '未知'
        const date = new Date(timestamp)
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    
    static showPreview(cardId) {
        const preview = StyleCardApplier.getStyleCardPreview(cardId)
        if (!preview) {
            modal.alert('文风卡不存在', { title: '错误', type: 'error' })
            return
        }
        
        const content = `
            <div class="space-y-4">
                <div class="bg-slate-700 rounded-lg p-4">
                    <h4 class="text-white font-medium mb-2">文风概述</h4>
                    <p class="text-slate-300">${preview.overview}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-slate-700 rounded-lg p-3">
                        <span class="text-slate-400 text-sm">强制规则</span>
                        <p class="text-white text-lg">${preview.mandatoryRulesCount} 条</p>
                    </div>
                    <div class="bg-slate-700 rounded-lg p-3">
                        <span class="text-slate-400 text-sm">禁止事项</span>
                        <p class="text-white text-lg">${preview.forbiddenItemsCount} 项</p>
                    </div>
                </div>
            </div>
        `
        
        modal.show({
            title: preview.name,
            content,
            width: 'max-w-md'
        })
    }
    
    static showGeneratedPrompt(cardId) {
        const prompt = StyleCardApplier.buildStylePrompt(cardId)
        if (!prompt) {
            modal.alert('无法生成Prompt', { title: '错误', type: 'error' })
            return
        }
        
        const content = `
            <div class="space-y-4">
                <pre class="bg-slate-900 rounded-lg p-4 text-sm text-slate-300 overflow-auto max-h-96 whitespace-pre-wrap">${prompt}</pre>
                <button class="btn btn-primary w-full" id="btn-copy-prompt">复制到剪贴板</button>
            </div>
        `
        
        const promptModal = modal.show({
            title: '生成的文风Prompt',
            content,
            width: 'max-w-2xl'
        })
        
        const copyBtn = promptModal.querySelector('#btn-copy-prompt')
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(prompt)
                    copyBtn.textContent = '已复制！'
                    setTimeout(() => {
                        copyBtn.textContent = '复制到剪贴板'
                    }, 2000)
                } catch (err) {
                    modal.alert('复制失败，请手动复制', { title: '错误', type: 'error' })
                }
            })
        }
    }
}

export { StyleCardDetail }
