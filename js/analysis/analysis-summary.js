import { getTemplatePrompt } from '../prompt/templates.js'
import { ConfigManager } from '../config.js'
import { StyleCardManager } from '../style/style-card-manager.js'

class AnalysisSummaryGenerator {
    constructor(options = {}) {
        this.chapters = options.chapters || []
        this.apiClient = options.apiClient || null
        this.novelName = options.novelName || '未知小说'
        
        this.onProgress = options.onProgress || null
        this.onComplete = options.onComplete || null
        this.onError = options.onError || null
        
        this.results = {
            roleCard: null,
            plotAnalysis: null,
            styleAnalysis: null,
            styleCard: null,
            generatedAt: null
        }
    }
    
    setApiClient(client) {
        this.apiClient = client
    }
    
    setChapters(chapters) {
        this.chapters = chapters
    }
    
    async generateAll() {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        this.notifyProgress({ stage: 'start', message: '开始生成综合分析结果...' })
        
        try {
            this.notifyProgress({ stage: 'role_card', message: '正在生成角色卡...', progress: 0 })
            this.results.roleCard = await this.generateRoleCard()
            this.notifyProgress({ stage: 'role_card', message: '角色卡生成完成', progress: 33 })
            
            this.notifyProgress({ stage: 'plot_analysis', message: '正在进行剧情分析...', progress: 33 })
            this.results.plotAnalysis = await this.generatePlotAnalysis()
            this.notifyProgress({ stage: 'plot_analysis', message: '剧情分析完成', progress: 66 })
            
            this.notifyProgress({ stage: 'style_analysis', message: '正在进行文风分析...', progress: 66 })
            const styleResult = await this.generateStyleAnalysis()
            this.results.styleAnalysis = styleResult.styleData
            this.results.styleCard = styleResult.styleCard
            this.notifyProgress({ stage: 'style_analysis', message: '文风分析完成', progress: 100 })
            
            this.results.generatedAt = Date.now()
            
            this.notifyProgress({ stage: 'complete', message: '综合分析完成', progress: 100 })
            this.notifyComplete(this.results)
            
            return this.results
            
        } catch (error) {
            this.notifyError(error)
            throw error
        }
    }
    
    async generateRoleCard() {
        const sampleChapters = this.getSampleChapters(5)
        const allContent = sampleChapters.map(ch => ch.content).join('\n\n')
        
        const systemPrompt = getTemplatePrompt('role_card')
        const userPrompt = `请分析以下小说文本中的角色：

小说名称：${this.novelName}
分析章节数：${sampleChapters.length}
总字数：${this.countWords(allContent)}

文本内容：
${allContent.slice(0, 30000)}`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            systemPrompt,
            userPrompt
        )
        
        const response = await this.apiClient.request(messages, {
            maxTokens: 4096,
            temperature: 0.7
        })
        
