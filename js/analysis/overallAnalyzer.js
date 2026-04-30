import { apiClient } from '../api.js'
import { ConfigManager } from '../config.js'

export class OverallAnalyzer {
    constructor() {
        this.maxChaptersForDirectAnalysis = 20
    }
    
    async analyze(chapters, chapterAnalyses, analysisType) {
        if (analysisType === 'plot') {
            return await this.analyzeOverallPlot(chapters, chapterAnalyses)
        } else if (analysisType === 'character') {
            return await this.analyzeOverallCharacter(chapters, chapterAnalyses)
        } else if (analysisType === 'style') {
            return await this.analyzeOverallStyle(chapters, chapterAnalyses)
        }
        
        return await this.analyzeOverallPlot(chapters, chapterAnalyses)
    }
    
    async analyzeOverallPlot(chapters, chapterAnalyses) {
        const chapterSummaries = Object.values(chapterAnalyses).map(analysis => ({
            chapterNum: analysis.chapterNum,
            title: analysis.title,
            summary: analysis.analysisResult?.summary || '',
            keyEvents: analysis.analysisResult?.key_events || [],
            chapterFunction: analysis.analysisResult?.chapter_function || []
        }))
        
        const prompt = this.buildOverallPlotPrompt(chapters, chapterSummaries)
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            this.getTaskInstructions(),
            prompt
        )
        
        const response = await apiClient.chat(messages, {
            maxTokens: 8192,
            temperature: 0.3
        })
        
