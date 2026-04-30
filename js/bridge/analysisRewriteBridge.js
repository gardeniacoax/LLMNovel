import { DataConverter, dataConverter } from './dataConverter.js'
import { WorkspaceManager } from '../workspace.js'

export class AnalysisRewriteBridge {
    constructor() {
        this.converter = new DataConverter()
        this.cache = new Map()
        this.storageKey = 'chapterAnalysis'
        this.overallKey = 'overallAnalysis'
    }
    
    getChapterAnalysisForRewrite(chapterNum) {
        if (this.cache.has(chapterNum)) {
            return this.cache.get(chapterNum)
        }
        
        const analysisData = this.getChapterAnalysisFromStorage(chapterNum)
        
        if (!analysisData) {
            return null
        }
        
        const convertedData = this.converter.toRewriteFormat(analysisData)
        this.cache.set(chapterNum, convertedData)
        
        return convertedData
    }
    
    getChapterAnalysisFromStorage(chapterNum) {
        const allAnalyses = WorkspaceManager.getWorkspaceData(this.storageKey) || {}
        return allAnalyses[chapterNum] || null
    }
    
    getBatchChapterAnalysis(startChapter, endChapter) {
        const results = []
        
        for (let i = startChapter; i <= endChapter; i++) {
            const data = this.getChapterAnalysisForRewrite(i)
            if (data) {
                results.push(data)
            }
        }
        
        return results
    }
    
    getPlotOverviewForRewrite(chapterNum) {
        const analysisData = this.getChapterAnalysisFromStorage(chapterNum)
        
        if (!analysisData || !analysisData.analysisResult) {
            return null
        }
        
        return {
            chapterNum: analysisData.chapterNum,
            chapterTitle: analysisData.title,
            summary: analysisData.analysisResult.summary || '',
            keyEvents: analysisData.analysisResult.key_events || [],
            chapterFunction: analysisData.analysisResult.chapter_function || []
        }
    }
    
    getCharacterInfoForRewrite(chapterNum, characterName) {
        const analysisData = this.getChapterAnalysisFromStorage(chapterNum)
        
        if (!analysisData || !analysisData.analysisResult) {
            return null
        }
        
        const performances = analysisData.analysisResult.character_performances || []
        const character = performances.find(p => p.name === characterName)
        
        if (!character) {
            return null
        }
        
        return {
            name: character.name,
            speech: character.speech || '',
            bodyLanguage: character.body_language || '',
            clothingChange: character.clothing_change || ''
        }
    }
    
    getAllCharactersForRewrite() {
        const allAnalyses = WorkspaceManager.getWorkspaceData(this.storageKey) || {}
        const characterMap = new Map()
        
        Object.values(allAnalyses).forEach(analysis => {
            const performances = analysis.analysisResult?.character_performances || []
            
            performances.forEach(perf => {
                if (!perf.name) return
                
                if (!characterMap.has(perf.name)) {
                    characterMap.set(perf.name, {
                        name: perf.name,
                        speeches: [],
                        actions: [],
                        clothingChanges: []
                    })
                }
                
                const charData = characterMap.get(perf.name)
                if (perf.speech) charData.speeches.push(perf.speech)
                if (perf.body_language) {
                    if (Array.isArray(perf.body_language)) {
                        charData.actions.push(...perf.body_language)
                    } else {
                        charData.actions.push(perf.body_language)
                    }
                }
                if (perf.clothing_change) charData.clothingChanges.push(perf.clothing_change)
            })
        })
        
        return Array.from(characterMap.values())
    }
    
    getOverallPlotForRewrite() {
        const overallAnalysis = WorkspaceManager.getWorkspaceData(this.overallKey)
        
        if (!overallAnalysis) {
            return null
        }
        
        return this.converter.toRewriteOverallFormat(overallAnalysis)
    }
    
    getStyleGuideForRewrite() {
        const overallAnalysis = WorkspaceManager.getWorkspaceData(this.overallKey)
        
        if (!overallAnalysis) {
            return null
        }
        
        if (overallAnalysis.styleAnalysis) {
            return this.converter.toRewriteStyleFormat(overallAnalysis.styleAnalysis)
        }
        
        if (overallAnalysis.style_overview) {
            return this.converter.toRewriteStyleFormat(overallAnalysis)
        }
        
        return null
    }
    
