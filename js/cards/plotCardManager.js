import { CardStorage } from './cardStorage.js'

class PlotCardManager {
    constructor() {
        this.storage = new CardStorage('plot_cards')
        this.cards = []
        this.loadCards()
    }

    loadCards() {
        this.cards = this.storage.load() || []
        return this.cards
    }

    saveCards() {
        this.storage.save(this.cards)
    }

    createCard(data) {
        const card = {
            id: `plot_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: data.name || `剧情卡_${this.cards.length + 1}`,
            source: data.source || {},
            plot_overview: data.plot_overview || {},
            core_conflicts: data.core_conflicts || { internal: [], external: [] },
            foreshadowing: data.foreshadowing || [],
            chapter_summaries: data.chapter_summaries || [],
            continuation_constraints: data.continuation_constraints || [],
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            tags: data.tags || []
        }

        this.cards.push(card)
        this.saveCards()
        return card
    }

    getCard(id) {
        return this.cards.find(card => card.id === id)
    }

    updateCard(id, data) {
        const index = this.cards.findIndex(card => card.id === id)
        if (index !== -1) {
            this.cards[index] = {
                ...this.cards[index],
                ...data,
                updated_at: new Date().toISOString().split('T')[0]
            }
            this.saveCards()
            return this.cards[index]
        }
        return null
    }

    deleteCard(id) {
        const index = this.cards.findIndex(card => card.id === id)
        if (index !== -1) {
            this.cards.splice(index, 1)
            this.saveCards()
            return true
        }
        return false
    }

    getAllCards() {
        return this.cards
    }

    searchCards(keyword) {
        if (!keyword) return this.cards
        
        const lowerKeyword = keyword.toLowerCase()
        return this.cards.filter(card => 
            card.name.toLowerCase().includes(lowerKeyword) ||
            card.source?.novel_name?.toLowerCase().includes(lowerKeyword) ||
            card.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))
        )
    }

    exportCard(id) {
        const card = this.getCard(id)
        if (!card) {
            throw new Error('剧情卡不存在')
        }

        const blob = new Blob([JSON.stringify(card, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${card.name}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    async importCard(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result)
                    
                    if (!data.name) {
                        data.name = `导入的剧情卡_${Date.now()}`
                    }
                    
                    const card = this.createCard(data)
                    resolve(card)
                } catch (error) {
                    reject(new Error('导入失败：无效的JSON格式'))
                }
            }
            reader.onerror = () => reject(new Error('文件读取失败'))
            reader.readAsText(file)
        })
    }

    getCardForContinuation(id) {
        const card = this.getCard(id)
        if (!card) {
            return null
        }

        return {
            id: card.id,
            name: card.name,
            plot_overview: card.plot_overview,
            core_conflicts: card.core_conflicts,
            foreshadowing: card.foreshadowing,
            continuation_constraints: card.continuation_constraints,
            recent_chapters: card.chapter_summaries?.slice(-5) || []
        }
    }

    getCardCount() {
        return this.cards.length
    }

    getCardsByNovel(novelName) {
        return this.cards.filter(card => 
            card.source?.novel_name === novelName
        )
    }

    addTag(id, tag) {
        const card = this.getCard(id)
        if (card) {
            if (!card.tags.includes(tag)) {
                card.tags.push(tag)
                this.saveCards()
            }
            return card
        }
        return null
    }

    removeTag(id, tag) {
        const card = this.getCard(id)
        if (card) {
            const index = card.tags.indexOf(tag)
            if (index !== -1) {
                card.tags.splice(index, 1)
                this.saveCards()
            }
            return card
        }
        return null
    }

    duplicateCard(id) {
        const original = this.getCard(id)
        if (!original) return null
        
        const duplicate = {
            ...original,
            id: `plot_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${original.name} (副本)`,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0]
        }
        
        this.cards.push(duplicate)
        this.saveCards()
        return duplicate
    }

    clearAll() {
        this.cards = []
        this.storage.clear()
    }
}

const plotCardManager = new PlotCardManager()

export { PlotCardManager, plotCardManager }
