class DataCompressor {
    static compress(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data)
        
        let compressed = ''
        let count = 1
        
        for (let i = 0; i < str.length; i++) {
            if (str[i] === str[i + 1]) {
                count++
            } else {
                if (count > 3) {
                    compressed += `${str[i]}~${count}~`
                } else {
                    compressed += str[i].repeat(count)
                }
                count = 1
            }
        }
        
        return compressed
    }
    
    static decompress(compressed) {
        let decompressed = ''
        let i = 0
        
        while (i < compressed.length) {
            if (compressed[i + 1] === '~') {
                const char = compressed[i]
                let numStr = ''
                i += 2
                
                while (i < compressed.length && compressed[i] !== '~') {
                    numStr += compressed[i]
                    i++
                }
                
                const count = parseInt(numStr)
                decompressed += char.repeat(count)
                i++
            } else {
                decompressed += compressed[i]
                i++
            }
        }
        
        return decompressed
    }
    
    static getCompressionRatio(original, compressed) {
        const originalSize = typeof original === 'string' ? original.length : JSON.stringify(original).length
        const compressedSize = compressed.length
        return ((originalSize - compressedSize) / originalSize * 100).toFixed(2)
    }
}

class DataEncryptor {
    static encrypt(data, key = 'novel-tool-key') {
        const str = typeof data === 'string' ? data : JSON.stringify(data)
        let encrypted = ''
        
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i)
            const keyChar = key.charCodeAt(i % key.length)
            const encryptedCode = charCode ^ keyChar
            encrypted += String.fromCharCode(encryptedCode)
        }
        
        return btoa(encrypted)
    }
    
    static decrypt(encrypted, key = 'novel-tool-key') {
        try {
            const str = atob(encrypted)
            let decrypted = ''
            
            for (let i = 0; i < str.length; i++) {
                const charCode = str.charCodeAt(i)
                const keyChar = key.charCodeAt(i % key.length)
                const decryptedCode = charCode ^ keyChar
                decrypted += String.fromCharCode(decryptedCode)
            }
            
            return decrypted
        } catch (error) {
            console.error('解密失败:', error)
            return null
        }
    }
}

class DataVersionManager {
    constructor() {
        this.currentVersion = 1
        this.migrations = {
            1: (data) => data
        }
    }
    
    getVersion(data) {
        return data.__version || 0
    }
    
    setVersion(data, version) {
        data.__version = version
        return data
    }
    
    migrate(data) {
        const version = this.getVersion(data)
        
        if (version === this.currentVersion) {
            return data
        }
        
        let migratedData = { ...data }
        
        for (let v = version + 1; v <= this.currentVersion; v++) {
            if (this.migrations[v]) {
                migratedData = this.migrations[v](migratedData)
                this.setVersion(migratedData, v)
            }
        }
        
        return migratedData
    }
    
    addMigration(version, migrationFn) {
        this.migrations[version] = migrationFn
        if (version > this.currentVersion) {
            this.currentVersion = version
        }
    }
}

class DataBackupManager {
    constructor(storage) {
        this.storage = storage
        this.backupKey = 'novel_data_backup'
        this.maxBackups = 10
    }
    
    createBackup(description = '') {
        const allData = this.storage.getAll()
        const backup = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            description,
            data: allData,
            size: JSON.stringify(allData).length
        }
        
        const backups = this.getBackups()
        backups.unshift(backup)
        
        if (backups.length > this.maxBackups) {
            backups.pop()
        }
        
        localStorage.setItem(this.backupKey, JSON.stringify(backups))
        
