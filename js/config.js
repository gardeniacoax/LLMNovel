import { promptBuilder, DEFAULT_GLOBAL_PROMPT, PROMPT_TEMPLATES, getTemplatePrompt, ExtensionManager } from './prompt/index.js'

const CONFIG_KEYS = {
    GLOBAL_PROMPT: 'novel_global_prompt',
    API_CONFIG: 'novel_api_config'
}

const DEFAULT_PROMPT = DEFAULT_GLOBAL_PROMPT

class ConfigManager {
    static getGlobalPrompt() {
        return promptBuilder.getGlobalPrompt()
    }
    
    static setGlobalPrompt(content) {
        return promptBuilder.setGlobalPrompt(content)
    }
    
    static resetGlobalPrompt() {
        return promptBuilder.resetGlobalPrompt()
    }
    
    static getPromptInfo() {
        return promptBuilder.getGlobalPromptInfo()
    }
    
    static buildSystemPrompt(taskType, options = {}) {
        return promptBuilder.buildSystemPrompt(taskType, options)
    }
    
    static buildMessagesWithGlobalPrompt(customSystemPrompt, userContent) {
        return promptBuilder.buildMessages('custom', userContent, {
            additionalPrompt: customSystemPrompt
        })
    }
    
    static prependGlobalPrompt(messages) {
        return promptBuilder.prependGlobalPrompt(messages)
    }
    
    static getTemplatePrompt(taskType) {
        return getTemplatePrompt(taskType)
    }
    
    static getTemplateInfo(taskType) {
        return promptBuilder.getTemplateInfo(taskType)
    }
    
    static getAllTemplates() {
        return promptBuilder.getAllTemplateInfos()
    }
    
    static buildAnalysisPrompt(text, taskType, options = {}) {
        return promptBuilder.buildAnalysisPrompt(text, taskType, options)
    }
    
    static buildContinuePrompt(context, options = {}) {
        return promptBuilder.buildContinuePrompt(context, options)
    }
    
    static buildRewritePrompt(originalContent, requirements, options = {}) {
        return promptBuilder.buildRewritePrompt(originalContent, requirements, options)
    }
    
    static getExtensions(templateType = null) {
        if (templateType) {
            return ExtensionManager.getExtensionsByType(templateType)
        }
        return ExtensionManager.getAllExtensions()
    }
    
    static createExtension(options) {
        return ExtensionManager.createExtension(options)
    }
    
    static updateExtension(id, data) {
        return ExtensionManager.updateExtension(id, data)
    }
    
    static deleteExtension(id) {
        return ExtensionManager.deleteExtension(id)
    }
    
    static toggleExtension(id) {
        return ExtensionManager.toggleExtension(id)
    }
    
    static previewPrompt(taskType, options = {}) {
        return promptBuilder.previewPrompt(taskType, options)
    }
}

class ApiConfigManager {
    static getDefaultConfig() {
        return {
            apiUrl: 'https://api.deepseek.com/v1/chat/completions',
            modelId: 'deepseek-chat',
            maxTokens: 16000,
            temperature: 0.7
        }
    }
    
    static getMaxTokensLimits() {
        return {
            min: 16000,
            max: 20000,
            default: 16000
        }
    }
    
    static getApiConfig() {
        const data = localStorage.getItem(CONFIG_KEYS.API_CONFIG)
        if (data) {
            const config = JSON.parse(data)
            config.apiKey = this.decryptKey(config.apiKey)
            const limits = this.getMaxTokensLimits()
            config.maxTokens = Math.max(limits.min, Math.min(limits.max, config.maxTokens || limits.default))
            return config
        }
        return this.getDefaultConfig()
    }
    
    static setApiConfig(config) {
        const limits = this.getMaxTokensLimits()
        const clampedMaxTokens = Math.max(limits.min, Math.min(limits.max, config.maxTokens || limits.default))
        const data = {
            ...config,
            maxTokens: clampedMaxTokens,
            apiKey: this.encryptKey(config.apiKey),
            updatedAt: Date.now()
        }
        localStorage.setItem(CONFIG_KEYS.API_CONFIG, JSON.stringify(data))
        return true
    }
    
    static encryptKey(key) {
        if (!key) return ''
        return btoa(key.split('').reverse().join(''))
    }
    
    static decryptKey(encrypted) {
        if (!encrypted) return ''
        try {
            return atob(encrypted).split('').reverse().join('')
        } catch {
            return ''
        }
    }
    
    static maskKey(key) {
        if (!key || key.length < 8) return '****'
        return '****' + key.slice(-4)
    }
    
    static getActiveConfig() {
        return this.getApiConfig()
    }
    
    static validateConfig(config) {
        const errors = []
        
        if (!config.apiKey) {
            errors.push('API Key不能为空')
        }
        
        try {
            new URL(config.apiUrl)
        } catch {
            errors.push('API URL格式错误')
        }
        
        if (!config.modelId) {
            errors.push('模型ID不能为空')
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        }
    }
}

export { 
    ConfigManager, 
    ApiConfigManager, 
    DEFAULT_PROMPT,
    CONFIG_KEYS,
    PROMPT_TEMPLATES
}
