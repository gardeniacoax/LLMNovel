/**
 * 提示框系统模块
 * 提供成功、错误、警告、信息等提示功能
 */

/**
 * 提示框管理器
 */
class ToastManager {
    constructor(options = {}) {
        this.position = options.position || 'top-right'
        this.maxToasts = options.maxToasts || 5
        this.defaultDuration = options.defaultDuration || 3000
        this.container = null
        this.toasts = []
        
        this.init()
    }
    
    /**
     * 初始化
     */
    init() {
        this.container = this.createContainer()
        document.body.appendChild(this.container)
    }
    
    /**
     * 创建容器
     */
    createContainer() {
        const container = document.createElement('div')
        container.id = 'toast-container'
        
        const positions = {
            'top-right': 'fixed top-4 right-4 z-50 space-y-2',
            'top-left': 'fixed top-4 left-4 z-50 space-y-2',
            'bottom-right': 'fixed bottom-4 right-4 z-50 space-y-2',
            'bottom-left': 'fixed bottom-4 left-4 z-50 space-y-2',
            'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2',
            'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2'
        }
        
        container.className = positions[this.position] || positions['top-right']
        
        return container
    }
    
    /**
     * 显示提示
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        const toast = this.createToast(message, type)
        
        this.container.appendChild(toast)
        this.toasts.push(toast)
        
        while (this.toasts.length > this.maxToasts) {
            const oldToast = this.toasts.shift()
            this.removeToast(oldToast)
        }
        
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast)
            }, duration)
        }
        
        return toast
    }
    
    /**
     * 创建提示元素
     */
    createToast(message, type) {
        const configs = {
            success: {
                bgClass: 'bg-green-900',
                borderClass: 'border-green-700',
                icon: '✓',
                iconColor: 'text-green-400',
                title: '成功'
            },
            error: {
                bgClass: 'bg-red-900',
                borderClass: 'border-red-700',
                icon: '✗',
                iconColor: 'text-red-400',
                title: '错误'
            },
            warning: {
                bgClass: 'bg-yellow-900',
                borderClass: 'border-yellow-700',
                icon: '⚠',
                iconColor: 'text-yellow-400',
                title: '警告'
            },
            info: {
                bgClass: 'bg-blue-900',
                borderClass: 'border-blue-700',
                icon: 'ℹ',
                iconColor: 'text-blue-400',
                title: '提示'
            }
        }
        
        const config = configs[type] || configs.info
        
        const toast = document.createElement('div')
        toast.className = `toast ${config.bgClass} ${config.borderClass} border rounded-lg shadow-lg p-4 min-w-80 max-w-md transform translate-x-full opacity-0 transition-all duration-300`
        
        toast.innerHTML = `
            <div class="flex items-center">
                <span class="text-2xl mr-3 ${config.iconColor}">${config.icon}</span>
                <div class="flex-1">
                    <div class="font-semibold text-white">${config.title}</div>
                    <p class="text-sm text-slate-200 mt-1">${message}</p>
                </div>
                <button class="toast-close ml-3 text-slate-400 hover:text-white transition-colors">
                    ✕
                </button>
            </div>
        `
        
        const closeBtn = toast.querySelector('.toast-close')
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast)
        })
        
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0')
        }, 10)
        
        return toast
    }
    
    /**
     * 移除提示
     */
    removeToast(toast) {
        toast.classList.add('translate-x-full', 'opacity-0')
        
        setTimeout(() => {
            toast.remove()
            const index = this.toasts.indexOf(toast)
            if (index > -1) {
                this.toasts.splice(index, 1)
            }
        }, 300)
    }
    
    /**
     * 成功提示
     */
    success(message, duration = this.defaultDuration) {
        return this.show(message, 'success', duration)
    }
    
    /**
     * 错误提示
     */
    error(message, duration = this.defaultDuration) {
        return this.show(message, 'error', duration)
    }
    
    /**
     * 警告提示
     */
    warning(message, duration = this.defaultDuration) {
        return this.show(message, 'warning', duration)
    }
    
    /**
     * 信息提示
     */
    info(message, duration = this.defaultDuration) {
        return this.show(message, 'info', duration)
    }
    
    /**
     * 清除所有提示
     */
    clear() {
        this.toasts.forEach(toast => {
            this.removeToast(toast)
        })
        this.toasts = []
    }
    
    /**
     * 设置位置
     */
    setPosition(position) {
        this.position = position
        this.container.className = this.createContainer().className
    }
    
    /**
     * 设置最大数量
     */
    setMaxToasts(max) {
        this.maxToasts = max
    }
}

