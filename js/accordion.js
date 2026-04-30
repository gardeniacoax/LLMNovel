/**
 * 折叠面板模块
 * 提供手风琴效果、折叠面板等功能
 */

/**
 * 折叠面板管理器
 */
class AccordionManager {
    constructor(container, options = {}) {
        this.container = container
        this.options = {
            allowMultiple: options.allowMultiple || false,
            defaultOpen: options.defaultOpen || null,
            animationDuration: options.animationDuration || 300,
            onOpen: options.onOpen || null,
            onClose: options.onClose || null
        }
        this.items = []
        this.init()
    }
    
    /**
     * 初始化
     */
    init() {
        const accordionItems = this.container.querySelectorAll('.accordion-item')
        
        accordionItems.forEach((item, index) => {
            const header = item.querySelector('.accordion-header')
            const content = item.querySelector('.accordion-content')
            
            if (header && content) {
                this.items.push({
                    element: item,
                    header,
                    content,
                    isOpen: false
                })
                
                header.addEventListener('click', () => {
                    this.toggle(index)
                })
            }
        })
        
        if (this.options.defaultOpen !== null) {
            this.open(this.options.defaultOpen)
        }
    }
    
    /**
     * 切换面板
     */
    toggle(index) {
        const item = this.items[index]
        if (!item) return
        
        if (item.isOpen) {
            this.close(index)
        } else {
            this.open(index)
        }
    }
    
    /**
     * 打开面板
     */
    open(index) {
        const item = this.items[index]
        if (!item || item.isOpen) return
        
        if (!this.options.allowMultiple) {
            this.closeAll()
        }
        
        item.content.style.maxHeight = item.content.scrollHeight + 'px'
        item.content.style.overflow = 'hidden'
        item.element.classList.add('open')
        item.header.classList.add('active')
        item.isOpen = true
        
        setTimeout(() => {
            item.content.style.maxHeight = 'none'
        }, this.options.animationDuration)
        
        if (this.options.onOpen) {
            this.options.onOpen(index, item)
        }
    }
    
    /**
     * 关闭面板
     */
    close(index) {
        const item = this.items[index]
        if (!item || !item.isOpen) return
        
        item.content.style.maxHeight = item.content.scrollHeight + 'px'
        
        setTimeout(() => {
            item.content.style.maxHeight = '0'
            item.element.classList.remove('open')
            item.header.classList.remove('active')
            item.isOpen = false
            
            if (this.options.onClose) {
                this.options.onClose(index, item)
            }
        }, 10)
    }
    
    /**
     * 关闭所有面板
     */
    closeAll() {
        this.items.forEach((item, index) => {
            if (item.isOpen) {
                this.close(index)
            }
        })
    }
    
    /**
     * 打开所有面板
     */
    openAll() {
        if (!this.options.allowMultiple) return
        
        this.items.forEach((item, index) => {
            if (!item.isOpen) {
                this.open(index)
            }
        })
    }
    
    /**
     * 获取打开的面板索引
     */
    getOpenIndexes() {
        return this.items
            .map((item, index) => item.isOpen ? index : null)
            .filter(index => index !== null)
    }
    
    /**
     * 销毁
     */
    destroy() {
        this.items.forEach(item => {
            item.header.removeEventListener('click', () => {})
        })
        this.items = []
    }
}

/**
 * 折叠面板构建器
 */
class AccordionBuilder {
    /**
     * 创建折叠面板
     */
    static createAccordion(items, options = {}) {
        const container = document.createElement('div')
        container.className = 'accordion space-y-2'
        
        items.forEach((item, index) => {
            const accordionItem = this.createAccordionItem(item, index, options)
            container.appendChild(accordionItem)
        })
        
        const manager = new AccordionManager(container, options)
        
        return {
            container,
            manager
        }
    }
    
