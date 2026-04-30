class AnalysisProgressUI {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId)
        this.chapters = options.chapters || []
        this.currentChapter = null
        this.stats = {
            total: 0,
            completed: 0,
            pending: 0,
            error: 0,
            percentage: 0
        }
        this.isPaused = false
        this.isRunning = false
        
        this.onPause = options.onPause || null
        this.onResume = options.onResume || null
        this.onStop = options.onStop || null
        this.onViewResult = options.onViewResult || null
    }
    
    render() {
        if (!this.container) return
        
        this.container.innerHTML = `
            <div class="analysis-progress">
                <div class="progress-header mb-4">
                    <h3 class="text-lg font-semibold text-white mb-2">分析进度</h3>
                    <div class="flex items-center space-x-4">
                        <div class="flex-1">
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-slate-400">总体进度</span>
                                <span class="text-white">${this.stats.percentage}%</span>
                            </div>
                            <div class="progress-bar h-3 bg-slate-600 rounded-full overflow-hidden">
                                <div id="progress-fill" class="h-full bg-blue-500 transition-all duration-300" 
                                    style="width: ${this.stats.percentage}%"></div>
                            </div>
                        </div>
                        <div class="text-sm text-slate-400">
                            <span id="progress-count">${this.stats.completed}/${this.stats.total}</span> 章
                        </div>
                    </div>
                </div>
                
                <div class="current-chapter mb-4 p-3 bg-slate-700 rounded-lg" id="current-chapter-info">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="text-slate-400 text-sm">当前章节：</span>
                            <span id="current-chapter-title" class="text-white">${this.currentChapter ? this.currentChapter.title : '等待开始'}</span>
                        </div>
                        <span id="current-status" class="text-sm px-2 py-1 rounded ${this.getStatusClass('idle')}">
                            ${this.getStatusText('idle')}
                        </span>
                    </div>
                </div>
                
                <div class="chapter-list mb-4">
                    <div class="table-header grid grid-cols-4 gap-2 p-2 bg-slate-600 rounded-t-lg text-sm">
                        <span class="text-slate-300">章节</span>
                        <span class="text-slate-300 col-span-2">标题</span>
                        <span class="text-slate-300">状态</span>
                    </div>
                    <div class="table-body max-h-48 overflow-y-auto" id="chapter-list-body">
                        ${this.renderChapterList()}
                    </div>
                </div>
                
                <div class="progress-actions flex justify-center space-x-3">
                    <button class="btn btn-secondary" id="btn-pause" ${!this.isRunning ? 'disabled' : ''}>
                        ${this.isPaused ? '继续' : '暂停'}
                    </button>
                    <button class="btn btn-danger" id="btn-stop" ${!this.isRunning ? 'disabled' : ''}>
                        停止
                    </button>
                </div>
            </div>
        `
        
        this.bindEvents()
    }
    
    renderChapterList() {
        if (this.chapters.length === 0) {
            return '<div class="p-4 text-center text-slate-400">暂无章节数据</div>'
        }
        
        return this.chapters.map(ch => `
            <div class="table-row grid grid-cols-4 gap-2 p-2 hover:bg-slate-600 transition-colors cursor-pointer" 
                data-chapter-num="${ch.chapterNum}">
                <span class="text-white text-sm">第${ch.chapterNum}章</span>
                <span class="text-slate-300 text-sm col-span-2 truncate" title="${ch.title}">${ch.title}</span>
                <span class="text-sm ${this.getStatusTextColor(ch.analysisStatus)}">
                    ${this.getStatusIcon(ch.analysisStatus)} ${this.getStatusText(ch.analysisStatus)}
                </span>
            </div>
        `).join('')
    }
    
    bindEvents() {
        const pauseBtn = document.getElementById('btn-pause')
        const stopBtn = document.getElementById('btn-stop')
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.isPaused) {
                    if (this.onResume) this.onResume()
                } else {
                    if (this.onPause) this.onPause()
                }
            })
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                if (this.onStop) this.onStop()
            })
        }
        
        const rows = this.container.querySelectorAll('.table-row[data-chapter-num]')
        rows.forEach(row => {
            row.addEventListener('click', () => {
                const chapterNum = parseInt(row.dataset.chapterNum)
                const chapter = this.chapters.find(ch => ch.chapterNum === chapterNum)
                if (chapter && chapter.analysisResult && this.onViewResult) {
                    this.onViewResult(chapter)
                }
            })
        })
    }
    
    updateProgress(stats) {
        this.stats = { ...this.stats, ...stats }
        
        const progressFill = document.getElementById('progress-fill')
        const progressCount = document.getElementById('progress-count')
        
        if (progressFill) {
            progressFill.style.width = `${this.stats.percentage}%`
        }
        
        if (progressCount) {
            progressCount.textContent = `${this.stats.completed}/${this.stats.total}`
        }
        
        this.updateChapterList()
    }
    
    updateCurrentChapter(chapter, status) {
        this.currentChapter = chapter
        
        const titleEl = document.getElementById('current-chapter-title')
        const statusEl = document.getElementById('current-status')
        
        if (titleEl) {
            titleEl.textContent = chapter ? chapter.title : '等待开始'
        }
        
        if (statusEl) {
            statusEl.className = `text-sm px-2 py-1 rounded ${this.getStatusClass(status)}`
            statusEl.textContent = this.getStatusText(status)
        }
    }
    
    updateChapterList() {
        const listBody = document.getElementById('chapter-list-body')
        if (listBody) {
            listBody.innerHTML = this.renderChapterList()
        }
    }
    
    setStatus(status) {
        this.isRunning = status === 'running'
        this.isPaused = status === 'paused'
        
        const pauseBtn = document.getElementById('btn-pause')
        const stopBtn = document.getElementById('btn-stop')
        
        if (pauseBtn) {
            pauseBtn.disabled = !this.isRunning
            pauseBtn.textContent = this.isPaused ? '继续' : '暂停'
        }
        
        if (stopBtn) {
            stopBtn.disabled = !this.isRunning
        }
    }
    
    getStatusClass(status) {
        const classes = {
            'idle': 'bg-slate-500 text-slate-200',
            'pending': 'bg-slate-500 text-slate-200',
            'analyzing': 'bg-blue-500 text-white',
            'completed': 'bg-green-500 text-white',
            'error': 'bg-red-500 text-white',
            'running': 'bg-blue-500 text-white',
            'paused': 'bg-yellow-500 text-white',
            'stopped': 'bg-slate-500 text-slate-200'
        }
        
        return classes[status] || classes['idle']
    }
    
    getStatusTextColor(status) {
        const colors = {
            'pending': 'text-slate-400',
            'analyzing': 'text-blue-400',
            'completed': 'text-green-400',
            'error': 'text-red-400'
        }
        
        return colors[status] || 'text-slate-400'
    }
    
    getStatusText(status) {
        const texts = {
            'idle': '等待开始',
            'pending': '待处理',
            'analyzing': '分析中',
            'completed': '已完成',
            'error': '出错',
            'running': '运行中',
            'paused': '已暂停',
            'stopped': '已停止'
        }
        
        return texts[status] || '未知'
    }
    
    getStatusIcon(status) {
        const icons = {
            'pending': '⏸',
            'analyzing': '⏳',
            'completed': '✅',
            'error': '❌'
        }
        
        return icons[status] || ''
    }
    
    setChapters(chapters) {
        this.chapters = chapters
        this.render()
    }
}

