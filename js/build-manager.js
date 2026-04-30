/**
 * 最终打包工具模块
 * 提供项目打包、资源优化、版本号更新等功能
 */

/**
 * 打包管理器
 */
class BuildManager {
    constructor() {
        this.projectName = 'LLMNovel'
        this.version = '1.0.0'
        this.buildTime = null
        this.files = []
    }
    
    /**
     * 执行打包
     */
    async build() {
        console.log('🚀 开始打包项目...')
        
        this.buildTime = new Date().toISOString()
        
        const buildConfig = {
            projectName: this.projectName,
            version: this.version,
            buildTime: this.buildTime,
            files: this.getProjectFiles(),
            stats: await this.calculateStats()
        }
        
        console.log('✅ 打包完成')
        console.log('📊 打包统计:', buildConfig.stats)
        
        return buildConfig
    }
    
    /**
     * 获取项目文件列表
     */
    getProjectFiles() {
        return [
            { path: 'index.html', type: 'html', required: true },
            { path: 'css/style.css', type: 'css', required: true },
            { path: 'js/app.js', type: 'javascript', required: true },
            { path: 'js/config.js', type: 'javascript', required: true },
            { path: 'js/utils.js', type: 'javascript', required: true },
            { path: 'js/ui.js', type: 'javascript', required: true },
            { path: 'js/file.js', type: 'javascript', required: true },
            { path: 'js/api.js', type: 'javascript', required: true },
            { path: 'js/continue.js', type: 'javascript', required: true },
            { path: 'js/rewrite.js', type: 'javascript', required: true },
            { path: 'js/roleCard.js', type: 'javascript', required: true },
            { path: 'js/progress.js', type: 'javascript', required: true },
            { path: 'js/storage.js', type: 'javascript', required: true },
            { path: 'js/monitor.js', type: 'javascript', required: true },
            { path: 'js/validator.js', type: 'javascript', required: true },
            { path: 'js/timeout.js', type: 'javascript', required: true },
            { path: 'js/submitGuard.js', type: 'javascript', required: true },
            { path: 'js/exceptionLogger.js', type: 'javascript', required: true },
            { path: 'js/responsive.js', type: 'javascript', required: true },
            { path: 'js/cardManager.js', type: 'javascript', required: true },
            { path: 'js/animation.js', type: 'javascript', required: true },
            { path: 'js/toast.js', type: 'javascript', required: true },
            { path: 'js/modal.js', type: 'javascript', required: true },
            { path: 'js/accordion.js', type: 'javascript', required: true },
            { path: 'js/tabs.js', type: 'javascript', required: true },
            { path: 'js/code-optimizer.js', type: 'javascript', required: false },
            { path: 'js/performance-optimizer.js', type: 'javascript', required: false },
            { path: 'js/ux-optimizer.js', type: 'javascript', required: false },
            { path: 'js/user-guide.js', type: 'javascript', required: false },
            { path: 'js/shortcut-manager.js', type: 'javascript', required: false },
            { path: 'js/bug-fixer.js', type: 'javascript', required: false }
        ]
    }
    
    /**
     * 计算项目统计
     */
    async calculateStats() {
        return {
            totalFiles: this.getProjectFiles().length,
            requiredFiles: this.getProjectFiles().filter(f => f.required).length,
            optionalFiles: this.getProjectFiles().filter(f => !f.required).length,
            estimatedSize: '约500KB（未压缩）',
            supportedBrowsers: ['Chrome 90+', 'Edge 90+', 'Firefox 88+', 'Safari 14+']
        }
    }
    
    /**
     * 生成构建报告
     */
    generateBuildReport(buildConfig) {
        return {
            title: `${this.projectName} v${this.version} 构建报告`,
            buildTime: this.buildTime,
            summary: {
                总文件数: buildConfig.stats.totalFiles,
                必需文件: buildConfig.stats.requiredFiles,
                可选文件: buildConfig.stats.optionalFiles,
                预估大小: buildConfig.stats.estimatedSize
            },
            files: buildConfig.files,
            compatibility: {
                浏览器支持: buildConfig.stats.supportedBrowsers,
                运行环境: '本地浏览器，无需服务器',
                数据存储: 'localStorage本地存储'
            }
        }
    }
    
    /**
     * 创建打包下载
     */
    async createDownloadPackage() {
        const buildConfig = await this.build()
        const report = this.generateBuildReport(buildConfig)
        
        const packageInfo = {
            name: this.projectName,
            version: this.version,
            description: '小说AI改写/续写工具 - 本地网页应用',
            author: 'LLMNovel Team',
            license: 'MIT',
            buildTime: this.buildTime,
            files: buildConfig.files.map(f => f.path)
        }
        
        return {
            packageInfo,
            report,
            downloadUrl: this.generateDownloadUrl(packageInfo)
        }
    }
    
