class ThreeColumnLayout {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.leftPanelContent = options.leftPanelContent || ''
        this.centerPanelContent = options.centerPanelContent || ''
        this.rightPanelContent = options.rightPanelContent || ''
        
        this.leftPanelWidth = options.leftPanelWidth || 200
        this.rightPanelWidth = options.rightPanelWidth || 280
        
        this.leftPanelOpen = true
        this.rightPanelOpen = true
        
        this.onLeftPanelToggle = options.onLeftPanelToggle || null
        this.onRightPanelToggle = options.onRightPanelToggle || null
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="three-column-layout">
                <div class="left-panel ${this.leftPanelOpen ? '' : 'closed'}" id="left-panel">
                    <div class="panel-header">
                        <span class="panel-title">章节列表</span>
                        <button class="panel-toggle" id="left-toggle">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="panel-content" id="left-content">
                        ${this.leftPanelContent}
                    </div>
                </div>
                
                <div class="center-panel" id="center-panel">
                    <div class="mobile-nav">
                        <button class="nav-btn" id="mobile-left-toggle">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                        <span class="nav-title" id="nav-title">内容编辑</span>
                        <button class="nav-btn" id="mobile-right-toggle">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="panel-content" id="center-content">
                        ${this.centerPanelContent}
                    </div>
                </div>
                
                <div class="right-panel ${this.rightPanelOpen ? '' : 'closed'}" id="right-panel">
                    <div class="panel-header">
                        <button class="panel-toggle" id="right-toggle">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                        <span class="panel-title">设置与信息</span>
                    </div>
                    <div class="panel-content" id="right-content">
                        ${this.rightPanelContent}
                    </div>
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    bindEvents() {
        const leftToggle = document.getElementById('left-toggle')
        const rightToggle = document.getElementById('right-toggle')
        const mobileLeftToggle = document.getElementById('mobile-left-toggle')
        const mobileRightToggle = document.getElementById('mobile-right-toggle')
        
        if (leftToggle) {
            leftToggle.addEventListener('click', () => this.toggleLeftPanel())
        }
        
        if (rightToggle) {
            rightToggle.addEventListener('click', () => this.toggleRightPanel())
        }
        
        if (mobileLeftToggle) {
            mobileLeftToggle.addEventListener('click', () => this.toggleLeftPanel())
        }
        
        if (mobileRightToggle) {
            mobileRightToggle.addEventListener('click', () => this.toggleRightPanel())
        }
    }
    
    toggleLeftPanel() {
        this.leftPanelOpen = !this.leftPanelOpen
        
        const leftPanel = document.getElementById('left-panel')
        if (leftPanel) {
            leftPanel.classList.toggle('closed', !this.leftPanelOpen)
        }
        
        if (this.onLeftPanelToggle) {
            this.onLeftPanelToggle(this.leftPanelOpen)
        }
    }
    
    toggleRightPanel() {
        this.rightPanelOpen = !this.rightPanelOpen
        
        const rightPanel = document.getElementById('right-panel')
        if (rightPanel) {
            rightPanel.classList.toggle('closed', !this.rightPanelOpen)
        }
        
        if (this.onRightPanelToggle) {
            this.onRightPanelToggle(this.rightPanelOpen)
        }
    }
    
    setLeftPanelContent(content) {
        this.leftPanelContent = content
        const leftContent = document.getElementById('left-content')
        if (leftContent) {
            leftContent.innerHTML = content
        }
    }
    
    setCenterPanelContent(content) {
        this.centerPanelContent = content
        const centerContent = document.getElementById('center-content')
        if (centerContent) {
            centerContent.innerHTML = content
        }
    }
    
    setRightPanelContent(content) {
        this.rightPanelContent = content
        const rightContent = document.getElementById('right-content')
        if (rightContent) {
            rightContent.innerHTML = content
        }
    }
    
    applyStyles() {
        if (!document.getElementById('three-column-layout-styles')) {
            const style = document.createElement('style')
            style.id = 'three-column-layout-styles'
            style.textContent = `
                .three-column-layout {
                    display: flex;
                    height: calc(100vh - 60px);
                    overflow: hidden;
                    background: #16162a;
                }
                
                .left-panel {
                    width: ${this.leftPanelWidth}px;
                    min-width: ${this.leftPanelWidth}px;
                    background: #1a1a2e;
                    border-right: 1px solid #2d2d44;
                    display: flex;
                    flex-direction: column;
                    transition: width 0.3s ease, min-width 0.3s ease;
                }
                
                .left-panel.closed {
                    width: 0;
                    min-width: 0;
                    border-right: none;
                }
                
                .center-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .right-panel {
                    width: ${this.rightPanelWidth}px;
                    min-width: ${this.rightPanelWidth}px;
                    background: #1a1a2e;
                    border-left: 1px solid #2d2d44;
                    display: flex;
                    flex-direction: column;
                    transition: width 0.3s ease, min-width 0.3s ease;
                }
                
                .right-panel.closed {
                    width: 0;
                    min-width: 0;
                    border-left: none;
                }
                
                .panel-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-bottom: 1px solid #2d2d44;
                    background: #1a1a2e;
                }
                
                .panel-title {
                    font-size: 14px;
                    font-weight: 500;
                    color: #e2e8f0;
                }
                
                .panel-toggle {
                    padding: 4px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                
                .panel-toggle:hover {
                    background: #2d2d44;
                    color: #e2e8f0;
                }
                
                .panel-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }
                
                .left-panel.closed .panel-header,
                .left-panel.closed .panel-content,
                .right-panel.closed .panel-header,
                .right-panel.closed .panel-content {
                    display: none;
                }
                
                .mobile-nav {
                    display: none;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: #1a1a2e;
                    border-bottom: 1px solid #2d2d44;
                }
                
                .nav-btn {
                    padding: 8px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                
                .nav-btn:hover {
                    background: #2d2d44;
                    color: #e2e8f0;
                }
                
                .nav-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #e2e8f0;
                }
                
                @media (max-width: 1199px) {
                    .left-panel {
                        position: fixed;
                        left: 0;
                        top: 60px;
                        height: calc(100vh - 60px);
                        z-index: 100;
                        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
                    }
                    
                    .left-panel.closed {
                        left: -${this.leftPanelWidth}px;
                    }
                    
                    .mobile-nav {
                        display: flex;
                    }
                }
                
                @media (max-width: 767px) {
                    .right-panel {
                        position: fixed;
                        right: 0;
                        top: 60px;
                        height: calc(100vh - 60px);
                        z-index: 100;
                        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
                    }
                    
                    .right-panel.closed {
                        right: -${this.rightPanelWidth}px;
                    }
                }
            `
            document.head.appendChild(style)
        }
    }
    
