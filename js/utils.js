class Utils {
    static debounce(func, wait) {
        let timer = null
        return function(...args) {
            clearTimeout(timer)
            timer = setTimeout(() => func.apply(this, args), wait)
        }
    }
    
    static throttle(func, limit) {
        let inThrottle = false
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args)
                inThrottle = true
                setTimeout(() => inThrottle = false, limit)
            }
        }
    }
    
    static formatDate(timestamp) {
        const date = new Date(timestamp)
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    
    static formatDuration(seconds) {
        if (seconds < 60) {
            return Math.round(seconds) + '秒'
        } else if (seconds < 3600) {
            return Math.round(seconds / 60) + '分钟'
        } else {
            const hours = Math.floor(seconds / 3600)
            const minutes = Math.round((seconds % 3600) / 60)
            return `${hours}小时${minutes}分钟`
        }
    }
    
    static countWords(text) {
        if (!text) return 0
        return text.replace(/\s/g, '').length
    }
    
    static countLines(text) {
        if (!text) return 0
        return text.split('\n').filter(line => line.trim()).length
    }
    
    static truncate(text, maxLength, suffix = '...') {
        if (!text || text.length <= maxLength) return text
        return text.slice(0, maxLength) + suffix
    }
    
    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj))
    }
    
    static isEmpty(value) {
        if (value === null || value === undefined) return true
        if (typeof value === 'string') return value.trim() === ''
        if (Array.isArray(value)) return value.length === 0
        if (typeof value === 'object') return Object.keys(value).length === 0
        return false
    }
    
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }
    
    static escapeHtml(text) {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    static unescapeHtml(html) {
        const div = document.createElement('div')
        div.innerHTML = html
        return div.textContent
    }
    
    static copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject)
            } else {
                const textarea = document.createElement('textarea')
                textarea.value = text
                textarea.style.position = 'fixed'
                textarea.style.opacity = '0'
                document.body.appendChild(textarea)
                textarea.select()
                try {
                    document.execCommand('copy')
                    resolve()
                } catch (err) {
                    reject(err)
                } finally {
                    document.body.removeChild(textarea)
                }
            }
        })
    }
    
    static downloadText(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }
}

class Storage {
    static set(key, value, expiry = null) {
        const data = {
            value: value,
            timestamp: Date.now(),
            expiry: expiry
        }
        localStorage.setItem(key, JSON.stringify(data))
    }
    
    static get(key) {
        const data = localStorage.getItem(key)
        if (!data) return null
        
        try {
            const parsed = JSON.parse(data)
            
            if (parsed.expiry && Date.now() > parsed.timestamp + parsed.expiry) {
                this.remove(key)
                return null
            }
            
            return parsed.value !== undefined ? parsed.value : parsed
        } catch {
            return data
        }
    }
    
    static remove(key) {
        localStorage.removeItem(key)
    }
    
    static clear() {
        localStorage.clear()
    }
    
    static clearByPrefix(prefix) {
        Object.keys(localStorage)
            .filter(key => key.startsWith(prefix))
            .forEach(key => localStorage.removeItem(key))
    }
    
    static getSize() {
        let total = 0
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage.getItem(key).length * 2
            }
        }
        return total
    }
    
    static getUsedSpace() {
        const bytes = this.getSize()
        return (bytes / 1024 / 1024).toFixed(2) + ' MB'
    }
}

export { Utils, Storage }
