/**
 * 项目初始化器
 * 提供应用启动、环境检查、配置加载等功能
 */

/**
 * 应用初始化器
 */
class AppInitializer {
    constructor() {
        this.isInitialized = false
        this.initTime = null
        this.errors = []
        this.warnings = []
    }
    
    /**
     * 初始化应用
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('应用已初始化')
            return
        }
        
        console.log('🚀 开始初始化应用...')
        this.initTime = Date.now()
        
        try {
            await this.checkEnvironment()
            await this.loadConfiguration()
            await this.initializeModules()
            await this.setupEventListeners()
            await this.showWelcomeIfNeeded()
            
            this.isInitialized = true
            const duration = Date.now() - this.initTime
            
            console.log(`✅ 应用初始化完成 (${duration}ms)`)
            
            if (this.warnings.length > 0) {
                console.warn('⚠️ 初始化警告:', this.warnings)
            }
            
            return {
                success: true,
                duration,
                errors: this.errors,
                warnings: this.warnings
            }
        } catch (error) {
            console.error('❌ 应用初始化失败:', error)
            this.errors.push(error.message)
            
            return {
                success: false,
                errors: this.errors,
                warnings: this.warnings
            }
        }
    }
    
    /**
     * 检查环境
     */
    async checkEnvironment() {
        console.log('📋 检查运行环境...')
        
        const checks = {
            localStorage: this.checkLocalStorage(),
            fetch: this.checkFetch(),
            promises: this.checkPromises(),
            es6: this.checkES6(),
            browser: this.checkBrowser()
        }
        
        const failedChecks = Object.entries(checks)
            .filter(([key, passed]) => !passed)
            .map(([key]) => key)
        
        if (failedChecks.length > 0) {
            throw new Error(`环境检查失败: ${failedChecks.join(', ')}`)
        }
        
        console.log('✅ 环境检查通过')
    }
    
    /**
     * 检查localStorage
     */
    checkLocalStorage() {
        try {
            const test = '__storage_test__'
            localStorage.setItem(test, test)
            localStorage.removeItem(test)
            return true
        } catch (e) {
            this.errors.push('localStorage不可用')
            return false
        }
    }
    
    /**
     * 检查Fetch API
     */
    checkFetch() {
        if (!window.fetch) {
            this.errors.push('Fetch API不可用')
            return false
        }
        return true
    }
    
    /**
     * 检查Promise
     */
    checkPromises() {
        if (!window.Promise) {
            this.errors.push('Promise不可用')
            return false
        }
        return true
    }
    
    /**
     * 检查ES6支持
     */
    checkES6() {
        try {
            eval('const test = () => {}')
            return true
        } catch (e) {
            this.errors.push('ES6不支持')
            return false
        }
    }
    
    /**
     * 检查浏览器
     */
    checkBrowser() {
        const ua = navigator.userAgent
        const browsers = {
            chrome: /Chrome\/(\d+)/,
            edge: /Edge\/(\d+)/,
            firefox: /Firefox\/(\d+)/,
            safari: /Safari\/(\d+)/
        }
        
        for (const [name, regex] of Object.entries(browsers)) {
            const match = ua.match(regex)
            if (match) {
                const version = parseInt(match[1])
                const minVersions = {
                    chrome: 90,
                    edge: 90,
                    firefox: 88,
                    safari: 14
                }
                
                if (version < minVersions[name]) {
                    this.warnings.push(`${name}版本过低，建议升级到${minVersions[name]}+`)
                }
                
                return true
            }
        }
        
        this.warnings.push('未知浏览器，某些功能可能不可用')
        return true
    }
    
    /**
     * 加载配置
     */
    async loadConfiguration() {
        console.log('⚙️ 加载配置...')
        
        const defaultConfig = {
            theme: 'dark',
            language: 'zh-CN',
            autoSave: true,
            autoSaveInterval: 30000,
            maxHistoryLength: 100,
            apiTimeout: 0,
            maxRetries: 3
        }
        
        try {
            const storedConfig = localStorage.getItem('llm-novel-config')
            const config = storedConfig ? JSON.parse(storedConfig) : {}
            
            window.appConfig = { ...defaultConfig, ...config }
            
            console.log('✅ 配置加载完成')
        } catch (error) {
            console.warn('配置加载失败，使用默认配置')
            window.appConfig = defaultConfig
            this.warnings.push('配置加载失败，使用默认配置')
        }
    }
    
    /**
     * 初始化模块
     */
    async initializeModules() {
        console.log('📦 初始化模块...')
        
        const modules = [
            { name: '主题管理', init: () => this.initThemeManager() },
            { name: '字体管理', init: () => this.initFontManager() },
            { name: '快捷键', init: () => this.initShortcutManager() },
            { name: '性能监控', init: () => this.initPerformanceMonitor() },
            { name: '错误处理', init: () => this.initErrorHandler() }
        ]
        
        for (const module of modules) {
            try {
                await module.init()
                console.log(`  ✓ ${module.name}`)
            } catch (error) {
                console.warn(`  ✗ ${module.name}: ${error.message}`)
                this.warnings.push(`${module.name}初始化失败`)
            }
        }
        
        console.log('✅ 模块初始化完成')
    }
    
    /**
     * 初始化主题管理
     */
    async initThemeManager() {
        if (window.themeManager) {
            window.themeManager.applyDefaultTheme()
        }
    }
    
    /**
     * 初始化字体管理
     */
    async initFontManager() {
        if (window.fontManager) {
            window.fontManager.applyGlobalFont()
            window.fontManager.optimizeFontRendering()
        }
    }
    
    /**
     * 初始化快捷键管理
     */
    async initShortcutManager() {
        if (window.shortcutManager) {
            window.shortcutManager.initializeDefaults()
        }
    }
    
