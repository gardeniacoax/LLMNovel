/**
 * 快捷键系统
 * 提供全局快捷键管理、自定义快捷键等功能
 */

/**
 * 快捷键管理器
 */
class ShortcutManager {
    constructor() {
        this.shortcuts = new Map()
        this.enabled = true
        this.pressedKeys = new Set()
        this.history = []
        this.maxHistoryLength = 10
    }
    
    /**
     * 初始化默认快捷键
     */
    initializeDefaults() {
        this.register('ctrl+s', {
            description: '保存当前内容',
            action: () => this.emit('save'),
            category: '文件操作'
        })
        
        this.register('ctrl+i', {
            description: '导入文件',
            action: () => this.emit('import'),
            category: '文件操作'
        })
        
        this.register('ctrl+e', {
            description: '导出文件',
            action: () => this.emit('export'),
            category: '文件操作'
        })
        
        this.register('ctrl+,', {
            description: '打开设置',
            action: () => this.emit('openSettings'),
            category: '系统操作'
        })
        
        this.register('ctrl+/', {
            description: '显示/隐藏使用说明',
            action: () => this.emit('toggleGuide'),
            category: '系统操作'
        })
        
        this.register('ctrl+z', {
            description: '撤销',
            action: () => this.emit('undo'),
            category: '编辑操作'
        })
        
        this.register('ctrl+y', {
            description: '重做',
            action: () => this.emit('redo'),
            category: '编辑操作'
        })
        
        this.register('ctrl+a', {
            description: '全选',
            action: () => this.emit('selectAll'),
            category: '编辑操作'
        })
        
        this.register('ctrl+f', {
            description: '查找',
            action: () => this.emit('find'),
            category: '编辑操作'
        })
        
        this.register('ctrl+g', {
            description: 'AI分析',
            action: () => this.emit('analyze'),
            category: 'AI操作'
        })
        
        this.register('ctrl+enter', {
            description: '开始生成',
            action: () => this.emit('generate'),
            category: 'AI操作'
        })
        
        this.register('escape', {
            description: '关闭弹窗/取消操作',
            action: () => this.emit('cancel'),
            category: '系统操作'
        })
        
        this.register('f1', {
            description: '显示帮助',
            action: () => this.emit('help'),
            category: '系统操作'
        })
        
        this.register('f5', {
            description: '刷新页面',
            action: () => window.location.reload(),
            category: '系统操作',
            preventDefault: false
        })
        
        this.setupListeners()
    }
    
    /**
     * 注册快捷键
     */
    register(combination, options) {
        const key = this.normalizeCombination(combination)
        
        this.shortcuts.set(key, {
            combination: key,
            description: options.description || '',
            action: options.action,
            category: options.category || '其他',
            preventDefault: options.preventDefault !== false,
            enabled: true
        })
    }
    
    /**
     * 注销快捷键
     */
    unregister(combination) {
        const key = this.normalizeCombination(combination)
        this.shortcuts.delete(key)
    }
    
    /**
     * 启用快捷键
     */
    enable() {
        this.enabled = true
    }
    
    /**
     * 禁用快捷键
     */
    disable() {
        this.enabled = false
    }
    
    /**
     * 启用特定快捷键
     */
    enableShortcut(combination) {
        const key = this.normalizeCombination(combination)
        const shortcut = this.shortcuts.get(key)
        if (shortcut) {
            shortcut.enabled = true
        }
    }
    
    /**
     * 禁用特定快捷键
     */
    disableShortcut(combination) {
        const key = this.normalizeCombination(combination)
        const shortcut = this.shortcuts.get(key)
        if (shortcut) {
            shortcut.enabled = false
        }
    }
    
    /**
     * 标准化组合键
     */
    normalizeCombination(combination) {
        return combination
            .toLowerCase()
            .split('+')
            .map(key => key.trim())
            .sort((a, b) => {
                const modifiers = ['ctrl', 'alt', 'shift', 'meta']
                const aIsModifier = modifiers.includes(a)
                const bIsModifier = modifiers.includes(b)
                
                if (aIsModifier && !bIsModifier) return -1
                if (!aIsModifier && bIsModifier) return 1
                return a.localeCompare(b)
            })
            .join('+')
    }
    
