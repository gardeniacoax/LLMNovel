import { FileHandler } from './file.js'
import { ConfigManager } from './config.js'
import { WordCountValidator, RewriteWordCountBuilder, REWRITE_DEFAULT_SETTINGS } from './wordcount/index.js'

class RewriteWriter {
    constructor() {
        this.originalContent = ''
        this.originalChapters = []
        this.plotData = null
        this.styleData = null
        this.roleCards = null
        this.rewriteConfig = null
        this.newOutlines = []
        this.newChapters = []
        this.wordCountSettings = REWRITE_DEFAULT_SETTINGS
    }
    
    setWordCountSettings(settings) {
        this.wordCountSettings = { ...REWRITE_DEFAULT_SETTINGS, ...settings }
    }
    
    getWordCountSettings() {
        return { ...this.wordCountSettings }
    }
    
    loadOriginalContent(content) {
        this.originalContent = content
        this.originalChapters = FileHandler.splitChapters(content)
    }
    
    loadPlotData(data) {
        this.plotData = data
    }
    
    loadStyleData(data) {
        this.styleData = data
    }
    
    loadRoleCards(cards) {
        this.roleCards = cards
    }
    
    setRewriteConfig(config) {
        this.rewriteConfig = config
    }
    
    async generateNewOutlines(apiClient, onProgress) {
        const outlines = []
        const total = this.originalChapters.length
        
        for (let i = 0; i < total; i++) {
            const chapter = this.originalChapters[i]
            
            if (onProgress) {
                onProgress((i / total) * 100, `正在生成第${chapter.chapterNum}章新梗概...`)
            }
            
            const outline = await this.generateSingleOutline(
                apiClient,
                chapter,
                i
            )
            
            outlines.push({
                chapterNum: chapter.chapterNum,
                originalTitle: chapter.title,
                newOutline: outline,
                status: 'pending'
            })
        }
        
        this.newOutlines = outlines
        return outlines
    }
    
    async generateSingleOutline(apiClient, chapter, index) {
        const taskInstructions = `你是一位专业的小说改写助手。请根据原文章节内容、改写要求和角色信息，生成改写后的章节梗概。

改写要求：
${this.rewriteConfig.overallOutline}

${this.rewriteConfig.minimizeChange ? '注意：最小化改写幅度，尽量保持原文结构。' : ''}

要求：
1. 保持原文文风不变
2. 按照改写方向调整剧情
3. 一对一映射，不增减章节

请直接输出新梗概内容。`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            taskInstructions,
            JSON.stringify({
                originalChapter: chapter.content,
                plotData: this.plotData,
                styleData: this.styleData,
                roleCards: this.roleCards,
                rewriteConfig: this.rewriteConfig,
                chapterIndex: index
            }, null, 2)
        )
        
        const response = await apiClient.request(messages, {
            maxTokens: 8192,
            temperature: 0.7
        })
        
        return response.choices[0].message.content.trim()
    }
    
    async rewriteChapter(apiClient, chapter, newOutline, onProgress) {
        const wordCountPrompt = RewriteWordCountBuilder.buildPrompt(
            { wordCount: chapter.content ? WordCountValidator.countWords(chapter.content) : 0 },
            this.wordCountSettings
        )
        
        const taskInstructions = `你是一位专业的小说改写作家。请根据原文章节、新梗概和文风信息，改写章节内容。

改写要求：
${this.rewriteConfig.overallOutline}

${this.rewriteConfig.minimizeChange ? '注意：最小化改写幅度，保持原文结构。' : ''}

${wordCountPrompt}

要求：
1. 严格保持原文文风
2. 按照新梗概调整剧情
3. 角色行为符合人设

请直接输出改写后的章节正文。`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            taskInstructions,
            JSON.stringify({
                originalChapter: chapter.content,
                newOutline: newOutline,
                styleData: this.styleData,
                roleCards: this.roleCards
            }, null, 2)
        )
        
        const response = await apiClient.request(messages, {
            maxTokens: 65536,
            temperature: 0.8
        })
        
        return response.choices[0].message.content.trim()
    }
    
    async rewriteAllChapters(apiClient, onProgress) {
        const chapters = []
        const total = this.newOutlines.length
        
        if (total !== this.originalChapters.length) {
            throw new Error('章节数量不匹配，必须一对一映射')
        }
        
        for (let i = 0; i < total; i++) {
            const outline = this.newOutlines[i]
            const originalChapter = this.originalChapters[i]
            
            if (onProgress) {
                onProgress((i / total) * 100, `正在改写第${outline.chapterNum}章...`)
            }
            
            const content = await this.rewriteChapter(
                apiClient,
                originalChapter,
                outline.newOutline
            )
            
            const originalWordCount = originalChapter.content 
                ? WordCountValidator.countWords(originalChapter.content) 
                : 0
            const rewriteWordCount = WordCountValidator.countWords(content)
            
            const validation = WordCountValidator.validateRewrite(
                content, 
                this.wordCountSettings, 
                originalWordCount
            )
            
            chapters.push({
                chapterNum: outline.chapterNum,
                originalTitle: outline.originalTitle,
                newOutline: outline.newOutline,
                content: content,
                originalWordCount: originalWordCount,
                rewriteWordCount: rewriteWordCount,
                wordCount: rewriteWordCount,
                validation: validation
            })
        }
        
        this.newChapters = chapters
        return chapters
    }
    
    getWordCountStats() {
        if (this.newChapters.length === 0) {
            return null
        }
        
        let totalOriginal = 0
        let totalRewritten = 0
        let validCount = 0
        let invalidCount = 0
        
        this.newChapters.forEach(chapter => {
            totalOriginal += chapter.originalWordCount || 0
            totalRewritten += chapter.rewriteWordCount || 0
            
            if (chapter.validation && chapter.validation.isValid) {
                validCount++
            } else {
                invalidCount++
            }
        })
        
        return {
            totalChapters: this.newChapters.length,
            totalOriginal,
            totalRewritten,
            validCount,
            invalidCount,
            avgRatio: totalOriginal > 0 ? Math.round((totalRewritten / totalOriginal) * 100) : 0
        }
    }
    
    exportToTxt() {
        let content = ''
        
        this.newChapters.forEach(chapter => {
            content += `${chapter.originalTitle}\n\n`
            content += chapter.content
            content += '\n\n'
        })
        
        return content
    }
    
    exportWithStats() {
        const stats = this.getWordCountStats()
        let content = `# 改写统计报告\n\n`
        content += `总章节：${stats.totalChapters}\n`
        content += `原文总字数：${WordCountValidator.formatWordCount(stats.totalOriginal)}\n`
        content += `改写总字数：${WordCountValidator.formatWordCount(stats.totalRewritten)}\n`
        content += `达标章节：${stats.validCount}\n`
        content += `未达标章节：${stats.invalidCount}\n`
        content += `平均比例：${stats.avgRatio}%\n\n`
        content += `---\n\n`
        
        this.newChapters.forEach(chapter => {
            content += `${chapter.originalTitle}\n\n`
            content += `原文：${WordCountValidator.formatWordCount(chapter.originalWordCount)} → `
            content += `改写：${WordCountValidator.formatWordCount(chapter.rewriteWordCount)} `
            content += `(${chapter.validation ? WordCountValidator.calculateRatio(chapter.rewriteWordCount, chapter.originalWordCount) : 0}%)\n\n`
            content += chapter.content
            content += '\n\n'
        })
        
        return content
    }
}

export { RewriteWriter }