        const content = response.choices[0].message.content.trim()
        return this.parseResult(content)
    }
    
    async generatePlotAnalysis() {
        const chapterSummaries = this.chapters
            .filter(ch => ch.analysisResult)
            .map(ch => ({
                chapterNum: ch.chapterNum,
                title: ch.title,
                summary: ch.analysisResult.summary || '',
                keyEvents: ch.analysisResult.key_events || []
            }))
        
        if (chapterSummaries.length === 0) {
            const sampleChapters = this.getSampleChapters(10)
            sampleChapters.forEach(ch => {
                chapterSummaries.push({
                    chapterNum: ch.chapterNum,
                    title: ch.title,
                    summary: ch.content.slice(0, 200) + '...',
                    keyEvents: []
                })
            })
        }
        
        const systemPrompt = getTemplatePrompt('plot_analysis')
        const userPrompt = `请根据以下章节信息进行总剧情分析：

小说名称：${this.novelName}
章节总数：${this.chapters.length}

章节摘要：
${JSON.stringify(chapterSummaries, null, 2)}`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            systemPrompt,
            userPrompt
        )
        
        const response = await this.apiClient.request(messages, {
            maxTokens: 4096,
            temperature: 0.7
        })
        
        const content = response.choices[0].message.content.trim()
        return this.parseResult(content)
    }
    
    async generateStyleAnalysis() {
        const sampleChapters = this.getSampleChapters(5)
        const sampleContent = sampleChapters.map(ch => ch.content).join('\n\n')
        
        const systemPrompt = getTemplatePrompt('style_analysis')
        const userPrompt = `请分析以下小说文本的写作风格：

小说名称：${this.novelName}
分析章节数：${sampleChapters.length}
总字数：${this.countWords(sampleContent)}

文本内容：
${sampleContent.slice(0, 30000)}`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            systemPrompt,
            userPrompt
        )
        
        const response = await this.apiClient.request(messages, {
            maxTokens: 4096,
            temperature: 0.7
        })
        
        const content = response.choices[0].message.content.trim()
        const styleData = this.parseResult(content)
        
        let styleCard = null
        if (styleData) {
            styleCard = StyleCardManager.createCard({
                name: `${this.novelName} - 自动生成文风卡`,
                author: 'AI分析',
                style: styleData,
                source: {
                    novelName: this.novelName,
                    wordCount: this.getTotalWordCount(),
                    analyzedAt: Date.now()
                }
            })
        }
        
        return { styleData, styleCard }
    }
    
    getSampleChapters(count) {
        if (this.chapters.length <= count) {
            return this.chapters
        }
        
        const step = Math.floor(this.chapters.length / count)
        const samples = []
        
        for (let i = 0; i < count; i++) {
            const index = Math.min(i * step, this.chapters.length - 1)
            samples.push(this.chapters[index])
        }
        
        return samples
    }
    
    parseResult(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0])
            }
        } catch (error) {
            console.error('解析结果失败:', error)
        }
        
        return {
            raw: response,
            parseError: true
        }
    }
    
    countWords(text) {
        if (!text) return 0
        
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
        
        return chineseChars + englishWords
    }
    
    getTotalWordCount() {
        return this.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
    }
    
    notifyProgress(data) {
        if (this.onProgress) {
            this.onProgress(data)
        }
    }
    
    notifyComplete(results) {
        if (this.onComplete) {
            this.onComplete(results)
        }
    }
    
    notifyError(error) {
        if (this.onError) {
            this.onError(error)
        }
    }
    
    getResults() {
        return this.results
    }
    
    hasResults() {
        return this.results.generatedAt !== null
    }
    
    exportResults() {
        return JSON.stringify(this.results, null, 2)
    }
    
    importResults(jsonString) {
        try {
            const data = JSON.parse(jsonString)
            this.results = { ...this.results, ...data }
            return true
        } catch (error) {
            console.error('导入结果失败:', error)
            return false
        }
    }
}

class AnalysisResultManager {
    static STORAGE_KEY = 'novel_analysis_results'
    
    static saveResults(workspaceId, results) {
        const key = `${this.STORAGE_KEY}_${workspaceId}`
        localStorage.setItem(key, JSON.stringify({
            ...results,
            savedAt: Date.now()
        }))
    }
    
    static loadResults(workspaceId) {
        const key = `${this.STORAGE_KEY}_${workspaceId}`
        const data = localStorage.getItem(key)
        
        if (data) {
            return JSON.parse(data)
        }
        
        return null
    }
    
    static deleteResults(workspaceId) {
        const key = `${this.STORAGE_KEY}_${workspaceId}`
        localStorage.removeItem(key)
    }
    
    static hasResults(workspaceId) {
        const key = `${this.STORAGE_KEY}_${workspaceId}`
        return localStorage.getItem(key) !== null
    }
    
