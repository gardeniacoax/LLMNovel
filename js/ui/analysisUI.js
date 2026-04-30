import { UIHelper } from '../ui.js'
import { AnalysisStatus } from '../analysis/index.js'

export class AnalysisUI {
    constructor(container, options = {}) {
        this.container = container
        this.options = options
        this.selectedChapter = null
        this.analysisData = null
        this.contentArea = null
        this.onChapterSelect = options.onChapterSelect || null
        this.onAnalyze = options.onAnalyze || null
        this.onAnalyzeAll = options.onAnalyzeAll || null
        this.onPause = options.onPause || null
        this.onResume = options.onResume || null
        this.onCancel = options.onCancel || null
        this.onExport = options.onExport || null
        this.onExportRoleCard = options.onExportRoleCard || null
        this.onExportStyleCard = options.onExportStyleCard || null
    }
    
    render(analysisData) {
        this.analysisData = analysisData
        this.container.innerHTML = ''
        
        const wrapper = document.createElement('div')
        wrapper.className = 'analysis-ui-wrapper flex h-full'
        
        const leftPanel = this.renderChapterListPanel(analysisData)
        const middlePanel = this.renderContentPanel(analysisData)
        const rightPanel = this.renderOperationPanel(analysisData)
        
        wrapper.appendChild(leftPanel)
        wrapper.appendChild(middlePanel)
        wrapper.appendChild(rightPanel)
        
        this.container.appendChild(wrapper)
    }
    
    renderChapterListPanel(analysisData) {
        const panel = document.createElement('div')
        panel.className = 'chapter-list-panel w-64 bg-slate-800 border-r border-slate-700 flex flex-col'
        
        const header = document.createElement('div')
        header.className = 'p-4 border-b border-slate-700'
        header.innerHTML = `
            <h3 class="text-lg font-semibold">章节列表</h3>
            <p class="text-sm text-slate-400 mt-1">共 ${analysisData.totalChapters || 0} 章</p>
        `
        panel.appendChild(header)
        
        const searchBox = document.createElement('div')
        searchBox.className = 'p-2 border-b border-slate-700'
        searchBox.innerHTML = `
            <input type="text" 
                   class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                   placeholder="搜索章节..."
                   id="chapter-search">
        `
        panel.appendChild(searchBox)
        
        const listContainer = document.createElement('div')
        listContainer.className = 'chapter-list flex-1 overflow-y-auto'
        listContainer.id = 'chapter-list-container'
        
        if (analysisData.chapters && analysisData.chapters.length > 0) {
            analysisData.chapters.forEach((chapter, index) => {
                const item = this.createChapterItem(chapter, index)
                listContainer.appendChild(item)
            })
        } else {
            listContainer.innerHTML = `
                <div class="p-4 text-center text-slate-500">
                    <p>暂无章节</p>
                    <p class="text-sm mt-2">请导入小说文件</p>
                </div>
            `
        }
        
        panel.appendChild(listContainer)
        
        const searchInput = searchBox.querySelector('#chapter-search')
        searchInput.addEventListener('input', (e) => {
            this.filterChapters(e.target.value, listContainer)
        })
        
        return panel
    }
    