class AnalysisResultUI {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId)
        this.results = options.results || null
        this.activeTab = 'roleCard'
        
        this.onExport = options.onExport || null
        this.onSaveToWorkspace = options.onSaveToWorkspace || null
    }
    
    render() {
        if (!this.container) return
        
        this.container.innerHTML = `
            <div class="analysis-results">
                <div class="results-header mb-4">
                    <h3 class="text-lg font-semibold text-white mb-2">分析结果</h3>
                    <div class="flex space-x-2">
                        <button class="tab-btn px-4 py-2 rounded-lg text-sm ${this.activeTab === 'roleCard' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'}" 
                            data-tab="roleCard">角色卡</button>
                        <button class="tab-btn px-4 py-2 rounded-lg text-sm ${this.activeTab === 'plotAnalysis' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'}" 
                            data-tab="plotAnalysis">剧情分析</button>
                        <button class="tab-btn px-4 py-2 rounded-lg text-sm ${this.activeTab === 'styleAnalysis' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'}" 
                            data-tab="styleAnalysis">文风分析</button>
                    </div>
                </div>
                
                <div class="results-content bg-slate-700 rounded-lg p-4 mb-4 min-h-64" id="results-content">
                    ${this.renderContent()}
                </div>
                
                <div class="results-actions flex justify-end space-x-3">
                    <button class="btn btn-secondary" id="btn-export">导出结果</button>
                    <button class="btn btn-primary" id="btn-save">保存到工作台</button>
                </div>
            </div>
        `
        
        this.bindEvents()
    }
    
    renderContent() {
        if (!this.results) {
            return '<div class="text-center text-slate-400 py-8">暂无分析结果</div>'
        }
        
        switch (this.activeTab) {
            case 'roleCard':
                return this.renderRoleCard()
            case 'plotAnalysis':
                return this.renderPlotAnalysis()
            case 'styleAnalysis':
                return this.renderStyleAnalysis()
            default:
                return '<div class="text-center text-slate-400 py-8">未知内容</div>'
        }
    }
    
    renderRoleCard() {
        const roleCard = this.results.roleCard
        
        if (!roleCard) {
            return '<div class="text-center text-slate-400 py-8">暂无角色卡数据</div>'
        }
        
        if (roleCard.parseError) {
            return `<div class="text-slate-300"><pre>${roleCard.raw || '解析失败'}</pre></div>`
        }
        
        let html = '<div class="role-card-content space-y-4">'
        
        if (roleCard.core_characters && Array.isArray(roleCard.core_characters)) {
            html += '<h4 class="text-white font-medium">核心角色</h4>'
            
            roleCard.core_characters.forEach(char => {
                html += `
                    <div class="character-card bg-slate-600 rounded-lg p-4">
                        <h5 class="text-white font-medium mb-2">${char.name}（${char.role_type || '角色'}）</h5>
                        ${char.basic_traits ? `
                            <div class="text-sm text-slate-300 space-y-1">
                                ${char.basic_traits.personality ? `<p><span class="text-slate-400">性格：</span>${char.basic_traits.personality}</p>` : ''}
                                ${char.basic_traits.appearance ? `<p><span class="text-slate-400">外貌：</span>${char.basic_traits.appearance}</p>` : ''}
                                ${char.basic_traits.clothing_style ? `<p><span class="text-slate-400">衣着：</span>${char.basic_traits.clothing_style}</p>` : ''}
                                ${char.basic_traits.speech_habit ? `<p><span class="text-slate-400">语言：</span>${char.basic_traits.speech_habit}</p>` : ''}
                                ${char.basic_traits.body_language ? `<p><span class="text-slate-400">动作：</span>${char.basic_traits.body_language}</p>` : ''}
                            </div>
                        ` : ''}
                        ${char.relationships && char.relationships.length > 0 ? `
                            <div class="mt-2 text-sm">
                                <span class="text-slate-400">关系：</span>
                                ${char.relationships.map(r => `<span class="text-slate-300">${r.target}（${r.relationship_type}）</span>`).join('、')}
                            </div>
                        ` : ''}
                    </div>
                `
            })
        }
        
        if (roleCard.minor_characters && Array.isArray(roleCard.minor_characters)) {
            html += '<h4 class="text-white font-medium mt-4">次要角色</h4>'
            html += '<div class="flex flex-wrap gap-2">'
            roleCard.minor_characters.forEach(char => {
                html += `<span class="bg-slate-600 px-3 py-1 rounded text-sm text-slate-300">${char.name}：${char.function}</span>`
            })
            html += '</div>'
        }
        
        html += '</div>'
        return html
    }
    
    renderPlotAnalysis() {
        const plotAnalysis = this.results.plotAnalysis
        
        if (!plotAnalysis) {
            return '<div class="text-center text-slate-400 py-8">暂无剧情分析数据</div>'
        }
        
        if (plotAnalysis.parseError) {
            return `<div class="text-slate-300"><pre>${plotAnalysis.raw || '解析失败'}</pre></div>`
        }
        
        let html = '<div class="plot-analysis-content space-y-4">'
        
        if (plotAnalysis.plot_overview) {
            html += `
                <div class="overview-section">
                    <h4 class="text-white font-medium mb-2">剧情脉络</h4>
                    <div class="text-sm text-slate-300 space-y-1">
                        ${plotAnalysis.plot_overview.opening ? `<p><span class="text-slate-400">开端：</span>${plotAnalysis.plot_overview.opening}</p>` : ''}
                        ${plotAnalysis.plot_overview.development ? `<p><span class="text-slate-400">发展：</span>${plotAnalysis.plot_overview.development}</p>` : ''}
                        ${plotAnalysis.plot_overview.climax ? `<p><span class="text-slate-400">高潮：</span>${plotAnalysis.plot_overview.climax}</p>` : ''}
                        ${plotAnalysis.plot_overview.current_progress ? `<p><span class="text-slate-400">当前：</span>${plotAnalysis.plot_overview.current_progress}</p>` : ''}
                        ${plotAnalysis.plot_overview.completion_percentage ? `<p><span class="text-slate-400">完成度：</span>${plotAnalysis.plot_overview.completion_percentage}%</p>` : ''}
                    </div>
                </div>
            `
        }
        
        if (plotAnalysis.core_conflicts) {
            html += `
                <div class="conflicts-section">
                    <h4 class="text-white font-medium mb-2">核心冲突</h4>
                    ${plotAnalysis.core_conflicts.internal ? `
                        <div class="mb-2">
                            <span class="text-slate-400 text-sm">内在冲突：</span>
                            <span class="text-slate-300 text-sm">${plotAnalysis.core_conflicts.internal.join('；')}</span>
                        </div>
                    ` : ''}
                    ${plotAnalysis.core_conflicts.external ? `
                        <div>
                            <span class="text-slate-400 text-sm">外在冲突：</span>
                            <span class="text-slate-300 text-sm">${plotAnalysis.core_conflicts.external.join('；')}</span>
                        </div>
                    ` : ''}
                </div>
            `
        }
        
        if (plotAnalysis.tone_and_theme) {
            html += `
                <div class="theme-section">
                    <h4 class="text-white font-medium mb-2">基调与主题</h4>
                    <div class="text-sm text-slate-300">
                        ${plotAnalysis.tone_and_theme.tone ? `<p><span class="text-slate-400">基调：</span>${plotAnalysis.tone_and_theme.tone.join('、')}</p>` : ''}
                        ${plotAnalysis.tone_and_theme.core_themes ? `<p><span class="text-slate-400">主题：</span>${plotAnalysis.tone_and_theme.core_themes.join('、')}</p>` : ''}
                    </div>
                </div>
            `
        }
        
        html += '</div>'
        return html
    }
    
    renderStyleAnalysis() {
        const styleAnalysis = this.results.styleAnalysis
        const styleCard = this.results.styleCard
        
        if (!styleAnalysis) {
            return '<div class="text-center text-slate-400 py-8">暂无文风分析数据</div>'
        }
        
        if (styleAnalysis.parseError) {
            return `<div class="text-slate-300"><pre>${styleAnalysis.raw || '解析失败'}</pre></div>`
        }
        
        let html = '<div class="style-analysis-content space-y-4">'
        
        if (styleAnalysis.style_overview) {
            html += `
                <div class="overview-section">
                    <h4 class="text-white font-medium mb-2">文风概述</h4>
                    <p class="text-slate-300 text-sm">${styleAnalysis.style_overview}</p>
                </div>
            `
        }
        
        if (styleAnalysis.mandatory_rules && styleAnalysis.mandatory_rules.length > 0) {
            html += `
                <div class="rules-section">
                    <h4 class="text-white font-medium mb-2">强制规则</h4>
                    <ul class="text-sm text-slate-300 list-disc list-inside">
                        ${styleAnalysis.mandatory_rules.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            `
        }
        
        if (styleCard) {
            html += `
                <div class="card-info mt-4 p-3 bg-slate-600 rounded-lg">
                    <p class="text-slate-300 text-sm">
                        <span class="text-slate-400">文风卡：</span>${styleCard.name}
                    </p>
                    <p class="text-slate-400 text-xs mt-1">已自动保存到文风卡库</p>
                </div>
            `
        }
        
        html += '</div>'
        return html
    }
    
    bindEvents() {
        const tabBtns = this.container.querySelectorAll('.tab-btn')
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab
                this.render()
            })
        })
        
        const exportBtn = document.getElementById('btn-export')
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (this.onExport) this.onExport(this.results)
            })
        }
        
        const saveBtn = document.getElementById('btn-save')
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.onSaveToWorkspace) this.onSaveToWorkspace(this.results)
            })
        }
    }
    
    setResults(results) {
        this.results = results
        this.render()
    }
    
    setActiveTab(tab) {
        this.activeTab = tab
        this.render()
    }
}

export { AnalysisProgressUI, AnalysisResultUI }
