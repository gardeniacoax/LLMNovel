/**
 * 版本管理模块
 * 提供版本检查、更新管理、版本信息展示等功能
 */

/**
 * 应用版本管理器
 */
class AppVersionManager {
    constructor() {
        this.currentVersion = '1.0.0'
        this.versionHistory = this.loadVersionHistory()
        this.storageKey = 'llm-novel-version-info'
    }
    
    /**
     * 获取当前版本
     */
    getCurrentVersion() {
        return this.currentVersion
    }
    
    /**
     * 解析版本号
     */
    parseVersion(version) {
        const parts = version.split('.').map(Number)
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0,
            full: version
        }
    }
    
    /**
     * 比较版本
     */
    compareVersions(v1, v2) {
        const parsed1 = this.parseVersion(v1)
        const parsed2 = this.parseVersion(v2)
        
        if (parsed1.major !== parsed2.major) {
            return parsed1.major - parsed2.major
        }
        if (parsed1.minor !== parsed2.minor) {
            return parsed1.minor - parsed2.minor
        }
        return parsed1.patch - parsed2.patch
    }
    
    /**
     * 检查是否需要更新
     */
    checkForUpdate(latestVersion) {
        const comparison = this.compareVersions(latestVersion, this.currentVersion)
        
        return {
            hasUpdate: comparison > 0,
            currentVersion: this.currentVersion,
            latestVersion: latestVersion,
            updateType: this.getUpdateType(this.currentVersion, latestVersion)
        }
    }
    
    /**
     * 获取更新类型
     */
    getUpdateType(current, latest) {
        const currentParsed = this.parseVersion(current)
        const latestParsed = this.parseVersion(latest)
        
        if (latestParsed.major > currentParsed.major) {
            return 'major'
        }
        if (latestParsed.minor > currentParsed.minor) {
            return 'minor'
        }
        if (latestParsed.patch > currentParsed.patch) {
            return 'patch'
        }
        return 'none'
    }
    
    /**
     * 记录版本使用
     */
    recordUsage() {
        const info = this.getVersionInfo()
        info.lastUsed = new Date().toISOString()
        info.usageCount = (info.usageCount || 0) + 1
        
        localStorage.setItem(this.storageKey, JSON.stringify(info))
    }
    
    /**
     * 获取版本信息
     */
    getVersionInfo() {
        const stored = localStorage.getItem(this.storageKey)
        
        if (stored) {
            return JSON.parse(stored)
        }
        
        return {
            version: this.currentVersion,
            firstUsed: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            usageCount: 0
        }
    }
    
    /**
     * 加载版本历史
     */
    loadVersionHistory() {
        return [
            {
                version: '1.0.0',
                date: new Date().toISOString(),
                changes: [
                    '初始版本发布',
                    '实现核心功能',
                    '支持TXT导入导出',
                    'AI智能分析',
                    '角色卡管理',
                    '续写和改写功能'
                ]
            }
        ]
    }
    
    /**
     * 获取版本历史
     */
    getVersionHistory() {
        return this.versionHistory
    }
    
    /**
     * 生成版本信息显示
     */
    generateVersionDisplay() {
        const info = this.getVersionInfo()
        
        return {
            version: this.currentVersion,
            buildDate: new Date().toISOString(),
            environment: 'production',
            firstUsed: info.firstUsed,
            lastUsed: info.lastUsed,
            usageCount: info.usageCount,
            features: this.getFeatures(),
            systemRequirements: this.getSystemRequirements()
        }
    }
    
    /**
     * 获取功能列表
     */
    getFeatures() {
        return [
            { name: 'TXT导入导出', enabled: true },
            { name: 'AI智能分析', enabled: true },
            { name: '角色卡管理', enabled: true },
            { name: '智能续写', enabled: true },
            { name: '智能改写', enabled: true },
            { name: '全局Prompt', enabled: true },
            { name: 'API Key管理', enabled: true },
            { name: '深色主题', enabled: true },
            { name: '快捷键', enabled: true },
            { name: '数据备份', enabled: true }
        ]
    }
    
    /**
     * 获取系统要求
     */
    getSystemRequirements() {
        return {
            browser: ['Chrome 90+', 'Edge 90+', 'Firefox 88+', 'Safari 14+'],
            storage: '5MB localStorage',
            network: 'AI功能需要网络连接',
            features: ['localStorage', 'Fetch API', 'ES6+']
        }
    }
    
    /**
     * 创建关于对话框
     */
    createAboutDialog() {
        const info = this.generateVersionDisplay()
        
        const dialog = document.createElement('div')
        dialog.className = 'about-dialog'
        dialog.innerHTML = `
            <div class="about-overlay"></div>
            <div class="about-content">
                <div class="about-header">
                    <h2>小说AI改写/续写工具</h2>
                    <button class="about-close">×</button>
                </div>
                <div class="about-body">
                    <div class="about-logo">📚</div>
                    <div class="about-version">
                        <span class="version-label">版本</span>
                        <span class="version-number">v${info.version}</span>
                    </div>
                    <div class="about-info">
                        <div class="info-item">
                            <span class="info-label">构建日期</span>
                            <span class="info-value">${new Date(info.buildDate).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">首次使用</span>
                            <span class="info-value">${new Date(info.firstUsed).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">使用次数</span>
                            <span class="info-value">${info.usageCount} 次</span>
                        </div>
                    </div>
                    <div class="about-features">
                        <h3>功能特性</h3>
                        <div class="features-list">
                            ${info.features.map(f => `
                                <div class="feature-item ${f.enabled ? 'enabled' : 'disabled'}">
                                    <span class="feature-icon">${f.enabled ? '✓' : '✗'}</span>
                                    <span class="feature-name">${f.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="about-requirements">
                        <h3>系统要求</h3>
                        <div class="requirements-list">
                            <div class="requirement-item">
                                <span class="req-label">浏览器</span>
                                <span class="req-value">${info.systemRequirements.browser.join(', ')}</span>
                            </div>
                            <div class="requirement-item">
                                <span class="req-label">存储空间</span>
                                <span class="req-value">${info.systemRequirements.storage}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="about-footer">
                    <p>© 2024 LLMNovel Team. All rights reserved.</p>
                    <p>MIT License</p>
                </div>
            </div>
            <style>
                .about-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .about-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .about-content {
                    position: relative;
                    width: 90%;
                    max-width: 500px;
                    max-height: 85vh;
                    background: var(--color-surface, #1e293b);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                }
                
                .about-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--color-border, #334155);
                }
                
                .about-header h2 {
                    margin: 0;
                    font-size: 20px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .about-close {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    color: var(--color-text-secondary, #94a3b8);
                    font-size: 24px;
                    cursor: pointer;
                    border-radius: 8px;
                }
                
                .about-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-text, #f1f5f9);
                }
                
                .about-body {
                    padding: 24px;
                    max-height: calc(85vh - 140px);
                    overflow-y: auto;
                }
                
                .about-logo {
                    font-size: 64px;
                    text-align: center;
                    margin-bottom: 16px;
                }
                
                .about-version {
                    text-align: center;
                    margin-bottom: 24px;
                }
                
                .version-label {
                    display: block;
                    font-size: 12px;
                    color: var(--color-text-secondary, #94a3b8);
                    margin-bottom: 4px;
                }
                
                .version-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--color-primary, #3b82f6);
                }
                
                .about-info {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }
                
                .info-item {
                    text-align: center;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                
                .info-label {
                    display: block;
                    font-size: 12px;
                    color: var(--color-text-secondary, #94a3b8);
                    margin-bottom: 4px;
                }
                
                .info-value {
                    font-size: 14px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .about-features h3,
                .about-requirements h3 {
                    margin: 0 0 12px;
                    font-size: 14px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .features-list {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                    margin-bottom: 24px;
                }
                
                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    font-size: 13px;
                }
                
                .feature-item.enabled .feature-icon {
                    color: var(--color-success, #22c55e);
                }
                
                .feature-item.disabled .feature-icon {
                    color: var(--color-error, #ef4444);
                }
                
                .feature-name {
                    color: var(--color-text-secondary, #94a3b8);
                }
                
                .requirements-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .requirement-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                }
                
                .req-label {
                    font-size: 13px;
                    color: var(--color-text-secondary, #94a3b8);
                }
                
                .req-value {
                    font-size: 13px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .about-footer {
                    padding: 16px 24px;
                    border-top: 1px solid var(--color-border, #334155);
                    text-align: center;
                }
                
                .about-footer p {
                    margin: 4px 0;
                    font-size: 12px;
                    color: var(--color-text-secondary, #94a3b8);
                }
            </style>
        `
        
        const overlay = dialog.querySelector('.about-overlay')
        const closeBtn = dialog.querySelector('.about-close')
        
        const closeDialog = () => {
            dialog.style.animation = 'fadeIn 0.3s ease reverse'
            setTimeout(() => dialog.remove(), 300)
        }
        
        overlay.addEventListener('click', closeDialog)
        closeBtn.addEventListener('click', closeDialog)
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeDialog()
                document.removeEventListener('keydown', escHandler)
            }
        })
        
        return dialog
    }
    
    /**
     * 显示关于对话框
     */
    showAbout() {
        const dialog = this.createAboutDialog()
        document.body.appendChild(dialog)
        this.recordUsage()
    }
}

/**
 * 更新检查器
 */
class UpdateChecker {
    constructor() {
        this.checkUrl = null
        this.lastCheck = null
        this.checkInterval = 24 * 60 * 60 * 1000
    }
    
    /**
     * 检查更新
     */
    async checkForUpdates(currentVersion) {
        console.log('检查更新...')
        
        return {
            hasUpdate: false,
            currentVersion: currentVersion,
            latestVersion: currentVersion,
            message: '当前已是最新版本'
        }
    }
    
    /**
     * 获取更新信息
     */
    getUpdateInfo() {
        return {
            lastCheck: this.lastCheck,
            nextCheck: this.lastCheck ? new Date(this.lastCheck.getTime() + this.checkInterval) : null
        }
    }
    
    /**
     * 显示更新提示
     */
    showUpdateNotification(updateInfo) {
        if (!updateInfo.hasUpdate) return
        
        const notification = document.createElement('div')
        notification.className = 'update-notification'
        notification.innerHTML = `
            <div class="update-icon">🎉</div>
            <div class="update-content">
                <div class="update-title">发现新版本</div>
                <div class="update-version">v${updateInfo.latestVersion}</div>
            </div>
            <button class="update-btn">更新</button>
            <button class="update-close">×</button>
        `
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `
        
        document.body.appendChild(notification)
        
        const closeBtn = notification.querySelector('.update-close')
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideInRight 0.3s ease reverse'
            setTimeout(() => notification.remove(), 300)
        })
    }
}

const appVersionManager = new AppVersionManager()
const updateChecker = new UpdateChecker()

export { 
    AppVersionManager, 
    UpdateChecker, 
    appVersionManager, 
    updateChecker 
}
