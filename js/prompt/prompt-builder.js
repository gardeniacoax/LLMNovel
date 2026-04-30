import { getTemplatePrompt, getTemplateById, getAllTemplates } from './templates.js'
import { ExtensionManager } from './extension-manager.js'
import { PromptMerger } from './prompt-merger.js'

const CONFIG_KEYS = {
    GLOBAL_PROMPT: 'novel_global_prompt'
}

const DEFAULT_GLOBAL_PROMPT = '你是专业小说创作助手，严格遵守用户设定的文风、人设、剧情逻辑，禁止OOC、禁止文风割裂、禁止崩坏世界观'

class PromptBuilder {
    constructor() {
        this.globalPrompt = null
    }
    
    getGlobalPrompt() {
        const data = localStorage.getItem(CONFIG_KEYS.GLOBAL_PROMPT)
        if (data) {
            const parsed = JSON.parse(data)
            return parsed.content
        }
        return DEFAULT_GLOBAL_PROMPT
    }
    
    setGlobalPrompt(content) {
        const data = {
            content: content,
            updatedAt: Date.now(),
            version: 1
        }
        localStorage.setItem(CONFIG_KEYS.GLOBAL_PROMPT, JSON.stringify(data))
        this.globalPrompt = content
        return true
    }
    
    resetGlobalPrompt() {
        return this.setGlobalPrompt(DEFAULT_GLOBAL_PROMPT)
    }
    
    getGlobalPromptInfo() {
        const data = localStorage.getItem(CONFIG_KEYS.GLOBAL_PROMPT)
        if (data) {
            return JSON.parse(data)
        }
        return {
            content: DEFAULT_GLOBAL_PROMPT,
            updatedAt: null,
            version: 0
        }
    }
    
    buildSystemPrompt(taskType, options = {}) {
        const globalPrompt = this.getGlobalPrompt()
        const templatePrompt = getTemplatePrompt(taskType)
        const extensions = ExtensionManager.getExtensionsByType(taskType)
        
        let systemPrompt = ''
        
        if (globalPrompt) {
            systemPrompt += `【全局指令 - 最高优先级】\n${globalPrompt}\n\n`
        }
        
        const mergedTemplate = PromptMerger.merge(templatePrompt, extensions)
        systemPrompt += mergedTemplate
        
        if (options.additionalPrompt) {
            systemPrompt += `\n\n【附加指令】\n${options.additionalPrompt}`
        }
        
        if (options.wordCountConstraint) {
            systemPrompt += `\n\n【字数约束】\n${options.wordCountConstraint}`
        }
        
        if (options.styleCard) {
            systemPrompt += `\n\n【文风参考】\n${options.styleCard}`
        }
        
        if (options.roleCards && options.roleCards.length > 0) {
            systemPrompt += `\n\n【角色设定】\n${JSON.stringify(options.roleCards, null, 2)}`
        }
        
        return systemPrompt
    }
    
    buildMessages(taskType, userContent, options = {}) {
        const systemPrompt = this.buildSystemPrompt(taskType, options)
        
        return [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: userContent
            }
        ]
    }
    
    buildAnalysisPrompt(text, taskType, options = {}) {
        const messages = this.buildMessages(taskType, `请分析以下小说文本：\n\n${text}`, options)
        return messages
    }
    
    buildContinuePrompt(context, options = {}) {
        const { previousContent, chapterCount, wordCountRange } = options
        
        let userContent = `请根据以下内容续写小说：\n\n`
        
        if (previousContent) {
            userContent += `【前文内容】\n${previousContent}\n\n`
        }
        
        if (chapterCount) {
            userContent += `【续写章节数】\n${chapterCount}章\n\n`
        }
        
        if (wordCountRange) {
            userContent += `【每章字数范围】\n${wordCountRange.min} - ${wordCountRange.max}字\n\n`
        }
        
        return this.buildMessages('continue', userContent, options)
    }
    
    buildRewritePrompt(originalContent, requirements, options = {}) {
        let userContent = `请根据以下要求改写小说内容：\n\n`
        
        userContent += `【原文内容】\n${originalContent}\n\n`
        
        userContent += `【改写要求】\n${requirements}\n\n`
        
        if (options.wordCountRange) {
            userContent += `【目标字数范围】\n${options.wordCountRange.min} - ${options.wordCountRange.max}字\n\n`
        }
        
        return this.buildMessages('rewrite', userContent, options)
    }
    
    buildRoleCardPrompt(text, options = {}) {
        return this.buildAnalysisPrompt(text, 'role_card', options)
    }
    
    buildChapterAnalysisPrompt(text, options = {}) {
        return this.buildAnalysisPrompt(text, 'chapter_analysis', options)
    }
    
    buildPlotAnalysisPrompt(text, options = {}) {
        return this.buildAnalysisPrompt(text, 'plot_analysis', options)
    }
    
    buildStyleAnalysisPrompt(text, options = {}) {
        return this.buildAnalysisPrompt(text, 'style_analysis', options)
    }
    
    prependGlobalPrompt(messages) {
        const globalPrompt = this.getGlobalPrompt()
        
        const systemMessage = messages.find(m => m.role === 'system')
        
        if (systemMessage) {
            if (systemMessage.content.includes('【全局指令 - 最高优先级】')) {
                return messages
            }
            systemMessage.content = `【全局指令 - 最高优先级】\n${globalPrompt}\n\n【任务指令】\n${systemMessage.content}`
        } else {
            messages.unshift({
                role: 'system',
                content: `【全局指令 - 最高优先级】\n${globalPrompt}`
            })
        }
        
        return messages
    }
    
    getTemplateInfo(taskType) {
        return getTemplateById(taskType)
    }
    
    getAllTemplateInfos() {
        return getAllTemplates()
    }
    
    previewPrompt(taskType, options = {}) {
        const systemPrompt = this.buildSystemPrompt(taskType, options)
        const extensions = ExtensionManager.getExtensionsByType(taskType)
        const template = getTemplateById(taskType)
        
        return {
            taskType,
            templateName: template?.name || taskType,
            globalPrompt: this.getGlobalPrompt(),
            templatePrompt: template?.prompt || '',
            extensions: extensions,
            finalPrompt: systemPrompt,
            extensionCount: extensions.length
        }
    }
}

const promptBuilder = new PromptBuilder()

export {
    PromptBuilder,
    promptBuilder,
    DEFAULT_GLOBAL_PROMPT,
    CONFIG_KEYS
}
