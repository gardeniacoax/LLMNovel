import { ConfigManager } from '../config.js'
import { WordCountValidator, RewriteWordCountBuilder } from '../wordcount/index.js'
import { StyleCardApplier } from '../style/style-card-applier.js'
import { ChapterStatusManager } from './rewrite-outline.js'

class RewriteContentGenerator {
    constructor(options = {}) {
        this.chapter = options.chapter || null
        this.outline = options.outline || null
        this.settings = options.settings || {}
        this.apiClient = options.apiClient || null
        
        this.onProgress = options.onProgress || null
        this.onComplete = options.onComplete || null
        this.onError = options.onError || null
        
        this.content = ''
        this.validation = null
    }
    
    setApiClient(client) {
        this.apiClient = client
    }
    
    setChapter(chapter) {
        this.chapter = chapter
    }
    
    setOutline(outline) {
        this.outline = outline
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
        
        if (!this.outline) {
            throw new Error('梗概未设置')
        }
        
        this.notifyProgress({ stage: 'generating', message: '正在生成改写内容...', progress: 0 })
        
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
                maxTokens: 65536,
                temperature: 0.8
            })
            
            this.content = response.choices[0].message.content.trim()
            
            const originalWordCount = this.chapter.wordCount || 
                WordCountValidator.countWords(this.chapter.content)
            const rewriteWordCount = WordCountValidator.countWords(this.content)
            
            this.validation = WordCountValidator.validateRewrite(
                this.content,
                this.settings.wordCount || {},
                originalWordCount
            )
            
            const result = {
                content: this.content,
                originalWordCount: originalWordCount,
                rewriteWordCount: rewriteWordCount,
                validation: this.validation
            }
            
            this.notifyProgress({ stage: 'completed', message: '内容生成完成', progress: 100 })
            this.notifyComplete(result)
            
            return result
            
        } catch (error) {
            this.notifyError(error)
            throw error
        }
    }
    
    async generateStream(onChunk) {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        if (!this.chapter) {
            throw new Error('章节未设置')
        }
        
        if (!this.outline) {
            throw new Error('梗概未设置')
        }
        
        this.notifyProgress({ stage: 'generating', message: '正在生成改写内容...', progress: 0 })
        
        try {
            const wordCountInstruction = this.buildWordCountInstruction()
            const stylePrompt = this.buildStylePrompt()
            
            const systemPrompt = this.buildSystemPrompt()
            const userPrompt = this.buildUserPrompt(wordCountInstruction, stylePrompt)
            
            const messages = ConfigManager.buildMessagesWithGlobalPrompt(
                systemPrompt,
                userPrompt
            )
            
            const response = await this.apiClient.requestStream(messages, {
                maxTokens: 65536,
                temperature: 0.8
            })
            
            this.content = ''
            
            for await (const chunk of response) {
                this.content += chunk
                if (onChunk) onChunk(this.content)
            }
            
            const originalWordCount = this.chapter.wordCount || 
                WordCountValidator.countWords(this.chapter.content)
            const rewriteWordCount = WordCountValidator.countWords(this.content)
            
            this.validation = WordCountValidator.validateRewrite(
                this.content,
                this.settings.wordCount || {},
                originalWordCount
            )
            
            const result = {
                content: this.content,
                originalWordCount: originalWordCount,
                rewriteWordCount: rewriteWordCount,
                validation: this.validation
            }
            
            this.notifyProgress({ stage: 'completed', message: '内容生成完成', progress: 100 })
            this.notifyComplete(result)
            
            return result
            
        } catch (error) {
            this.notifyError(error)
            throw error
        }
    }
    
    buildSystemPrompt() {
        return `你是一位专业的小说改写作家。请根据梗概、原文风格和改写要求，改写章节内容。

要求：
1. 严格保持原文文风
2. 按照梗概调整剧情
3. 角色行为符合人设
4. 文字流畅自然
5. 段落分明，节奏合理

请直接输出改写后的章节内容，不要包含任何解释、说明或标题。`
    }
    
    buildUserPrompt(wordCountInstruction, stylePrompt) {
        let prompt = ''
        
        if (stylePrompt) {
            prompt += `${stylePrompt}\n\n`
        }
        
        if (wordCountInstruction) {
            prompt += `${wordCountInstruction}\n\n`
        }
        
        prompt += `梗概：
- 主要情节：${this.outline.summary}
- 关键场景：${this.outline.key_scenes?.join('、') || '无'}
- 角色要点：${this.outline.character_points?.join('、') || '无'}
- 情感基调：${this.outline.emotional_tone || '无'}

`
        
        if (this.settings.requirements) {
            prompt += `改写要求：
${this.settings.requirements}

`
        }
        
        if (this.settings.minimizeChange) {
            prompt += `注意：最小化改写幅度，保持原文结构和节奏。

`
        }
        
        prompt += `请改写章节内容：`
        
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
    
    notifyProgress(data) {
        if (this.onProgress) {
            this.onProgress(data)
        }
    }
    
    notifyComplete(result) {
        if (this.onComplete) {
            this.onComplete(result)
        }
    }
    
    notifyError(error) {
        if (this.onError) {
            this.onError(error)
        }
    }
    
    getContent() {
        return this.content
    }
    
    getValidation() {
        return this.validation
    }
}

