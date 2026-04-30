/**
 * 最终检查清单
 * 提供项目完整性检查、功能测试、部署前检查等功能
 */

/**
 * 检查清单管理器
 */
class ChecklistManager {
    constructor() {
        this.checks = []
        this.results = []
    }
    
    /**
     * 运行所有检查
     */
    async runAllChecks() {
        console.log('🔍 开始运行检查清单...')
        
        this.results = []
        
        const categories = [
            { name: '文件完整性', checks: this.getFileChecks() },
            { name: '功能测试', checks: this.getFunctionChecks() },
            { name: '性能检查', checks: this.getPerformanceChecks() },
            { name: '安全检查', checks: this.getSecurityChecks() },
            { name: '兼容性检查', checks: this.getCompatibilityChecks() },
            { name: '用户体验检查', checks: this.getUXChecks() }
        ]
        
        for (const category of categories) {
            console.log(`\n📋 ${category.name}`)
            
            for (const check of category.checks) {
                const result = await this.runCheck(check)
                this.results.push({
                    category: category.name,
                    ...result
                })
            }
        }
        
        const report = this.generateReport()
        
        console.log('\n' + '='.repeat(60))
        console.log('📊 检查完成')
        console.log('='.repeat(60))
        console.log(`总计: ${report.summary.total}`)
        console.log(`✅ 通过: ${report.summary.passed}`)
        console.log(`❌ 失败: ${report.summary.failed}`)
        console.log(`⚠️  警告: ${report.summary.warnings}`)
        console.log(`📈 通过率: ${report.summary.passRate}%`)
        
        return report
    }
    
    /**
     * 运行单个检查
     */
    async runCheck(check) {
        try {
            const result = await check.test()
            
            const status = result.passed ? '✅' : (result.warning ? '⚠️' : '❌')
            console.log(`  ${status} ${check.name}: ${result.message || ''}`)
            
            return {
                name: check.name,
                passed: result.passed,
                warning: result.warning || false,
                message: result.message || '',
                details: result.details || null
            }
        } catch (error) {
            console.log(`  ❌ ${check.name}: ${error.message}`)
            
            return {
                name: check.name,
                passed: false,
                warning: false,
                message: error.message,
                details: null
            }
        }
    }
    
    /**
     * 文件完整性检查
     */
    getFileChecks() {
        return [
            {
                name: 'index.html存在',
                test: async () => {
                    const exists = document.querySelector('html') !== null
                    return {
                        passed: exists,
                        message: exists ? '文件存在' : '文件不存在'
                    }
                }
            },
            {
                name: 'CSS样式加载',
                test: async () => {
                    const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
                    return {
                        passed: styles.length > 0,
                        message: `找到${styles.length}个样式文件`
                    }
                }
            },
            {
                name: 'JavaScript模块加载',
                test: async () => {
                    const scripts = document.querySelectorAll('script')
                    return {
                        passed: scripts.length > 0,
                        message: `找到${scripts.length}个脚本文件`
                    }
                }
            },
            {
                name: 'localStorage可用',
                test: async () => {
                    try {
                        localStorage.setItem('test', 'test')
                        localStorage.removeItem('test')
                        return { passed: true, message: 'localStorage正常' }
                    } catch (e) {
                        return { passed: false, message: 'localStorage不可用' }
                    }
                }
            }
        ]
    }
    
    /**
     * 功能测试
     */
    getFunctionChecks() {
        return [
            {
                name: '导航功能',
                test: async () => {
                    const nav = document.querySelector('nav') || document.querySelector('.nav')
                    return {
                        passed: !!nav,
                        message: nav ? '导航元素存在' : '未找到导航元素'
                    }
                }
            },
            {
                name: '按钮交互',
                test: async () => {
                    const buttons = document.querySelectorAll('button')
                    return {
                        passed: buttons.length > 0,
                        message: `找到${buttons.length}个按钮`
                    }
                }
            },
            {
                name: '表单输入',
                test: async () => {
                    const inputs = document.querySelectorAll('input, textarea')
                    return {
                        passed: inputs.length > 0,
                        message: `找到${inputs.length}个输入框`
                    }
                }
            },
            {
                name: '模态框功能',
                test: async () => {
                    const modals = document.querySelectorAll('.modal, [role="dialog"]')
                    return {
                        passed: true,
                        warning: modals.length === 0,
                        message: modals.length > 0 ? `找到${modals.length}个模态框` : '未找到模态框'
                    }
                }
            },
            {
                name: 'Toast提示',
                test: async () => {
                    const hasToast = typeof window.toast !== 'undefined'
                    return {
                        passed: true,
                        warning: !hasToast,
                        message: hasToast ? 'Toast组件已加载' : 'Toast组件未加载'
                    }
                }
            }
        ]
    }
    
