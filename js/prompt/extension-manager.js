const EXTENSION_KEYS = {
    EXTENSIONS: 'novel_prompt_extensions'
}

const EXTENSION_TYPES = {
    ADD_DIMENSION: 'add_dimension',
    MODIFY_OUTPUT: 'modify_output',
    ADD_CONSTRAINT: 'add_constraint',
    FOCUS_AREA: 'focus_area'
}

class ExtensionManager {
    static generateExtensionId() {
        return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    static getDefaultExtensions() {
        return []
    }
    
    static getAllExtensions() {
        const data = localStorage.getItem(EXTENSION_KEYS.EXTENSIONS)
        return data ? JSON.parse(data) : this.getDefaultExtensions()
    }
    
    static setAllExtensions(extensions) {
        localStorage.setItem(EXTENSION_KEYS.EXTENSIONS, JSON.stringify(extensions))
    }
    
    static getExtensionsByType(templateType) {
        const extensions = this.getAllExtensions()
        return extensions.filter(ext => ext.templateType === templateType && ext.enabled)
    }
    
    static getExtension(id) {
        const extensions = this.getAllExtensions()
        return extensions.find(ext => ext.id === id) || null
    }
    
    static createExtension(options) {
        const extension = {
            id: this.generateExtensionId(),
            name: options.name || '新扩展',
            description: options.description || '',
            templateType: options.templateType,
            extensionType: options.extensionType || EXTENSION_TYPES.ADD_DIMENSION,
            content: options.content || {},
            enabled: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        
        const extensions = this.getAllExtensions()
        extensions.push(extension)
        this.setAllExtensions(extensions)
        
        return extension
    }
    
    static updateExtension(id, data) {
        const extensions = this.getAllExtensions()
        const index = extensions.findIndex(ext => ext.id === id)
        
        if (index === -1) return false
        
        const protectedFields = ['id', 'createdAt']
        protectedFields.forEach(field => {
            if (data[field] !== undefined) {
                delete data[field]
            }
        })
        
        extensions[index] = {
            ...extensions[index],
            ...data,
            updatedAt: Date.now()
        }
        
        this.setAllExtensions(extensions)
        return true
    }
    
    static deleteExtension(id) {
        const extensions = this.getAllExtensions()
        const filtered = extensions.filter(ext => ext.id !== id)
        
        if (filtered.length === extensions.length) return false
        
        this.setAllExtensions(filtered)
        return true
    }
    
    static toggleExtension(id) {
        const extension = this.getExtension(id)
        if (!extension) return false
        
        return this.updateExtension(id, { enabled: !extension.enabled })
    }
    
    static enableExtension(id) {
        return this.updateExtension(id, { enabled: true })
    }
    
    static disableExtension(id) {
        return this.updateExtension(id, { enabled: false })
    }
    
    static duplicateExtension(id) {
        const original = this.getExtension(id)
        if (!original) return null
        
        return this.createExtension({
            name: original.name + ' (副本)',
            description: original.description,
            templateType: original.templateType,
            extensionType: original.extensionType,
            content: { ...original.content }
        })
    }
    
    static importExtensions(extensionsData) {
        if (!Array.isArray(extensionsData)) {
            throw new Error('无效的扩展数据格式')
        }
        
        const extensions = this.getAllExtensions()
        
        for (const ext of extensionsData) {
            const newExt = {
                ...ext,
                id: this.generateExtensionId(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
            extensions.push(newExt)
        }
        
        this.setAllExtensions(extensions)
        return extensionsData.length
    }
    
    static exportExtensions(templateType = null) {
        const extensions = this.getAllExtensions()
        
        if (templateType) {
            return extensions.filter(ext => ext.templateType === templateType)
        }
        
        return extensions
    }
    
    static clearAllExtensions() {
        this.setAllExtensions([])
        return true
    }
    
    static getExtensionStats() {
        const extensions = this.getAllExtensions()
        
        return {
            total: extensions.length,
            enabled: extensions.filter(e => e.enabled).length,
            disabled: extensions.filter(e => !e.enabled).length,
            byType: this.countByField(extensions, 'templateType'),
            byExtensionType: this.countByField(extensions, 'extensionType')
        }
    }
    
    static countByField(extensions, field) {
        const counts = {}
        extensions.forEach(ext => {
            const value = ext[field]
            counts[value] = (counts[value] || 0) + 1
        })
        return counts
    }
    
    static validateExtension(extension) {
        const errors = []
        
        if (!extension.name || extension.name.trim() === '') {
            errors.push('扩展名称不能为空')
        }
        
        if (!extension.templateType) {
            errors.push('必须指定模板类型')
        }
        
        if (!extension.extensionType) {
            errors.push('必须指定扩展类型')
        }
        
        if (!extension.content || Object.keys(extension.content).length === 0) {
            errors.push('扩展内容不能为空')
        }
        
        return errors
    }
}

export {
    ExtensionManager,
    EXTENSION_KEYS,
    EXTENSION_TYPES
}
