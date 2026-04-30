import { ConfigManager } from '../config.js'
import { RewriteWordCountBuilder } from '../wordcount/index.js'
import { StyleCardApplier } from '../style/style-card-applier.js'

class RewriteOutlineGenerator {
    constructor(options = {}) {
        this.chapter = options.chapter || null
        this.settings = options.settings || {}
        this.apiClient = options.apiClient || null
        
        this.onProgress = options.onProgress || null
        this.onComplete = options.onComplete || null
        this.onError = options.onError || null
        
        this.outline = null
    }
    
    setApiClient(client) {
        this.apiClient = client
    }
    
    setChapter(chapter) {
        this.chapter = chapter
    }
    
    setSettings(settings) {
        this.settings = { ...this.settings, ...settings }
    }
    
    async generate() {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        if (!this.chapter) {
            throw new Error('章节未设置')
        }
        
        this.notifyProgress({ stage: 'generating', message: '正在生成改写梗概...' })
        
        try {
            const wordCountInstruction = this.buildWordCountInstruction()
            const stylePrompt = this.buildStylePrompt()
            
            const systemPrompt = this.buildSystemPrompt()
            const userPrompt = this.buildUserPrompt(wordCountInstruction, stylePrompt)
            
            const messages = ConfigManager.buildMessagesWithGlobalPrompt(
                systemPrompt,
                userPrompt
            )
            
            const response = await this.apiClient.request(messages, {
                maxTokens: 4096,
                temperature: 0.7
            })
            
            const content = response.choices[0].message.content.trim()
            this.outline = this.parseOutline(content)
            
            this.notifyProgress({ stage: 'completed', message: '梗概生成完成' })
            this.notifyComplete(this.outline)
            
            return this.outline
            
        } catch (error) {
            this.notifyError(error)
            throw error
        }
    }
    
    buildSystemPrompt() {
        return `你是一位专业的小说改写助手。请根据原文章节内容和改写要求，生成改写梗概。

梗概应包含：
1. 主要情节概述（100字以内）
2. 关键场景描述（2-3个）
3. 角色表现要点
4. 情感基调

输出格式要求：
必须以JSON格式输出，格式如下：
{
    "summary": "主要情节概述",
    "key_scenes": ["场景1", "场景2", "场景3"],
    "character_points": ["角色要点1", "角色要点2"],
    "emotional_tone": "情感基调"
}`
    }
    
    buildUserPrompt(wordCountInstruction, stylePrompt) {
        let prompt = ''
        
        if (stylePrompt) {
            prompt += `${stylePrompt}\n\n`
        }
        
        if (wordCountInstruction) {
            prompt += `${wordCountInstruction}\n\n`
        }
        
        prompt += `原章节内容：\n${this.chapter.content}\n\n`
        
        if (this.settings.requirements) {
            prompt += `改写要求：\n${this.settings.requirements}\n\n`
        }
        
        if (this.settings.minimizeChange) {
            prompt += `注意：最小化改写幅度，尽量保持原文结构和节奏。\n\n`
        }
        
        prompt += `请生成改写梗概：`
        
        return prompt
    }
    
    buildWordCountInstruction() {
        if (!this.settings.wordCount) return ''
        
        return RewriteWordCountBuilder.buildPrompt(
            this.chapter,
            this.settings.wordCount
        )
    }
    
    buildStylePrompt() {
        if (!this.settings.styleCardId) return ''
        
        return StyleCardApplier.buildStylePrompt(this.settings.styleCardId)
    }
    