/**
 * 通知管理器
 */
class NotificationManager {
    constructor() {
        this.notifications = []
        this.container = null
        this.init()
    }
    
    /**
     * 初始化
     */
    init() {
        this.container = document.createElement('div')
        this.container.id = 'notification-container'
        this.container.className = 'fixed top-20 right-4 z-50 space-y-4'
        document.body.appendChild(this.container)
    }
    
    /**
     * 显示通知
     */
    show(options = {}) {
        const {
            title = '',
            message = '',
            icon = '',
            type = 'info',
            duration = 5000,
            actions = []
        } = options
        
        const notification = this.createNotification({
            title,
            message,
            icon,
            type,
            actions
        })
        
        this.container.appendChild(notification)
        this.notifications.push(notification)
        
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification)
            }, duration)
        }
        
        return notification
    }
    
    /**
     * 创建通知元素
     */
    createNotification(options) {
        const { title, message, icon, type, actions } = options
        
        const configs = {
            success: 'bg-green-900 border-green-700',
            error: 'bg-red-900 border-red-700',
            warning: 'bg-yellow-900 border-yellow-700',
            info: 'bg-blue-900 border-blue-700'
        }
        
        const notification = document.createElement('div')
        notification.className = `notification ${configs[type]} border rounded-lg shadow-xl p-4 min-w-80 max-w-sm transform translate-x-full opacity-0 transition-all duration-300`
        
        const actionsHtml = actions.map(action => `
            <button class="notification-action px-3 py-1 text-sm rounded bg-slate-700 hover:bg-slate-600 transition-colors" data-action="${action.id}">
                ${action.label}
            </button>
        `).join('')
        
        notification.innerHTML = `
            <div class="flex items-start">
                ${icon ? `<span class="text-2xl mr-3">${icon}</span>` : ''}
                <div class="flex-1">
                    ${title ? `<div class="font-semibold text-white mb-1">${title}</div>` : ''}
                    <div class="text-sm text-slate-200">${message}</div>
                    ${actions.length > 0 ? `
                        <div class="flex space-x-2 mt-3">
                            ${actionsHtml}
                        </div>
                    ` : ''}
                </div>
                <button class="notification-close ml-3 text-slate-400 hover:text-white transition-colors">
                    ✕
                </button>
            </div>
        `
        
        const closeBtn = notification.querySelector('.notification-close')
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification)
        })
        
        actions.forEach(action => {
            const btn = notification.querySelector(`[data-action="${action.id}"]`)
            if (btn && action.onClick) {
                btn.addEventListener('click', () => {
                    action.onClick()
                    this.removeNotification(notification)
                })
            }
        })
        
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0')
        }, 10)
        
        return notification
    }
    
    /**
     * 移除通知
     */
    removeNotification(notification) {
        notification.classList.add('translate-x-full', 'opacity-0')
        
        setTimeout(() => {
            notification.remove()
            const index = this.notifications.indexOf(notification)
            if (index > -1) {
                this.notifications.splice(index, 1)
            }
        }, 300)
    }
    
    /**
     * 清除所有通知
     */
    clear() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification)
        })
        this.notifications = []
    }
}

/**
 * 消息队列管理器
 */
class MessageQueue {
    constructor() {
        this.queue = []
        this.isProcessing = false
        this.interval = 1000
    }
    
    /**
     * 添加消息到队列
     */
    add(message, type = 'info', duration = 3000) {
        this.queue.push({ message, type, duration })
        
        if (!this.isProcessing) {
            this.process()
        }
    }
    
    /**
     * 处理队列
     */
    async process() {
        this.isProcessing = true
        
        while (this.queue.length > 0) {
            const { message, type, duration } = this.queue.shift()
            toast.show(message, type, duration)
            
            await this.delay(this.interval)
        }
        
        this.isProcessing = false
    }
    
    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    /**
     * 清空队列
     */
    clear() {
        this.queue = []
    }
    
    /**
     * 获取队列长度
     */
    getLength() {
        return this.queue.length
    }
}

const toast = new ToastManager()
const notification = new NotificationManager()
const messageQueue = new MessageQueue()

export { ToastManager, NotificationManager, MessageQueue, toast, notification, messageQueue }
