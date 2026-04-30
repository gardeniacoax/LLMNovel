import { StyleCardManager } from './style-card-manager.js'
import { WorkspaceDataManager } from '../workspace.js'

class StyleCardApplier {
    static applyToWorkspace(cardId, workspaceId) {
        const card = StyleCardManager.getCard(cardId)
        if (!card) {
            return { success: false, error: '文风卡不存在' }
        }
        
        const meta = WorkspaceDataManager.getWorkspaceMeta(workspaceId)
        if (!meta) {
            return { success: false, error: '工作台不存在' }
        }
        
        meta.styleCard = {
            id: cardId,
            name: card.name,
            author: card.author,
            appliedAt: Date.now()
        }
        
        WorkspaceDataManager.setWorkspaceMeta(workspaceId, meta)
        StyleCardManager.recordUsage(cardId, workspaceId)
        
        return { success: true, card: card }
    }
    
    static removeFromWorkspace(workspaceId) {
        const meta = WorkspaceDataManager.getWorkspaceMeta(workspaceId)
        if (!meta) return false
        
        delete meta.styleCard
        WorkspaceDataManager.setWorkspaceMeta(workspaceId, meta)
        
        return true
    }
    
    static getWorkspaceStyleCard(workspaceId) {
        const meta = WorkspaceDataManager.getWorkspaceMeta(workspaceId)
        if (!meta || !meta.styleCard) return null
        
        return StyleCardManager.getCard(meta.styleCard.id)
    }
    
    static buildStylePrompt(cardId) {
        const card = StyleCardManager.getCard(cardId)
        if (!card) return ''
        
        const style = card.style
        
        if (!style.dimensions) {
            return this.buildSimpleStylePrompt(style)
        }
        
        let prompt = `## 文风规则（必须严格遵守）

### 文风概述
${style.style_overview || '无'}

### 遣词用词
`
        
        if (style.dimensions.wording) {
            const w = style.dimensions.wording
            prompt += `- 书面/口语比例：${w.formal_casual_ratio || '未指定'}
- 高频词汇：${(w.high_frequency_words || []).join('、')}
- 固定搭配：${(w.fixed_collocations || []).join('、')}
- 禁用词汇：${(w.forbidden_words || []).join('、')}
- 形容词密度：${w.adjective_density || '未指定'}
`
        }
        
        prompt += `
### 句式节奏
`
        
        if (style.dimensions.sentence_structure) {
            const s = style.dimensions.sentence_structure
            prompt += `- 长短句比例：${s.length_ratio || '未指定'}
- 惯用句型：${(s.common_patterns || []).join('；')}
- 连接词偏好：${(s.conjunctions || []).join('、')}
- 语序特征：${s.word_order || '未指定'}
- 段落长度：${s.paragraph_length || '未指定'}
`
        }
        
        prompt += `
### 标点习惯
`
        
        if (style.dimensions.punctuation) {
            const p = style.dimensions.punctuation
            prompt += `- 省略号用法：${p.ellipsis_usage || '未指定'}
- 停顿逻辑：${p.pause_logic || '未指定'}
- 禁用组合：${(p.forbidden_combos || []).join('、')}
`
        }
        
        prompt += `
### 叙事手法
`
        
        if (style.dimensions.narrative) {
            const n = style.dimensions.narrative
            prompt += `- 叙事视角：${n.perspective || '未指定'}
- 视角切换：${n.perspective_switch || '无'}
- 节奏控制：${n.pacing || '未指定'}
- 插叙习惯：${n.flashback || '未指定'}
`
        }
        
        prompt += `
### 描写风格
`
        
        if (style.dimensions.description) {
            const d = style.dimensions.description
            if (d.character) {
                prompt += `- 肢体动作：${(d.character.body_language || []).join('、')}
- 外貌侧重：${d.character.appearance || '未指定'}
- 衣着风格：${d.character.clothing || '未指定'}
`
            }
            if (d.environment) {
                prompt += `- 感官偏好：${d.environment.sensory_preference || '未指定'}
- 氛围烘托：${d.environment.atmosphere_logic || '未指定'}
`
            }
        }
        
        prompt += `
### 情感表达
`
        
        if (style.dimensions.emotion) {
            const e = style.dimensions.emotion
            prompt += `- 整体基调：${e.tone || '未指定'}
- 表达方式：${e.expression || '未指定'}
- 情绪收束：${e.closure || '未指定'}
`
        }
        
        prompt += `
### 作者烙印
`
        
        if (style.dimensions.signature) {
            const sig = style.dimensions.signature
            prompt += `- 专属动作：${(sig.trademark_actions || []).join('、')}
- 专属结尾：${(sig.trademark_endings || []).join('；')}
- 高频语气词：${(sig.common_particles || []).join('、')}
- 差异化特征：${sig.differentiation || '无'}
`
        }
        
        prompt += `
### 禁止事项
`
        
        if (style.forbidden_list) {
            const f = style.forbidden_list
            prompt += `- 禁用词汇：${(f.words || []).join('、')}
- 禁用句式：${(f.sentence_patterns || []).join('、')}
- 禁用修辞：${(f.rhetoric || []).join('、')}
- 禁用语调：${(f.tone || []).join('、')}
`
        }
        
        prompt += `
### 强制规则
${(style.mandatory_rules || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}

### 核心锚点
${(style.core_anchors || []).join('、')}
`
        
        if (card.customExtensions && card.customExtensions.customConstraints && card.customExtensions.customConstraints.length > 0) {
            prompt += `
### 自定义约束
${card.customExtensions.customConstraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}
`
        }
        
        return prompt
    }
    