    /**
     * 获取当前按键组合
     */
    getCurrentCombination(event) {
        const parts = []
        
        if (event.ctrlKey) parts.push('ctrl')
        if (event.altKey) parts.push('alt')
        if (event.shiftKey) parts.push('shift')
        if (event.metaKey) parts.push('meta')
        
        let key = event.key.toLowerCase()
        
        const keyMap = {
            ' ': 'space',
            'arrowup': 'up',
            'arrowdown': 'down',
            'arrowleft': 'left',
            'arrowright': 'right',
            'escape': 'escape'
        }
        
        key = keyMap[key] || key
        
        if (!['ctrl', 'alt', 'shift', 'meta'].includes(key)) {
            parts.push(key)
        }
        
        return parts.join('+')
    }
    
    /**
     * 设置事件监听
     */
    setupListeners() {
        document.addEventListener('keydown', (event) => {
            if (!this.enabled) return
            
            if (this.isInputFocused() && !this.isAllowedInInput(event)) {
                return
            }
            
            const combination = this.getCurrentCombination(event)
            const shortcut = this.shortcuts.get(combination)
            
            if (shortcut && shortcut.enabled) {
                if (shortcut.preventDefault) {
                    event.preventDefault()
                }
                
                this.recordHistory(combination)
                shortcut.action()
                
                this.showShortcutToast(combination, shortcut.description)
            }
        })
        
        document.addEventListener('keyup', () => {
            this.pressedKeys.clear()
        })
    }
    
    /**
     * 检查是否在输入框中
     */
    isInputFocused() {
        const activeElement = document.activeElement
        const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT']
        
        return inputTypes.includes(activeElement.tagName) ||
               activeElement.isContentEditable
    }
    
    /**
     * 检查快捷键是否允许在输入框中使用
     */
    isAllowedInInput(event) {
        const allowedShortcuts = [
            'ctrl+a',
            'ctrl+c',
            'ctrl+v',
            'ctrl+x',
            'ctrl+z',
            'ctrl+y',
            'escape'
        ]
        
        const combination = this.getCurrentCombination(event)
        return allowedShortcuts.includes(combination)
    }
    
    /**
     * 记录历史
     */
    recordHistory(combination) {
        this.history.unshift({
            combination,
            timestamp: Date.now()
        })
        
        if (this.history.length > this.maxHistoryLength) {
            this.history.pop()
        }
    }
    
    /**
     * 显示快捷键提示
     */
    showShortcutToast(combination, description) {
        const existingToast = document.querySelector('.shortcut-toast')
        if (existingToast) {
            existingToast.remove()
        }
        
        const toast = document.createElement('div')
        toast.className = 'shortcut-toast'
        toast.innerHTML = `
            <span class="shortcut-keys">${this.formatCombination(combination)}</span>
            <span class="shortcut-desc">${description}</span>
        `
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            z-index: 10000;
            animation: fadeInUp 0.3s ease;
        `
        
        const style = document.createElement('style')
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            .shortcut-keys {
                background: rgba(255, 255, 255, 0.2);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: monospace;
            }
            
            .shortcut-desc {
                color: rgba(255, 255, 255, 0.8);
            }
        `
        
        if (!document.querySelector('#shortcut-toast-styles')) {
            style.id = 'shortcut-toast-styles'
            document.head.appendChild(style)
        }
        
        document.body.appendChild(toast)
        
        setTimeout(() => {
            toast.style.animation = 'fadeInUp 0.3s ease reverse'
            setTimeout(() => toast.remove(), 300)
        }, 2000)
    }
    
    /**
     * 格式化组合键显示
     */
    formatCombination(combination) {
        const keyMap = {
            'ctrl': 'Ctrl',
            'alt': 'Alt',
            'shift': 'Shift',
            'meta': '⌘',
            'enter': 'Enter',
            'escape': 'Esc',
            'space': 'Space',
            'up': '↑',
            'down': '↓',
            'left': '←',
            'right': '→'
        }
        
        return combination
            .split('+')
            .map(key => keyMap[key] || key.toUpperCase())
            .join(' + ')
    }
    
    /**
     * 获取所有快捷键
     */
    getAllShortcuts() {
        const grouped = {}
        
        this.shortcuts.forEach((shortcut, key) => {
            if (!grouped[shortcut.category]) {
                grouped[shortcut.category] = []
            }
            
            grouped[shortcut.category].push({
                combination: key,
                description: shortcut.description,
                enabled: shortcut.enabled
            })
        })
        
        return grouped
    }
    
