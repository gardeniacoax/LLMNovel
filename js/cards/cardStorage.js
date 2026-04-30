class CardStorage {
    constructor(storageKey) {
        this.storageKey = storageKey
    }

    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data))
            return true
        } catch (error) {
            console.error('存储失败:', error)
            return false
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey)
            return data ? JSON.parse(data) : null
        } catch (error) {
            console.error('加载失败:', error)
            return null
        }
    }

    clear() {
        localStorage.removeItem(this.storageKey)
    }

    exists() {
        return localStorage.getItem(this.storageKey) !== null
    }

    getSize() {
        const data = localStorage.getItem(this.storageKey)
        return data ? new Blob([data]).size : 0
    }

    exportToJson() {
        const data = this.load()
        if (!data) return null
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        return blob
    }

    async importFromJson(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result)
                    this.save(data)
                    resolve(data)
                } catch (error) {
                    reject(new Error('无效的JSON格式'))
                }
            }
            reader.onerror = () => reject(new Error('文件读取失败'))
            reader.readAsText(file)
        })
    }
}

export { CardStorage }
