import { PlotAnalyzer } from './plotAnalyzer.js'
import { CharacterAnalyzer } from './characterAnalyzer.js'
import { StyleAnalyzer } from './styleAnalyzer.js'
import { AnalysisStateManager, AnalysisStatus } from './analysisStatus.js'
import { AnalysisQueue } from './analysisQueue.js'
import { AnalysisStorage } from './analysisStorage.js'
import { apiClient } from '../api.js'
import { ConfigManager } from '../config.js'

class TextAnalysis {
    constructor(config = {}) {
        this.config = config
        this.stateManager = new AnalysisStateManager()
        this.queue = new AnalysisQueue()
        this.storage = new AnalysisStorage()
        
        this.plotAnalyzer = new PlotAnalyzer(config)
        this.characterAnalyzer = new CharacterAnalyzer(config)
        this.styleAnalyzer = new StyleAnalyzer(config)
        
        this.currentSubModule = 'plot'
        this.analysisData = {
            novelTitle: '',
            chapters: [],
            plotAnalysis: null,
            characterAnalysis: null,
            styleAnalysis: null
        }
        
        this.isRunning = false
        this.isPaused = false
        this.currentChapterIndex = 0
    }

    setSubModule(moduleName) {
        const validModules = ['plot', 'character', 'style']
        if (validModules.includes(moduleName)) {
            this.currentSubModule = moduleName
            return true
        }
        return false
    }

    getCurrentAnalyzer() {
        switch (this.currentSubModule) {
            case 'plot':
                return this.plotAnalyzer
            case 'character':
                return this.characterAnalyzer
            case 'style':
                return this.styleAnalyzer
            default:
                return this.plotAnalyzer
        }
    }

    async loadNovel(chapters, title) {
        this.analysisData.novelTitle = title || '未知小说'
        this.analysisData.chapters = chapters.map((content, index) => ({
            index,
            content,
            title: content.split('\n')[0].slice(0, 50) || `第${index + 1}章`,
            status: AnalysisStatus.PENDING,
            plotResult: null,
            characterResult: null,
            styleResult: null
        }))
        
        this.stateManager.reset()
        this.queue.clear()
        
        return this.analysisData
    }

    async analyzeChapter(chapterIndex, analysisType = null) {
        const type = analysisType || this.currentSubModule
        const chapter = this.analysisData.chapters[chapterIndex]
        
        if (!chapter) {
            throw new Error(`章节 ${chapterIndex} 不存在`)
        }

        chapter.status = AnalysisStatus.ANALYZING
        this.stateManager.updateChapterStatus(chapterIndex, AnalysisStatus.ANALYZING)

        try {
            let result = null
            
            switch (type) {
                case 'plot':
                    result = await this.plotAnalyzer.analyzeChapter(chapter.content)
                    chapter.plotResult = result
                    break
                case 'character':
                    result = await this.characterAnalyzer.analyzeChapter(chapter.content)
                    chapter.characterResult = result
                    break
                case 'style':
                    result = await this.styleAnalyzer.analyzeChapter(chapter.content)
                    chapter.styleResult = result
                    break
                case 'all':
                    chapter.plotResult = await this.plotAnalyzer.analyzeChapter(chapter.content)
                    chapter.characterResult = await this.characterAnalyzer.analyzeChapter(chapter.content)
                    chapter.styleResult = await this.styleAnalyzer.analyzeChapter(chapter.content)
                    break
            }

            chapter.status = AnalysisStatus.COMPLETED
            this.stateManager.updateChapterStatus(chapterIndex, AnalysisStatus.COMPLETED)
            
            return chapter
        } catch (error) {
            chapter.status = AnalysisStatus.FAILED
            this.stateManager.updateChapterStatus(chapterIndex, AnalysisStatus.FAILED)
            throw error
        }
    }

    async analyzeAllChapters(analysisType = null, callbacks = {}) {
        const type = analysisType || this.currentSubModule
        const { onProgress, onChapterComplete, onError, onComplete } = callbacks
        const total = this.analysisData.chapters.length
        
        this.isRunning = true
        this.isPaused = false
        let completed = 0
        let errors = []

        for (let i = 0; i < total; i++) {
            if (!this.isRunning) {
                break
            }
            
            while (this.isPaused) {
                await this.sleep(500)
                if (!this.isRunning) {
                    break
                }
            }
            
            this.currentChapterIndex = i
            
            try {
                await this.analyzeChapter(i, type)
                completed++
                
                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total,
                        percentage: Math.round((completed / total) * 100),
                        chapter: this.analysisData.chapters[i]
                    })
                }
                
