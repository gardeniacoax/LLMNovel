/**
 * 标签页切换模块
 * 提供标签页创建、切换、管理等功能
 */

/**
 * 标签页管理器
 */
class TabManager {
    constructor(container, options = {}) {
        this.container = container
        this.options = {
            defaultTab: options.defaultTab || 0,
            animationDuration: options.animationDuration || 300,
            onChange: options.onChange || null,
            closable: options.closable || false,
            onclose: options.onClose || null
        }
        this.tabs = []
        this.activeTab = null
        this.init()
    }
    
    /**
     * 初始化
     */
    init() {
        const tabList = this.container.querySelector('.tab-list')
        const tabPanels = this.container.querySelectorAll('.tab-panel')
        
        if (!tabList) return
        
        const tabButtons = tabList.querySelectorAll('.tab-button')
        
        tabButtons.forEach((button, index) => {
            const tabId = button.getAttribute('data-tab') || `tab-${index}`
            const panel = this.container.querySelector(`#${tabId}`) || tabPanels[index]
            
            this.tabs.push({
                id: tabId,
                button,
                panel,
                isActive: false
            })
            
            button.addEventListener('click', () => {
                this.switchTo(index)
            })
            
            if (this.options.closable) {
                const closeBtn = button.querySelector('.tab-close')
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation()
                        this.closeTab(index)
                    })
                }
            }
        })
        
        if (this.tabs.length > 0) {
            this.switchTo(this.options.defaultTab)
        }
    }
    
    /**
     * 切换到指定标签
     */
    switchTo(index) {
        const tab = this.tabs[index]
        if (!tab) return
        
        if (this.activeTab !== null && this.activeTab !== index) {
            this.deactivateTab(this.activeTab)
        }
        
        this.activateTab(index)
        this.activeTab = index
        
        if (this.options.onChange) {
            this.options.onChange(index, tab)
        }
    }
    
    /**
     * 激活标签
     */
    activateTab(index) {
        const tab = this.tabs[index]
        if (!tab) return
        
        tab.button.classList.add('active', 'text-blue-400', 'border-b-2', 'border-blue-400')
        tab.button.classList.remove('text-slate-400')
        
        if (tab.panel) {
            tab.panel.classList.remove('hidden')
            tab.panel.style.opacity = '0'
            tab.panel.style.transform = 'translateY(10px)'
            
            setTimeout(() => {
                tab.panel.style.transition = `opacity ${this.options.animationDuration}ms ease, transform ${this.options.animationDuration}ms ease`
                tab.panel.style.opacity = '1'
                tab.panel.style.transform = 'translateY(0)'
            }, 10)
        }
        
        tab.isActive = true
    }
    
    /**
     * 停用标签
     */
    deactivateTab(index) {
        const tab = this.tabs[index]
        if (!tab) return
        
        tab.button.classList.remove('active', 'text-blue-400', 'border-b-2', 'border-blue-400')
        tab.button.classList.add('text-slate-400')
        
        if (tab.panel) {
            tab.panel.classList.add('hidden')
        }
        
        tab.isActive = false
    }
    
    /**
     * 添加标签
     */
    addTab(tabData) {
        const {
            id = `tab-${this.tabs.length}`,
            title = '',
            content = '',
            icon = '',
            closable = this.options.closable
        } = tabData
        
        const tabList = this.container.querySelector('.tab-list')
        const tabContent = this.container.querySelector('.tab-content')
        
        if (!tabList || !tabContent) return
        
        const button = document.createElement('button')
        button.className = 'tab-button px-4 py-2 text-slate-400 hover:text-white transition-colors relative'
        button.setAttribute('data-tab', id)
        button.innerHTML = `
            ${icon ? `<span class="mr-2">${icon}</span>` : ''}
            <span>${title}</span>
            ${closable ? `<button class="tab-close ml-2 text-slate-400 hover:text-white">✕</button>` : ''}
        `
        
        const panel = document.createElement('div')
        panel.id = id
        panel.className = 'tab-panel hidden p-4'
        panel.innerHTML = content
        
        tabList.appendChild(button)
        tabContent.appendChild(panel)
        
        const tabIndex = this.tabs.length
        
        this.tabs.push({
            id,
            button,
            panel,
            isActive: false
        })
        
        button.addEventListener('click', () => {
            this.switchTo(tabIndex)
        })
        
        if (closable) {
            const closeBtn = button.querySelector('.tab-close')
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation()
                    this.closeTab(tabIndex)
                })
            }
        }
        
        return tabIndex
    }
    
    /**
     * 关闭标签
     */
    closeTab(index) {
        const tab = this.tabs[index]
        if (!tab) return
        
        if (this.options.onClose) {
            const shouldClose = this.options.onClose(index, tab)
            if (shouldClose === false) return
        }
        
        if (this.activeTab === index) {
            const newIndex = this.tabs.length > 1 ? (index === 0 ? 1 : index - 1) : null
            if (newIndex !== null) {
                this.switchTo(newIndex)
            }
        }
        
        tab.button.remove()
        if (tab.panel) {
            tab.panel.remove()
        }
        
        this.tabs.splice(index, 1)
        
        if (this.activeTab > index) {
            this.activeTab--
        }
    }
    
    /**
     * 获取当前激活的标签索引
     */
    getActiveIndex() {
        return this.activeTab
    }
    
    /**
     * 获取标签数量
     */
    getTabCount() {
        return this.tabs.length
    }
    
    /**
     * 获取标签数据
     */
    getTab(index) {
        return this.tabs[index]
    }
    
    /**
     * 销毁
     */
    destroy() {
        this.tabs.forEach(tab => {
            tab.button.removeEventListener('click', () => {})
        })
        this.tabs = []
    }
}

