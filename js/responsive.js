/**
 * 响应式布局管理模块
 * 提供断点检测、响应式样式应用等功能
 */

/**
 * 响应式管理器
 */
class ResponsiveManager {
    constructor() {
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1366,
            wide: 1920
        }
        
        this.currentBreakpoint = this.getCurrentBreakpoint()
        this.listeners = []
        this.setupResizeListener()
        this.applyResponsiveStyles()
    }
    
    /**
     * 获取当前断点
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth
        
        if (width < this.breakpoints.mobile) return 'mobile'
        if (width < this.breakpoints.tablet) return 'tablet'
        if (width < this.breakpoints.desktop) return 'desktop'
        if (width < this.breakpoints.wide) return 'desktop'
        return 'wide'
    }
    
    /**
     * 设置窗口大小变化监听器
     */
    setupResizeListener() {
        let resizeTimer
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                const newBreakpoint = this.getCurrentBreakpoint()
                
                if (newBreakpoint !== this.currentBreakpoint) {
                    const oldBreakpoint = this.currentBreakpoint
                    this.currentBreakpoint = newBreakpoint
                    this.onBreakpointChange(newBreakpoint, oldBreakpoint)
                }
            }, 250)
        })
    }
    
    /**
     * 断点变化处理
     */
    onBreakpointChange(newBreakpoint, oldBreakpoint) {
        document.body.setAttribute('data-breakpoint', newBreakpoint)
        
        this.applyResponsiveStyles()
        
        this.notifyListeners(newBreakpoint, oldBreakpoint)
        
        window.dispatchEvent(new CustomEvent('breakpointChange', {
            detail: { newBreakpoint, oldBreakpoint }
        }))
    }
    
    /**
     * 应用响应式样式
     */
    applyResponsiveStyles() {
        const root = document.documentElement
        
        switch (this.currentBreakpoint) {
            case 'mobile':
                root.style.setProperty('--sidebar-width', '0px')
                root.style.setProperty('--content-padding', '16px')
                root.style.setProperty('--font-size-base', '14px')
                root.style.setProperty('--card-columns', '1')
                break
                
            case 'tablet':
                root.style.setProperty('--sidebar-width', '200px')
                root.style.setProperty('--content-padding', '24px')
                root.style.setProperty('--font-size-base', '14px')
                root.style.setProperty('--card-columns', '2')
                break
                
            case 'desktop':
                root.style.setProperty('--sidebar-width', '240px')
                root.style.setProperty('--content-padding', '32px')
                root.style.setProperty('--font-size-base', '16px')
                root.style.setProperty('--card-columns', '3')
                break
                
            case 'wide':
                root.style.setProperty('--sidebar-width', '280px')
                root.style.setProperty('--content-padding', '48px')
                root.style.setProperty('--font-size-base', '16px')
                root.style.setProperty('--card-columns', '4')
                break
        }
    }
    
    /**
     * 检查是否为移动端
     */
    isMobile() {
        return this.currentBreakpoint === 'mobile'
    }
    
    /**
     * 检查是否为平板
     */
    isTablet() {
        return this.currentBreakpoint === 'tablet'
    }
    
    /**
     * 检查是否为桌面端
     */
    isDesktop() {
        return this.currentBreakpoint === 'desktop' || this.currentBreakpoint === 'wide'
    }
    
    /**
     * 检查是否为宽屏
     */
    isWide() {
        return this.currentBreakpoint === 'wide'
    }
    
    /**
     * 添加断点变化监听器
     */
    addListener(callback) {
        this.listeners.push(callback)
    }
    
    /**
     * 移除断点变化监听器
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback)
        if (index > -1) {
            this.listeners.splice(index, 1)
        }
    }
    
    /**
     * 通知所有监听器
     */
    notifyListeners(newBreakpoint, oldBreakpoint) {
        this.listeners.forEach(callback => {
            callback(newBreakpoint, oldBreakpoint)
        })
    }
    
    /**
     * 获取断点配置
     */
    getBreakpoints() {
        return { ...this.breakpoints }
    }
    
    /**
     * 设置断点配置
     */
    setBreakpoints(breakpoints) {
        this.breakpoints = { ...this.breakpoints, ...breakpoints }
        this.currentBreakpoint = this.getCurrentBreakpoint()
        this.applyResponsiveStyles()
    }
    
    /**
     * 获取当前断点名称
     */
    getBreakpointName() {
        return this.currentBreakpoint
    }
    
    /**
     * 获取窗口尺寸
     */
    getWindowSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        }
    }
    
    /**
     * 检查是否为触摸设备
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0
    }
    
    /**
     * 获取设备方向
     */
    getOrientation() {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    }
}