        return backup
    }
    
    getBackups() {
        const data = localStorage.getItem(this.backupKey)
        return data ? JSON.parse(data) : []
    }
    
    getBackup(id) {
        const backups = this.getBackups()
        return backups.find(b => b.id === id)
    }
    
    restoreBackup(id) {
        const backup = this.getBackup(id)
        if (!backup) {
            throw new Error('备份不存在')
        }
        
        this.storage.clear()
        
        Object.entries(backup.data).forEach(([key, value]) => {
            this.storage.set(key, value)
        })
        
        return true
    }
    
    deleteBackup(id) {
        const backups = this.getBackups()
        const index = backups.findIndex(b => b.id === id)
        
        if (index !== -1) {
            backups.splice(index, 1)
            localStorage.setItem(this.backupKey, JSON.stringify(backups))
            return true
        }
        
        return false
    }
    
    exportBackup(id) {
        const backup = this.getBackup(id)
        if (!backup) {
            throw new Error('备份不存在')
        }
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_${backup.timestamp.slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }
    
    importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result)
                    
                    if (!backup.id || !backup.timestamp || !backup.data) {
                        throw new Error('无效的备份文件')
                    }
                    
                    backup.id = Date.now()
                    backup.timestamp = new Date().toISOString()
                    backup.description = '导入的备份'
                    
                    const backups = this.getBackups()
                    backups.unshift(backup)
                    
                    if (backups.length > this.maxBackups) {
                        backups.pop()
                    }
                    
                    localStorage.setItem(this.backupKey, JSON.stringify(backups))
                    resolve(backup)
                } catch (error) {
                    reject(error)
                }
            }
            
            reader.onerror = () => reject(new Error('文件读取失败'))
            reader.readAsText(file)
        })
    }
}

class DataCleaner {
    constructor(storage) {
        this.storage = storage
        this.ttlConfig = {
            'novel_continue_draft': 7 * 24 * 60 * 60 * 1000,
            'novel_rewrite_draft': 7 * 24 * 60 * 60 * 1000,
            'novel_continue_history': 30 * 24 * 60 * 60 * 1000,
            'novel_rewrite_history': 30 * 24 * 60 * 60 * 1000,
            'novel_analysis_cache': 24 * 60 * 60 * 1000
        }
    }
    
    cleanExpired() {
        const now = Date.now()
        const cleaned = []
        
        Object.entries(this.ttlConfig).forEach(([key, ttl]) => {
            const data = localStorage.getItem(key)
            if (data) {
                try {
                    const parsed = JSON.parse(data)
                    if (parsed.timestamp && now - parsed.timestamp > ttl) {
                        localStorage.removeItem(key)
                        cleaned.push(key)
                    }
                } catch (error) {
                    console.error(`清理 ${key} 失败:`, error)
                }
            }
        })
        
        return cleaned
    }
    
    cleanByKey(key) {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key)
            return true
        }
        return false
    }
    
    cleanByPattern(pattern) {
        const cleaned = []
        
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && key.includes(pattern)) {
                localStorage.removeItem(key)
                cleaned.push(key)
            }
        }
        
        return cleaned
    }
    
    getStorageUsage() {
        let totalSize = 0
        const items = []
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            const value = localStorage.getItem(key)
            const size = key.length + value.length
            
            items.push({
                key,
                size,
                sizeKB: (size / 1024).toFixed(2)
            })
            
            totalSize += size
        }
        
        return {
            totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            items: items.sort((a, b) => b.size - a.size)
        }
    }
    
    setTTL(key, ttl) {
        this.ttlConfig[key] = ttl
    }
}

class DataStorageManager {
    constructor() {
        this.prefix = 'novel_'
        this.versionManager = new DataVersionManager()
        this.backupManager = new DataBackupManager(this)
        this.cleaner = new DataCleaner(this)
        
        this.compressionThreshold = 1024
        this.encryptionKeys = ['api_key', 'password', 'secret']
        
        this.init()
    }
    
    init() {
        this.migrateAllData()
        this.cleaner.cleanExpired()
    }
    