    static buildSimpleStylePrompt(style) {
        let prompt = `## 文风规则\n\n`
        
        if (style.style_overview) {
            prompt += `### 文风概述\n${style.style_overview}\n\n`
        }
        
        if (style.mandatory_rules && style.mandatory_rules.length > 0) {
            prompt += `### 强制规则\n${style.mandatory_rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n`
        }
        
        if (style.forbidden_list) {
            prompt += `### 禁止事项\n`
            if (style.forbidden_list.words) {
                prompt += `- 禁用词汇：${style.forbidden_list.words.join('、')}\n`
            }
            if (style.forbidden_list.tone) {
                prompt += `- 禁用语调：${style.forbidden_list.tone.join('、')}\n`
            }
        }
        
        return prompt
    }
    
    static buildStylePromptForWorkspace(workspaceId) {
        const card = this.getWorkspaceStyleCard(workspaceId)
        if (!card) return ''
        
        return this.buildStylePrompt(card.id)
    }
    
    static getStyleCardPreview(cardId) {
        const card = StyleCardManager.getCard(cardId)
        if (!card) return null
        
        return {
            id: card.id,
            name: card.name,
            author: card.author,
            overview: card.style?.style_overview || '无概述',
            mandatoryRulesCount: (card.style?.mandatory_rules || []).length,
            forbiddenItemsCount: Object.values(card.style?.forbidden_list || {}).flat().length,
            usageCount: card.usage?.usageCount || 0,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt
        }
    }
    
    static validateStyleCard(cardId) {
        const card = StyleCardManager.getCard(cardId)
        if (!card) {
            return { valid: false, errors: ['文风卡不存在'] }
        }
        
        const errors = []
        
        if (!card.name || card.name.trim() === '') {
            errors.push('文风卡名称不能为空')
        }
        
        if (!card.style) {
            errors.push('文风数据不能为空')
        } else {
            if (!card.style.style_overview) {
                errors.push('文风概述不能为空')
            }
            
            if (!card.style.dimensions || Object.keys(card.style.dimensions).length === 0) {
                errors.push('至少需要一个分析维度')
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        }
    }
}

export { StyleCardApplier }
