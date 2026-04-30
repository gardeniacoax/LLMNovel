import { unifiedDataManager } from './unified-data-manager.js'

class BackupManager {
    constructor() {
        this.maxBackups = 20
    }
    
    async createBackup(workspaceId, description = '') {
        const backup = await unifiedDataManager.createBackup(workspaceId, description)
        
        await this.cleanupOldBackups(workspaceId)
        
        return backup
    }
    
    async getBackups(workspaceId) {
        return await unifiedDataManager.getBackups(workspaceId)
    }
    
    async getBackup(backupId) {
        return await unifiedDataManager.getBackup(backupId)
    }
    
    async restoreBackup(backupId) {
        return await unifiedDataManager.restoreBackup(backupId)
    }
    
    async deleteBackup(backupId) {
        return await unifiedDataManager.deleteBackup(backupId)
    }
    
    async cleanupOldBackups(workspaceId) {
        const backups = await this.getBackups(workspaceId)
        
        if (backups.length > this.maxBackups) {
            const toDelete = backups.slice(this.maxBackups)
            
            for (const backup of toDelete) {
                await this.deleteBackup(backup.backupId)
            }
            
            console.log(`清理了 ${toDelete.length} 个旧备份`)
        }
    }
    
    async exportBackup(backupId) {
        const backup = await this.getBackup(backupId)
        
        if (!backup) {
            throw new Error('备份不存在')
        }
        
        const exportData = {
            backupId: backup.backupId,
            workspaceId: backup.workspaceId,
            description: backup.description,
            createdAt: backup.createdAt,
            data: backup.data
        }
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_${backup.workspaceId}_${new Date(backup.createdAt).toISOString().slice(0, 10)}.json`
        a.click()
        
        URL.revokeObjectURL(url)
    }
    
    async importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            
            reader.onload = async (e) => {
                try {
                    const backupData = JSON.parse(e.target.result)
                    
                    if (!backupData.backupId || !backupData.workspaceId || !backupData.data) {
                        throw new Error('无效的备份文件格式')
                    }
                    
                    backupData.backupId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    backupData.description = backupData.description || '导入的备份'
                    backupData.createdAt = Date.now()
                    
                    const result = await unifiedDataManager.createBackup(
                        backupData.workspaceId,
                        backupData.data,
                        backupData.description
                    )
                    
                    resolve(result)
                } catch (error) {
                    reject(error)
                }
            }
            
            reader.onerror = () => reject(new Error('文件读取失败'))
            reader.readAsText(file)
        })
    }
    
    async getBackupStats(workspaceId) {
        const backups = await this.getBackups(workspaceId)
        
        let totalSize = 0
        const sizePromises = backups.map(async (backup) => {
            const size = JSON.stringify(backup.data).length
            totalSize += size
            return { ...backup, size }
        })
        
        const backupsWithSize = await Promise.all(sizePromises)
        
        return {
            count: backups.length,
            totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
            newestBackup: backups.length > 0 ? backups[0].createdAt : null,
            backups: backupsWithSize
        }
    }
    
    async createAutoBackup(workspaceId) {
        const lastBackup = await this.getLastBackup(workspaceId)
        const now = Date.now()
        const oneHour = 60 * 60 * 1000
        
        if (!lastBackup || (now - lastBackup.createdAt) > oneHour) {
            return await this.createBackup(workspaceId, '自动备份')
        }
        
        return null
    }
    
    async getLastBackup(workspaceId) {
        const backups = await this.getBackups(workspaceId)
        return backups.length > 0 ? backups[0] : null
    }
    
    renderBackupUI(container, workspaceId) {
        container.innerHTML = `
            <div class="backup-manager">
                <div class="backup-header">
                    <h3>备份管理</h3>
                    <div class="backup-actions">
                        <button id="create-backup-btn" class="btn-primary">创建备份</button>
                        <label class="btn-secondary">
                            导入备份
                            <input type="file" id="import-backup-input" accept=".json" style="display: none;">
                        </label>
                    </div>
                </div>
                
                <div id="backup-list" class="backup-list">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `
        
        this.setupBackupEvents(container, workspaceId)
        this.loadBackupList(container, workspaceId)
    }
    
    async loadBackupList(container, workspaceId) {
        const listEl = container.querySelector('#backup-list')
        const backups = await this.getBackups(workspaceId)
        
        if (backups.length === 0) {
            listEl.innerHTML = `
                <div class="no-backups">
                    <p>暂无备份</p>
                    <p class="hint">点击"创建备份"按钮创建第一个备份</p>
                </div>
            `
            return
        }
        
        listEl.innerHTML = backups.map(backup => `
            <div class="backup-item" data-backup-id="${backup.backupId}">
                <div class="backup-info">
                    <div class="backup-name">${backup.description || '未命名备份'}</div>
                    <div class="backup-time">${new Date(backup.createdAt).toLocaleString('zh-CN')}</div>
                </div>
                <div class="backup-actions">
                    <button class="btn-restore" data-id="${backup.backupId}">恢复</button>
                    <button class="btn-export" data-id="${backup.backupId}">导出</button>
                    <button class="btn-delete" data-id="${backup.backupId}">删除</button>
                </div>
            </div>
        `).join('')
    }
    
    setupBackupEvents(container, workspaceId) {
        const createBtn = container.querySelector('#create-backup-btn')
        const importInput = container.querySelector('#import-backup-input')
        
        createBtn?.addEventListener('click', async () => {
            createBtn.disabled = true
            createBtn.textContent = '创建中...'
            
            try {
                await this.createBackup(workspaceId, '手动备份')
                await this.loadBackupList(container, workspaceId)
            } catch (error) {
                console.error('创建备份失败:', error)
                alert('创建备份失败: ' + error.message)
            } finally {
                createBtn.disabled = false
                createBtn.textContent = '创建备份'
            }
        })
        
        importInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                await this.importBackup(file)
                await this.loadBackupList(container, workspaceId)
            } catch (error) {
                console.error('导入备份失败:', error)
                alert('导入备份失败: ' + error.message)
            }
            
            e.target.value = ''
        })
        
        container.addEventListener('click', async (e) => {
            const target = e.target
            
            if (target.classList.contains('btn-restore')) {
                const backupId = target.dataset.id
                if (confirm('确定要恢复此备份吗？当前数据将被覆盖。')) {
                    try {
                        await this.restoreBackup(backupId)
                        alert('备份恢复成功')
                        location.reload()
                    } catch (error) {
                        console.error('恢复备份失败:', error)
                        alert('恢复备份失败: ' + error.message)
                    }
                }
            }
            
            if (target.classList.contains('btn-export')) {
                const backupId = target.dataset.id
                try {
                    await this.exportBackup(backupId)
                } catch (error) {
                    console.error('导出备份失败:', error)
                    alert('导出备份失败: ' + error.message)
                }
            }
            
            if (target.classList.contains('btn-delete')) {
                const backupId = target.dataset.id
                if (confirm('确定要删除此备份吗？')) {
                    try {
                        await this.deleteBackup(backupId)
                        await this.loadBackupList(container, workspaceId)
                    } catch (error) {
                        console.error('删除备份失败:', error)
                        alert('删除备份失败: ' + error.message)
                    }
                }
            }
        })
    }
}

const backupManager = new BackupManager()

export { BackupManager, backupManager }