    set(key, value, options = {}) {
        const fullKey = this.prefix + key
        const data = {
            value,
            timestamp: Date.now(),
            compressed: false,
            encrypted: false,
            version: this.versionManager.currentVersion
        }
        
        let serialized = JSON.stringify(data)
        
        if (this.shouldEncrypt(key)) {
            data.value = DataEncryptor.encrypt(data.value)
            data.encrypted = true
            serialized = JSON.stringify(data)
        }
        
        if (serialized.length > this.compressionThreshold) {
            data.value = DataCompressor.compress(data.value)
            data.compressed = true
            serialized = JSON.stringify(data)
        }
        
        try {
            localStorage.setItem(fullKey, serialized)
            return true
        } catch (error) {
            console.error('存储失败:', error)
            
            if (error.name === 'QuotaExceededError') {
                this.handleStorageQuotaExceeded()
                try {
                    localStorage.setItem(fullKey, serialized)
                    return true
                } catch (retryError) {
                    console.error('重试存储失败:', retryError)
                    return false
                }
            }
            
            return false
        }
    }
    
    get(key, defaultValue = null) {
        const fullKey = this.prefix + key
        const data = localStorage.getItem(fullKey)
        
        if (!data) {
            return defaultValue
        }
        
        try {
            let parsed = JSON.parse(data)
            
            if (parsed.compressed) {
                parsed.value = DataCompressor.decompress(parsed.value)
            }
            
            if (parsed.encrypted) {
                parsed.value = DataEncryptor.decrypt(parsed.value)
                parsed.value = JSON.parse(parsed.value)
            }
            
            parsed = this.versionManager.migrate(parsed)
            
            return parsed.value
        } catch (error) {
            console.error('读取数据失败:', error)
            return defaultValue
        }
    }
    
    remove(key) {
        const fullKey = this.prefix + key
        localStorage.removeItem(fullKey)
    }
    
    has(key) {
        const fullKey = this.prefix + key
        return localStorage.getItem(fullKey) !== null
    }
    
    clear() {
        const keys = []
        
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && key.startsWith(this.prefix)) {
                keys.push(key)
            }
        }
        
        keys.forEach(key => localStorage.removeItem(key))
    }
    
    getAll() {
        const data = {}
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(this.prefix)) {
                const shortKey = key.replace(this.prefix, '')
                data[shortKey] = this.get(shortKey)
            }
        }
        
        return data
    }
    
    keys() {
        const keys = []
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.replace(this.prefix, ''))
            }
        }
        
        return keys
    }
    
    shouldEncrypt(key) {
        return this.encryptionKeys.some(ek => key.toLowerCase().includes(ek))
    }
    
    handleStorageQuotaExceeded() {
        console.warn('存储空间不足，正在清理过期数据...')
        this.cleaner.cleanExpired()
        
        const usage = this.cleaner.getStorageUsage()
        console.log('当前存储使用情况:', usage)
    }
    
    migrateAllData() {
        this.keys().forEach(key => {
            const data = localStorage.getItem(this.prefix + key)
            if (data) {
                try {
                    const parsed = JSON.parse(data)
                    const migrated = this.versionManager.migrate(parsed)
                    
                    if (migrated !== parsed) {
                        localStorage.setItem(this.prefix + key, JSON.stringify(migrated))
                    }
                } catch (error) {
                    console.error(`迁移 ${key} 失败:`, error)
                }
            }
        })
    }
    
    createBackup(description = '') {
        return this.backupManager.createBackup(description)
    }
    
    getBackups() {
        return this.backupManager.getBackups()
    }
    
    restoreBackup(id) {
        return this.backupManager.restoreBackup(id)
    }
    
    deleteBackup(id) {
        return this.backupManager.deleteBackup(id)
    }
    
    exportBackup(id) {
        return this.backupManager.exportBackup(id)
    }
    
    importBackup(file) {
        return this.backupManager.importBackup(file)
    }
    
    getStorageUsage() {
        return this.cleaner.getStorageUsage()
    }
    
    cleanExpired() {
        return this.cleaner.cleanExpired()
    }
}

const dataStorage = new DataStorageManager()

export { 
    dataStorage, 
    DataStorageManager, 
    DataCompressor, 
    DataEncryptor, 
    DataVersionManager, 
    DataBackupManager, 
    DataCleaner 
}
