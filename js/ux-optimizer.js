/**
 * 用户体验优化模块
 * 提供字体优化、主题管理、界面美化等功能
 */

/**
 * 字体管理器
 */
class FontManager {
    constructor() {
        this.fonts = {
            primary: "'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
            mono: "'Consolas', 'Monaco', 'Courier New', monospace",
            fallback: "sans-serif"
        }
        
        this.fontSizes = {
            xs: '12px',
            sm: '14px',
            base: '16px',
            lg: '18px',
            xl: '20px',
            '2xl': '24px',
            '3xl': '30px',
            '4xl': '36px'
        }
        
        this.lineHeights = {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
            loose: 2
        }
    }
    
    /**
     * 应用字体
     */
    applyFont(element, fontKey = 'primary') {
        if (!element) return
        
        element.style.fontFamily = this.fonts[fontKey] || this.fonts.primary
    }
    
    /**
     * 应用字体大小
     */
    applyFontSize(element, sizeKey = 'base') {
        if (!element) return
        
        element.style.fontSize = this.fontSizes[sizeKey] || this.fontSizes.base
    }
    
    /**
     * 应用行高
     */
    applyLineHeight(element, heightKey = 'normal') {
        if (!element) return
        
        element.style.lineHeight = this.lineHeights[heightKey] || this.lineHeights.normal
    }
    
    /**
     * 全局应用字体
     */
    applyGlobalFont() {
        document.documentElement.style.fontFamily = this.fonts.primary
        document.body.style.fontFamily = this.fonts.primary
        
        const codeElements = document.querySelectorAll('code, pre, .code')
        codeElements.forEach(el => {
            el.style.fontFamily = this.fonts.mono
        })
    }
    
    /**
     * 优化字体渲染
     */
    optimizeFontRendering() {
        document.documentElement.style.webkitFontSmoothing = 'antialiased'
        document.documentElement.style.mozOsxFontSmoothing = 'grayscale'
        document.documentElement.style.textRendering = 'optimizeLegibility'
    }
    
    /**
     * 动态加载字体
     */
    async loadFont(family, url) {
        try {
            const font = new FontFace(family, `url(${url})`)
            await font.load()
            document.fonts.add(font)
            return true
        } catch (error) {
            console.error('字体加载失败:', error)
            return false
        }
    }
}

/**
 * 主题管理器
 */
class ThemeManager {
    constructor() {
        this.themes = {
            dark: {
                name: '深色主题',
                colors: {
                    primary: '#3b82f6',
                    secondary: '#8b5cf6',
                    background: '#0f172a',
                    surface: '#1e293b',
                    text: '#f1f5f9',
                    textSecondary: '#94a3b8',
                    border: '#334155',
                    error: '#ef4444',
                    warning: '#f59e0b',
                    success: '#22c55e',
                    info: '#3b82f6'
                }
            },
            light: {
                name: '浅色主题',
                colors: {
                    primary: '#2563eb',
                    secondary: '#7c3aed',
                    background: '#ffffff',
                    surface: '#f8fafc',
                    text: '#1e293b',
                    textSecondary: '#64748b',
                    border: '#e2e8f0',
                    error: '#dc2626',
                    warning: '#d97706',
                    success: '#16a34a',
                    info: '#2563eb'
                }
            }
        }
        
        this.currentTheme = 'dark'
        this.listeners = []
    }
    
    /**
     * 获取当前主题
     */
    getCurrentTheme() {
        return this.currentTheme
    }
    
    /**
     * 切换主题
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark'
        this.applyTheme(this.currentTheme)
        this.notifyListeners()
    }
    
    /**
     * 应用主题
     */
    applyTheme(themeName) {
        const theme = this.themes[themeName]
        if (!theme) return
        
        const root = document.documentElement
        
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value)
        })
        
        root.setAttribute('data-theme', themeName)
        
        if (themeName === 'dark') {
            document.body.classList.add('dark-theme')
            document.body.classList.remove('light-theme')
        } else {
            document.body.classList.add('light-theme')
            document.body.classList.remove('dark-theme')
        }
        
        this.currentTheme = themeName
    }
    
    /**
     * 应用默认主题
     */
    applyDefaultTheme() {
        this.applyTheme('dark')
    }
    
    /**
     * 监听主题变化
     */
    onThemeChange(callback) {
        this.listeners.push(callback)
    }
    
    /**
     * 通知监听器
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback(this.currentTheme)
        })
    }
    
    /**
     * 获取主题颜色
     */
    getColor(colorKey) {
        const theme = this.themes[this.currentTheme]
        return theme.colors[colorKey] || null
    }
    
    /**
     * 设置自定义颜色
     */
    setCustomColor(colorKey, value) {
        const root = document.documentElement
        root.style.setProperty(`--color-${colorKey}`, value)
    }
}

/**
 * 界面美化器
 */