    /**
     * 生成下载URL
     */
    generateDownloadUrl(packageInfo) {
        const content = JSON.stringify(packageInfo, null, 2)
        const blob = new Blob([content], { type: 'application/json' })
        return URL.createObjectURL(blob)
    }
}

/**
 * 资源优化器
 */
class ResourceOptimizer {
    /**
     * 优化HTML
     */
    static optimizeHtml(html) {
        return html
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><')
            .replace(/\s+>/g, '>')
            .replace(/<\s+/g, '<')
            .trim()
    }
    
    /**
     * 优化CSS
     */
    static optimizeCss(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s*;\s*/g, ';')
            .replace(/;}/g, '}')
            .trim()
    }
    
    /**
     * 优化JavaScript
     */
    static optimizeJs(js) {
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{};,:])\s*/g, '$1')
            .replace(/;\s*}/g, '}')
            .trim()
    }
    
    /**
     * 移除console.log
     */
    static removeConsoleLogs(code) {
        return code.replace(/console\.(log|warn|error|info|debug)\([^)]*\);?/g, '')
    }
    
    /**
     * 计算优化效果
     */
    static calculateOptimization(original, optimized) {
        const originalSize = new Blob([original]).size
        const optimizedSize = new Blob([optimized]).size
        const savedBytes = originalSize - optimizedSize
        const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(2)
        
        return {
            originalSize: this.formatBytes(originalSize),
            optimizedSize: this.formatBytes(optimizedSize),
            savedBytes: this.formatBytes(savedBytes),
            savedPercentage: `${savedPercentage}%`
        }
    }
    
    /**
     * 格式化字节
     */
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
}

/**
 * 版本号管理器
 */
class VersionManager {
    constructor() {
        this.currentVersion = '1.0.0'
        this.versionHistory = []
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
            patch: parts[2] || 0
        }
    }
    
    /**
     * 升级主版本号
     */
    bumpMajor() {
        const v = this.parseVersion(this.currentVersion)
        this.currentVersion = `${v.major + 1}.0.0`
        this.recordVersion('major')
        return this.currentVersion
    }
    
    /**
     * 升级次版本号
     */
    bumpMinor() {
        const v = this.parseVersion(this.currentVersion)
        this.currentVersion = `${v.major}.${v.minor + 1}.0`
        this.recordVersion('minor')
        return this.currentVersion
    }
    
    /**
     * 升级修订号
     */
    bumpPatch() {
        const v = this.parseVersion(this.currentVersion)
        this.currentVersion = `${v.major}.${v.minor}.${v.patch + 1}`
        this.recordVersion('patch')
        return this.currentVersion
    }
    
    /**
     * 记录版本变更
     */
    recordVersion(type) {
        this.versionHistory.push({
            version: this.currentVersion,
            type,
            timestamp: new Date().toISOString()
        })
    }
    
    /**
     * 获取版本历史
     */
    getVersionHistory() {
        return this.versionHistory
    }
    
    /**
     * 生成版本信息
     */
    generateVersionInfo() {
        return {
            version: this.currentVersion,
            buildDate: new Date().toISOString(),
            environment: 'production',
            features: [
                'TXT文件导入导出',
                'AI智能分析',
                '角色卡管理',
                '智能续写',
                '智能改写',
                '全局Prompt配置',
                'API Key管理',
                '本地数据存储',
                '深色主题',
                '快捷键支持'
            ]
        }
    }
}

/**
 * 清单生成器
 */
class ManifestGenerator {
    /**
     * 生成项目清单
     */
    static generate(projectInfo) {
        return {
            name: projectInfo.name || 'LLMNovel',
            version: projectInfo.version || '1.0.0',
            description: projectInfo.description || '小说AI改写/续写工具',
            author: projectInfo.author || 'LLMNovel Team',
            license: projectInfo.license || 'MIT',
            homepage: projectInfo.homepage || './index.html',
            keywords: [
                '小说',
                'AI',
                '改写',
                '续写',
                '写作工具',
                '本地应用'
            ],
            engines: {
                browser: 'Chrome 90+, Edge 90+, Firefox 88+, Safari 14+'
            },
            features: {
                offline: true,
                local_storage: true,
                responsive: true,
                dark_mode: true,
                keyboard_shortcuts: true
            },
            build: {
                time: new Date().toISOString(),
                environment: 'production',
                optimizer: 'ResourceOptimizer v1.0'
            }
        }
    }
    
    /**
     * 导出为JSON
     */
    static exportJson(manifest) {
        return JSON.stringify(manifest, null, 2)
    }
}

const buildManager = new BuildManager()
const versionManager = new VersionManager()

export { 
    BuildManager, 
    ResourceOptimizer, 
    VersionManager, 
    ManifestGenerator,
    buildManager,
    versionManager
}