        return this.parseOverallPlotResult(response)
    }
    
    getTaskInstructions() {
        return `你是一位专业的小说分析师。请分析小说整体剧情，输出结构化JSON格式的分析结果。
请严格按照JSON格式输出，不要添加任何其他文字或说明。`
    }
    
    buildOverallPlotPrompt(chapters, chapterSummaries) {
        const summaryText = chapterSummaries.map(s => 
            `第${s.chapterNum}章：${s.summary}\n关键情节：${s.keyEvents.join('；')}\n章节作用：${s.chapterFunction.join('、')}`
        ).join('\n\n')
        
        return `## 任务指令
基于以下章节分析数据，生成小说整体剧情分析报告。

## 章节分析数据

${summaryText}

## 分析要求

请生成以下内容：

### 1. 核心剧情脉络
- 开端：故事开始的状态和背景
- 发展：主要情节推进过程
- 高潮：冲突最激烈的部分
- 当前进度：故事发展到哪里

### 2. 核心冲突
- 内在冲突：角色内心的挣扎
- 外在冲突：角色间的矛盾

### 3. 剧情伏笔与铺垫
- 识别已埋下的伏笔
- 预期揭示方式

### 4. 剧情基调与核心主题

## 输出格式（JSON）

\`\`\`json
{
  "plot_overview": {
    "opening": "开端描述",
    "development": "发展描述",
    "climax": "高潮描述",
    "current_progress": "当前进度",
    "completion_percentage": 65
  },
  "core_conflicts": {
    "internal": [
      {
        "character": "角色名",
        "conflict": "内心冲突描述",
        "manifestation": "表现形式"
      }
    ],
    "external": [
      {
        "parties": ["冲突双方"],
        "conflict_type": "矛盾类型",
        "description": "冲突描述"
      }
    ]
  },
  "foreshadowing": [
    {
      "id": 1,
      "hint": "伏笔内容",
      "source_chapter": 3,
      "expected_resolution": "预期揭示方式"
    }
  ],
  "tone_and_theme": {
    "tone": ["悬疑", "温情"],
    "core_themes": ["救赎与成长"],
    "evidence": "原文细节佐证"
  },
  "continuation_constraints": [
    "禁止偏离主角性格"
  ]
}
\`\`\``
    }
    
    parseOverallPlotResult(response) {
        try {
            let cleanText = response
            
            cleanText = cleanText.replace(/```json\s*/gi, '')
            cleanText = cleanText.replace(/```\s*/g, '')
            cleanText = cleanText.trim()
            
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0])
            }
            return { raw: response }
        } catch (error) {
            console.error('解析整体剧情分析失败:', error)
            return { raw: response, error: error.message }
        }
    }
    
    async analyzeOverallCharacter(chapters, chapterAnalyses) {
        const characterData = this.aggregateCharacterData(chapterAnalyses)
        
        const prompt = this.buildOverallCharacterPrompt(characterData)
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            this.getTaskInstructions(),
            prompt
        )
        
        const response = await apiClient.chat(messages, {
            maxTokens: 8192,
            temperature: 0.3
        })
        
        return this.parseCharacterResult(response)
    }
    
    aggregateCharacterData(chapterAnalyses) {
        const characterMap = new Map()
        
        Object.values(chapterAnalyses).forEach(analysis => {
            const characters = analysis.analysisResult?.characters || 
                              analysis.analysisResult?.character_performances || []
            
            characters.forEach(char => {
                const name = char.name
                if (!name) return
                
                if (!characterMap.has(name)) {
                    characterMap.set(name, {
                        name: name,
                        appearances: [],
                        speeches: [],
                        actions: [],
                        emotionalStates: [],
                        clothing: []
                    })
                }
                
                const data = characterMap.get(name)
                data.appearances.push(analysis.chapterNum)
                if (char.speech || char.speech_style) {
                    data.speeches.push(char.speech || char.speech_style)
                }
                if (char.body_language) {
                    if (Array.isArray(char.body_language)) {
                        data.actions.push(...char.body_language)
                    } else {
                        data.actions.push(char.body_language)
                    }
                }
                if (char.emotional_state) {
                    data.emotionalStates.push(char.emotional_state)
                }
                if (char.clothing || char.clothing_change) {
                    data.clothing.push(char.clothing || char.clothing_change)
                }
            })
        })
        
        return Array.from(characterMap.values())
    }
    
    buildOverallCharacterPrompt(characterData) {
        const characterText = characterData.map(c => 
            `角色：${c.name}\n出场章节：${c.appearances.join('、')}\n语言风格：${c.speeches.join('；') || '暂无'}\n动作特点：${c.actions.join('、') || '暂无'}`
        ).join('\n\n')
        
        return `## 任务指令
基于以下角色数据，生成角色分析报告。

## 角色数据

${characterText}

## 输出格式（JSON）

\`\`\`json
{
  "core_characters": [
    {
      "name": "角色名",
      "role_type": "主角/配角",
      "personality": "性格描述",
      "speech_habit": "语言习惯",
      "body_language": ["动作特点"],
      "appearances": 章节数,
      "growth_arc": "成长轨迹"
    }
  ],
  "minor_characters": [
    {
      "name": "角色名",
      "function": "功能描述"
    }
  ]
}
\`\`\`

## 强制约束
1. 全程基于输入数据，不主观脑补
2. 输出纯JSON格式，不要包含其他说明`
    }
    
    parseCharacterResult(response) {
        try {
            let cleanText = response
            
            cleanText = cleanText.replace(/```json\s*/gi, '')
            cleanText = cleanText.replace(/```\s*/g, '')
            cleanText = cleanText.trim()
            
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0])
            }
            return { raw: response }
        } catch (error) {
            return { raw: response, error: error.message }
        }
    }
    
    async analyzeOverallStyle(chapters, chapterAnalyses) {
        const styleData = this.aggregateStyleData(chapterAnalyses)
        
        const prompt = this.buildOverallStylePrompt(styleData)
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            this.getTaskInstructions(),
            prompt
        )
        
        const response = await apiClient.chat(messages, {
            maxTokens: 8192,
            temperature: 0.3
        })
        
        return this.parseStyleResult(response)
    }
    
    aggregateStyleData(chapterAnalyses) {
        const styleFeatures = []
        
        Object.values(chapterAnalyses).forEach(analysis => {
            if (analysis.analysisResult?.style_features) {
                styleFeatures.push(analysis.analysisResult.style_features)
            }
        })
        
        return styleFeatures
    }
    
    buildOverallStylePrompt(styleData) {
        const styleText = styleData.map((s, i) => 
            `第${i + 1}章风格：\n句式比例：${s.sentence_ratio || '暂无'}\n描写风格：${s.description_style || '暂无'}\n高频词：${(s.high_frequency_words || []).join('、') || '暂无'}`
        ).join('\n\n')
        
        return `## 任务指令
基于以下章节风格数据，生成整体文风分析报告。

## 风格数据

${styleText}

## 输出格式（JSON）

\`\`\`json
{
  "style_overview": "文风总括",
  "dimensions": {
    "wording": {
      "formal_casual_ratio": "书面/口语比例",
      "high_frequency_words": ["高频词"],
      "forbidden_words": ["禁用词"]
    },
    "sentence_structure": {
      "length_ratio": "长短句比例",
      "common_patterns": ["常用句型"]
    },
    "description": {
      "character": "人物描写特点",
      "environment": "环境描写特点"
    }
  },
  "forbidden_list": {
    "words": ["禁止词汇"],
    "sentence_patterns": ["禁止句式"]
  },
  "mandatory_rules": [
    "必须遵守规则1",
    "必须遵守规则2"
  ]
}
\`\`\`

## 强制约束
1. 全程基于输入数据，不主观脑补
2. 输出纯JSON格式，不要包含其他说明`
    }
    
    parseStyleResult(response) {
        try {
            let cleanText = response
            
            cleanText = cleanText.replace(/```json\s*/gi, '')
            cleanText = cleanText.replace(/```\s*/g, '')
            cleanText = cleanText.trim()
            
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0])
            }
            return { raw: response }
        } catch (error) {
            return { raw: response, error: error.message }
        }
    }
}