class RewriteExecutor {
    constructor(options = {}) {
        this.chapters = options.chapters || []
        this.settings = options.settings || {}
        this.apiClient = options.apiClient || null
        this.workspaceId = options.workspaceId || null
        
        this.currentChapterIndex = -1
        this.isRunning = false
        this.isPaused = false
        
        this.onChapterStart = options.onChapterStart || null
        this.onChapterProgress = options.onChapterProgress || null
        this.onChapterComplete = options.onChapterComplete || null
        this.onChapterError = options.onChapterError || null
        this.onAllComplete = options.onAllComplete || null
        this.onStatusChange = options.onStatusChange || null
        
        this.results = []
        this.errors = []
    }
    
    setApiClient(client) {
        this.apiClient = client
    }
    
    setChapters(chapters) {
        this.chapters = chapters.map(ch => ({
            ...ch,
            status: ch.status || 'pending',
            outline: ch.outline || null,
            rewriteContent: ch.rewriteContent || null,
            validation: ch.validation || null
        }))
    }
    
    setSettings(settings) {
        this.settings = { ...this.settings, ...settings }
    }
    
    async executeChapter(chapter, settings = null) {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        const chapterIndex = typeof chapter === 'number' ? chapter : this.chapters.findIndex(ch => ch.chapterNum === chapter.chapterNum)
        
        if (chapterIndex < 0 || chapterIndex >= this.chapters.length) {
            throw new Error('章节索引无效')
        }
        
        const targetChapter = this.chapters[chapterIndex]
        const useSettings = settings || this.settings
        
        this.notifyChapterStart(targetChapter, chapterIndex)
        targetChapter.status = 'content_generating'
        
        try {
            const generator = new RewriteContentGenerator({
                chapter: targetChapter,
                outline: targetChapter.outline,
                settings: useSettings,
                apiClient: this.apiClient,
                onProgress: (data) => {
                    this.notifyChapterProgress(targetChapter, data, chapterIndex)
                }
            })
            
            const result = await generator.generate()
            
            targetChapter.rewriteContent = result.content
            targetChapter.validation = result.validation
            targetChapter.status = 'completed'
            
            this.notifyChapterComplete(targetChapter, result, chapterIndex)
            
            return result
            
        } catch (error) {
            targetChapter.status = 'failed'
            targetChapter.error = error.message
            
            this.errors.push({
                chapterIndex: chapterIndex,
                chapterNum: targetChapter.chapterNum,
                error: error.message
            })
            
            this.notifyChapterError(targetChapter, error, chapterIndex)
            throw error
        }
    }
    
    async executeBatch(chapters, settings = null) {
        if (!this.apiClient) {
            throw new Error('API客户端未设置')
        }
        
        const useSettings = settings || this.settings
        
        if (chapters && chapters.length > 0) {
            this.setChapters(chapters)
        }
        
        this.isRunning = true
        this.isPaused = false
        this.results = []
        this.errors = []
        
        this.notifyStatusChange('running')
        
        for (let i = 0; i < this.chapters.length; i++) {
            if (!this.isRunning) {
                this.notifyStatusChange('stopped')
                return {
                    results: this.results,
                    errors: this.errors,
                    stats: this.getStats()
                }
            }
            
            while (this.isPaused) {
                await this.sleep(500)
                if (!this.isRunning) {
                    this.notifyStatusChange('stopped')
                    return {
                        results: this.results,
                        errors: this.errors,
                        stats: this.getStats()
                    }
                }
            }
            
            this.currentChapterIndex = i
            
            try {
                const result = await this.executeChapter(i, useSettings)
                this.results.push({
                    chapterIndex: i,
                    chapterNum: this.chapters[i].chapterNum,
                    result: result
                })
            } catch (error) {
                console.error(`章节 ${this.chapters[i].chapterNum} 改写失败:`, error)
            }
        }
        
        this.isRunning = false
        this.notifyStatusChange('completed')
        this.notifyAllComplete(this.chapters, this.results, this.errors)
        
        return {
            results: this.results,
            errors: this.errors,
            stats: this.getStats()
        }
    }
    
