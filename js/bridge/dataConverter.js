export class DataConverter {
    toRewriteFormat(analysisData) {
        if (!analysisData) return null
        
        return {
            chapterNum: analysisData.chapterNum,
            chapterTitle: analysisData.title,
            originalContent: analysisData.content,
            wordCount: analysisData.wordCount,
            plotOverview: {
                summary: analysisData.analysisResult?.summary || '',
                keyEvents: analysisData.analysisResult?.key_events || [],
                chapterFunction: analysisData.analysisResult?.chapter_function || []
            },
            characterInfo: this.convertCharacterPerformances(
                analysisData.analysisResult?.character_performances || []
            ),
            foreshadowing: analysisData.analysisResult?.foreshadowing || [],
            analyzedAt: analysisData.analyzedAt
        }
    }
    
    convertCharacterPerformances(performances) {
        if (!performances || !Array.isArray(performances)) return []
        
        return performances.map(perf => ({
            name: perf.name || '',
            speech: perf.speech || '',
            bodyLanguage: perf.body_language || '',
            clothingChange: perf.clothing_change || '',
            emotionalState: perf.emotional_state || ''
        }))
    }
    
    toRewriteOverallFormat(plotAnalysis) {
        if (!plotAnalysis) return null
        
        return {
            plotOverview: {
                opening: plotAnalysis.plot_overview?.opening || '',
                development: plotAnalysis.plot_overview?.development || '',
                climax: plotAnalysis.plot_overview?.climax || '',
                currentProgress: plotAnalysis.plot_overview?.current_progress || '',
                completionPercentage: plotAnalysis.plot_overview?.completion_percentage || 0
            },
            coreConflicts: {
                internal: plotAnalysis.core_conflicts?.internal || [],
                external: plotAnalysis.core_conflicts?.external || []
            },
            foreshadowing: plotAnalysis.foreshadowing || [],
            toneAndTheme: {
                tone: plotAnalysis.tone_and_theme?.tone || [],
                coreThemes: plotAnalysis.tone_and_theme?.core_themes || [],
                evidence: plotAnalysis.tone_and_theme?.evidence || ''
            },
            continuationConstraints: plotAnalysis.continuation_constraints || []
        }
    }
    
    toRewriteStyleFormat(styleAnalysis) {
        if (!styleAnalysis) return null
        
        return {
            styleOverview: styleAnalysis.style_overview || '',
            dimensions: {
                wording: styleAnalysis.dimensions?.wording || {},
                sentenceStructure: styleAnalysis.dimensions?.sentence_structure || {},
                punctuation: styleAnalysis.dimensions?.punctuation || {},
                narrative: styleAnalysis.dimensions?.narrative || {},
                description: styleAnalysis.dimensions?.description || {},
                emotion: styleAnalysis.dimensions?.emotion || {},
                signature: styleAnalysis.dimensions?.signature || {}
            },
            forbiddenList: styleAnalysis.forbidden_list || {},
            mandatoryRules: styleAnalysis.mandatory_rules || [],
            coreAnchors: styleAnalysis.core_anchors || []
        }
    }
    
    toRewritePromptContext(chapterAnalysis, styleGuide, overallPlot) {
        const context = {
            chapter: {
                num: chapterAnalysis?.chapterNum || 0,
                title: chapterAnalysis?.chapterTitle || '',
                summary: chapterAnalysis?.plotOverview?.summary || '',
                keyEvents: chapterAnalysis?.plotOverview?.keyEvents || [],
                wordCount: chapterAnalysis?.wordCount || 0
            },
            characters: chapterAnalysis?.characterInfo || [],
            style: {
                overview: styleGuide?.styleOverview || '',
                rules: styleGuide?.mandatoryRules || [],
                forbidden: styleGuide?.forbiddenList || {}
            },
            plot: {
                currentProgress: overallPlot?.plotOverview?.currentProgress || '',
                coreConflicts: overallPlot?.coreConflicts || {},
                tone: overallPlot?.toneAndTheme?.tone || []
            }
        }
        
        return context
    }
    
    mergeChapterData(originalChapter, analysisData) {
        return {
            ...originalChapter,
            analysisResult: analysisData.plotOverview,
            characterInfo: analysisData.characterInfo,
            hasAnalysis: true,
            analyzedAt: analysisData.analyzedAt
        }
    }
    
    extractRewriteHints(analysisData) {
        const hints = {
            plotHints: [],
            characterHints: [],
            styleHints: []
        }
        
        if (!analysisData) return hints
        
        if (analysisData.plotOverview) {
            if (analysisData.plotOverview.keyEvents) {
                hints.plotHints.push(...analysisData.plotOverview.keyEvents)
            }
            if (analysisData.plotOverview.chapterFunction) {
                hints.plotHints.push(...analysisData.plotOverview.chapterFunction)
            }
        }
        
        if (analysisData.characterInfo) {
            analysisData.characterInfo.forEach(char => {
                hints.characterHints.push({
                    name: char.name,
                    speech: char.speech,
                    actions: char.bodyLanguage
                })
            })
        }
        
        return hints
    }
    
    formatForPrompt(data, type) {
        switch (type) {
            case 'plot':
                return this.formatPlotForPrompt(data)
            case 'character':
                return this.formatCharacterForPrompt(data)
            case 'style':
                return this.formatStyleForPrompt(data)
            default:
                return JSON.stringify(data, null, 2)
        }
    }
    
    formatPlotForPrompt(plotData) {
        if (!plotData) return '暂无剧情数据'
        
        let result = `## 剧情概览\n`
        result += `- 章节主旨：${plotData.summary || '暂无'}\n`
        
        if (plotData.keyEvents && plotData.keyEvents.length > 0) {
            result += `- 关键情节：${plotData.keyEvents.join('；')}\n`
        }
        
        if (plotData.chapterFunction && plotData.chapterFunction.length > 0) {
            result += `- 章节作用：${plotData.chapterFunction.join('、')}\n`
        }
        
        return result
    }
    
    formatCharacterForPrompt(characterData) {
        if (!characterData) return '暂无角色数据'
        
        if (Array.isArray(characterData)) {
            return characterData.map(char => 
                `### ${char.name}\n- 语言：${char.speech || '无'}\n- 动作：${char.bodyLanguage || '无'}\n- 衣着：${char.clothingChange || '无'}`
            ).join('\n\n')
        }
        
        return `### ${characterData.name || '未知角色'}\n- 语言：${characterData.speech || '无'}\n- 动作：${characterData.bodyLanguage || '无'}`
    }
    
    formatStyleForPrompt(styleData) {
        if (!styleData) return '暂无文风数据'
        
        let result = `## 文风指南\n`
        result += `- 总体风格：${styleData.styleOverview || '暂无'}\n`
        
        if (styleData.mandatoryRules && styleData.mandatoryRules.length > 0) {
            result += `- 必须遵守：${styleData.mandatoryRules.join('；')}\n`
        }
        
        if (styleData.forbiddenList && Object.keys(styleData.forbiddenList).length > 0) {
            result += `- 禁止事项：${JSON.stringify(styleData.forbiddenList)}\n`
        }
        
        return result
    }
    
    toContinuationFormat(analysisData) {
        if (!analysisData) return null
        
        return {
            plotOverview: analysisData.plotOverview,
            characters: analysisData.characterInfo,
            styleGuide: analysisData.styleGuide,
            overallPlot: analysisData.overallPlot
        }
    }
    
    batchConvertToRewriteFormat(analyses) {
        if (!analyses || typeof analyses !== 'object') return []
        
        return Object.values(analyses).map(analysis => this.toRewriteFormat(analysis))
    }
    
    validateRewriteData(data) {
        const errors = []
        
        if (!data) {
            errors.push('数据为空')
            return { valid: false, errors }
        }
        
        if (!data.chapterNum) {
            errors.push('缺少章节号')
        }
        
        if (!data.originalContent) {
            errors.push('缺少原文内容')
        }
        
        return {
            valid: errors.length === 0,
            errors
        }
    }
}

export const dataConverter = new DataConverter()