    setTitle(title) {
        const navTitle = document.getElementById('nav-title')
        if (navTitle) {
            navTitle.textContent = title
        }
    }
    
    isOpen(panel) {
        if (panel === 'left') return this.leftPanelOpen
        if (panel === 'right') return this.rightPanelOpen
        return false
    }
    
    openPanel(panel) {
        if (panel === 'left' && !this.leftPanelOpen) {
            this.toggleLeftPanel()
        }
        if (panel === 'right' && !this.rightPanelOpen) {
            this.toggleRightPanel()
        }
    }
    
    closePanel(panel) {
        if (panel === 'left' && this.leftPanelOpen) {
            this.toggleLeftPanel()
        }
        if (panel === 'right' && this.rightPanelOpen) {
            this.toggleRightPanel()
        }
    }
}

class StatusBar {
    constructor(options = {}) {
        this.container = options.container || document.body
        this.info = options.info || {}
        
        this.onExport = options.onExport || null
        this.onSettings = options.onSettings || null
    }
    
    render() {
        const container = typeof this.container === 'string' 
            ? document.getElementById(this.container) 
            : this.container
        
        if (!container) return
        
        container.innerHTML = `
            <div class="status-bar">
                <div class="status-left">
                    <span class="status-item">
                        <span class="status-label">已选择：</span>
                        <span class="status-value" id="status-selected">${this.info.selected || 0} 章</span>
                    </span>
                    <span class="status-divider">|</span>
                    <span class="status-item">
                        <span class="status-label">预计总字数：</span>
                        <span class="status-value" id="status-words">${(this.info.totalWords || 0).toLocaleString()} 字</span>
                    </span>
                    <span class="status-divider">|</span>
                    <span class="status-item">
                        <span class="status-label">当前处理：</span>
                        <span class="status-value" id="status-current">${this.info.current || '无'}</span>
                    </span>
                </div>
                <div class="status-right">
                    <button class="status-btn" id="status-export" title="导出">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                    </button>
                    <button class="status-btn" id="status-settings" title="设置">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `
        
        this.bindEvents()
        this.applyStyles()
    }
    
    bindEvents() {
        const exportBtn = document.getElementById('status-export')
        const settingsBtn = document.getElementById('status-settings')
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (this.onExport) this.onExport()
            })
        }
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                if (this.onSettings) this.onSettings()
            })
        }
    }
    
    updateInfo(info) {
        this.info = { ...this.info, ...info }
        
        const selectedEl = document.getElementById('status-selected')
        const wordsEl = document.getElementById('status-words')
        const currentEl = document.getElementById('status-current')
        
        if (selectedEl) selectedEl.textContent = `${this.info.selected || 0} 章`
        if (wordsEl) wordsEl.textContent = `${(this.info.totalWords || 0).toLocaleString()} 字`
        if (currentEl) currentEl.textContent = this.info.current || '无'
    }
    
    applyStyles() {
        if (!document.getElementById('status-bar-styles')) {
            const style = document.createElement('style')
            style.id = 'status-bar-styles'
            style.textContent = `
                .status-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 16px;
                    background: #1a1a2e;
                    border-top: 1px solid #2d2d44;
                    font-size: 13px;
                }
                
                .status-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .status-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .status-item {
                    display: flex;
                    align-items: center;
                }
                
                .status-label {
                    color: #64748b;
                }
                
                .status-value {
                    color: #e2e8f0;
                    font-weight: 500;
                }
                
                .status-divider {
                    color: #2d2d44;
                }
                
                .status-btn {
                    padding: 6px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background 0.2s, color 0.2s;
                }
                
                .status-btn:hover {
                    background: #2d2d44;
                    color: #e2e8f0;
                }
                
                @media (max-width: 767px) {
                    .status-divider {
                        display: none;
                    }
                    
                    .status-item {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    
                    .status-label {
                        font-size: 11px;
                    }
                    
                    .status-value {
                        font-size: 12px;
                    }
                }
            `
            document.head.appendChild(style)
        }
    }
}

export { ThreeColumnLayout, StatusBar }
