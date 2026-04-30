import { WorkspaceManager } from './workspace.js'

const ROLE_CARD_KEY = 'novel_role_cards'

class RoleCardManager {
    static getRoleCards() {
        const roleCards = WorkspaceManager.getWorkspaceData('roleCards')
        return roleCards || []
    }
    
    static saveRoleCards(cards) {
        WorkspaceManager.setWorkspaceData('roleCards', cards)
    }
    
    static addRoleCard(card) {
        const cards = this.getRoleCards()
        const newCard = {
            id: this.generateId(),
            ...card,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        cards.push(newCard)
        this.saveRoleCards(cards)
        return newCard
    }
    
    static updateRoleCard(id, data) {
        const cards = this.getRoleCards()
        const index = cards.findIndex(c => c.id === id)
        if (index !== -1) {
            cards[index] = {
                ...cards[index],
                ...data,
                updatedAt: Date.now()
            }
            this.saveRoleCards(cards)
            return cards[index]
        }
        return null
    }
    
    static deleteRoleCard(id) {
        const cards = this.getRoleCards()
        const filtered = cards.filter(c => c.id !== id)
        this.saveRoleCards(filtered)
        return true
    }
    
    static searchRoleCards(keyword) {
        const cards = this.getRoleCards()
        if (!keyword) return cards
        
        const lower = keyword.toLowerCase()
        return cards.filter(card => 
            card.name.toLowerCase().includes(lower) ||
            (card.personality && card.personality.toLowerCase().includes(lower))
        )
    }
    
    static generateId() {
        return 'role_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }
    
    static importFromAnalysis(plotAnalysis) {
        if (!plotAnalysis || !plotAnalysis.characters) return []
        
        const cards = []
        plotAnalysis.characters.forEach(char => {
            cards.push({
                id: this.generateId(),
                name: char.name,
                appearance: char.appearance || '',
                personality: char.personality || '',
                relationships: char.relationships || [],
                plotChanges: char.plotChanges || [],
                bodyFeatures: '',
                background: '',
                catchphrases: [],
                taboos: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            })
        })
        
        this.saveRoleCards(cards)
        return cards
    }
    
    static exportRoleCards() {
        const cards = this.getRoleCards()
        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            cards: cards
        }
    }
    
    static importRoleCards(data) {
        if (!data || !data.cards || !Array.isArray(data.cards)) {
            throw new Error('无效的角色卡数据格式')
        }
        
        const cards = data.cards.map(card => ({
            ...card,
            id: card.id || this.generateId(),
            createdAt: card.createdAt || Date.now(),
            updatedAt: Date.now()
        }))
        
        this.saveRoleCards(cards)
        return cards
    }
}

export { RoleCardManager }