    /**
     * 初始化性能监控
     */
    async initPerformanceMonitor() {
        if (window.performanceMonitor) {
            window.performanceMonitor.startMonitoring()
        }
    }
    
    /**
     * 初始化错误处理
     */
    async initErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('全局错误:', event.error)
        })
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise拒绝:', event.reason)
        })
    }
    
    /**
     * 设置事件监听
     */
    async setupEventListeners() {
        console.log('🎯 设置事件监听...')
        
        window.addEventListener('beforeunload', () => {
            this.onBeforeUnload()
        })
        
        window.addEventListener('online', () => {
            this.onOnline()
        })
        
        window.addEventListener('offline', () => {
            this.onOffline()
        })
        
        document.addEventListener('visibilitychange', () => {
            this.onVisibilityChange()
        })
        
        console.log('✅ 事件监听设置完成')
    }
    
    /**
     * 显示欢迎信息
     */
    async showWelcomeIfNeeded() {
        const hasVisited = localStorage.getItem('llm-novel-visited')
        
        if (!hasVisited) {
            if (window.userGuide) {
                window.userGuide.showGuide()
            }
            
            localStorage.setItem('llm-novel-visited', 'true')
        }
    }
    
    /**
     * 页面卸载前处理
     */
    onBeforeUnload() {
        if (window.appConfig && window.appConfig.autoSave) {
            console.log('自动保存数据...')
        }
    }
    
    /**
     * 网络连接恢复
     */
    onOnline() {
        console.log('网络已连接')
        if (window.toast) {
            window.toast.success('网络已恢复')
        }
    }
    
    /**
     * 网络连接断开
     */
    onOffline() {
        console.log('网络已断开')
        if (window.toast) {
            window.toast.warning('网络已断开，部分功能可能不可用')
        }
    }
    
    /**
     * 页面可见性变化
     */
    onVisibilityChange() {
        if (document.hidden) {
            console.log('页面隐藏')
        } else {
            console.log('页面显示')
        }
    }
    
    /**
     * 获取初始化状态
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            initTime: this.initTime,
            errors: this.errors,
            warnings: this.warnings
        }
    }
    
    /**
     * 重置应用
     */
    async reset() {
        console.log('🔄 重置应用...')
        
        localStorage.clear()
        
        this.isInitialized = false
        this.errors = []
        this.warnings = []
        
        await this.initialize()
        
        console.log('✅ 应用重置完成')
    }
}

/**
 * 启动画面管理器
 */
class SplashScreen {
    constructor() {
        this.element = null
        this.minDisplayTime = 1000
    }
    
    /**
     * 显示启动画面
     */
    show() {
        this.element = document.createElement('div')
        this.element.className = 'splash-screen'
        this.element.innerHTML = `
            <div class="splash-content">
                <div class="splash-logo">📚</div>
                <div class="splash-title">小说AI改写/续写工具</div>
                <div class="splash-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">正在加载...</div>
                </div>
            </div>
            <style>
                .splash-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, #0f172a, #1e293b);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    transition: opacity 0.5s ease;
                }
                
                .splash-content {
                    text-align: center;
                }
                
                .splash-logo {
                    font-size: 80px;
                    margin-bottom: 20px;
                    animation: bounce 1s ease infinite;
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                .splash-title {
                    font-size: 24px;
                    color: #f1f5f9;
                    margin-bottom: 30px;
                    font-weight: 600;
                }
                
                .splash-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(59, 130, 246, 0.2);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .loading-text {
                    color: #94a3b8;
                    font-size: 14px;
                }
            </style>
        `
        
        document.body.appendChild(this.element)
    }
    
    /**
     * 隐藏启动画面
     */
    hide() {
        if (!this.element) return
        
        const displayTime = Date.now() - this.startTime
        const remainingTime = Math.max(0, this.minDisplayTime - displayTime)
        
        setTimeout(() => {
            this.element.style.opacity = '0'
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element)
                }
                this.element = null
            }, 500)
        }, remainingTime)
    }
    
    /**
     * 更新加载文本
     */
    updateText(text) {
        if (this.element) {
            const textEl = this.element.querySelector('.loading-text')
            if (textEl) {
                textEl.textContent = text
            }
        }
    }
}

/**
 * 应用启动器
 */
class AppLauncher {
    constructor() {
        this.initializer = new AppInitializer()
        this.splashScreen = new SplashScreen()
    }
    
    /**
     * 启动应用
     */
    async launch() {
        console.log('🌟 启动应用...')
        
        this.splashScreen.startTime = Date.now()
        this.splashScreen.show()
        
        try {
            this.splashScreen.updateText('检查环境...')
            await this.initializer.checkEnvironment()
            
            this.splashScreen.updateText('加载配置...')
            await this.initializer.loadConfiguration()
            
            this.splashScreen.updateText('初始化模块...')
            await this.initializer.initializeModules()
            
            this.splashScreen.updateText('准备就绪...')
            await this.initializer.setupEventListeners()
            
            const result = await this.initializer.initialize()
            
            this.splashScreen.hide()
            
            if (result.success) {
                console.log('🎉 应用启动成功')
            } else {
                console.error('应用启动失败:', result.errors)
            }
            
            return result
        } catch (error) {
            console.error('应用启动失败:', error)
            this.splashScreen.hide()
            
            return {
                success: false,
                errors: [error.message]
            }
        }
    }
}

const appInitializer = new AppInitializer()
const appLauncher = new AppLauncher()

export { 
    AppInitializer, 
    SplashScreen, 
    AppLauncher, 
    appInitializer, 
    appLauncher 
}
