import { IndexedDBManager, indexedDBManager } from './indexeddb-manager.js'
import { AutoSaveManager } from './auto-save-manager.js'
import { UnifiedDataManager, unifiedDataManager } from './unified-data-manager.js'
import { DataMigrator, dataMigrator } from './data-migrator.js'
import { BackupManager, backupManager } from './backup-manager.js'
import { StorageManager, storageManager, StorageKeys, STORAGE_LIMITS } from './storageManager.js'
import { ExportManager, exportManager } from './exportManager.js'
import { ImportManager, importManager } from './importManager.js'

export {
    IndexedDBManager,
    indexedDBManager,
    AutoSaveManager,
    UnifiedDataManager,
    unifiedDataManager,
    DataMigrator,
    dataMigrator,
    BackupManager,
    backupManager,
    StorageManager,
    storageManager,
    StorageKeys,
    STORAGE_LIMITS,
    ExportManager,
    exportManager,
    ImportManager,
    importManager
}

export async function initStorage() {
    await unifiedDataManager.init()
    await dataMigrator.checkAndMigrate()
    
    console.log('存储系统初始化完成')
    
    return {
        dataManager: unifiedDataManager,
        migrator: dataMigrator,
        backupManager: backupManager,
        storageManager: storageManager,
        exportManager: exportManager,
        importManager: importManager
    }
}