/**
 * 侧边栏管理器
 */
class SidebarManager {
    constructor(sidebarId, toggleBtnId) {
        this.sidebar = document.getElementById(sidebarId)
        this.toggleBtn = document.getElementById(toggleBtnId)
        this.isOpen = false
        this.responsiveManager = null
        
        this.init()
    }
    
    /**
     * 初始化
     */
    init() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle())
        }
        
        document.addEventListener('click', (e) => {
            if (this.isOpen && this.sidebar && !this.sidebar.contains(e.target) && e.target !== this.toggleBtn) {
                this.close()
            }
        })
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close()
            }
        })
    }
    
    /**
     * 切换侧边栏
     */
    toggle() {
        if (this.isOpen) {
            this.close()
        } else {
            this.open()
        }
    }
    
    /**
     * 打开侧边栏
     */
    open() {
        if (this.sidebar) {
            this.sidebar.classList.add('open')
            this.isOpen = true
            document.body.style.overflow = 'hidden'
        }
    }
    
    /**
     * 关闭侧边栏
     */
    close() {
        if (this.sidebar) {
            this.sidebar.classList.remove('open')
            this.isOpen = false
            document.body.style.overflow = ''
        }
    }
    
    /**
     * 设置响应式管理器
     */
    setResponsiveManager(manager) {
        this.responsiveManager = manager
        
        manager.addListener((newBreakpoint) => {
            if (newBreakpoint !== 'mobile' && this.isOpen) {
                this.close()
            }
        })
    }
}

/**
 * 网格布局管理器
 */
class GridManager {
    /**
     * 创建响应式网格
     */
    static createResponsiveGrid(container, options = {}) {
        const {
            mobileCols = 1,
            tabletCols = 2,
            desktopCols = 3,
            wideCols = 4,
            gap = '1.5rem'
        } = options
        
        const grid = document.createElement('div')
        grid.className = 'responsive-grid'
        grid.style.display = 'grid'
        grid.style.gap = gap
        grid.style.gridTemplateColumns = `repeat(${mobileCols}, 1fr)`
        
        const updateColumns = (breakpoint) => {
            let cols = mobileCols
            
            switch (breakpoint) {
                case 'mobile':
                    cols = mobileCols
                    break
                case 'tablet':
                    cols = tabletCols
                    break
                case 'desktop':
                    cols = desktopCols
                    break
                case 'wide':
                    cols = wideCols
                    break
            }
            
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
        }
        
        window.addEventListener('breakpointChange', (e) => {
            updateColumns(e.detail.newBreakpoint)
        })
        
        return grid
    }
    
    /**
     * 创建瀑布流布局
     */
    static createMasonryLayout(container, options = {}) {
        const {
            columns = 3,
            gap = '1rem'
        } = options
        
        const masonry = document.createElement('div')
        masonry.className = 'masonry-layout'
        masonry.style.columnCount = columns
        masonry.style.columnGap = gap
        
        return masonry
    }
}

const responsiveManager = new ResponsiveManager()

export { ResponsiveManager, SidebarManager, GridManager, responsiveManager }
