import { PLOT_ANALYSIS_PROMPT, CHAPTER_ANALYSIS_PROMPT } from '../prompt/templates.js'
import { apiClient } from '../api.js'
import { ConfigManager } from '../config.js'

class PlotAnalyzer {
    constructor(config = {}) {
        this.config = config
        this.promptTemplate = PLOT_ANALYSIS_PROMPT
        this.chapterPromptTemplate = CHAPTER_ANALYSIS_PROMPT
        this.customPrompt = null
    }

    async analyzeChapter(content) {
        const prompt = this.buildPrompt(content, 'chapter')
        const response = await this.callAPI(prompt)
        return this.parseResponse(response)
    }

    async analyzeOverall(content) {
        const prompt = this.buildPrompt(content, 'overall')
        const response = await this.callAPI(prompt)
        return this.parseResponse(response)
    }

    buildPrompt(content, type) {
        let basePrompt = this.customPrompt 
            ? this.customPrompt + '\n\n' + this.promptTemplate 
            : this.promptTemplate
        
        if (type === 'chapter') {
            basePrompt = this.customPrompt
                ? this.customPrompt + '\n\n' + this.chapterPromptTemplate
                : this.chapterPromptTemplate
        }
        
        const truncatedContent = this.truncateContent(content, 30000)
        
        const prompt = `${basePrompt}

## 待分析文本
\`\`\`
${truncatedContent}
\`\`\`

请输出${type === 'chapter' ? '单章节剧情分析' : '完整剧情分析'}结果（JSON格式）。`

        return prompt
    }

    async callAPI(prompt) {
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            '你是一位专业的小说剧情分析师，擅长分析剧情脉络、角色关系、伏笔铺垫。',
            prompt
        )
        
        const response = await apiClient.request(messages, {
            maxTokens: 4096,
            temperature: 0.7
        })
        
        return response.choices[0].message.content.trim()
    }

    parseResponse(response) {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1])
            }
            
            const jsonObject = this.extractJsonObject(response)
            if (jsonObject) {
                return jsonObject
            }
            
            return JSON.parse(response)
        } catch (error) {
            console.error('解析剧情分析结果失败:', error)
            return {
                error: '解析失败',
                raw_response: response,
                parse_error: error.message
            }
        }
    }

    extractJsonObject(text) {
        let depth = 0
        let start = -1
        
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
                if (depth === 0) {
                    start = i
                }
                depth++
            } else if (text[i] === '}') {
                depth--
                if (depth === 0 && start !== -1) {
                    const jsonStr = text.substring(start, i + 1)
                    try {
                        return JSON.parse(jsonStr)
                    } catch (e) {
                        // 继续查找
                    }
                    start = -1
                }
            }
        }
        
        return null
    }

    truncateContent(content, maxLength) {
        if (content.length <= maxLength) {
            return content
        }
        return content.slice(0, maxLength) + '\n...（内容已截断）'
    }

    setCustomPrompt(customPrompt) {
        this.customPrompt = customPrompt
    }

    getPromptTemplate() {
        return this.promptTemplate
    }

    getChapterPromptTemplate() {
        return this.chapterPromptTemplate
    }
}

export { PlotAnalyzer }