    parseOutline(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                
                return {
                    summary: parsed.summary || '',
                    key_scenes: parsed.key_scenes || [],
                    character_points: parsed.character_points || [],
                    emotional_tone: parsed.emotional_tone || '',
                    raw: response
                }
            }
        } catch (error) {
            console.error('解析梗概失败:', error)
        }
        
        return {
            summary: response.slice(0, 200),
            key_scenes: [],
            character_points: [],
            emotional_tone: '',
            raw: response,
            parseError: true
        }
    }
    
    notifyProgress(data) {
        if (this.onProgress) {
            this.onProgress(data)
        }
    }
    
    notifyComplete(outline) {
        if (this.onComplete) {
            this.onComplete(outline)
        }
    }
    
    notifyError(error) {
        if (this.onError) {
            this.onError(error)
        }
    }
    
    getOutline() {
        return this.outline
    }
}

class OutlineEditor {
    constructor(options = {}) {
        this.outline = options.outline || null
        this.container = options.container || null
        
        this.onSave = options.onSave || null
        this.onRegenerate = options.onRegenerate || null
        this.onCancel = options.onCancel || null
    }
    
    render() {
        if (!this.container) return
        
        this.container.innerHTML = `
            <div class="outline-editor">
                <div class="editor-header mb-4">
                    <h3 class="text-lg font-semibold text-white mb-2">改写梗概编辑</h3>
                    <div class="text-sm text-slate-400">
                        章节：${this.outline?.chapterTitle || '未知章节'} | 
                        原字数：${this.outline?.originalWordCount || 0} 字
                    </div>
                </div>
                
                <div class="editor-content space-y-4">
                    <div class="form-group">
                        <label class="text-slate-300 text-sm mb-2 block">主要情节概述：</label>
                        <textarea id="outline-summary" rows="3"
                            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none resize-none"
                            placeholder="请输入主要情节概述（100字以内）">${this.outline?.summary || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="text-slate-300 text-sm mb-2 block">关键场景：</label>
                        <div id="key-scenes-list" class="space-y-2">
                            ${this.renderKeyScenes()}
                        </div>
                        <button class="mt-2 text-sm text-blue-400 hover:text-blue-300" id="add-scene-btn">
                            + 添加场景
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label class="text-slate-300 text-sm mb-2 block">角色表现要点：</label>
                        <textarea id="outline-character" rows="2"
                            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none resize-none"
                            placeholder="请输入角色表现要点">${this.outline?.character_points?.join('\n') || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="text-slate-300 text-sm mb-2 block">情感基调：</label>
                        <input type="text" id="outline-tone"
                            value="${this.outline?.emotional_tone || ''}"
                            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                            placeholder="请输入情感基调">
                    </div>
                </div>
                
                <div class="editor-actions mt-6 flex justify-end space-x-3">
                    <button class="btn btn-secondary" id="btn-regenerate">重新生成梗概</button>
                    <button class="btn btn-secondary" id="btn-cancel">取消</button>
                    <button class="btn btn-primary" id="btn-confirm">确认并生成内容</button>
                </div>
            </div>
        `
        
        this.bindEvents()
    }
    
    renderKeyScenes() {
        const scenes = this.outline?.key_scenes || []
        
        if (scenes.length === 0) {
            return ''
        }
        
        return scenes.map((scene, index) => `
            <div class="scene-item flex items-center space-x-2" data-index="${index}">
                <span class="text-slate-400 text-sm">${index + 1}.</span>
                <input type="text" value="${scene}"
                    class="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm focus:border-blue-500 focus:outline-none scene-input">
                <button class="text-red-400 hover:text-red-300 text-sm delete-scene-btn" data-index="${index}">删除</button>
            </div>
        `).join('')
    }
    