                if (onChapterComplete) {
                    onChapterComplete(this.analysisData.chapters[i], i)
                }
            } catch (error) {
                errors.push({ chapterIndex: i, error })
                
                if (onError) {
                    onError(this.analysisData.chapters[i], error, i)
                }
            }
        }

        if (completed > 0) {
            await this.generateOverallAnalysis(type)
        }

        this.isRunning = false

        if (onComplete) {
            onComplete(this.analysisData, errors)
        }

        return { data: this.analysisData, errors }
    }

    async generateOverallAnalysis(analysisType = null) {
        const type = analysisType || this.currentSubModule
        const allContent = this.analysisData.chapters
            .filter(c => c.status === AnalysisStatus.COMPLETED)
            .map(c => c.content)
            .join('\n\n')

        if (!allContent) {
            return null
        }

        switch (type) {
            case 'plot':
                this.analysisData.plotAnalysis = await this.plotAnalyzer.analyzeOverall(allContent)
                break
            case 'character':
                this.analysisData.characterAnalysis = await this.characterAnalyzer.analyzeOverall(allContent)
                break
            case 'style':
                this.analysisData.styleAnalysis = await this.styleAnalyzer.analyzeOverall(allContent)
                break
            case 'all':
                this.analysisData.plotAnalysis = await this.plotAnalyzer.analyzeOverall(allContent)
                this.analysisData.characterAnalysis = await this.characterAnalyzer.analyzeOverall(allContent)
                this.analysisData.styleAnalysis = await this.styleAnalyzer.analyzeOverall(allContent)
                break
        }

        return this.analysisData
    }

    getAnalysisResult(analysisType = null) {
        const type = analysisType || this.currentSubModule
        
        switch (type) {
            case 'plot':
                return {
                    overview: this.analysisData.plotAnalysis,
                    chapters: this.analysisData.chapters.map(c => ({
                        index: c.index,
                        title: c.title,
                        result: c.plotResult,
                        status: c.status
                    }))
                }
            case 'character':
                return {
                    overview: this.analysisData.characterAnalysis,
                    chapters: this.analysisData.chapters.map(c => ({
                        index: c.index,
                        title: c.title,
                        result: c.characterResult,
                        status: c.status
                    }))
                }
            case 'style':
                return {
                    overview: this.analysisData.styleAnalysis,
                    chapters: this.analysisData.chapters.map(c => ({
                        index: c.index,
                        title: c.title,
                        result: c.styleResult,
                        status: c.status
                    }))
                }
            default:
                return this.analysisData
        }
    }

    async exportToPlotCard() {
        if (!this.analysisData.plotAnalysis) {
            throw new Error('剧情分析结果不存在，请先进行分析')
        }

        const plotCard = {
            id: `plot_card_${Date.now()}`,
            name: `《${this.analysisData.novelTitle}》剧情卡`,
            source: {
                novel_name: this.analysisData.novelTitle,
                total_chapters: this.analysisData.chapters.length,
                analyzed_chapters: this.analysisData.chapters.filter(c => c.plotResult).length
            },
            plot_overview: this.analysisData.plotAnalysis.plot_analysis?.overview || this.analysisData.plotAnalysis.overview || {},
            core_conflicts: this.analysisData.plotAnalysis.plot_analysis?.core_conflicts || this.analysisData.plotAnalysis.core_conflicts || { internal: [], external: [] },
            foreshadowing: this.analysisData.plotAnalysis.plot_analysis?.foreshadowing || this.analysisData.plotAnalysis.foreshadowing || [],
            chapter_summaries: this.analysisData.chapters
                .filter(c => c.plotResult)
                .map(c => ({
                    chapter_num: c.index + 1,
                    title: c.title,
                    summary: c.plotResult.summary || c.plotResult.chapter_analysis?.summary || '',
                    key_events: c.plotResult.key_events || c.plotResult.chapter_analysis?.key_events || []
                })),
            continuation_constraints: this.analysisData.plotAnalysis.continuation_constraints || [],
            created_at: new Date().toISOString().split('T')[0],
            tags: ['AI分析生成']
        }

        return plotCard
    }

    async exportToRoleCards() {
        if (!this.analysisData.characterAnalysis) {
            throw new Error('角色分析结果不存在，请先进行分析')
        }

        const roleCards = []
        const coreCharacters = this.analysisData.characterAnalysis.core_characters || []

        for (const char of coreCharacters) {
            roleCards.push({
                id: `role_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: char.name,
                role_type: char.role_type || '角色',
                basic_traits: char.basic_traits || {},
                behavior_logic: char.behavior_logic || {},
                relationships: char.relationships || [],
                growth_arc: char.growth_arc || {},
                source: this.analysisData.novelTitle,
                created_at: new Date().toISOString().split('T')[0],
                tags: ['AI分析生成']
            })
        }

        return roleCards
    }

    async exportToStyleCard() {
        if (!this.analysisData.styleAnalysis) {
            throw new Error('文风分析结果不存在，请先进行分析')
        }

        const styleCard = {
            id: `style_card_${Date.now()}`,
            name: `《${this.analysisData.novelTitle}》文风卡`,
            style_overview: this.analysisData.styleAnalysis.style_overview || '',
            dimensions: this.analysisData.styleAnalysis.dimensions || {},
            forbidden_list: this.analysisData.styleAnalysis.forbidden_list || {},
            mandatory_rules: this.analysisData.styleAnalysis.mandatory_rules || [],
            sample_writing: this.analysisData.styleAnalysis.sample_writing || '',
            core_anchors: this.analysisData.styleAnalysis.core_anchors || [],
            source: this.analysisData.novelTitle,
            created_at: new Date().toISOString().split('T')[0],
            tags: ['AI分析生成']
        }

        return styleCard
    }

    pauseAnalysis() {
        this.isPaused = true
        this.queue.pause()
    }

    resumeAnalysis() {
        this.isPaused = false
        this.queue.resume()
    }

    cancelAnalysis() {
        this.isRunning = false
        this.isPaused = false
        this.queue.clear()
        this.stateManager.reset()
    }

    getProgress() {
        const total = this.analysisData.chapters.length
        const completed = this.analysisData.chapters.filter(c => c.status === AnalysisStatus.COMPLETED).length
        const failed = this.analysisData.chapters.filter(c => c.status === AnalysisStatus.FAILED).length
        
        return {
            total,
            completed,
            failed,
            pending: total - completed - failed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentChapter: this.currentChapterIndex
        }
    }

    saveToStorage() {
        this.storage.save(this.analysisData)
    }

    loadFromStorage() {
        const data = this.storage.load()
        if (data) {
            this.analysisData = data
            return true
        }
        return false
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

export { TextAnalysis }