    createChapterItem(chapter, index) {
        const item = document.createElement('div')
        item.className = `chapter-item p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors ${this.selectedChapter === index ? 'bg-slate-700' : ''}`
        item.dataset.index = index
        
        const statusIcon = this.getStatusIcon(chapter.analysisStatus)
        const statusColor = this.getStatusColor(chapter.analysisStatus)
        
        item.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium">第${chapter.chapterNum || index + 1}章</span>
                <span class="${statusColor}">${statusIcon}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1 truncate">${chapter.title || '无标题'}</p>
            <p class="text-xs text-slate-500 mt-1">${chapter.wordCount || 0} 字</p>
        `
        
        item.addEventListener('click', () => {
            this.selectChapter(index, chapter)
        })
        
        return item
    }
    
    getStatusIcon(status) {
        const icons = {
            [AnalysisStatus.PENDING]: '○',
            [AnalysisStatus.ANALYZING]: '◐',
            [AnalysisStatus.COMPLETED]: '●',
            [AnalysisStatus.FAILED]: '✗',
            [AnalysisStatus.EDITED]: '✎'
        }
        return icons[status] || '○'
    }
    
    getStatusColor(status) {
        const colors = {
            [AnalysisStatus.PENDING]: 'text-slate-400',
            [AnalysisStatus.ANALYZING]: 'text-blue-400 animate-pulse',
            [AnalysisStatus.COMPLETED]: 'text-green-400',
            [AnalysisStatus.FAILED]: 'text-red-400',
            [AnalysisStatus.EDITED]: 'text-yellow-400'
        }
        return colors[status] || 'text-slate-400'
    }
    
    selectChapter(index, chapter) {
        this.selectedChapter = index
        
        const items = this.container.querySelectorAll('.chapter-item')
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('bg-slate-700')
            } else {
                item.classList.remove('bg-slate-700')
            }
        })
        
        this.updateContentPanel(chapter)
        
        if (this.onChapterSelect) {
            this.onChapterSelect(index, chapter)
        }
    }
    
    updateContentPanel(chapter) {
        if (!this.contentArea) return
        
        const titleEl = document.getElementById('content-title')
        const subtitleEl = document.getElementById('content-subtitle')
        
        if (titleEl) {
            titleEl.textContent = chapter.title || `第${chapter.chapterNum}章`
        }
        if (subtitleEl) {
            subtitleEl.textContent = `${chapter.wordCount || 0} 字`
        }
        
        this.contentArea.innerHTML = this.renderChapterContent(chapter)
    }
    
    filterChapters(keyword, container) {
        const items = container.querySelectorAll('.chapter-item')
        items.forEach(item => {
            const title = item.querySelector('.truncate').textContent
            const chapterNum = item.querySelector('.font-medium').textContent
            
            if (keyword === '' || title.includes(keyword) || chapterNum.includes(keyword)) {
                item.style.display = ''
            } else {
                item.style.display = 'none'
            }
        })
    }
    
    renderContentPanel(analysisData) {
        const panel = document.createElement('div')
        panel.className = 'content-panel flex-1 bg-slate-900 flex flex-col'
        
        const header = document.createElement('div')
        header.className = 'p-4 border-b border-slate-700 flex items-center justify-between'
        header.innerHTML = `
            <div>
                <h3 class="text-lg font-semibold" id="content-title">内容展示</h3>
                <p class="text-sm text-slate-400" id="content-subtitle">选择章节查看内容</p>
            </div>
            <div class="flex space-x-2" id="content-actions">
            </div>
        `
        panel.appendChild(header)
        
        const contentArea = document.createElement('div')
        contentArea.className = 'content-area flex-1 overflow-y-auto p-4'
        contentArea.id = 'content-display'
        this.contentArea = contentArea
        
        if (this.selectedChapter !== null && analysisData.chapters && analysisData.chapters[this.selectedChapter]) {
            const chapter = analysisData.chapters[this.selectedChapter]
            contentArea.innerHTML = this.renderChapterContent(chapter)
        } else {
            contentArea.innerHTML = `
                <div class="h-full flex items-center justify-center text-slate-500">
                    <div class="text-center">
                        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p>请选择章节查看内容</p>
                    </div>
                </div>
            `
        }
        
        panel.appendChild(contentArea)
        
        return panel
    }
    
    renderChapterContent(chapter) {
        let html = `
            <div class="chapter-content">
                <div class="mb-6">
                    <h4 class="text-xl font-bold mb-2">${chapter.title || '无标题'}</h4>
                    <div class="flex items-center space-x-4 text-sm text-slate-400">
                        <span>第${chapter.chapterNum}章</span>
                        <span>${chapter.wordCount || 0} 字</span>
                        ${chapter.analyzedAt ? `<span>分析于 ${new Date(chapter.analyzedAt).toLocaleString()}</span>` : ''}
                    </div>
                </div>
        `
        
        if (chapter.analysisResult) {
            html += this.renderAnalysisResult(chapter.analysisResult)
        }
        
        html += `
                <div class="mt-6">
                    <h5 class="text-lg font-semibold mb-3">原文内容</h5>
                    <div class="bg-slate-800 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                        ${chapter.content || '无内容'}
                    </div>
                </div>
            </div>
        `
        
        return html
    }
    
    renderAnalysisResult(result) {
        let html = `
            <div class="analysis-result bg-slate-800 rounded-lg p-4 mb-6">
                <h5 class="text-lg font-semibold mb-4">分析结果</h5>
        `
        
        if (result.style_overview) {
            html += `
                <div class="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
                    <h6 class="font-medium text-blue-400 mb-2">文风总览</h6>
                    <p class="text-sm text-slate-300">${result.style_overview}</p>
                </div>
            `
        }
        
        if (result.plot_overview) {
            html += `
                <div class="mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-700/50">
                    <h6 class="font-medium text-purple-400 mb-2">剧情总览</h6>
                    ${result.plot_overview.opening ? `<p class="text-sm text-slate-300 mb-2"><strong>开端：</strong>${typeof result.plot_overview.opening === 'object' ? result.plot_overview.opening.description : result.plot_overview.opening}</p>` : ''}
                    ${result.plot_overview.climax ? `<p class="text-sm text-slate-300 mb-2"><strong>高潮：</strong>${typeof result.plot_overview.climax === 'object' ? result.plot_overview.climax.description : result.plot_overview.climax}</p>` : ''}
                    ${result.plot_overview.current_progress ? `<p class="text-sm text-slate-300"><strong>当前进度：</strong>${typeof result.plot_overview.current_progress === 'object' ? result.plot_overview.current_progress.position : result.plot_overview.current_progress}</p>` : ''}
                </div>
            `
        }
        
        if (result.summary) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-blue-400 mb-2">章节概要</h6>
                    <p class="text-sm text-slate-300">${result.summary}</p>
                </div>
            `
        }
        
