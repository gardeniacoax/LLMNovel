import { ROLE_ANALYSIS_PROMPT } from '../prompt/role-templates.js'
import { apiClient } from '../api.js'
import { ConfigManager } from '../config.js'

class CharacterAnalyzer {
    constructor(config = {}) {
        this.config = config
        this.promptTemplate = ROLE_ANALYSIS_PROMPT
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
        
        const truncatedContent = this.truncateContent(content, 30000)
        
        let instruction = ''
        if (type === 'chapter') {
            instruction = '请输出本章角色表现分析结果（JSON格式），重点关注本章出现的角色，分析他们的语言、肢体动作、衣着变化等细节。'
        } else {
            instruction = '请输出完整角色分析结果（JSON格式），包括核心角色和次要角色的详细信息。'
        }
        
        const prompt = `${basePrompt}

## 待分析文本
\`\`\`
${truncatedContent}
\`\`\`

${instruction}`

        return prompt
    }

    async callAPI(prompt) {
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            '你是一位专业的小说角色分析师，擅长分析角色性格、行为逻辑、人物关系和成长轨迹。',
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
            console.error('解析角色分析结果失败:', error)
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

    mergeCharacterData(chapterResults) {
        const mergedData = {
            core_characters: [],
            minor_characters: []
        }
        
        const characterMap = new Map()
        
        for (const result of chapterResults) {
            if (!result || result.error) continue
            
            const coreChars = result.core_characters || []
            const minorChars = result.minor_characters || []
            
            for (const char of coreChars) {
                if (!characterMap.has(char.name)) {
                    characterMap.set(char.name, {
                        ...char,
                        appearances: 1
                    })
                } else {
                    const existing = characterMap.get(char.name)
                    existing.appearances++
                    this.mergeCharacterTraits(existing, char)
                }
            }
            
            for (const char of minorChars) {
                const existingMinor = mergedData.minor_characters.find(m => m.name === char.name)
                if (!existingMinor) {
                    mergedData.minor_characters.push(char)
                }
            }
        }
        
        mergedData.core_characters = Array.from(characterMap.values())
            .sort((a, b) => b.appearances - a.appearances)
            .slice(0, 5)
        
        return mergedData
    }

    mergeCharacterTraits(existing, newChar) {
        if (newChar.basic_traits) {
            existing.basic_traits = {
                ...existing.basic_traits,
                ...newChar.basic_traits
            }
        }
        
        if (newChar.relationships) {
            const existingTargets = new Set(existing.relationships.map(r => r.target))
            for (const rel of newChar.relationships) {
                if (!existingTargets.has(rel.target)) {
                    existing.relationships.push(rel)
                }
            }
        }
    }
}

export { CharacterAnalyzer }
