/**
 * 模态框系统模块
 * 提供确认对话框、自定义模态框等功能
 */

/**
 * 模态框管理器
 */
class ModalManager {
    constructor() {
        this.modals = []
        this.overlay = null
        this.createOverlay()
    }
    
    /**
     * 创建遮罩层
     */
    createOverlay() {
        this.overlay = document.createElement('div')
        this.overlay.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 z-40 hidden'
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeTopModal()
            }
        })
        document.body.appendChild(this.overlay)
    }
    
    /**
     * 显示模态框
     */
    show(options = {}) {
        const {
            title = '',
            content = '',
            footer = '',
            width = 'max-w-lg',
            closable = true,
            onClose = null,
            onOpen = null,
            closeOnOverlay = true,
            closeOnEscape = true
        } = options
        
        const modal = document.createElement('div')
        modal.className = 'modal fixed inset-0 z-50 flex items-center justify-center p-4'
        
        modal.innerHTML = `
            <div class="modal-content bg-slate-800 border border-slate-700 rounded-lg shadow-2xl ${width} w-full transform scale-95 opacity-0 transition-all duration-300">
                ${title ? `
                    <div class="modal-header p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 class="text-xl font-semibold text-white">${title}</h3>
                        ${closable ? `
                            <button class="modal-close text-slate-400 hover:text-white transition-colors">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
                <div class="modal-body p-4">
                    ${content}
                </div>
                ${footer ? `
                    <div class="modal-footer p-4 border-t border-slate-700 flex justify-end space-x-3">
                        ${footer}
                    </div>
                ` : ''}
            </div>
        `
        
        document.body.appendChild(modal)
        this.modals.push(modal)
        
        this.overlay.classList.remove('hidden')
        
        setTimeout(() => {
            const modalContent = modal.querySelector('.modal-content')
            modalContent.classList.remove('scale-95', 'opacity-0')
        }, 10)
        
        if (closable) {
            const closeBtn = modal.querySelector('.modal-close')
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close(modal))
            }
        }
        
        if (closeOnEscape) {
            const escHandler = (e) => {
                if (e.key === 'Escape' && closable) {
                    this.close(modal)
                    document.removeEventListener('keydown', escHandler)
                }
            }
            document.addEventListener('keydown', escHandler)
            modal.escHandler = escHandler
        }
        
        if (closeOnOverlay) {
            this.overlay.onclick = () => {
                if (closable) {
                    this.closeTopModal()
                }
            }
        }
        
        modal.onClose = onClose
        
        if (onOpen) {
            onOpen(modal)
        }
        
        return modal
    }
    
    /**
     * 关闭模态框
     */
    close(modal) {
        const modalContent = modal.querySelector('.modal-content')
        modalContent.classList.add('scale-95', 'opacity-0')
        
        setTimeout(() => {
            modal.remove()
            const index = this.modals.indexOf(modal)
            if (index > -1) {
                this.modals.splice(index, 1)
            }
            
            if (this.modals.length === 0) {
                this.overlay.classList.add('hidden')
            }
            
            if (modal.escHandler) {
                document.removeEventListener('keydown', modal.escHandler)
            }
            
            if (modal.onClose) {
                modal.onClose()
            }
        }, 300)
    }
    
    /**
     * 关闭顶层模态框
     */
    closeTopModal() {
        if (this.modals.length > 0) {
            this.close(this.modals[this.modals.length - 1])
        }
    }
    
    /**
     * 关闭所有模态框
     */
    closeAll() {
        this.modals.forEach(modal => {
            this.close(modal)
        })
    }
    
    /**
     * 确认对话框
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = '确认',
                confirmText = '确认',
                cancelText = '取消',
                type = 'info',
                confirmClass = 'btn-primary',
                cancelClass = 'btn-secondary'
            } = options
            
            const icons = {
                info: 'ℹ',
                warning: '⚠',
                danger: '✗',
                success: '✓'
            }
            
            const iconColors = {
                info: 'text-blue-400',
                warning: 'text-yellow-400',
                danger: 'text-red-400',
                success: 'text-green-400'
            }
            
            const modal = this.show({
                title,
                content: `
                    <div class="flex items-center">
                        <span class="text-4xl mr-4 ${iconColors[type]}">${icons[type]}</span>
                        <p class="text-slate-300">${message}</p>
                    </div>
                `,
                footer: `
                    <button class="btn ${cancelClass} modal-cancel">${cancelText}</button>
                    <button class="btn ${confirmClass} modal-confirm">${confirmText}</button>
                `,
                closable: false
            })
            
            const cancelBtn = modal.querySelector('.modal-cancel')
            const confirmBtn = modal.querySelector('.modal-confirm')
            
            cancelBtn.addEventListener('click', () => {
                this.close(modal)
                resolve(false)
            })
            
            confirmBtn.addEventListener('click', () => {
                this.close(modal)
                resolve(true)
            })
        })
    }
    
    /**
     * 提示对话框
     */
    alert(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = '提示',
                buttonText = '确定',
                type = 'info'
            } = options
            
            const icons = {
                info: 'ℹ',
                warning: '⚠',
                error: '✗',
                success: '✓'
            }
            
            const iconColors = {
                info: 'text-blue-400',
                warning: 'text-yellow-400',
                error: 'text-red-400',
                success: 'text-green-400'
            }
            
            const modal = this.show({
                title,
                content: `
                    <div class="flex items-center">
                        <span class="text-4xl mr-4 ${iconColors[type]}">${icons[type]}</span>
                        <p class="text-slate-300">${message}</p>
                    </div>
                `,
                footer: `
                    <button class="btn btn-primary modal-ok">${buttonText}</button>
                `,
                closable: false
            })
            
            const okBtn = modal.querySelector('.modal-ok')
            okBtn.addEventListener('click', () => {
                this.close(modal)
                resolve(true)
            })
        })
    }
    
    /**
     * 输入对话框
     */
    prompt(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = '输入',
                placeholder = '',
                defaultValue = '',
                confirmText = '确认',
                cancelText = '取消',
                inputType = 'text',
                required = false
            } = options
            
            const modal = this.show({
                title,
                content: `
                    <div>
                        <p class="text-slate-300 mb-4">${message}</p>
                        <input 
                            type="${inputType}"
                            class="modal-input w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                            placeholder="${placeholder}"
                            value="${defaultValue}"
                            ${required ? 'required' : ''}
                        >
                    </div>
                `,
                footer: `
                    <button class="btn btn-secondary modal-cancel">${cancelText}</button>
                    <button class="btn btn-primary modal-confirm">${confirmText}</button>
                `,
                closable: false
            })
            
            const input = modal.querySelector('.modal-input')
            const cancelBtn = modal.querySelector('.modal-cancel')
            const confirmBtn = modal.querySelector('.modal-confirm')
            
            input.focus()
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    confirmBtn.click()
                }
            })
            
            cancelBtn.addEventListener('click', () => {
                this.close(modal)
                resolve(null)
            })
            
            confirmBtn.addEventListener('click', () => {
                const value = input.value
                if (required && !value) {
                    input.classList.add('border-red-500')
                    return
                }
                this.close(modal)
                resolve(value)
            })
        })
    }
    
    /**
     * 自定义内容模态框
     */
    custom(content, options = {}) {
        return this.show({
            ...options,
            content
        })
    }
    
    /**
     * 获取模态框数量
     */
    getModalCount() {
        return this.modals.length
    }
    
    /**
     * 检查是否有打开的模态框
     */
    hasOpenModals() {
        return this.modals.length > 0
    }
}