        if (result.key_events && result.key_events.length > 0) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-blue-400 mb-2">关键情节</h6>
                    <div class="space-y-2">
                        ${result.key_events.map(event => {
                            if (typeof event === 'object') {
                                return `
                                    <div class="bg-slate-700 rounded p-3">
                                        <p class="text-sm font-medium">${event.event}</p>
                                        ${event.body_language_detail ? `<p class="text-xs text-slate-400 mt-1">肢体动作：${event.body_language_detail}</p>` : ''}
                                        ${event.emotion_turning_point ? `<p class="text-xs text-slate-400">情绪转折：${event.emotion_turning_point}</p>` : ''}
                                    </div>
                                `
                            }
                            return `<p class="text-sm text-slate-300 bg-slate-700 rounded p-2">• ${event}</p>`
                        }).join('')}
                    </div>
                </div>
            `
        }
        
        if (result.chapter_function) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-blue-400 mb-2">章节作用</h6>
                    <div class="space-y-2">
                        ${typeof result.chapter_function === 'object' ? `
                            ${result.chapter_function.foreshadowing ? `<p class="text-sm text-slate-300"><strong>伏笔：</strong>${Array.isArray(result.chapter_function.foreshadowing) ? result.chapter_function.foreshadowing.join('、') : result.chapter_function.foreshadowing}</p>` : ''}
                            ${result.chapter_function.conflict_push ? `<p class="text-sm text-slate-300"><strong>冲突推动：</strong>${result.chapter_function.conflict_push}</p>` : ''}
                            ${result.chapter_function.character_shaping ? `<p class="text-sm text-slate-300"><strong>角色塑造：</strong>${result.chapter_function.character_shaping}</p>` : ''}
                            ${result.chapter_function.transition ? `<p class="text-sm text-slate-300"><strong>过渡功能：</strong>${result.chapter_function.transition}</p>` : ''}
                        ` : `
                            <div class="flex flex-wrap gap-2">
                                ${Array.isArray(result.chapter_function) ? result.chapter_function.map(func => `<span class="px-2 py-1 bg-slate-700 rounded text-xs">${func}</span>`).join('') : ''}
                            </div>
                        `}
                    </div>
                </div>
            `
        }
        
        if (result.character_performances && result.character_performances.length > 0) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-green-400 mb-2">角色表现</h6>
                    <div class="space-y-3">
                        ${result.character_performances.map(char => `
                            <div class="bg-slate-700 rounded p-3">
                                <p class="font-medium text-green-300">${char.name}</p>
                                ${char.speech ? `
                                    <div class="mt-2">
                                        ${typeof char.speech === 'object' ? `
                                            ${char.speech.content ? `<p class="text-xs text-slate-400">语言内容：${char.speech.content}</p>` : ''}
                                            ${char.speech.sentence_length ? `<p class="text-xs text-slate-400">句式长短：${char.speech.sentence_length}</p>` : ''}
                                            ${char.speech.tone ? `<p class="text-xs text-slate-400">语气起伏：${char.speech.tone}</p>` : ''}
                                            ${char.speech.speed ? `<p class="text-xs text-slate-400">语速：${char.speech.speed}</p>` : ''}
                                            ${char.speech.emotional_change ? `<p class="text-xs text-slate-400">情绪变化：${char.speech.emotional_change}</p>` : ''}
                                        ` : `<p class="text-xs text-slate-400 mt-1">语言：${char.speech}</p>`}
                                    </div>
                                ` : ''}
                                ${char.body_language ? `
                                    <div class="mt-2">
                                        ${typeof char.body_language === 'object' ? `
                                            ${char.body_language.daily_actions ? `<p class="text-xs text-slate-400">日常动作：${Array.isArray(char.body_language.daily_actions) ? char.body_language.daily_actions.join('、') : char.body_language.daily_actions}</p>` : ''}
                                            ${char.body_language.intense_reactions ? `
                                                <div class="mt-1 p-2 bg-slate-600 rounded">
                                                    <p class="text-xs text-yellow-400 font-medium">剧烈运动反应：</p>
                                                    ${char.body_language.intense_reactions.breathing ? `<p class="text-xs text-slate-400">喘息：${char.body_language.intense_reactions.breathing}</p>` : ''}
                                                    ${char.body_language.intense_reactions.muscle_tension ? `<p class="text-xs text-slate-400">肌肉紧绷：${char.body_language.intense_reactions.muscle_tension}</p>` : ''}
                                                    ${char.body_language.intense_reactions.sweat ? `<p class="text-xs text-slate-400">汗水：${char.body_language.intense_reactions.sweat}</p>` : ''}
                                                    ${char.body_language.intense_reactions.stiffness ? `<p class="text-xs text-slate-400">肢体僵硬：${char.body_language.intense_reactions.stiffness}</p>` : ''}
                                                </div>
                                            ` : ''}
                                        ` : `<p class="text-xs text-slate-400">动作：${Array.isArray(char.body_language) ? char.body_language.join('、') : char.body_language}</p>`}
                                    </div>
                                ` : ''}
                                ${char.clothing ? `
                                    <div class="mt-2">
                                        ${typeof char.clothing === 'object' ? `
                                            ${char.clothing.style ? `<p class="text-xs text-slate-400">衣着风格：${char.clothing.style}</p>` : ''}
                                            ${char.clothing.fabric ? `<p class="text-xs text-slate-400">面料质感：${char.clothing.fabric}</p>` : ''}
                                            ${char.clothing.color ? `<p class="text-xs text-slate-400">颜色：${char.clothing.color}</p>` : ''}
                                            ${char.clothing.changes ? `<p class="text-xs text-slate-400">衣着变化：${char.clothing.changes}</p>` : ''}
                                        ` : `<p class="text-xs text-slate-400">衣着：${char.clothing}</p>`}
                                    </div>
                                ` : ''}
                                ${char.clothing_change ? `<p class="text-xs text-slate-400">衣着变化：${char.clothing_change}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `
        }
        
        if (result.core_characters && result.core_characters.length > 0) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-yellow-400 mb-2">核心角色</h6>
                    <div class="space-y-3">
                        ${result.core_characters.map(char => `
                            <div class="bg-slate-700 rounded p-3">
                                <div class="flex items-center justify-between mb-2">
                                    <p class="font-medium text-yellow-300">${char.name}</p>
                                    <span class="text-xs px-2 py-1 bg-slate-600 rounded">${char.role_type || '角色'}</span>
                                </div>
                                ${char.basic_traits ? `
                                    <div class="space-y-1">
                                        ${char.basic_traits.personality ? `<p class="text-xs text-slate-400">性格：${char.basic_traits.personality}</p>` : ''}
                                        ${char.basic_traits.appearance ? `
                                            <div class="p-2 bg-slate-600 rounded mt-2">
                                                <p class="text-xs text-blue-400 font-medium">外貌特征</p>
                                                ${typeof char.basic_traits.appearance === 'object' ? `
                                                    ${char.basic_traits.appearance.facial_features ? `<p class="text-xs text-slate-400">面部：${char.basic_traits.appearance.facial_features}</p>` : ''}
                                                    ${char.basic_traits.appearance.distinctive_marks ? `<p class="text-xs text-slate-400">标志性特征：${char.basic_traits.appearance.distinctive_marks}</p>` : ''}
                                                    ${char.basic_traits.appearance.expression_linkage ? `<p class="text-xs text-slate-400">神态联动：${char.basic_traits.appearance.expression_linkage}</p>` : ''}
                                                ` : `<p class="text-xs text-slate-400">${char.basic_traits.appearance}</p>`}
                                            </div>
                                        ` : ''}
                                        ${char.basic_traits.clothing_style ? `
                                            <div class="p-2 bg-slate-600 rounded mt-2">
                                                <p class="text-xs text-green-400 font-medium">衣着风格</p>
                                                ${typeof char.basic_traits.clothing_style === 'object' ? `
                                                    ${char.basic_traits.clothing_style.style ? `<p class="text-xs text-slate-400">风格：${char.basic_traits.clothing_style.style}</p>` : ''}
                                                    ${char.basic_traits.clothing_style.fabric ? `<p class="text-xs text-slate-400">面料：${char.basic_traits.clothing_style.fabric}</p>` : ''}
                                                    ${char.basic_traits.clothing_style.color_preference ? `<p class="text-xs text-slate-400">颜色偏好：${Array.isArray(char.basic_traits.clothing_style.color_preference) ? char.basic_traits.clothing_style.color_preference.join('、') : char.basic_traits.clothing_style.color_preference}</p>` : ''}
                                                ` : `<p class="text-xs text-slate-400">${char.basic_traits.clothing_style}</p>`}
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `
        }
        
        if (result.dimensions && result.dimensions.description && result.dimensions.description.character) {
            const desc = result.dimensions.description.character
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-pink-400 mb-2">描写体系</h6>
                    <div class="space-y-2">
                        ${desc.speech ? `
                            <div class="bg-slate-700 rounded p-3">
                                <p class="text-xs text-pink-400 font-medium mb-1">语言描写</p>
                                ${desc.speech.sentence_length ? `<p class="text-xs text-slate-400">句式长短：${desc.speech.sentence_length}</p>` : ''}
                                ${desc.speech.tone_fluctuation ? `<p class="text-xs text-slate-400">语气起伏：${desc.speech.tone_fluctuation}</p>` : ''}
                                ${desc.speech.speech_speed ? `<p class="text-xs text-slate-400">语速：${desc.speech.speech_speed}</p>` : ''}
                                ${desc.speech.dialect_catchphrase ? `<p class="text-xs text-slate-400">口头禅：${Array.isArray(desc.speech.dialect_catchphrase) ? desc.speech.dialect_catchphrase.join('、') : desc.speech.dialect_catchphrase}</p>` : ''}
                            </div>
                        ` : ''}
                        ${desc.body_language ? `
                            <div class="bg-slate-700 rounded p-3">
                                <p class="text-xs text-pink-400 font-medium mb-1">肢体动作</p>
                                ${desc.body_language.daily_actions ? `<p class="text-xs text-slate-400">日常动作：${Array.isArray(desc.body_language.daily_actions) ? desc.body_language.daily_actions.join('、') : desc.body_language.daily_actions}</p>` : ''}
                                ${desc.body_language.intense_reactions ? `
                                    <div class="mt-2 p-2 bg-slate-600 rounded">
                                        <p class="text-xs text-yellow-400 font-medium">剧烈运动反应</p>
                                        ${desc.body_language.intense_reactions.breathing ? `<p class="text-xs text-slate-400">喘息：${desc.body_language.intense_reactions.breathing}</p>` : ''}
                                        ${desc.body_language.intense_reactions.muscle_tension ? `<p class="text-xs text-slate-400">肌肉紧绷：${desc.body_language.intense_reactions.muscle_tension}</p>` : ''}
                                        ${desc.body_language.intense_reactions.sweat ? `<p class="text-xs text-slate-400">汗水：${desc.body_language.intense_reactions.sweat}</p>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        ${desc.clothing ? `
                            <div class="bg-slate-700 rounded p-3">
                                <p class="text-xs text-pink-400 font-medium mb-1">衣着描写</p>
                                ${desc.clothing.style ? `<p class="text-xs text-slate-400">风格：${desc.clothing.style}</p>` : ''}
                                ${desc.clothing.fabric_preference ? `<p class="text-xs text-slate-400">面料偏好：${desc.clothing.fabric_preference}</p>` : ''}
                                ${desc.clothing.color_preference ? `<p class="text-xs text-slate-400">颜色偏好：${Array.isArray(desc.clothing.color_preference) ? desc.clothing.color_preference.join('、') : desc.clothing.color_preference}</p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `
        }
        
        if (result.forbidden_list) {
            html += `
                <div class="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-700/50">
                    <h6 class="font-medium text-red-400 mb-2">禁止清单</h6>
                    ${result.forbidden_list.words ? `<p class="text-xs text-slate-400">禁用词汇：${Array.isArray(result.forbidden_list.words) ? result.forbidden_list.words.join('、') : result.forbidden_list.words}</p>` : ''}
                    ${result.forbidden_list.sentence_patterns ? `<p class="text-xs text-slate-400">禁用句式：${Array.isArray(result.forbidden_list.sentence_patterns) ? result.forbidden_list.sentence_patterns.join('、') : result.forbidden_list.sentence_patterns}</p>` : ''}
                    ${result.forbidden_list.rhetoric ? `<p class="text-xs text-slate-400">禁用修辞：${Array.isArray(result.forbidden_list.rhetoric) ? result.forbidden_list.rhetoric.join('、') : result.forbidden_list.rhetoric}</p>` : ''}
                </div>
            `
        }
        
        if (result.mandatory_rules && result.mandatory_rules.length > 0) {
            html += `
                <div class="mb-4 p-3 bg-green-900/30 rounded-lg border border-green-700/50">
                    <h6 class="font-medium text-green-400 mb-2">强制规则</h6>
                    <ul class="text-sm text-slate-300 space-y-1">
                        ${result.mandatory_rules.map(rule => `<li>✓ ${rule}</li>`).join('')}
                    </ul>
                </div>
            `
        }
        
        if (result.core_anchors && result.core_anchors.length > 0) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-cyan-400 mb-2">核心锚点</h6>
                    <div class="flex flex-wrap gap-2">
                        ${result.core_anchors.map(anchor => `<span class="px-3 py-1 bg-cyan-600/30 text-cyan-300 rounded-full text-sm">${anchor}</span>`).join('')}
                    </div>
                </div>
            `
        }
        
        if (result.sample_writing) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-orange-400 mb-2">仿写示范</h6>
                    <div class="bg-slate-700 rounded p-3 text-sm text-slate-300 italic border-l-4 border-orange-500">
                        ${result.sample_writing}
                    </div>
                </div>
            `
        }
        
        if (result.foreshadowing && result.foreshadowing.length > 0) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-purple-400 mb-2">伏笔铺垫</h6>
                    <div class="space-y-2">
                        ${result.foreshadowing.map(f => {
                            if (typeof f === 'object') {
                                return `
                                    <div class="bg-slate-700 rounded p-3">
                                        <p class="text-sm">${f.hint}</p>
                                        ${f.first_appearance_chapter ? `<p class="text-xs text-slate-400 mt-1">首次出现：第${f.first_appearance_chapter}章</p>` : ''}
                                        ${f.expected_reveal ? `<p class="text-xs text-slate-400">预期揭示：${f.expected_reveal}</p>` : ''}
                                    </div>
                                `
                            }
                            return `<p class="text-sm text-slate-300 bg-slate-700 rounded p-2">• ${f}</p>`
                        }).join('')}
                    </div>
                </div>
            `
        }
        
        if (result.core_conflicts) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-red-400 mb-2">核心冲突</h6>
                    <div class="space-y-2">
                        ${result.core_conflicts.internal && result.core_conflicts.internal.length > 0 ? `
                            <div class="bg-slate-700 rounded p-3">
                                <p class="text-xs text-red-400 font-medium mb-1">内在冲突</p>
                                ${Array.isArray(result.core_conflicts.internal) ? result.core_conflicts.internal.map(c => {
                                    if (typeof c === 'object') {
                                        return `
                                            <div class="mt-2">
                                                <p class="text-sm text-slate-300">${c.conflict}</p>
                                                ${c.external_manifestation ? `
                                                    <p class="text-xs text-slate-400 mt-1">外在表现：${c.external_manifestation.body_language || ''} ${c.external_manifestation.clothing_change || ''}</p>
                                                ` : ''}
                                            </div>
                                        `
                                    }
                                    return `<p class="text-sm text-slate-300">• ${c}</p>`
                                }).join('') : ''}
                            </div>
                        ` : ''}
                        ${result.core_conflicts.external && result.core_conflicts.external.length > 0 ? `
                            <div class="bg-slate-700 rounded p-3">
                                <p class="text-xs text-orange-400 font-medium mb-1">外在冲突</p>
                                ${Array.isArray(result.core_conflicts.external) ? result.core_conflicts.external.map(c => {
                                    if (typeof c === 'object') {
                                        return `
                                            <div class="mt-2">
                                                <p class="text-sm text-slate-300"><strong>${c.type || '冲突'}：</strong>${c.cause || ''}</p>
                                                ${c.parties ? `<p class="text-xs text-slate-400">冲突方：${Array.isArray(c.parties) ? c.parties.join(' vs ') : c.parties}</p>` : ''}
                                            </div>
                                        `
                                    }
                                    return `<p class="text-sm text-slate-300">• ${c}</p>`
                                }).join('') : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `
        }
        
        if (result.tone_and_theme) {
            html += `
                <div class="mb-4">
                    <h6 class="font-medium text-indigo-400 mb-2">基调与主题</h6>
                    <div class="bg-slate-700 rounded p-3">
                        ${result.tone_and_theme.tone ? `<p class="text-sm text-slate-300"><strong>基调：</strong>${Array.isArray(result.tone_and_theme.tone) ? result.tone_and_theme.tone.join('、') : result.tone_and_theme.tone}</p>` : ''}
                        ${result.tone_and_theme.core_themes ? `<p class="text-sm text-slate-300 mt-1"><strong>主题：</strong>${Array.isArray(result.tone_and_theme.core_themes) ? result.tone_and_theme.core_themes.join('、') : result.tone_and_theme.core_themes}</p>` : ''}
                        ${result.tone_and_theme.evidence ? `<p class="text-xs text-slate-400 mt-2">佐证：${typeof result.tone_and_theme.evidence === 'object' ? result.tone_and_theme.evidence.detail : result.tone_and_theme.evidence}</p>` : ''}
                    </div>
                </div>
            `
        }
        
        if (result.continuation_constraints && result.continuation_constraints.length > 0) {
            html += `
                <div class="mb-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
                    <h6 class="font-medium text-yellow-400 mb-2">续写约束</h6>
                    <ul class="text-sm text-slate-300 space-y-1">
                        ${result.continuation_constraints.map(c => `<li>⚠ ${c}</li>`).join('')}
                    </ul>
                </div>
            `
        }
        
        html += `</div>`
        
        return html
    }
    
    renderOperationPanel(analysisData) {
        const panel = document.createElement('div')
        panel.className = 'operation-panel w-80 bg-slate-800 border-l border-slate-700 flex flex-col'
        
        const header = document.createElement('div')
        header.className = 'p-4 border-b border-slate-700'
        header.innerHTML = `
            <h3 class="text-lg font-semibold">操作面板</h3>
        `
        panel.appendChild(header)
        
        const progressSection = this.renderProgressSection(analysisData)
        panel.appendChild(progressSection)
        
        const actionsSection = this.renderActionsSection(analysisData)
        panel.appendChild(actionsSection)
        
        const statsSection = this.renderStatsSection(analysisData)
        panel.appendChild(statsSection)
        
        return panel
    }
    
    renderProgressSection(analysisData) {
        const section = document.createElement('div')
        section.className = 'p-4 border-b border-slate-700'
        
        const completed = analysisData.chapters ? analysisData.chapters.filter(c => c.analysisStatus === AnalysisStatus.COMPLETED).length : 0
        const total = analysisData.totalChapters || 0
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0
        
        section.innerHTML = `
            <h4 class="font-medium mb-3">分析进度</h4>
            <div class="mb-2">
                <div class="flex justify-between text-sm mb-1">
                    <span>已完成</span>
                    <span id="progress-count">${completed}/${total}</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                    <div id="analysis-progress-bar" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${percent}%"></div>
                </div>
            </div>
            <p id="progress-percent-text" class="text-sm text-slate-400">${percent}% 完成</p>
        `
        
        return section
    }
    
    renderActionsSection(analysisData) {
        const section = document.createElement('div')
        section.className = 'p-4 border-b border-slate-700'
        
        const isAnalyzing = analysisData.isAnalyzing || false
        
        section.innerHTML = `
            <h4 class="font-medium mb-3">操作</h4>
            <div class="space-y-2">
                <button class="w-full btn btn-primary analyze-btn ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}" 
                        ${isAnalyzing ? 'disabled' : ''}>
                    分析当前章节
                </button>
                <button class="w-full btn btn-secondary analyze-all-btn ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${isAnalyzing ? 'disabled' : ''}>
                    分析全部章节
                </button>
                <div class="flex space-x-2">
                    <button class="flex-1 btn btn-secondary pause-btn ${!isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${!isAnalyzing ? 'disabled' : ''}>
                        暂停
                    </button>
                    <button class="flex-1 btn btn-secondary cancel-btn ${!isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${!isAnalyzing ? 'disabled' : ''}>
                        取消
                    </button>
                </div>
                <div class="border-t border-slate-600 pt-2 mt-2">
                    <h5 class="text-sm font-medium mb-2 text-slate-300">导出选项</h5>
                    <button class="w-full btn btn-secondary export-btn text-sm">
                        导出分析结果
                    </button>
                    <div class="flex space-x-2 mt-2">
                        <button class="flex-1 btn btn-secondary export-role-card-btn text-xs bg-purple-600 hover:bg-purple-700">
                            生成角色卡
                        </button>
                        <button class="flex-1 btn btn-secondary export-style-card-btn text-xs bg-green-600 hover:bg-green-700">
                            生成文风卡
                        </button>
                    </div>
                </div>
            </div>
        `
        
        section.querySelector('.analyze-btn').addEventListener('click', () => {
            if (this.selectedChapter === null) {
                UIHelper.showToast('请先选择章节', 'warning')
                return
            }
            if (this.onAnalyze) {
                this.onAnalyze(this.selectedChapter)
            }
        })
        
        section.querySelector('.analyze-all-btn').addEventListener('click', () => {
            if (this.onAnalyzeAll) {
                this.onAnalyzeAll()
            }
        })
        
        section.querySelector('.pause-btn').addEventListener('click', () => {
            if (this.onPause) {
                this.onPause()
            }
        })
        
        section.querySelector('.cancel-btn').addEventListener('click', () => {
            if (this.onCancel) {
                this.onCancel()
            }
        })
        
        section.querySelector('.export-btn').addEventListener('click', () => {
            if (this.onExport) {
                this.onExport()
            }
        })
        
        section.querySelector('.export-role-card-btn').addEventListener('click', () => {
            if (this.onExportRoleCard) {
                this.onExportRoleCard()
            }
        })
        
        section.querySelector('.export-style-card-btn').addEventListener('click', () => {
            if (this.onExportStyleCard) {
                this.onExportStyleCard()
            }
        })
        
        return section
    }
    
    renderStatsSection(analysisData) {
        const section = document.createElement('div')
        section.className = 'p-4 flex-1'
        
        const completed = analysisData.chapters ? analysisData.chapters.filter(c => c.analysisStatus === AnalysisStatus.COMPLETED).length : 0
        const failed = analysisData.chapters ? analysisData.chapters.filter(c => c.analysisStatus === AnalysisStatus.FAILED).length : 0
        const pending = analysisData.chapters ? analysisData.chapters.filter(c => c.analysisStatus === AnalysisStatus.PENDING).length : 0
        
        section.innerHTML = `
            <h4 class="font-medium mb-3">统计信息</h4>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-slate-400">小说名称</span>
                    <span>${analysisData.novelTitle || '未知'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">总章节数</span>
                    <span>${analysisData.totalChapters || 0}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">总字数</span>
                    <span>${analysisData.totalWords || 0}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">已完成</span>
                    <span class="text-green-400">${completed}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">失败</span>
                    <span class="text-red-400">${failed}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">待分析</span>
                    <span class="text-slate-400">${pending}</span>
                </div>
            </div>
        `
        
        return section
    }
    
    updateProgress(analysisData) {
        const completed = analysisData.chapters ? analysisData.chapters.filter(c => c.analysisStatus === AnalysisStatus.COMPLETED).length : 0
        const total = analysisData.totalChapters || 0
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0
        
        const progressBar = document.getElementById('analysis-progress-bar')
        if (progressBar) {
            progressBar.style.width = `${percent}%`
        }
        
        const progressCount = document.getElementById('progress-count')
        if (progressCount) {
            progressCount.textContent = `${completed}/${total}`
        }
        
        const progressPercentText = document.getElementById('progress-percent-text')
        if (progressPercentText) {
            progressPercentText.textContent = `${percent}% 完成`
        }
    }
    
    updateChapterStatus(index, status) {
        const item = this.container.querySelector(`.chapter-item[data-index="${index}"]`)
        if (item) {
            const statusSpan = item.querySelector('.flex span:last-child')
            if (statusSpan) {
                statusSpan.className = this.getStatusColor(status)
                statusSpan.textContent = this.getStatusIcon(status)
            }
        }
        
        if (this.analysisData && this.analysisData.chapters && this.analysisData.chapters[index]) {
            this.analysisData.chapters[index].analysisStatus = status
        }
    }
    
    showAnalyzing(index) {
        this.updateChapterStatus(index, AnalysisStatus.ANALYZING)
        
        const analyzeBtn = this.container.querySelector('.analyze-btn')
        if (analyzeBtn) {
            analyzeBtn.disabled = true
            analyzeBtn.innerHTML = `
                <span class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    分析中...
                </span>
            `
        }
        
        UIHelper.showToast(`正在分析第${index + 1}章...`, 'info')
    }
    
    showAnalyzingAll() {
        const overlay = document.createElement('div')
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        overlay.id = 'analysis-progress-overlay'
        overlay.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 w-96">
                <h3 class="text-lg font-semibold mb-4">批量分析进行中</h3>
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-2">
                        <span id="batch-progress-text">准备中...</span>
                        <span id="batch-progress-percent">0%</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-3">
                        <div id="batch-progress-bar" class="bg-blue-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
                <div id="batch-current-chapter" class="text-sm text-slate-400 mb-4">
                    正在准备...
                </div>
                <div class="flex justify-end space-x-2">
                    <button id="batch-pause-btn" class="btn btn-secondary px-4 py-2">暂停</button>
                    <button id="batch-cancel-btn" class="btn btn-secondary px-4 py-2">取消</button>
                </div>
            </div>
        `
        document.body.appendChild(overlay)
        
        const pauseBtn = document.getElementById('batch-pause-btn')
        const cancelBtn = document.getElementById('batch-cancel-btn')
        
        if (pauseBtn) {
            pauseBtn.onclick = () => {
                if (pauseBtn.textContent === '暂停') {
                    if (this.onPause) this.onPause()
                } else {
                    if (this.onResume) this.onResume()
                }
            }
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                if (this.onCancel) this.onCancel()
            }
        }
    }
    
    updateAnalyzingProgress(progress) {
        const progressBar = document.getElementById('batch-progress-bar')
        const progressPercent = document.getElementById('batch-progress-percent')
        const progressText = document.getElementById('batch-progress-text')
        const currentChapter = document.getElementById('batch-current-chapter')
        
        if (progressBar) {
            progressBar.style.width = `${progress.percent}%`
        }
        if (progressPercent) {
            progressPercent.textContent = `${progress.percent}%`
        }
        if (progressText) {
            progressText.textContent = `正在分析 ${progress.current}/${progress.total}`
        }
        if (currentChapter && progress.chapter) {
            currentChapter.textContent = `当前：第${progress.chapter.chapterNum}章 ${progress.chapter.title || ''}`
        }
    }
    
    hideAnalyzingAll() {
        const overlay = document.getElementById('analysis-progress-overlay')
        if (overlay) {
            overlay.remove()
        }
        
        const analyzeBtn = this.container.querySelector('.analyze-btn')
        if (analyzeBtn) {
            analyzeBtn.disabled = false
            analyzeBtn.textContent = '分析当前章节'
        }
    }
    
    updatePauseState(isPaused) {
        const pauseBtn = document.getElementById('batch-pause-btn')
        if (pauseBtn) {
            pauseBtn.textContent = isPaused ? '继续' : '暂停'
        }
    }
    
    showLoading(message = '加载中...') {
        const overlay = document.createElement('div')
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        overlay.id = 'analysis-loading-overlay'
        overlay.innerHTML = `
            <div class="bg-slate-800 rounded-lg p-6 flex items-center space-x-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span>${message}</span>
            </div>
        `
        document.body.appendChild(overlay)
    }
    
    hideLoading() {
        const overlay = document.getElementById('analysis-loading-overlay')
        if (overlay) {
            overlay.remove()
        }
    }
}

export class AnalysisImportUI {
    constructor(container, options = {}) {
        this.container = container
        this.options = options
        this.onImport = options.onImport || null
    }
    
    render() {
        this.container.innerHTML = ''
        
        const wrapper = document.createElement('div')
        wrapper.className = 'analysis-import-ui p-6'
        
        const dropZone = UIHelper.createDropZone({
            accept: '.txt',
            hint: '拖拽小说文件到此处或点击上传',
            onDrop: async (file) => {
                if (this.onImport) {
                    await this.onImport(file)
                }
            },
            onError: (error) => {
                UIHelper.showToast(`导入失败: ${error.message}`, 'error')
            }
        })
        
        wrapper.appendChild(dropZone)
        
        const tips = document.createElement('div')
        tips.className = 'mt-6 text-sm text-slate-400'
        tips.innerHTML = `
            <h4 class="font-medium mb-2">导入说明</h4>
            <ul class="space-y-1 list-disc list-inside">
                <li>支持 .txt 格式的小说文件</li>
                <li>系统会自动识别章节划分</li>
                <li>支持多种章节格式识别</li>
            </ul>
        `
        wrapper.appendChild(tips)
        
        this.container.appendChild(wrapper)
    }
}

export class AnalysisTypeSelector {
    constructor(container, options = {}) {
        this.container = container
        this.options = options
        this.selectedType = 'plot'
        this.onTypeChange = options.onTypeChange || null
    }
    
    render() {
        this.container.innerHTML = ''
        
        const wrapper = document.createElement('div')
        wrapper.className = 'analysis-type-selector'
        
        const types = [
            { value: 'plot', label: '剧情分析', icon: '📖', desc: '分析章节剧情走向和关键情节' },
            { value: 'character', label: '角色分析', icon: '👤', desc: '分析角色表现和性格特征' },
            { value: 'style', label: '文风分析', icon: '✍', desc: '分析写作风格和语言特点' }
        ]
        
        types.forEach(type => {
            const item = document.createElement('div')
            item.className = `type-item p-4 rounded-lg cursor-pointer transition-colors ${this.selectedType === type.value ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`
            item.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="text-2xl">${type.icon}</span>
                    <div>
                        <p class="font-medium">${type.label}</p>
                        <p class="text-xs text-slate-400">${type.desc}</p>
                    </div>
                </div>
            `
            
            item.addEventListener('click', () => {
                this.selectedType = type.value
                
                wrapper.querySelectorAll('.type-item').forEach(el => {
                    el.classList.remove('bg-blue-600')
                    el.classList.add('bg-slate-700', 'hover:bg-slate-600')
                })
                
                item.classList.remove('bg-slate-700', 'hover:bg-slate-600')
                item.classList.add('bg-blue-600')
                
                if (this.onTypeChange) {
                    this.onTypeChange(type.value)
                }
            })
            
            wrapper.appendChild(item)
        })
        
        this.container.appendChild(wrapper)
    }
    
    getSelectedType() {
        return this.selectedType
    }
}