/**
 * 标签页构建器
 */
class TabBuilder {
    /**
     * 创建标签页
     */
    static createTabs(tabsData, options = {}) {
        const container = document.createElement('div')
        container.className = 'tabs-container'
        
        const tabList = document.createElement('div')
        tabList.className = 'tab-list flex border-b border-slate-700 space-x-1'
        
        const tabContent = document.createElement('div')
        tabContent.className = 'tab-content'
        
        container.appendChild(tabList)
        container.appendChild(tabContent)
        
        tabsData.forEach((tabData, index) => {
            const { title = '', content = '', icon = '', id = `tab-${index}` } = tabData
            
            const button = document.createElement('button')
            button.className = 'tab-button px-4 py-2 text-slate-400 hover:text-white transition-colors relative'
            button.setAttribute('data-tab', id)
            button.innerHTML = `
                ${icon ? `<span class="mr-2">${icon}</span>` : ''}
                <span>${title}</span>
            `
            
            const panel = document.createElement('div')
            panel.id = id
            panel.className = 'tab-panel hidden p-4'
            panel.innerHTML = content
            
            tabList.appendChild(button)
            tabContent.appendChild(panel)
        })
        
        const manager = new TabManager(container, options)
        
        return {
            container,
            manager
        }
    }
    
    /**
     * 创建垂直标签页
     */
    static createVerticalTabs(tabsData, options = {}) {
        const container = document.createElement('div')
        container.className = 'tabs-container flex'
        
        const tabList = document.createElement('div')
        tabList.className = 'tab-list flex flex-col border-r border-slate-700 space-y-1 w-48'
        
        const tabContent = document.createElement('div')
        tabContent.className = 'tab-content flex-1'
        
        container.appendChild(tabList)
        container.appendChild(tabContent)
        
        tabsData.forEach((tabData, index) => {
            const { title = '', content = '', icon = '', id = `tab-${index}` } = tabData
            
            const button = document.createElement('button')
            button.className = 'tab-button px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-left'
            button.setAttribute('data-tab', id)
            button.innerHTML = `
                <div class="flex items-center">
                    ${icon ? `<span class="mr-2">${icon}</span>` : ''}
                    <span>${title}</span>
                </div>
            `
            
            const panel = document.createElement('div')
            panel.id = id
            panel.className = 'tab-panel hidden p-4'
            panel.innerHTML = content
            
            tabList.appendChild(button)
            tabContent.appendChild(panel)
        })
        
        const manager = new TabManager(container, options)
        
        return {
            container,
            manager
        }
    }
    
    /**
     * 创建卡片式标签页
     */
    static createCardTabs(tabsData, options = {}) {
        const container = document.createElement('div')
        container.className = 'tabs-container'
        
        const tabList = document.createElement('div')
        tabList.className = 'tab-list flex space-x-2 mb-4'
        
        const tabContent = document.createElement('div')
        tabContent.className = 'tab-content'
        
        container.appendChild(tabList)
        container.appendChild(tabContent)
        
        tabsData.forEach((tabData, index) => {
            const { title = '', content = '', icon = '', id = `tab-${index}` } = tabData
            
            const button = document.createElement('button')
            button.className = 'tab-button px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-blue-500 transition-all'
            button.setAttribute('data-tab', id)
            button.innerHTML = `
                <div class="flex items-center">
                    ${icon ? `<span class="mr-2">${icon}</span>` : ''}
                    <span>${title}</span>
                </div>
            `
            
            const panel = document.createElement('div')
            panel.id = id
            panel.className = 'tab-panel hidden bg-slate-800 border border-slate-700 rounded-lg p-4'
            panel.innerHTML = content
            
            tabList.appendChild(button)
            tabContent.appendChild(panel)
        })
        
        const manager = new TabManager(container, options)
        
        return {
            container,
            manager
        }
    }
    
    /**
     * 创建药丸式标签页
     */
    static createPillTabs(tabsData, options = {}) {
        const container = document.createElement('div')
        container.className = 'tabs-container'
        
        const tabList = document.createElement('div')
        tabList.className = 'tab-list flex space-x-2 bg-slate-800 rounded-lg p-1'
        
        const tabContent = document.createElement('div')
        tabContent.className = 'tab-content mt-4'
        
        container.appendChild(tabList)
        container.appendChild(tabContent)
        
        tabsData.forEach((tabData, index) => {
            const { title = '', content = '', icon = '', id = `tab-${index}` } = tabData
            
            const button = document.createElement('button')
            button.className = 'tab-button px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-all'
            button.setAttribute('data-tab', id)
            button.innerHTML = `
                <div class="flex items-center">
                    ${icon ? `<span class="mr-2">${icon}</span>` : ''}
                    <span>${title}</span>
                </div>
            `
            
            const panel = document.createElement('div')
            panel.id = id
            panel.className = 'tab-panel hidden'
            panel.innerHTML = content
            
            tabList.appendChild(button)
            tabContent.appendChild(panel)
        })
        
        const manager = new TabManager(container, options)
        
        return {
            container,
            manager
        }
    }
}

/**
 * 标签页组管理器
 */
class TabGroup {
    constructor() {
        this.tabManagers = []
    }
    
    /**
     * 添加标签页管理器
     */
    add(tabManager) {
        this.tabManagers.push(tabManager)
    }
    
    /**
     * 移除标签页管理器
     */
    remove(tabManager) {
        const index = this.tabManagers.indexOf(tabManager)
        if (index > -1) {
            this.tabManagers.splice(index, 1)
        }
    }
    
    /**
     * 销毁所有
     */
    destroyAll() {
        this.tabManagers.forEach(manager => {
            manager.destroy()
        })
        this.tabManagers = []
    }
}

export { TabManager, TabBuilder, TabGroup }