    static exportToFile(workspaceId, filename) {
        const results = this.loadResults(workspaceId)
        
        if (!results) {
            return false
        }
        
        const content = JSON.stringify(results, null, 2)
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = filename || `analysis_results_${workspaceId}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        return true
    }
    
    static async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result)
                    resolve(data)
                } catch (error) {
                    reject(new Error('无效的JSON文件'))
                }
            }
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'))
            }
            
            reader.readAsText(file)
        })
    }
}

class RoleCardFormatter {
    static format(roleCard) {
        if (!roleCard) return ''
        
        let output = '# 角色卡\n\n'
        
        if (roleCard.core_characters && Array.isArray(roleCard.core_characters)) {
            output += '## 核心角色\n\n'
            
            roleCard.core_characters.forEach(char => {
                output += `### ${char.name}（${char.role_type || '角色'}）\n\n`
                
                if (char.basic_traits) {
                    output += '**基础特质**\n'
                    if (char.basic_traits.personality) output += `- 性格：${char.basic_traits.personality}\n`
                    if (char.basic_traits.appearance) output += `- 外貌：${char.basic_traits.appearance}\n`
                    if (char.basic_traits.clothing_style) output += `- 衣着：${char.basic_traits.clothing_style}\n`
                    if (char.basic_traits.speech_habit) output += `- 语言：${char.basic_traits.speech_habit}\n`
                    if (char.basic_traits.body_language) output += `- 动作：${char.basic_traits.body_language}\n`
                    output += '\n'
                }
                
                if (char.behavior_logic) {
                    output += '**行为逻辑**\n'
                    if (char.behavior_logic.core_motivation) output += `- 核心动机：${char.behavior_logic.core_motivation}\n`
                    if (char.behavior_logic.strengths) output += `- 优点：${char.behavior_logic.strengths.join('、')}\n`
                    if (char.behavior_logic.weaknesses) output += `- 缺点：${char.behavior_logic.weaknesses.join('、')}\n`
                    output += '\n'
                }
                
                if (char.relationships && char.relationships.length > 0) {
                    output += '**角色关系**\n'
                    char.relationships.forEach(rel => {
                        output += `- ${rel.target}：${rel.relationship_type}（${rel.interaction_mode}）\n`
                    })
                    output += '\n'
                }
            })
        }
        
        if (roleCard.minor_characters && Array.isArray(roleCard.minor_characters)) {
            output += '## 次要角色\n\n'
            roleCard.minor_characters.forEach(char => {
                output += `- **${char.name}**：${char.function}\n`
            })
        }
        
        return output
    }
    
    static toPrompt(roleCard) {
        if (!roleCard) return ''
        
        let prompt = '## 角色设定\n\n'
        
        if (roleCard.core_characters) {
            roleCard.core_characters.forEach(char => {
                prompt += `### ${char.name}\n`
                if (char.basic_traits) {
                    prompt += `性格：${char.basic_traits.personality || ''}\n`
                    prompt += `外貌：${char.basic_traits.appearance || ''}\n`
                    prompt += `衣着：${char.basic_traits.clothing_style || ''}\n`
                    prompt += `语言习惯：${char.basic_traits.speech_habit || ''}\n`
                    prompt += `肢体动作：${char.basic_traits.body_language || ''}\n`
                }
                prompt += '\n'
            })
        }
        
        return prompt
    }
}

class PlotAnalysisFormatter {
    static format(plotAnalysis) {
        if (!plotAnalysis) return ''
        
        let output = '# 剧情分析\n\n'
        
        if (plotAnalysis.plot_overview) {
            output += '## 剧情脉络\n\n'
            const overview = plotAnalysis.plot_overview
            if (overview.opening) output += `- 开端：${overview.opening}\n`
            if (overview.development) output += `- 发展：${overview.development}\n`
            if (overview.climax) output += `- 高潮：${overview.climax}\n`
            if (overview.current_progress) output += `- 当前进度：${overview.current_progress}\n`
            if (overview.completion_percentage) output += `- 完成度：${overview.completion_percentage}%\n`
            output += '\n'
        }
        
        if (plotAnalysis.core_conflicts) {
            output += '## 核心冲突\n\n'
            if (plotAnalysis.core_conflicts.internal) {
                output += '**内在冲突**\n'
                plotAnalysis.core_conflicts.internal.forEach(c => {
                    output += `- ${c}\n`
                })
                output += '\n'
            }
            if (plotAnalysis.core_conflicts.external) {
                output += '**外在冲突**\n'
                plotAnalysis.core_conflicts.external.forEach(c => {
                    output += `- ${c}\n`
                })
                output += '\n'
            }
        }
        
        if (plotAnalysis.foreshadowing) {
            output += '## 伏笔铺垫\n\n'
            plotAnalysis.foreshadowing.forEach(f => {
                output += `- ${f.hint}（${f.related_chapter}）\n`
            })
            output += '\n'
        }
        
        if (plotAnalysis.tone_and_theme) {
            output += '## 基调与主题\n\n'
            if (plotAnalysis.tone_and_theme.tone) {
                output += `- 基调：${plotAnalysis.tone_and_theme.tone.join('、')}\n`
            }
            if (plotAnalysis.tone_and_theme.core_themes) {
                output += `- 主题：${plotAnalysis.tone_and_theme.core_themes.join('、')}\n`
            }
            output += '\n'
        }
        
        return output
    }
    
    static toPrompt(plotAnalysis) {
        if (!plotAnalysis) return ''
        
        let prompt = '## 剧情背景\n\n'
        
        if (plotAnalysis.plot_overview) {
            prompt += `当前进度：${plotAnalysis.plot_overview.current_progress || ''}\n`
        }
        
        if (plotAnalysis.core_conflicts) {
            prompt += `\n核心冲突：\n`
            if (plotAnalysis.core_conflicts.internal) {
                prompt += `内在：${plotAnalysis.core_conflicts.internal.join('；')}\n`
            }
            if (plotAnalysis.core_conflicts.external) {
                prompt += `外在：${plotAnalysis.core_conflicts.external.join('；')}\n`
            }
        }
        
        return prompt
    }
}

export { 
    AnalysisSummaryGenerator, 
    AnalysisResultManager,
    RoleCardFormatter,
    PlotAnalysisFormatter
}