class UIBeautifier {
    /**
     * 添加阴影效果
     */
    static addShadow(element, level = 'md') {
        const shadows = {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }
        
        if (element) {
            element.style.boxShadow = shadows[level] || shadows.md
        }
    }
    
    /**
     * 添加圆角
     */
    static addBorderRadius(element, size = 'md') {
        const radiuses = {
            none: '0',
            sm: '0.25rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            '2xl': '1rem',
            '3xl': '1.5rem',
            full: '9999px'
        }
        
        if (element) {
            element.style.borderRadius = radiuses[size] || radiuses.md
        }
    }
    
    /**
     * 添加过渡效果
     */
    static addTransition(element, properties = 'all', duration = '300ms') {
        if (element) {
            element.style.transition = `${properties} ${duration} ease`
        }
    }
    
    /**
     * 添加悬停效果
     */
    static addHoverEffect(element, options = {}) {
        const {
            scale = 1.02,
            shadow = 'lg',
            duration = '200ms'
        } = options
        
        if (!element) return
        
        element.style.transition = `transform ${duration} ease, box-shadow ${duration} ease`
        
        element.addEventListener('mouseenter', () => {
            element.style.transform = `scale(${scale})`
            this.addShadow(element, shadow)
        })
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1)'
            element.style.boxShadow = ''
        })
    }
    
    /**
     * 添加点击效果
     */
    static addClickEffect(element) {
        if (!element) return
        
        element.addEventListener('mousedown', () => {
            element.style.transform = 'scale(0.98)'
        })
        
        element.addEventListener('mouseup', () => {
            element.style.transform = 'scale(1)'
        })
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1)'
        })
    }
    
    /**
     * 美化按钮
     */
    static beautifyButton(button, variant = 'primary') {
        if (!button) return
        
        const variants = {
            primary: {
                background: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none'
            },
            secondary: {
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)'
            },
            danger: {
                background: 'var(--color-error)',
                color: '#ffffff',
                border: 'none'
            },
            success: {
                background: 'var(--color-success)',
                color: '#ffffff',
                border: 'none'
            }
        }
        
        const style = variants[variant] || variants.primary
        
        Object.assign(button.style, {
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ...style
        })
        
        this.addHoverEffect(button, { scale: 1.05 })
        this.addClickEffect(button)
    }
    
    /**
     * 美化输入框
     */
    static beautifyInput(input) {
        if (!input) return
        
        Object.assign(input.style, {
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '14px',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none'
        })
        
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--color-primary)'
            input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
        })
        
        input.addEventListener('blur', () => {
            input.style.borderColor = 'var(--color-border)'
            input.style.boxShadow = 'none'
        })
    }
    
    /**
     * 美化卡片
     */
    static beautifyCard(card) {
        if (!card) return
        
        Object.assign(card.style, {
            backgroundColor: 'var(--color-surface)',
            borderRadius: '0.75rem',
            border: '1px solid var(--color-border)',
            padding: '1.5rem',
            transition: 'all 0.3s ease'
        })
        
        this.addShadow(card, 'lg')
        this.addHoverEffect(card, { scale: 1.01, shadow: 'xl' })
    }
}

/**
 * 动画管理器
 */
class AnimationManager {
    /**
     * 添加淡入动画
     */
    static fadeIn(element, duration = 300) {
        if (!element) return
        
        element.style.opacity = '0'
        element.style.display = 'block'
        
        setTimeout(() => {
            element.style.transition = `opacity ${duration}ms ease`
            element.style.opacity = '1'
        }, 10)
    }
    
    /**
     * 添加淡出动画
     */
    static fadeOut(element, duration = 300) {
        if (!element) return
        
        element.style.transition = `opacity ${duration}ms ease`
        element.style.opacity = '0'
        
        setTimeout(() => {
            element.style.display = 'none'
        }, duration)
    }
    
    /**
     * 添加滑入动画
     */
    static slideIn(element, direction = 'up', duration = 300) {
        if (!element) return
        
        const transforms = {
            up: 'translateY(20px)',
            down: 'translateY(-20px)',
            left: 'translateX(20px)',
            right: 'translateX(-20px)'
        }
        
        element.style.opacity = '0'
        element.style.transform = transforms[direction]
        element.style.display = 'block'
        
        setTimeout(() => {
            element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`
            element.style.opacity = '1'
            element.style.transform = 'translate(0)'
        }, 10)
    }
    
    /**
     * 添加脉冲动画
     */
    static pulse(element) {
        if (!element) return
        
        element.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }
    
    /**
     * 添加旋转动画
     */
    static spin(element) {
        if (!element) return
        
        element.style.animation = 'spin 1s linear infinite'
    }
    
    /**
     * 停止动画
     */
    static stop(element) {
        if (!element) return
        
        element.style.animation = 'none'
    }
}

const fontManager = new FontManager()
const themeManager = new ThemeManager()

export { 
    FontManager, 
    ThemeManager, 
    UIBeautifier, 
    AnimationManager,
    fontManager,
    themeManager
}