    async executeAll() {
        return await this.executeBatch(null, this.settings)
    }
    
    getProgress() {
        return {
            current: this.currentChapterIndex + 1,
            total: this.chapters.length,
            percentage: this.chapters.length > 0 ? 
                Math.round(((this.currentChapterIndex + 1) / this.chapters.length) * 100) : 0,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            stats: this.getStats()
        }
    }
    
    pause() {
        this.isPaused = true
        this.notifyStatusChange('paused')
    }
    
    resume() {
        this.isPaused = false
        this.notifyStatusChange('running')
    }
    
    stop() {
        this.isRunning = false
        this.isPaused = false
        this.notifyStatusChange('stopped')
    }
    
    retryChapter(chapterIndex) {
        const chapter = this.chapters[chapterIndex]
        if (chapter) {
            chapter.status = 'pending'
            chapter.error = null
            
            const errorIndex = this.errors.findIndex(e => e.chapterIndex === chapterIndex)
            if (errorIndex !== -1) {
                this.errors.splice(errorIndex, 1)
            }
        }
    }
    
    retryAllErrors() {
        this.chapters.forEach((chapter, index) => {
            if (chapter.status === 'failed') {
                chapter.status = 'pending'
                chapter.error = null
            }
        })
        this.errors = []
    }
    
    getStats() {
        const completed = this.chapters.filter(ch => ch.status === 'completed').length
        const pending = this.chapters.filter(ch => ch.status === 'pending').length
        const failed = this.chapters.filter(ch => ch.status === 'failed').length
        const processing = this.chapters.filter(ch => 
            ['outline_generating', 'outline_editing', 'content_generating'].includes(ch.status)
        ).length
        
        return {
            total: this.chapters.length,
            completed,
            pending,
            failed,
            processing,
            percentage: this.chapters.length > 0 ? Math.round((completed / this.chapters.length) * 100) : 0
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    notifyChapterStart(chapter, index) {
        if (this.onChapterStart) {
            this.onChapterStart(chapter, index)
        }
    }
    
    notifyChapterProgress(chapter, data, index) {
        if (this.onChapterProgress) {
            this.onChapterProgress(chapter, data, index)
        }
    }
    
    notifyChapterComplete(chapter, result, index) {
        if (this.onChapterComplete) {
            this.onChapterComplete(chapter, result, index)
        }
    }
    
    notifyChapterError(chapter, error, index) {
        if (this.onChapterError) {
            this.onChapterError(chapter, error, index)
        }
    }
    
    notifyAllComplete(chapters, results, errors) {
        if (this.onAllComplete) {
            this.onAllComplete(chapters, results, errors)
        }
    }
    
    notifyStatusChange(status) {
        if (this.onStatusChange) {
            this.onStatusChange(status)
        }
    }
    
    exportResults() {
        let content = ''
        
        this.chapters.forEach(chapter => {
            if (chapter.rewriteContent) {
                content += `${chapter.title || `第${chapter.chapterNum}章`}\n\n`
                content += chapter.rewriteContent
                content += '\n\n'
            }
        })
        
        return content
    }
    
    exportWithStats() {
        const stats = this.getStats()
        let content = `# 改写统计报告\n\n`
        content += `总章节：${stats.total}\n`
        content += `已完成：${stats.completed}\n`
        content += `失败：${stats.failed}\n\n`
        content += `---\n\n`
        
        this.chapters.forEach(chapter => {
            content += `${chapter.title || `第${chapter.chapterNum}章`}\n\n`
            
            if (chapter.rewriteContent) {
                content += `原文：${chapter.wordCount || 0} 字 → `
                content += `改写：${WordCountValidator.countWords(chapter.rewriteContent)} 字\n\n`
                content += chapter.rewriteContent
            } else {
                content += `状态：${ChapterStatusManager.getStatusText(chapter.status)}\n`
                if (chapter.error) {
                    content += `错误：${chapter.error}\n`
                }
            }
            
            content += '\n\n'
        })
        
        return content
    }
}

export { 
    RewriteContentGenerator, 
    RewriteExecutor 
}
