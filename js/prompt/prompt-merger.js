import { EXTENSION_TYPES } from './extension-manager.js'

class PromptMerger {
    static merge(basePrompt, extensions) {
        if (!extensions || extensions.length === 0) {
            return basePrompt
        }
        
        let mergedPrompt = basePrompt
        
        const sortedExtensions = [...extensions].sort((a, b) => {
            const order = {
                [EXTENSION_TYPES.ADD_DIMENSION]: 1,
                [EXTENSION_TYPES.FOCUS_AREA]: 2,
                [EXTENSION_TYPES.MODIFY_OUTPUT]: 3,
                [EXTENSION_TYPES.ADD_CONSTRAINT]: 4
            }
            return (order[a.extensionType] || 5) - (order[b.extensionType] || 5)
        })
        
        for (const ext of sortedExtensions) {
            if (!ext.enabled) continue
            
            switch (ext.extensionType) {
                case EXTENSION_TYPES.ADD_DIMENSION:
                    mergedPrompt = this.addDimension(mergedPrompt, ext)
                    break
                case EXTENSION_TYPES.MODIFY_OUTPUT:
                    mergedPrompt = this.modifyOutput(mergedPrompt, ext)
                    break
                case EXTENSION_TYPES.ADD_CONSTRAINT:
                    mergedPrompt = this.addConstraint(mergedPrompt, ext)
                    break
                case EXTENSION_TYPES.FOCUS_AREA:
                    mergedPrompt = this.addFocusArea(mergedPrompt, ext)
                    break
            }
        }
        
        return mergedPrompt
    }
    
    static addDimension(prompt, extension) {
        const content = extension.content
        
        const dimensionSection = `
### ${content.dimensionName || '新分析维度'}
${content.dimensionDescription || ''}
${content.outputField ? `输出字段：${content.outputField}` : ''}
${content.outputFormat ? `输出格式：${content.outputFormat}` : ''}
`
        
        const constraintMarker = '## 强制约束'
        if (prompt.includes(constraintMarker)) {
            return prompt.replace(constraintMarker, dimensionSection + '\n' + constraintMarker)
        }
        
        return prompt + '\n' + dimensionSection
    }
    
    static modifyOutput(prompt, extension) {
        const content = extension.content
        
        if (content.addField && content.fieldDefinition) {
            const fieldSection = `
### 附加输出字段
${content.fieldDefinition}
`
            const constraintMarker = '## 强制约束'
            if (prompt.includes(constraintMarker)) {
                return prompt.replace(constraintMarker, fieldSection + '\n' + constraintMarker)
            }
            
            return prompt + '\n' + fieldSection
        }
        
        return prompt
    }
    
    static addConstraint(prompt, extension) {
        const content = extension.content
        
        if (content.constraint) {
            const constraintMarker = '## 强制约束'
            if (prompt.includes(constraintMarker)) {
                const constraintText = `\n${content.constraint}`
                return prompt.replace(constraintMarker, constraintMarker + constraintText)
            }
            
            return prompt + '\n\n## 附加约束\n' + content.constraint
        }
        
        return prompt
    }
    
    static addFocusArea(prompt, extension) {
        const content = extension.content
        
        if (content.focusArea) {
            const focusSection = `
## 重点分析区域
${content.focusArea}
${content.priority ? `优先级：${content.priority}` : ''}
`
            
            const constraintMarker = '## 强制约束'
            if (prompt.includes(constraintMarker)) {
                return prompt.replace(constraintMarker, focusSection + '\n' + constraintMarker)
            }
            
            return prompt + '\n' + focusSection
        }
        
        return prompt
    }
    
    static mergeMultiple(basePrompt, extensionsList) {
        let result = basePrompt
        
        for (const extensions of extensionsList) {
            result = this.merge(result, extensions)
        }
        
        return result
    }
    
    static previewMerge(basePrompt, extensions) {
        const merged = this.merge(basePrompt, extensions)
        
        return {
            original: basePrompt,
            merged: merged,
            diff: this.calculateDiff(basePrompt, merged),
            addedSections: this.extractAddedSections(basePrompt, merged)
        }
    }
    
    static calculateDiff(original, merged) {
        const originalLines = original.split('\n').length
        const mergedLines = merged.split('\n').length
        
        return {
            addedLines: mergedLines - originalLines,
            addedPercentage: originalLines > 0 
                ? ((mergedLines - originalLines) / originalLines * 100).toFixed(1) 
                : 0
        }
    }
    
    static extractAddedSections(original, merged) {
        const sections = []
        const originalLines = new Set(original.split('\n'))
        const mergedLines = merged.split('\n')
        
        let currentSection = []
        let inSection = false
        
        for (const line of mergedLines) {
            if (!originalLines.has(line)) {
                if (!inSection) {
                    inSection = true
                    currentSection = []
                }
                currentSection.push(line)
            } else {
                if (inSection && currentSection.length > 0) {
                    sections.push(currentSection.join('\n'))
                    currentSection = []
                }
                inSection = false
            }
        }
        
        if (currentSection.length > 0) {
            sections.push(currentSection.join('\n'))
        }
        
        return sections
    }
}

export { PromptMerger }
