import { STYLE_ANALYSIS_PROMPT } from '../style/style-prompt.js'
import { apiClient } from '../api.js'
import { ConfigManager } from '../config.js'

class StyleAnalyzer {
    constructor(config = {}) {
        this.config = config
        this.promptTemplate = STYLE_ANALYSIS_PROMPT
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
            instruction = '请输出本章文风特征分析结果（JSON格式），重点关注本章的语言风格、句式特点、描写手法等。'
        } else {
            instruction = '请输出完整文风分析结果（JSON格式），提炼作者长期固定、贯穿全文的稳定写作习惯。'
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
            '你是一位专业的小说文风分析师，擅长分析作者的写作风格、语言习惯、叙事手法。',
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
            console.error('解析文风分析结果失败:', error)
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

    mergeStyleData(chapterResults) {
        const mergedData = {
            style_overview: '',
            dimensions: {},
            forbidden_list: {},
            mandatory_rules: [],
            sample_writing: '',
            core_anchors: []
        }
        
        const validResults = chapterResults.filter(r => r && !r.error)
        
        if (validResults.length === 0) {
            return mergedData
        }
        
        const wordings = []
        const sentenceStructures = []
        const punctuations = []
        const narratives = []
        const descriptions = []
        const emotions = []
        const signatures = []
        
        for (const result of validResults) {
            if (result.dimensions) {
                if (result.dimensions.wording) wordings.push(result.dimensions.wording)
                if (result.dimensions.sentence_structure) sentenceStructures.push(result.dimensions.sentence_structure)
                if (result.dimensions.punctuation) punctuations.push(result.dimensions.punctuation)
                if (result.dimensions.narrative) narratives.push(result.dimensions.narrative)
                if (result.dimensions.description) descriptions.push(result.dimensions.description)
                if (result.dimensions.emotion) emotions.push(result.dimensions.emotion)
                if (result.dimensions.signature) signatures.push(result.dimensions.signature)
            }
        }
        
        mergedData.dimensions = {
            wording: this.mergeWording(wordings),
            sentence_structure: this.mergeSentenceStructure(sentenceStructures),
            punctuation: this.mergePunctuation(punctuations),
            narrative: this.mergeNarrative(narratives),
            description: this.mergeDescription(descriptions),
            emotion: this.mergeEmotion(emotions),
            signature: this.mergeSignature(signatures)
        }
        
        const firstValid = validResults[0]
        mergedData.style_overview = firstValid.style_overview || ''
        mergedData.forbidden_list = firstValid.forbidden_list || {}
        mergedData.mandatory_rules = firstValid.mandatory_rules || []
        mergedData.sample_writing = firstValid.sample_writing || ''
        mergedData.core_anchors = firstValid.core_anchors || []
        
        return mergedData
    }

    mergeWording(wordings) {
        if (wordings.length === 0) return {}
        
        const merged = {
            formal_casual_ratio: '',
            high_frequency_words: { nouns: [], verbs: [], adjectives: [] },
            fixed_collocations: [],
            emotion_substitutes: {},
            forbidden_words: [],
            adjective_density: '',
            adverb_density: ''
        }
        
        const nouns = new Set()
        const verbs = new Set()
        const adjectives = new Set()
        const collocations = new Set()
        
        for (const w of wordings) {
            if (w.high_frequency_words) {
                if (w.high_frequency_words.nouns) w.high_frequency_words.nouns.forEach(n => nouns.add(n))
                if (w.high_frequency_words.verbs) w.high_frequency_words.verbs.forEach(v => verbs.add(v))
                if (w.high_frequency_words.adjectives) w.high_frequency_words.adjectives.forEach(a => adjectives.add(a))
            }
            if (w.fixed_collocations) w.fixed_collocations.forEach(c => collocations.add(c))
        }
        
        merged.high_frequency_words.nouns = Array.from(nouns).slice(0, 5)
        merged.high_frequency_words.verbs = Array.from(verbs).slice(0, 5)
        merged.high_frequency_words.adjectives = Array.from(adjectives).slice(0, 5)
        merged.fixed_collocations = Array.from(collocations).slice(0, 5)
        
        if (wordings[0]) {
            merged.formal_casual_ratio = wordings[0].formal_casual_ratio || ''
            merged.emotion_substitutes = wordings[0].emotion_substitutes || {}
            merged.forbidden_words = wordings[0].forbidden_words || []
            merged.adjective_density = wordings[0].adjective_density || ''
            merged.adverb_density = wordings[0].adverb_density || ''
        }
        
        return merged
    }

    mergeSentenceStructure(structures) {
        if (structures.length === 0) return {}
        return structures[0] || {}
    }

    mergePunctuation(punctuations) {
        if (punctuations.length === 0) return {}
        return punctuations[0] || {}
    }

    mergeNarrative(narratives) {
        if (narratives.length === 0) return {}
        return narratives[0] || {}
    }

    mergeDescription(descriptions) {
        if (descriptions.length === 0) return {}
        return descriptions[0] || {}
    }

    mergeEmotion(emotions) {
        if (emotions.length === 0) return {}
        return emotions[0] || {}
    }

    mergeSignature(signatures) {
        if (signatures.length === 0) return {}
        return signatures[0] || {}
    }
}

export { StyleAnalyzer }