    /**
     * 创建折叠项
     */
    static createAccordionItem(item, index, options = {}) {
        const {
            title = '',
            content = '',
            icon = '▼',
            activeIcon = '▲'
        } = item
        
        const accordionItem = document.createElement('div')
        accordionItem.className = 'accordion-item bg-slate-800 border border-slate-700 rounded-lg overflow-hidden'
        
        accordionItem.innerHTML = `
            <div class="accordion-header flex items-center justify-between p-4 cursor-pointer hover:bg-slate-750 transition-colors">
                <div class="flex items-center">
                    ${item.icon ? `<span class="mr-3 text-blue-400">${item.icon}</span>` : ''}
                    <span class="font-semibold text-white">${title}</span>
                </div>
                <span class="accordion-icon text-slate-400 transform transition-transform duration-300">${icon}</span>
            </div>
            <div class="accordion-content max-h-0 overflow-hidden transition-all duration-300">
                <div class="p-4 text-slate-300 border-t border-slate-700">
                    ${content}
                </div>
            </div>
        `
        
        return accordionItem
    }
    
    /**
     * 创建嵌套折叠面板
     */
    static createNestedAccordion(nestedItems, options = {}) {
        const container = document.createElement('div')
        container.className = 'accordion space-y-2'
        
        nestedItems.forEach((item, index) => {
            const accordionItem = this.createAccordionItem(item, index, options)
            
            if (item.children && item.children.length > 0) {
                const content = accordionItem.querySelector('.accordion-content > div')
                const nestedAccordion = this.createAccordion(item.children, {
                    ...options,
                    allowMultiple: false
                })
                content.appendChild(nestedAccordion.container)
            }
            
            container.appendChild(accordionItem)
        })
        
        const manager = new AccordionManager(container, options)
        
        return {
            container,
            manager
        }
    }
}

/**
 * 可折叠区域管理器
 */
class CollapsibleManager {
    constructor(element, options = {}) {
        this.element = element
        this.trigger = null
        this.content = null
        this.isOpen = false
        this.options = {
            triggerSelector: options.triggerSelector || '.collapsible-trigger',
            contentSelector: options.contentSelector || '.collapsible-content',
            animationDuration: options.animationDuration || 300,
            onOpen: options.onOpen || null,
            onClose: options.onClose || null
        }
        
        this.init()
    }
    
    /**
     * 初始化
     */
    init() {
        this.trigger = this.element.querySelector(this.options.triggerSelector)
        this.content = this.element.querySelector(this.options.contentSelector)
        
        if (this.trigger && this.content) {
            this.trigger.addEventListener('click', () => {
                this.toggle()
            })
        }
    }
    
    /**
     * 切换
     */
    toggle() {
        if (this.isOpen) {
            this.close()
        } else {
            this.open()
        }
    }
    
    /**
     * 打开
     */
    open() {
        if (this.isOpen) return
        
        this.content.style.maxHeight = this.content.scrollHeight + 'px'
        this.content.style.overflow = 'hidden'
        this.element.classList.add('open')
        this.trigger.classList.add('active')
        this.isOpen = true
        
        setTimeout(() => {
            this.content.style.maxHeight = 'none'
        }, this.options.animationDuration)
        
        if (this.options.onOpen) {
            this.options.onOpen(this)
        }
    }
    
    /**
     * 关闭
     */
    close() {
        if (!this.isOpen) return
        
        this.content.style.maxHeight = this.content.scrollHeight + 'px'
        
        setTimeout(() => {
            this.content.style.maxHeight = '0'
            this.element.classList.remove('open')
            this.trigger.classList.remove('active')
            this.isOpen = false
            
            if (this.options.onClose) {
                this.options.onClose(this)
            }
        }, 10)
    }
    
    /**
     * 销毁
     */
    destroy() {
        if (this.trigger) {
            this.trigger.removeEventListener('click', () => {})
        }
    }
}

/**
 * 手风琴组管理器
 */
class AccordionGroup {
    constructor() {
        this.accordions = []
    }
    
    /**
     * 添加折叠面板
     */
    add(accordion) {
        this.accordions.push(accordion)
    }
    
    /**
     * 移除折叠面板
     */
    remove(accordion) {
        const index = this.accordions.indexOf(accordion)
        if (index > -1) {
            this.accordions.splice(index, 1)
        }
    }
    
    /**
     * 关闭所有
     */
    closeAll() {
        this.accordions.forEach(accordion => {
            accordion.closeAll()
        })
    }
    
    /**
     * 销毁所有
     */
    destroyAll() {
        this.accordions.forEach(accordion => {
            accordion.destroy()
        })
        this.accordions = []
    }
}

export { AccordionManager, AccordionBuilder, CollapsibleManager, AccordionGroup }
