const DB_CONFIG = {
    name: 'NovelWriterDB',
    version: 2,
    stores: {
        chapters: {
            keyPath: ['workspaceId', 'chapterNum'],
            indexes: {
                workspaceId: { unique: false },
                chapterNum: { unique: false },
                status: { unique: false },
                updatedAt: { unique: false }
            }
        },
        analysis: {
            keyPath: 'workspaceId',
            indexes: {
                analyzedAt: { unique: false }
            }
        },
        rewrites: {
            keyPath: ['workspaceId', 'chapterNum'],
            indexes: {
                workspaceId: { unique: false },
                chapterNum: { unique: false },
                updatedAt: { unique: false }
            }
        },
        continues: {
            keyPath: ['workspaceId', 'chapterNum'],
            indexes: {
                workspaceId: { unique: false },
                chapterNum: { unique: false },
                updatedAt: { unique: false }
            }
        },
        backups: {
            keyPath: 'backupId',
            indexes: {
                workspaceId: { unique: false },
                createdAt: { unique: false }
            }
        }
    }
}

class IndexedDBManager {
    constructor() {
        this.db = null
        this.dbName = DB_CONFIG.name
        this.dbVersion = DB_CONFIG.version
        this.isInitialized = false
    }
    
    async init() {
        if (this.isInitialized && this.db) {
            return this.db
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion)
            
            request.onerror = () => {
                console.error('IndexedDB打开失败:', request.error)
                reject(request.error)
            }
            
            request.onsuccess = () => {
                this.db = request.result
                this.isInitialized = true
                console.log('IndexedDB初始化成功')
                resolve(this.db)
            }
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result
                this.createStores(db)
            }
        })
    }
    
    createStores(db) {
        if (!db.objectStoreNames.contains('chapters')) {
            const chapterStore = db.createObjectStore('chapters', { 
                keyPath: DB_CONFIG.stores.chapters.keyPath 
            })
            chapterStore.createIndex('workspaceId', 'workspaceId', { unique: false })
            chapterStore.createIndex('chapterNum', 'chapterNum', { unique: false })
            chapterStore.createIndex('status', 'status', { unique: false })
            chapterStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('analysis')) {
            const analysisStore = db.createObjectStore('analysis', { 
                keyPath: DB_CONFIG.stores.analysis.keyPath 
            })
            analysisStore.createIndex('analyzedAt', 'analyzedAt', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('rewrites')) {
            const rewriteStore = db.createObjectStore('rewrites', { 
                keyPath: DB_CONFIG.stores.rewrites.keyPath 
            })
            rewriteStore.createIndex('workspaceId', 'workspaceId', { unique: false })
            rewriteStore.createIndex('chapterNum', 'chapterNum', { unique: false })
            rewriteStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('continues')) {
            const continueStore = db.createObjectStore('continues', { 
                keyPath: DB_CONFIG.stores.continues.keyPath 
            })
            continueStore.createIndex('workspaceId', 'workspaceId', { unique: false })
            continueStore.createIndex('chapterNum', 'chapterNum', { unique: false })
            continueStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('backups')) {
            const backupStore = db.createObjectStore('backups', { 
                keyPath: DB_CONFIG.stores.backups.keyPath 
            })
            backupStore.createIndex('workspaceId', 'workspaceId', { unique: false })
            backupStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
    }
    
    async saveChapter(workspaceId, chapterNum, data) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['chapters'], 'readwrite')
            const store = transaction.objectStore('chapters')
            
            const record = {
                workspaceId,
                chapterNum,
                ...data,
                updatedAt: Date.now()
            }
            
            const request = store.put(record)
            
            request.onsuccess = () => resolve(record)
            request.onerror = () => {
                console.error('保存章节失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async getChapter(workspaceId, chapterNum) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['chapters'], 'readonly')
            const store = transaction.objectStore('chapters')
            
            const request = store.get([workspaceId, chapterNum])
            
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => {
                console.error('获取章节失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async getAllChapters(workspaceId) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['chapters'], 'readonly')
            const store = transaction.objectStore('chapters')
            const index = store.index('workspaceId')
            
            const request = index.getAll(workspaceId)
            
            request.onsuccess = () => {
                const chapters = request.result || []
                chapters.sort((a, b) => a.chapterNum - b.chapterNum)
                resolve(chapters)
            }
            request.onerror = () => {
                console.error('获取所有章节失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async deleteChapter(workspaceId, chapterNum) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['chapters'], 'readwrite')
            const store = transaction.objectStore('chapters')
            
            const request = store.delete([workspaceId, chapterNum])
            
            request.onsuccess = () => resolve(true)
            request.onerror = () => {
                console.error('删除章节失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async saveAnalysis(workspaceId, analysisData) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['analysis'], 'readwrite')
            const store = transaction.objectStore('analysis')
            
            const record = {
                workspaceId,
                ...analysisData,
                analyzedAt: Date.now()
            }
            
            const request = store.put(record)
            
            request.onsuccess = () => resolve(record)
            request.onerror = () => {
                console.error('保存分析结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async getAnalysis(workspaceId) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['analysis'], 'readonly')
            const store = transaction.objectStore('analysis')
            
            const request = store.get(workspaceId)
            
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => {
                console.error('获取分析结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async deleteAnalysis(workspaceId) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['analysis'], 'readwrite')
            const store = transaction.objectStore('analysis')
            
            const request = store.delete(workspaceId)
            
            request.onsuccess = () => resolve(true)
            request.onerror = () => {
                console.error('删除分析结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async saveRewrite(workspaceId, chapterNum, data) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rewrites'], 'readwrite')
            const store = transaction.objectStore('rewrites')
            
            const record = {
                workspaceId,
                chapterNum,
                ...data,
                updatedAt: Date.now()
            }
            
            const request = store.put(record)
            
            request.onsuccess = () => resolve(record)
            request.onerror = () => {
                console.error('保存改写结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async getRewrite(workspaceId, chapterNum) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rewrites'], 'readonly')
            const store = transaction.objectStore('rewrites')
            
            const request = store.get([workspaceId, chapterNum])
            
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => {
                console.error('获取改写结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async getAllRewrites(workspaceId) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rewrites'], 'readonly')
            const store = transaction.objectStore('rewrites')
            const index = store.index('workspaceId')
            
            const request = index.getAll(workspaceId)
            
            request.onsuccess = () => {
                const rewrites = request.result || []
                rewrites.sort((a, b) => a.chapterNum - b.chapterNum)
                resolve(rewrites)
            }
            request.onerror = () => {
                console.error('获取所有改写结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async deleteRewrite(workspaceId, chapterNum) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rewrites'], 'readwrite')
            const store = transaction.objectStore('rewrites')
            
            const request = store.delete([workspaceId, chapterNum])
            
            request.onsuccess = () => resolve(true)
            request.onerror = () => {
                console.error('删除改写结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async saveContinue(workspaceId, chapterNum, data) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['continues'], 'readwrite')
            const store = transaction.objectStore('continues')
            
            const record = {
                workspaceId,
                chapterNum,
                ...data,
                updatedAt: Date.now()
            }
            
            const request = store.put(record)
            
            request.onsuccess = () => resolve(record)
            request.onerror = () => {
                console.error('保存续写结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async getContinue(workspaceId, chapterNum) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['continues'], 'readonly')
            const store = transaction.objectStore('continues')
            
            const request = store.get([workspaceId, chapterNum])
            
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => {
                console.error('获取续写结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async getAllContinues(workspaceId) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['continues'], 'readonly')
            const store = transaction.objectStore('continues')
            const index = store.index('workspaceId')
            
            const request = index.getAll(workspaceId)
            
            request.onsuccess = () => {
                const continues = request.result || []
                continues.sort((a, b) => a.chapterNum - b.chapterNum)
                resolve(continues)
            }
            request.onerror = () => {
                console.error('获取所有续写结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async deleteContinue(workspaceId, chapterNum) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['continues'], 'readwrite')
            const store = transaction.objectStore('continues')
            
            const request = store.delete([workspaceId, chapterNum])
            
            request.onsuccess = () => resolve(true)
            request.onerror = () => {
                console.error('删除续写结果失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async createBackup(workspaceId, data, description = '') {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readwrite')
            const store = transaction.objectStore('backups')
            
            const backup = {
                backupId: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                workspaceId,
                description,
                data,
                createdAt: Date.now()
            }
            
            const request = store.add(backup)
            
            request.onsuccess = () => resolve(backup)
            request.onerror = () => {
                console.error('创建备份失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async getBackups(workspaceId) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readonly')
            const store = transaction.objectStore('backups')
            const index = store.index('workspaceId')
            
            const request = index.getAll(workspaceId)
            
            request.onsuccess = () => {
                const backups = request.result || []
                backups.sort((a, b) => b.createdAt - a.createdAt)
                resolve(backups)
            }
            request.onerror = () => {
                console.error('获取备份列表失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async getBackup(backupId) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readonly')
            const store = transaction.objectStore('backups')
            
            const request = store.get(backupId)
            
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => {
                console.error('获取备份失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async deleteBackup(backupId) {
        await this.ensureInit()
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readwrite')
            const store = transaction.objectStore('backups')
            
            const request = store.delete(backupId)
            
            request.onsuccess = () => resolve(true)
            request.onerror = () => {
                console.error('删除备份失败:', request.error)
                reject(request.error)
            }
        })
    }
    
    async deleteWorkspace(workspaceId) {
        await this.ensureInit()
        
        await this.deleteByIndex('chapters', 'workspaceId', workspaceId)
        await this.deleteByIndex('analysis', 'workspaceId', workspaceId)
        await this.deleteByIndex('rewrites', 'workspaceId', workspaceId)
        await this.deleteByIndex('continues', 'workspaceId', workspaceId)
        await this.deleteByIndex('backups', 'workspaceId', workspaceId)
        
        return true
    }
    
    async deleteByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite')
            const store = transaction.objectStore(storeName)
            const index = store.index(indexName)
            
            const request = index.openCursor(IDBKeyRange.only(value))
            
            const deletePromises = []
            
            request.onsuccess = (event) => {
                const cursor = event.target.result
                if (cursor) {
                    deletePromises.push(
                        new Promise((res, rej) => {
                            const deleteRequest = cursor.delete()
                            deleteRequest.onsuccess = () => res()
                            deleteRequest.onerror = () => rej(deleteRequest.error)
                        })
                    )
                    cursor.continue()
                } else {
                    Promise.all(deletePromises).then(() => resolve()).catch(reject)
                }
            }
            
            request.onerror = () => reject(request.error)
        })
    }
    
    async ensureInit() {
        if (!this.isInitialized || !this.db) {
            await this.init()
        }
    }
    
    async clearAll() {
        await this.ensureInit()
        
        const storeNames = ['chapters', 'analysis', 'rewrites', 'continues', 'backups']
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeNames, 'readwrite')
            
            transaction.oncomplete = () => resolve(true)
            transaction.onerror = () => reject(transaction.error)
            
            storeNames.forEach(name => {
                transaction.objectStore(name).clear()
            })
        })
    }
    
    async getStorageStats() {
        await this.ensureInit()
        
        const stats = {
            chapters: 0,
            analysis: 0,
            rewrites: 0,
            continues: 0,
            backups: 0
        }
        
        const countStore = (storeName) => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly')
                const store = transaction.objectStore(storeName)
                const request = store.count()
                
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        }
        
        stats.chapters = await countStore('chapters')
        stats.analysis = await countStore('analysis')
        stats.rewrites = await countStore('rewrites')
        stats.continues = await countStore('continues')
        stats.backups = await countStore('backups')
        
        return stats
    }
}

const indexedDBManager = new IndexedDBManager()

export { IndexedDBManager, indexedDBManager, DB_CONFIG }