    bindEvents() {
        const addSceneBtn = document.getElementById('add-scene-btn')
        if (addSceneBtn) {
            addSceneBtn.addEventListener('click', () => {
                this.addScene()
            })
        }
        
        const deleteBtns = this.container.querySelectorAll('.delete-scene-btn')
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index)
                this.deleteScene(index)
            })
        })
        
        const regenerateBtn = document.getElementById('btn-regenerate')
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                if (this.onRegenerate) this.onRegenerate()
            })
        }
        
        const cancelBtn = document.getElementById('btn-cancel')
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.onCancel) this.onCancel()
            })
        }
        
        const confirmBtn = document.getElementById('btn-confirm')
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const outline = this.getEditedOutline()
                if (this.onSave) this.onSave(outline)
            })
        }
    }
    
    addScene() {
        const listContainer = document.getElementById('key-scenes-list')
        if (!listContainer) return
        
        const index = listContainer.children.length
        
        const sceneHtml = `
            <div class="scene-item flex items-center space-x-2" data-index="${index}">
                <span class="text-slate-400 text-sm">${index + 1}.</span>
                <input type="text" value=""
                    class="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm focus:border-blue-500 focus:outline-none scene-input"
                    placeholder="输入场景描述">
                <button class="text-red-400 hover:text-red-300 text-sm delete-scene-btn" data-index="${index}">删除</button>
            </div>
        `
        
        listContainer.insertAdjacentHTML('beforeend', sceneHtml)
        
        const newBtn = listContainer.querySelector(`.delete-scene-btn[data-index="${index}"]`)
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                this.deleteScene(index)
            })
        }
    }
    
    deleteScene(index) {
        const listContainer = document.getElementById('key-scenes-list')
        if (!listContainer) return
        
        const item = listContainer.querySelector(`.scene-item[data-index="${index}"]`)
        if (item) {
            item.remove()
            this.reindexScenes()
        }
    }
    
    reindexScenes() {
        const listContainer = document.getElementById('key-scenes-list')
        if (!listContainer) return
        
        const items = listContainer.querySelectorAll('.scene-item')
        items.forEach((item, index) => {
            item.dataset.index = index
            const numberSpan = item.querySelector('span')
            if (numberSpan) {
                numberSpan.textContent = `${index + 1}.`
            }
            
            const deleteBtn = item.querySelector('.delete-scene-btn')
            if (deleteBtn) {
                deleteBtn.dataset.index = index
            }
        })
    }
    
    getEditedOutline() {
        const summary = document.getElementById('outline-summary')?.value || ''
        const characterText = document.getElementById('outline-character')?.value || ''
        const tone = document.getElementById('outline-tone')?.value || ''
        
        const sceneInputs = this.container.querySelectorAll('.scene-input')
        const keyScenes = []
        sceneInputs.forEach(input => {
            if (input.value.trim()) {
                keyScenes.push(input.value.trim())
            }
        })
        
        const characterPoints = characterText.split('\n').filter(p => p.trim())
        
        return {
            summary: summary,
            key_scenes: keyScenes,
            character_points: characterPoints,
            emotional_tone: tone
        }
    }
    
    setOutline(outline) {
        this.outline = outline
        this.render()
    }
}

class ChapterStatusManager {
    static getStatusIcon(status) {
        const icons = {
            pending: '⏸',
            outline_generating: '📝',
            outline_editing: '✏️',
            content_generating: '⏳',
            completed: '✅',
            failed: '❌'
        }
        return icons[status] || '⏸'
    }
    
    static getStatusText(status) {
        const texts = {
            pending: '待处理',
            outline_generating: '梗概生成中',
            outline_editing: '梗概编辑中',
            content_generating: '内容生成中',
            completed: '已完成',
            failed: '失败'
        }
        return texts[status] || '未知'
    }
    
    static getStatusClass(status) {
        return `status-${status.replace('_', '-')}`
    }
    
    static canRetry(status) {
        return status === 'failed'
    }
    
    static canEdit(status) {
        return status === 'outline_editing' || status === 'completed'
    }
    
    static isProcessing(status) {
        return ['outline_generating', 'content_generating'].includes(status)
    }
    
    static isCompleted(status) {
        return status === 'completed'
    }
    
    static isFailed(status) {
        return status === 'failed'
    }
}

export { 
    RewriteOutlineGenerator, 
    OutlineEditor, 
    ChapterStatusManager 
}