    /**
     * 获取快捷键历史
     */
    getHistory() {
        return this.history
    }
    
    /**
     * 导出快捷键配置
     */
    exportConfig() {
        const config = {}
        
        this.shortcuts.forEach((shortcut, key) => {
            config[key] = {
                description: shortcut.description,
                category: shortcut.category,
                enabled: shortcut.enabled
            }
        })
        
        return config
    }
    
    /**
     * 导入快捷键配置
     */
    importConfig(config) {
        Object.entries(config).forEach(([key, options]) => {
            const shortcut = this.shortcuts.get(key)
            if (shortcut) {
                shortcut.enabled = options.enabled
            }
        })
    }
    
    /**
     * 事件发射器
     */
    emit(event, data) {
        const customEvent = new CustomEvent(`shortcut:${event}`, { detail: data })
        document.dispatchEvent(customEvent)
    }
    
    /**
     * 事件监听器
     */
    on(event, callback) {
        document.addEventListener(`shortcut:${event}`, (e) => {
            callback(e.detail)
        })
    }
}

/**
 * 快捷键帮助面板
 */
class ShortcutHelp {
    /**
     * 显示快捷键帮助
     */
    static show() {
        const existingPanel = document.querySelector('.shortcut-help-panel')
        if (existingPanel) {
            existingPanel.remove()
            return
        }
        
        const panel = document.createElement('div')
        panel.className = 'shortcut-help-panel'
        
        const shortcuts = shortcutManager.getAllShortcuts()
        
        let shortcutsHtml = ''
        Object.entries(shortcuts).forEach(([category, items]) => {
            shortcutsHtml += `
                <div class="shortcut-category">
                    <h4>${category}</h4>
                    <div class="shortcut-list">
                        ${items.map(item => `
                            <div class="shortcut-item ${item.enabled ? '' : 'disabled'}">
                                <span class="shortcut-keys">${shortcutManager.formatCombination(item.combination)}</span>
                                <span class="shortcut-desc">${item.description}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `
        })
        
        panel.innerHTML = `
            <div class="shortcut-help-overlay"></div>
            <div class="shortcut-help-content">
                <div class="shortcut-help-header">
                    <h3>⌨️ 快捷键列表</h3>
                    <button class="close-btn">×</button>
                </div>
                <div class="shortcut-help-body">
                    ${shortcutsHtml}
                </div>
            </div>
            <style>
                .shortcut-help-panel {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.2s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .shortcut-help-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .shortcut-help-content {
                    position: relative;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    background: var(--color-surface, #1e293b);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                }
                
                .shortcut-help-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--color-border, #334155);
                }
                
                .shortcut-help-header h3 {
                    margin: 0;
                    font-size: 18px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .close-btn {
                    width: 28px;
                    height: 28px;
                    border: none;
                    background: transparent;
                    color: var(--color-text-secondary, #94a3b8);
                    font-size: 20px;
                    cursor: pointer;
                    border-radius: 6px;
                }
                
                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-text, #f1f5f9);
                }
                
                .shortcut-help-body {
                    padding: 20px;
                    max-height: calc(80vh - 60px);
                    overflow-y: auto;
                }
                
                .shortcut-category {
                    margin-bottom: 20px;
                }
                
                .shortcut-category:last-child {
                    margin-bottom: 0;
                }
                
                .shortcut-category h4 {
                    margin: 0 0 12px;
                    font-size: 14px;
                    color: var(--color-primary, #3b82f6);
                    font-weight: 500;
                }
                
                .shortcut-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .shortcut-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                
                .shortcut-item.disabled {
                    opacity: 0.5;
                }
                
                .shortcut-item .shortcut-keys {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 12px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .shortcut-item .shortcut-desc {
                    color: var(--color-text-secondary, #94a3b8);
                    font-size: 13px;
                }
            </style>
        `
        
        document.body.appendChild(panel)
        
        const overlay = panel.querySelector('.shortcut-help-overlay')
        const closeBtn = panel.querySelector('.close-btn')
        
        overlay.addEventListener('click', () => panel.remove())
        closeBtn.addEventListener('click', () => panel.remove())
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                panel.remove()
                document.removeEventListener('keydown', escHandler)
            }
        })
    }
}

const shortcutManager = new ShortcutManager()
shortcutManager.initializeDefaults()

export { ShortcutManager, ShortcutHelp, shortcutManager }
