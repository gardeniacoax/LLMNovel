import { ConfigManager } from './config.js'
import { WordCountValidator, ContinueWordCountBuilder, CONTINUE_DEFAULT_SETTINGS } from './wordcount/index.js'

class ContinueWriter {
    constructor() {
        this.plotData = null
        this.styleData = null
        this.roleCards = null
        this.outlines = []
        this.chapters = []
        this.wordCountSettings = CONTINUE_DEFAULT_SETTINGS
    }
    
    setWordCountSettings(settings) {
        this.wordCountSettings = { ...CONTINUE_DEFAULT_SETTINGS, ...settings }
    }
    
    getWordCountSettings() {
        return { ...this.wordCountSettings }
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
    
    setOutline(outline) {
        this.outline = outline
    }
    
    setChapterRange(start, end) {
        this.chapterStart = start
        this.chapterEnd = end
    }
    
    async generateOutlines(apiClient, onProgress) {
        const outlines = []
        const total = this.chapterEnd - this.chapterStart + 1
        
        for (let i = 0; i < total; i++) {
            const chapterNum = this.chapterStart + i
            
            if (onProgress) {
                onProgress((i / total) * 100, `正在生成第${chapterNum}章梗概...`)
            }
            
            const outline = await this.generateSingleOutline(apiClient, chapterNum)
            outlines.push({
                chapterNum: chapterNum,
                outline: outline,
                status: 'pending'
            })
        }
        
        this.outlines = outlines
        return outlines
    }
    
    async generateSingleOutline(apiClient, chapterNum) {
        const taskInstructions = `你是一位专业的小说续写助手。请根据提供的剧情分析、文风分析和角色信息，生成第${chapterNum}章的续写梗概。

要求：
1. 保持与原文一致的文风
2. 符合角色性格设定
3. 剧情连贯合理

请直接输出梗概内容，不要添加其他说明。`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            taskInstructions,
            JSON.stringify({
                plotData: this.plotData,
                styleData: this.styleData,
                roleCards: this.roleCards,
                userOutline: this.outline,
                chapterNum: chapterNum
            }, null, 2)
        )
        
        const response = await apiClient.request(messages, {
            maxTokens: 8192,
            temperature: 0.7
        })
        
        return response.choices[0].message.content.trim()
    }
    
    async generateChapter(apiClient, chapterNum, outline, onProgress) {
        const wordCountPrompt = ContinueWordCountBuilder.buildPrompt(outline, this.wordCountSettings)
        
        const taskInstructions = `你是一位专业的小说作家。请根据提供的章节梗概、文风分析和角色信息，撰写完整的章节内容。

${wordCountPrompt}

要求：
1. 严格保持原文文风
2. 角色行为符合人设
3. 对话自然生动
4. 段落分明，节奏合理

请直接输出章节正文，不要添加标题或其他说明。`
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            taskInstructions,
            JSON.stringify({
                styleData: this.styleData,
                roleCards: this.roleCards,
                chapterNum: chapterNum,
                outline: outline
            }, null, 2)
        )
        
        const response = await apiClient.request(messages, {
            maxTokens: 65536,
            temperature: 0.8
        })
        
        return response.choices[0].message.content.trim()
    }
    
    async generateAllChapters(apiClient, onProgress) {
        const chapters = []
        const total = this.outlines.length
        
        for (let i = 0; i < total; i++) {
            const outline = this.outlines[i]
            
            if (onProgress) {
                onProgress((i / total) * 100, `正在生成第${outline.chapterNum}章正文...`)
            }
            
            const content = await this.generateChapter(
                apiClient,
                outline.chapterNum,
                outline.outline
            )
            
            const generatedWordCount = WordCountValidator.countWords(content)
            
            const validation = WordCountValidator.validateContinue(
                content, 
                this.wordCountSettings
            )
            
            chapters.push({
                chapterNum: outline.chapterNum,
                outline: outline.outline,
                content: content,
                generatedWordCount: generatedWordCount,
                wordCount: generatedWordCount,
                validation: validation
            })
        }
        
        this.chapters = chapters
        return chapters
    }
    
    getWordCountStats() {
        if (this.chapters.length === 0) {
            return null
        }
        
        let totalWords = 0
        let validCount = 0
        let invalidCount = 0
        
        this.chapters.forEach(chapter => {
            totalWords += chapter.generatedWordCount || 0
            
            if (chapter.validation && chapter.validation.isValid) {
                validCount++
            } else {
                invalidCount++
            }
        })
        
        return {
            totalChapters: this.chapters.length,
            totalWords,
            avgWords: this.chapters.length > 0 ? Math.round(totalWords / this.chapters.length) : 0,
            validCount,
            invalidCount
        }
    }
    
    exportToTxt() {
        let content = ''
        
        this.chapters.forEach(chapter => {
            content += `第${chapter.chapterNum}章\n\n`
            content += chapter.content
            content += '\n\n'
        })
        
        return content
    }
    
    exportWithStats() {
        const stats = this.getWordCountStats()
        let content = `# 续写统计报告\n\n`
        content += `总章节：${stats.totalChapters}\n`
        content += `总字数：${WordCountValidator.formatWordCount(stats.totalWords)}\n`
        content += `平均每章：${WordCountValidator.formatWordCount(stats.avgWords)}\n`
        content += `达标章节：${stats.validCount}\n`
        content += `未达标章节：${stats.invalidCount}\n\n`
        content += `---\n\n`
        
        this.chapters.forEach(chapter => {
            content += `第${chapter.chapterNum}章\n\n`
            content += `字数：${WordCountValidator.formatWordCount(chapter.generatedWordCount)}`
            content += chapter.validation && chapter.validation.isValid ? ' ✓' : ' ⚠'
            content += `\n\n`
            content += chapter.content
            content += '\n\n'
        })
        
        return content
    }
}

export { ContinueWriter }
