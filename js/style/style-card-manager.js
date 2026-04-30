const STORAGE_KEYS = {
    STYLE_CARDS: 'novel_style_cards',
    STYLE_CARD_PREFIX: 'novel_style_card_'
}

class StyleCardManager {
    static generateCardId() {
        return `style_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    static getCardLibrary() {
        const data = localStorage.getItem(STORAGE_KEYS.STYLE_CARDS)
        return data ? JSON.parse(data) : { version: '1.0', cards: [] }
    }
    
    static saveCardLibrary(library) {
        localStorage.setItem(STORAGE_KEYS.STYLE_CARDS, JSON.stringify(library))
    }
    
    static createCard(options) {
        const library = this.getCardLibrary()
        
        const card = {
            id: this.generateCardId(),
            name: options.name || '新文风卡',
            author: options.author || '未知作者',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: options.source || {
                novelName: '',
                wordCount: 0,
                analyzedAt: Date.now()
            },
            style: options.style || {},
            customExtensions: {
                focusWeights: options.focusWeights || {},
                customConstraints: options.customConstraints || []
            },
            usage: {
                usageCount: 0,
                lastUsedAt: null,
                usedInWorkspaces: []
            }
        }
        
        library.cards.push({
            id: card.id,
            name: card.name,
            author: card.author,
            createdAt: card.createdAt,
            usageCount: 0
        })
        
        this.saveCardLibrary(library)
        localStorage.setItem(STORAGE_KEYS.STYLE_CARD_PREFIX + card.id, JSON.stringify(card))
        
        return card
    }
    
    static getCard(cardId) {
        const data = localStorage.getItem(STORAGE_KEYS.STYLE_CARD_PREFIX + cardId)
        return data ? JSON.parse(data) : null
    }
    
    static getAllCards() {
        const library = this.getCardLibrary()
        return library.cards
    }
    
    static updateCard(cardId, updates) {
        const card = this.getCard(cardId)
        if (!card) return null
        
        const protectedFields = ['id', 'createdAt']
        protectedFields.forEach(field => {
            if (updates[field] !== undefined) {
                delete updates[field]
            }
        })
        
        Object.assign(card, updates)
        card.updatedAt = Date.now()
        
        localStorage.setItem(STORAGE_KEYS.STYLE_CARD_PREFIX + cardId, JSON.stringify(card))
        
        const library = this.getCardLibrary()
        const index = library.cards.findIndex(c => c.id === cardId)
        if (index !== -1) {
            library.cards[index].name = card.name
            library.cards[index].author = card.author
            this.saveCardLibrary(library)
        }
        
        return card
    }
    
    static deleteCard(cardId) {
        const library = this.getCardLibrary()
        library.cards = library.cards.filter(c => c.id !== cardId)
        this.saveCardLibrary(library)
        
        localStorage.removeItem(STORAGE_KEYS.STYLE_CARD_PREFIX + cardId)
        
        return true
    }
    
    static recordUsage(cardId, workspaceId) {
        const card = this.getCard(cardId)
        if (!card) return false
        
        card.usage.usageCount++
        card.usage.lastUsedAt = Date.now()
        if (workspaceId && !card.usage.usedInWorkspaces.includes(workspaceId)) {
            card.usage.usedInWorkspaces.push(workspaceId)
        }
        
        localStorage.setItem(STORAGE_KEYS.STYLE_CARD_PREFIX + cardId, JSON.stringify(card))
        
        const library = this.getCardLibrary()
        const index = library.cards.findIndex(c => c.id === cardId)
        if (index !== -1) {
            library.cards[index].usageCount = card.usage.usageCount
            this.saveCardLibrary(library)
        }
        
        return true
    }
    
    static exportCard(cardId) {
        const card = this.getCard(cardId)
        if (!card) return null
        
        return JSON.stringify(card, null, 2)
    }
    
    static importCard(jsonString) {
        try {
            const card = JSON.parse(jsonString)
            
            if (!card.style || !card.name) {
                throw new Error('无效的文风卡格式')
            }
            
            const newCard = this.createCard({
                name: card.name + ' (导入)',
                author: card.author || '未知作者',
                source: card.source || {},
                style: card.style,
                focusWeights: card.customExtensions?.focusWeights || {},
                customConstraints: card.customExtensions?.customConstraints || []
            })
            
            return newCard
        } catch (error) {
            console.error('导入文风卡失败:', error)
            return null
        }
    }
    
    static exportAllCards() {
        const library = this.getCardLibrary()
        const cards = []
        
        for (const cardMeta of library.cards) {
            const card = this.getCard(cardMeta.id)
            if (card) {
                cards.push(card)
            }
        }
        
        return JSON.stringify({
            version: '1.0',
            exportedAt: Date.now(),
            cards: cards
        }, null, 2)
    }
    
    static importMultipleCards(jsonString) {
        try {
            const data = JSON.parse(jsonString)
            
            if (!data.cards || !Array.isArray(data.cards)) {
                throw new Error('无效的文风卡集合格式')
            }
            
            const imported = []
            for (const card of data.cards) {
                const newCard = this.createCard({
                    name: card.name,
                    author: card.author || '未知作者',
                    source: card.source || {},
                    style: card.style,
                    focusWeights: card.customExtensions?.focusWeights || {},
                    customConstraints: card.customExtensions?.customConstraints || []
                })
                imported.push(newCard)
            }
            
            return imported
        } catch (error) {
            console.error('批量导入文风卡失败:', error)
            return []
        }
    }
    
    static searchCards(query) {
        const library = this.getCardLibrary()
        const lowerQuery = query.toLowerCase()
        
        return library.cards.filter(card => 
            card.name.toLowerCase().includes(lowerQuery) ||
            card.author.toLowerCase().includes(lowerQuery)
        )
    }
    
    static getCardStats() {
        const library = this.getCardLibrary()
        
        return {
            total: library.cards.length,
            totalUsage: library.cards.reduce((sum, c) => sum + (c.usageCount || 0), 0)
        }
    }
    
    static duplicateCard(cardId) {
        const original = this.getCard(cardId)
        if (!original) return null
        
        return this.createCard({
            name: original.name + ' (副本)',
            author: original.author,
            source: original.source,
            style: JSON.parse(JSON.stringify(original.style)),
            focusWeights: JSON.parse(JSON.stringify(original.customExtensions?.focusWeights || {})),
            customConstraints: [...(original.customExtensions?.customConstraints || [])]
        })
    }
    
    static clearAllCards() {
        const library = this.getCardLibrary()
        
        for (const card of library.cards) {
            localStorage.removeItem(STORAGE_KEYS.STYLE_CARD_PREFIX + card.id)
        }
        
        this.saveCardLibrary({ version: '1.0', cards: [] })
        return true
    }
}

export { StyleCardManager, STORAGE_KEYS }