    syncToRewriteModule(rewriteModule) {
        const chapters = this.getAllChapterAnalyses()
        const overallPlot = this.getOverallPlotForRewrite()
        const styleGuide = this.getStyleGuideForRewrite()
        const characters = this.getAllCharactersForRewrite()
        
        if (rewriteModule.setChapterAnalyses) {
            rewriteModule.setChapterAnalyses(chapters)
        }
        if (rewriteModule.setOverallPlot) {
            rewriteModule.setOverallPlot(overallPlot)
        }
        if (rewriteModule.setStyleGuide) {
            rewriteModule.setStyleGuide(styleGuide)
        }
        if (rewriteModule.setCharacterInfo) {
            rewriteModule.setCharacterInfo(characters)
        }
        
        return {
            chaptersCount: chapters.length,
            hasOverallPlot: !!overallPlot,
            hasStyleGuide: !!styleGuide,
            charactersCount: characters.length
        }
    }
    
    getAllChapterAnalyses() {
        const allAnalyses = WorkspaceManager.getWorkspaceData(this.storageKey) || {}
        
        return Object.values(allAnalyses).map(analysis => ({
            chapterNum: analysis.chapterNum,
            title: analysis.title,
            content: analysis.content,
            wordCount: analysis.wordCount,
            plotOverview: {
                summary: analysis.analysisResult?.summary || '',
                keyEvents: analysis.analysisResult?.key_events || [],
                chapterFunction: analysis.analysisResult?.chapter_function || []
            },
            characterInfo: analysis.analysisResult?.character_performances || [],
            foreshadowing: analysis.analysisResult?.foreshadowing || []
        }))
    }
    
    clearCache() {
        this.cache.clear()
    }
    
    getBridgeStatus() {
        const allAnalyses = WorkspaceManager.getWorkspaceData(this.storageKey) || {}
        const overallAnalysis = WorkspaceManager.getWorkspaceData(this.overallKey)
        
        return {
            hasChapterAnalyses: Object.keys(allAnalyses).length > 0,
            chapterCount: Object.keys(allAnalyses).length,
            hasOverallAnalysis: overallAnalysis !== null,
            hasPlotAnalysis: !!(overallAnalysis?.plot_overview || overallAnalysis?.plotAnalysis),
            hasStyleAnalysis: !!(overallAnalysis?.style_overview || overallAnalysis?.styleAnalysis),
            hasCharacterAnalysis: !!(overallAnalysis?.core_characters || overallAnalysis?.characterAnalysis),
            cacheSize: this.cache.size
        }
    }
    
    buildRewritePromptContext(chapterNum) {
        const chapterAnalysis = this.getChapterAnalysisForRewrite(chapterNum)
        const styleGuide = this.getStyleGuideForRewrite()
        const overallPlot = this.getOverallPlotForRewrite()
        
        return this.converter.toRewritePromptContext(chapterAnalysis, styleGuide, overallPlot)
    }
    
    getRewriteHints(chapterNum) {
        const chapterAnalysis = this.getChapterAnalysisForRewrite(chapterNum)
        return this.converter.extractRewriteHints(chapterAnalysis)
    }
    
    hasChapterAnalysis(chapterNum) {
        const allAnalyses = WorkspaceManager.getWorkspaceData(this.storageKey) || {}
        return !!allAnalyses[chapterNum]
    }
    
    getAvailableChapterNums() {
        const allAnalyses = WorkspaceManager.getWorkspaceData(this.storageKey) || {}
        return Object.keys(allAnalyses).map(Number).sort((a, b) => a - b)
    }
    
    exportForRewrite() {
        const chapters = this.getAllChapterAnalyses()
        const overallPlot = this.getOverallPlotForRewrite()
        const styleGuide = this.getStyleGuideForRewrite()
        const characters = this.getAllCharactersForRewrite()
        
        return {
            exportType: 'rewrite_reference',
            exportVersion: '2.0',
            exportedAt: new Date().toISOString(),
            chapterAnalyses: chapters,
            overallPlot: overallPlot,
            styleGuide: styleGuide,
            characters: characters
        }
    }
    
    importFromAnalysis(analysisData) {
        if (analysisData.chapterAnalyses) {
            WorkspaceManager.setWorkspaceData(this.storageKey, analysisData.chapterAnalyses)
        }
        
        if (analysisData.overallAnalysis) {
            WorkspaceManager.setWorkspaceData(this.overallKey, analysisData.overallAnalysis)
        }
        
        this.clearCache()
        
        return true
    }
}

export const analysisRewriteBridge = new AnalysisRewriteBridge()