/**
 * 抽屉管理器
 */
class DrawerManager {
    constructor() {
        this.drawers = []
        this.overlay = null
        this.createOverlay()
    }
    
    /**
     * 创建遮罩层
     */
    createOverlay() {
        this.overlay = document.createElement('div')
        this.overlay.className = 'drawer-overlay fixed inset-0 bg-black bg-opacity-50 z-40 hidden'
        this.overlay.addEventListener('click', () => {
            this.closeTopDrawer()
        })
        document.body.appendChild(this.overlay)
    }
    
    /**
     * 显示抽屉
     */
    show(options = {}) {
        const {
            title = '',
            content = '',
            position = 'right',
            width = 'w-80',
            closable = true,
            onClose = null
        } = options
        
        const drawer = document.createElement('div')
        drawer.className = `drawer fixed ${position === 'right' ? 'right-0' : 'left-0'} top-0 h-full ${width} bg-slate-800 border-${position === 'right' ? 'l' : 'r'} border-slate-700 shadow-2xl z-50 transform ${position === 'right' ? 'translate-x-full' : '-translate-x-full'} transition-transform duration-300`
        
        drawer.innerHTML = `
            ${title ? `
                <div class="drawer-header p-4 border-b border-slate-700 flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white">${title}</h3>
                    ${closable ? `
                        <button class="drawer-close text-slate-400 hover:text-white transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            ` : ''}
            <div class="drawer-body p-4 overflow-y-auto h-full">
                ${content}
            </div>
        `
        
        document.body.appendChild(drawer)
        this.drawers.push(drawer)
        
        this.overlay.classList.remove('hidden')
        
        setTimeout(() => {
            drawer.classList.remove(position === 'right' ? 'translate-x-full' : '-translate-x-full')
        }, 10)
        
        if (closable) {
            const closeBtn = drawer.querySelector('.drawer-close')
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close(drawer))
            }
        }
        
        drawer.onClose = onClose
        
        return drawer
    }
    
    /**
     * 关闭抽屉
     */
    close(drawer) {
        const position = drawer.classList.contains('right-0') ? 'right' : 'left'
        drawer.classList.add(position === 'right' ? 'translate-x-full' : '-translate-x-full')
        
        setTimeout(() => {
            drawer.remove()
            const index = this.drawers.indexOf(drawer)
            if (index > -1) {
                this.drawers.splice(index, 1)
            }
            
            if (this.drawers.length === 0) {
                this.overlay.classList.add('hidden')
            }
            
            if (drawer.onClose) {
                drawer.onClose()
            }
        }, 300)
    }
    
    /**
     * 关闭顶层抽屉
     */
    closeTopDrawer() {
        if (this.drawers.length > 0) {
            this.close(this.drawers[this.drawers.length - 1])
        }
    }
    
    /**
     * 关闭所有抽屉
     */
    closeAll() {
        this.drawers.forEach(drawer => {
            this.close(drawer)
        })
    }
}

const modal = new ModalManager()
const drawer = new DrawerManager()

export { ModalManager, DrawerManager, modal, drawer }
