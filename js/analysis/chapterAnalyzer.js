import { apiClient } from '../api.js'
import { ConfigManager } from '../config.js'

export class ChapterAnalyzer {
    constructor() {
        this.analysisType = 'plot'
        this.customPrompt = null
    }
    
    setAnalysisType(type) {
        this.analysisType = type
    }
    
    setCustomPrompt(prompt) {
        this.customPrompt = prompt
    }
    
    async analyze(chapter) {
        const prompt = this.buildPrompt(chapter)
        
        const messages = ConfigManager.buildMessagesWithGlobalPrompt(
            this.getTaskInstructions(),
            prompt
        )
        
        const response = await apiClient.chat(messages, {
            maxTokens: 4096,
            temperature: 0.3
        })
        
        return this.parseResult(response)
    }
    
    getTaskInstructions() {
        return `你是一位专业的小说分析师。请分析章节内容，输出结构化JSON格式的分析结果。
请严格按照JSON格式输出，不要添加任何其他文字或说明。`
    }
    
    buildPrompt(chapter) {
        const basePrompt = this.getBasePrompt()
        
        return `${basePrompt}

## 待分析章节

章节：第${chapter.chapterNum}章 ${chapter.title || ''}
字数：${chapter.wordCount}字

## 章节原文

${chapter.content}

---

请按照上述要求输出JSON格式的分析结果。`
    }
    
    getBasePrompt() {
        if (this.customPrompt) {
            return this.customPrompt
        }
        
        switch (this.analysisType) {
            case 'plot':
                return this.getPlotAnalysisPrompt()
            case 'character':
                return this.getCharacterAnalysisPrompt()
            case 'style':
                return this.getStyleAnalysisPrompt()
            default:
                return this.getPlotAnalysisPrompt()
        }
    }
    
    getPlotAnalysisPrompt() {
        return `## 任务指令
逐章分析小说内容，每章分析严格遵循以下4点，每章不超过3句话，重点关联角色语言、肢体动作、衣着细节，贴合整体剧情逻辑。

## 核心分析维度（每章必写）

### 1. 章节主旨
- 1句话概括本章核心内容
- 示例：第5章：主角与配角初次相遇，因衣着差异产生误会，引发争执

### 2. 关键情节
- 本章推动剧情、塑造角色的核心事件
- 示例：主角因衣着破旧被配角轻视，争执中主角攥紧拳头、汗水滴落袖口，语气急促却不卑不亢

### 3. 角色表现
- 核心角色的语言、肢体动作、衣着变化
- 示例：配角身着锦缎长袍，说话傲慢，眉峰微挑；主角衣着破旧却脊背挺直，说话短促有力，指尖因用力而泛白

### 4. 章节作用
- 铺垫伏笔、推动冲突、塑造角色、过渡剧情
- 示例：本章铺垫主角与配角的核心矛盾，同时通过衣着、动作细节，强化两人的性格差异

## 固定输出格式（结构化JSON）

\`\`\`json
{
  "chapter_num": 章节号,
  "chapter_title": "章节标题",
  "summary": "章节主旨（1句话）",
  "key_events": ["关键情节1", "关键情节2"],
  "character_performances": [
    {
      "name": "角色名",
      "speech": "语言表现",
      "body_language": "肢体动作",
      "clothing_change": "衣着变化（如有）"
    }
  ],
  "chapter_function": ["铺垫伏笔", "推动冲突", "塑造角色"],
  "word_count": 字数
}
\`\`\`

## 强制约束
1. 每章分析不超过3句话
2. 重点关联角色语言、肢体动作、衣着细节
3. 输出纯JSON格式，不要包含其他说明`
    }
    
    getCharacterAnalysisPrompt() {
        return `## 任务指令
分析本章中出现的角色信息，提取角色表现特征。

## 核心分析维度

### 1. 角色识别
- 识别本章出现的所有角色

### 2. 角色表现
- 语言风格
- 肢体动作
- 情绪状态
- 衣着描述

## 固定输出格式（结构化JSON）

\`\`\`json
{
  "chapter_num": 章节号,
  "characters": [
    {
      "name": "角色名",
      "role_type": "主角/配角/路人",
      "speech_style": "语言风格",
      "body_language": ["动作1", "动作2"],
      "emotional_state": "情绪状态",
      "clothing": "衣着描述",
      "key_dialogues": ["关键对话1", "关键对话2"]
    }
  ]
}
\`\`\`

## 强制约束
1. 全程基于输入文本，不主观脑补
2. 输出纯JSON格式，不要包含其他说明`
    }
    
    getStyleAnalysisPrompt() {
        return `## 任务指令
分析本章的写作风格特征。

## 核心分析维度

### 1. 句式特征
- 长短句比例
- 常用句型

### 2. 描写特点
- 人物描写方式
- 环境描写特点

### 3. 语言风格
- 口语/书面语比例
- 高频词汇

## 固定输出格式（结构化JSON）

\`\`\`json
{
  "chapter_num": 章节号,
  "style_features": {
    "sentence_ratio": "长句X%+中句Y%+短句Z%",
    "description_style": "描写风格描述",
    "dialogue_style": "对话风格描述",
    "high_frequency_words": ["词汇1", "词汇2"],
    "rhetoric": ["修辞1", "修辞2"]
  }
}
\`\`\`

## 强制约束
1. 全程基于输入文本，不主观脑补
2. 输出纯JSON格式，不要包含其他说明`
    }
    
    parseResult(response) {
        try {
            let cleanText = response
            
            cleanText = cleanText.replace(/```json\s*/gi, '')
            cleanText = cleanText.replace(/```\s*/g, '')
            cleanText = cleanText.trim()
            
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0])
            }
            
            return { raw: response, parseError: '未能提取JSON' }
        } catch (error) {
            console.error('解析分析结果失败:', error)
            return { raw: response, error: error.message }
        }
    }
    
    validateResult(result) {
        if (!result) return { valid: false, error: '结果为空' }
        
        if (result.error || result.parseError) {
            return { valid: false, error: result.error || result.parseError }
        }
        
        switch (this.analysisType) {
            case 'plot':
                return this.validatePlotResult(result)
            case 'character':
                return this.validateCharacterResult(result)
            case 'style':
                return this.validateStyleResult(result)
            default:
                return { valid: true }
        }
    }
    
    validatePlotResult(result) {
        const required = ['summary', 'key_events', 'character_performances', 'chapter_function']
        const missing = required.filter(field => !result[field])
        
        if (missing.length > 0) {
            return { valid: false, error: `缺少必要字段: ${missing.join(', ')}` }
        }
        
        return { valid: true }
    }
    
    validateCharacterResult(result) {
        if (!result.characters || !Array.isArray(result.characters)) {
            return { valid: false, error: '缺少characters字段或格式错误' }
        }
        
        return { valid: true }
    }
    
    validateStyleResult(result) {
        if (!result.style_features) {
            return { valid: false, error: '缺少style_features字段' }
        }
        
        return { valid: true }
    }
}