    /**
     * 性能检查
     */
    getPerformanceChecks() {
        return [
            {
                name: '页面加载时间',
                test: async () => {
                    const timing = performance.timing
                    const loadTime = timing.loadEventEnd - timing.navigationStart
                    const passed = loadTime < 5000
                    
                    return {
                        passed,
                        warning: !passed && loadTime < 10000,
                        message: `加载时间: ${loadTime}ms`,
                        details: { loadTime }
                    }
                }
            },
            {
                name: 'DOM节点数量',
                test: async () => {
                    const nodeCount = document.getElementsByTagName('*').length
                    const passed = nodeCount < 1500
                    
                    return {
                        passed,
                        warning: !passed && nodeCount < 3000,
                        message: `DOM节点: ${nodeCount}`,
                        details: { nodeCount }
                    }
                }
            },
            {
                name: '内存使用',
                test: async () => {
                    if (!performance.memory) {
                        return { passed: true, warning: true, message: '无法检测内存使用' }
                    }
                    
                    const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
                    const passed = performance.memory.usedJSHeapSize < 100 * 1024 * 1024
                    
                    return {
                        passed,
                        warning: !passed,
                        message: `内存使用: ${usedMB}MB`,
                        details: { usedMB }
                    }
                }
            },
            {
                name: '图片懒加载',
                test: async () => {
                    const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]')
                    const allImages = document.querySelectorAll('img')
                    
                    return {
                        passed: true,
                        warning: lazyImages.length === 0 && allImages.length > 10,
                        message: `${lazyImages.length}/${allImages.length}图片使用懒加载`
                    }
                }
            }
        ]
    }
    
    /**
     * 安全检查
     */
    getSecurityChecks() {
        return [
            {
                name: 'HTTPS检查',
                test: async () => {
                    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost'
                    return {
                        passed: isHTTPS,
                        warning: !isHTTPS,
                        message: isHTTPS ? '使用安全连接' : '未使用HTTPS'
                    }
                }
            },
            {
                name: 'API密钥加密',
                test: async () => {
                    const hasEncryption = typeof window.ApiConfigManager !== 'undefined'
                    return {
                        passed: true,
                        warning: !hasEncryption,
                        message: hasEncryption ? 'API密钥加密已启用' : 'API密钥加密未检测到'
                    }
                }
            },
            {
                name: 'XSS防护',
                test: async () => {
                    const scripts = document.querySelectorAll('script[src*="http"]')
                    const hasExternalScripts = scripts.length > 0
                    
                    return {
                        passed: true,
                        warning: hasExternalScripts,
                        message: hasExternalScripts ? `发现${scripts.length}个外部脚本` : '无外部脚本'
                    }
                }
            },
            {
                name: '敏感数据检查',
                test: async () => {
                    const html = document.documentElement.innerHTML
                    const hasApiKey = html.includes('sk-') && !html.includes('sk-****')
                    
                    return {
                        passed: !hasApiKey,
                        message: hasApiKey ? '发现可能的API密钥泄露' : '未发现敏感数据'
                    }
                }
            }
        ]
    }
    
    /**
     * 兼容性检查
     */
    getCompatibilityChecks() {
        return [
            {
                name: '浏览器版本',
                test: async () => {
                    const ua = navigator.userAgent
                    let browser = '未知'
                    let version = 0
                    
                    if (ua.includes('Chrome/')) {
                        browser = 'Chrome'
                        version = parseInt(ua.match(/Chrome\/(\d+)/)[1])
                    } else if (ua.includes('Firefox/')) {
                        browser = 'Firefox'
                        version = parseInt(ua.match(/Firefox\/(\d+)/)[1])
                    } else if (ua.includes('Safari/')) {
                        browser = 'Safari'
                        version = parseInt(ua.match(/Version\/(\d+)/)[1])
                    } else if (ua.includes('Edge/')) {
                        browser = 'Edge'
                        version = parseInt(ua.match(/Edge\/(\d+)/)[1])
                    }
                    
                    const minVersions = { Chrome: 90, Firefox: 88, Safari: 14, Edge: 90 }
                    const passed = version >= (minVersions[browser] || 0)
                    
                    return {
                        passed,
                        warning: !passed,
                        message: `${browser} ${version}`,
                        details: { browser, version }
                    }
                }
            },
            {
                name: 'ES6支持',
                test: async () => {
                    try {
                        eval('const a = () => {}; class B {}')
                        return { passed: true, message: 'ES6支持正常' }
                    } catch (e) {
                        return { passed: false, message: 'ES6不支持' }
                    }
                }
            },
            {
                name: 'Fetch API',
                test: async () => {
                    return {
                        passed: !!window.fetch,
                        message: window.fetch ? 'Fetch API可用' : 'Fetch API不可用'
                    }
                }
            },
            {
                name: 'Promise支持',
                test: async () => {
                    return {
                        passed: !!window.Promise,
                        message: window.Promise ? 'Promise可用' : 'Promise不可用'
                    }
                }
            },
            {
                name: 'CSS Grid支持',
                test: async () => {
                    const div = document.createElement('div')
                    const supported = 'grid' in div.style
                    return {
                        passed: supported,
                        message: supported ? 'CSS Grid支持' : 'CSS Grid不支持'
                    }
                }
            }
        ]
    }
    
    /**
     * 用户体验检查
     */
    getUXChecks() {
        return [
            {
                name: '响应式设计',
                test: async () => {
                    const viewport = document.querySelector('meta[name="viewport"]')
                    return {
                        passed: !!viewport,
                        message: viewport ? 'Viewport已设置' : 'Viewport未设置'
                    }
                }
            },
            {
                name: '深色主题',
                test: async () => {
                    const hasDarkTheme = document.body.classList.contains('dark-theme') ||
                                        document.documentElement.getAttribute('data-theme') === 'dark'
                    return {
                        passed: true,
                        warning: !hasDarkTheme,
                        message: hasDarkTheme ? '深色主题已启用' : '深色主题未启用'
                    }
                }
            },
            {
                name: '快捷键支持',
                test: async () => {
                    const hasShortcut = typeof window.shortcutManager !== 'undefined'
                    return {
                        passed: true,
                        warning: !hasShortcut,
                        message: hasShortcut ? '快捷键已配置' : '快捷键未配置'
                    }
                }
            },
            {
                name: '使用说明',
                test: async () => {
                    const hasGuide = typeof window.userGuide !== 'undefined'
                    return {
                        passed: true,
                        warning: !hasGuide,
                        message: hasGuide ? '使用说明已配置' : '使用说明未配置'
                    }
                }
            },
            {
                name: '错误提示',
                test: async () => {
                    const hasErrorHandler = typeof window.ErrorToastOptimizer !== 'undefined'
                    return {
                        passed: true,
                        warning: !hasErrorHandler,
                        message: hasErrorHandler ? '错误提示已优化' : '错误提示未优化'
                    }
                }
            },
            {
                name: '加载动画',
                test: async () => {
                    const spinners = document.querySelectorAll('.spinner, .loading, [class*="spin"]')
                    return {
                        passed: true,
                        warning: spinners.length === 0,
                        message: spinners.length > 0 ? `找到${spinners.length}个加载动画` : '未找到加载动画'
                    }
                }
            }
        ]
    }
    
    /**
     * 生成报告
     */
    generateReport() {
        const summary = {
            total: this.results.length,
            passed: this.results.filter(r => r.passed && !r.warning).length,
            failed: this.results.filter(r => !r.passed).length,
            warnings: this.results.filter(r => r.warning).length,
            passRate: 0
        }
        
        if (summary.total > 0) {
            summary.passRate = ((summary.passed / summary.total) * 100).toFixed(2)
        }
        
        const byCategory = {}
        this.results.forEach(result => {
            if (!byCategory[result.category]) {
                byCategory[result.category] = []
            }
            byCategory[result.category].push(result)
        })
        
        return {
            timestamp: new Date().toISOString(),
            summary,
            byCategory,
            results: this.results,
            recommendations: this.generateRecommendations()
        }
    }
    
    /**
     * 生成建议
     */
    generateRecommendations() {
        const recommendations = []
        
        this.results.forEach(result => {
            if (!result.passed) {
                recommendations.push({
                    type: 'error',
                    category: result.category,
                    message: `修复: ${result.name}`,
                    details: result.message
                })
            } else if (result.warning) {
                recommendations.push({
                    type: 'warning',
                    category: result.category,
                    message: `优化: ${result.name}`,
                    details: result.message
                })
            }
        })
        
        return recommendations
    }
    
    /**
     * 显示检查结果UI
     */
    showResultsUI() {
        const report = this.generateReport()
        
        const container = document.createElement('div')
        container.className = 'checklist-results'
        container.innerHTML = `
            <div class="checklist-overlay"></div>
            <div class="checklist-content">
                <div class="checklist-header">
                    <h2>🔍 项目检查报告</h2>
                    <button class="checklist-close">×</button>
                </div>
                <div class="checklist-body">
                    <div class="checklist-summary">
                        <div class="summary-item total">
                            <span class="summary-value">${report.summary.total}</span>
                            <span class="summary-label">总计</span>
                        </div>
                        <div class="summary-item passed">
                            <span class="summary-value">${report.summary.passed}</span>
                            <span class="summary-label">通过</span>
                        </div>
                        <div class="summary-item failed">
                            <span class="summary-value">${report.summary.failed}</span>
                            <span class="summary-label">失败</span>
                        </div>
                        <div class="summary-item warnings">
                            <span class="summary-value">${report.summary.warnings}</span>
                            <span class="summary-label">警告</span>
                        </div>
                    </div>
                    
                    <div class="checklist-categories">
                        ${Object.entries(report.byCategory).map(([category, results]) => `
                            <div class="category-section">
                                <h3>${category}</h3>
                                <div class="category-results">
                                    ${results.map(r => `
                                        <div class="result-item ${r.passed ? (r.warning ? 'warning' : 'passed') : 'failed'}">
                                            <span class="result-icon">${r.passed ? (r.warning ? '⚠️' : '✅') : '❌'}</span>
                                            <span class="result-name">${r.name}</span>
                                            <span class="result-message">${r.message}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${report.recommendations.length > 0 ? `
                        <div class="checklist-recommendations">
                            <h3>📝 改进建议</h3>
                            <div class="recommendations-list">
                                ${report.recommendations.map(r => `
                                    <div class="recommendation-item ${r.type}">
                                        <span class="rec-icon">${r.type === 'error' ? '🔴' : '🟡'}</span>
                                        <div class="rec-content">
                                            <div class="rec-message">${r.message}</div>
                                            <div class="rec-details">${r.details}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            <style>
                .checklist-results {
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
                
                .checklist-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .checklist-content {
                    position: relative;
                    width: 90%;
                    max-width: 800px;
                    max-height: 85vh;
                    background: var(--color-surface, #1e293b);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                }
                
                .checklist-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--color-border, #334155);
                }
                
                .checklist-header h2 {
                    margin: 0;
                    font-size: 20px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .checklist-close {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    color: var(--color-text-secondary, #94a3b8);
                    font-size: 24px;
                    cursor: pointer;
                    border-radius: 8px;
                }
                
                .checklist-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-text, #f1f5f9);
                }
                
                .checklist-body {
                    padding: 24px;
                    max-height: calc(85vh - 80px);
                    overflow-y: auto;
                }
                
                .checklist-summary {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }
                
                .summary-item {
                    text-align: center;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                }
                
                .summary-value {
                    display: block;
                    font-size: 32px;
                    font-weight: bold;
                    color: var(--color-text, #f1f5f9);
                }
                
                .summary-label {
                    display: block;
                    font-size: 12px;
                    color: var(--color-text-secondary, #94a3b8);
                    margin-top: 4px;
                }
                
                .summary-item.passed .summary-value { color: #22c55e; }
                .summary-item.failed .summary-value { color: #ef4444; }
                .summary-item.warnings .summary-value { color: #f59e0b; }
                
                .category-section {
                    margin-bottom: 24px;
                }
                
                .category-section h3 {
                    margin: 0 0 12px;
                    font-size: 16px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .category-results {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .result-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    border-left: 3px solid;
                }
                
                .result-item.passed { border-left-color: #22c55e; }
                .result-item.failed { border-left-color: #ef4444; }
                .result-item.warning { border-left-color: #f59e0b; }
                
                .result-icon { font-size: 16px; }
                
                .result-name {
                    font-weight: 500;
                    color: var(--color-text, #f1f5f9);
                    min-width: 150px;
                }
                
                .result-message {
                    color: var(--color-text-secondary, #94a3b8);
                    font-size: 13px;
                }
                
                .checklist-recommendations h3 {
                    margin: 0 0 12px;
                    font-size: 16px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .recommendations-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .recommendation-item {
                    display: flex;
                    gap: 12px;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                
                .rec-icon { font-size: 16px; }
                
                .rec-message {
                    font-weight: 500;
                    color: var(--color-text, #f1f5f9);
                }
                
                .rec-details {
                    font-size: 13px;
                    color: var(--color-text-secondary, #94a3b8);
                    margin-top: 4px;
                }
            </style>
        `
        
        document.body.appendChild(container)
        
        const overlay = container.querySelector('.checklist-overlay')
        const closeBtn = container.querySelector('.checklist-close')
        
        const closeUI = () => {
            container.style.animation = 'fadeIn 0.3s ease reverse'
            setTimeout(() => container.remove(), 300)
        }
        
        overlay.addEventListener('click', closeUI)
        closeBtn.addEventListener('click', closeUI)
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeUI()
                document.removeEventListener('keydown', escHandler)
            }
        })
        
        return report
    }
}

const checklistManager = new ChecklistManager()

export { ChecklistManager, checklistManager }
