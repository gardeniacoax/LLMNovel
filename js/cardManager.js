/**
 * 卡片式布局管理模块
 * 提供卡片创建、布局管理等功能
 */

/**
 * 卡片管理器
 */
class CardManager {
    /**
     * 创建卡片
     */
    static createCard(options = {}) {
        const {
            title = '',
            content = '',
            footer = '',
            className = '',
            collapsible = false,
            defaultCollapsed = false,
            shadow = 'lg',
            hoverable = true
        } = options
        
        const card = document.createElement('div')
        card.className = `card bg-slate-800 border border-slate-700 rounded-lg shadow-${shadow} ${className} ${hoverable ? 'hover:shadow-xl transition-shadow duration-300' : ''}`
        
        let html = ''
        
        if (title) {
            html += `
                <div class="card-header p-4 border-b border-slate-700 ${collapsible ? 'cursor-pointer hover:bg-slate-750' : ''}">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-white">${title}</h3>
                        ${collapsible ? `
                            <svg class="w-5 h-5 text-slate-400 transform transition-transform ${defaultCollapsed ? '' : 'rotate-180'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        ` : ''}
                    </div>
                </div>
            `
        }
        
        html += `
            <div class="card-body p-4 ${defaultCollapsed ? 'hidden' : ''}">
                ${content}
            </div>
        `
        
        if (footer) {
            html += `
                <div class="card-footer p-4 border-t border-slate-700 bg-slate-850">
                    ${footer}
                </div>
            `
        }
        
        card.innerHTML = html
        
        if (collapsible) {
            const header = card.querySelector('.card-header')
            const body = card.querySelector('.card-body')
            const icon = card.querySelector('svg')
            
            header.addEventListener('click', () => {
                body.classList.toggle('hidden')
                icon.classList.toggle('rotate-180')
            })
        }
        
        return card
    }
    
    /**
     * 创建卡片网格
     */
    static createCardGrid(cards, columns = 3) {
        const grid = document.createElement('div')
        grid.className = `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`
        
        cards.forEach(card => {
            grid.appendChild(card)
        })
        
        return grid
    }
    
    /**
     * 创建统计卡片
     */
    static createStatCard(title, value, icon, color = 'blue') {
        return this.createCard({
            content: `
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-slate-400">${title}</p>
                        <p class="text-3xl font-bold text-${color}-400 mt-1">${value}</p>
                    </div>
                    <div class="text-${color}-400 text-4xl">
                        ${icon}
                    </div>
                </div>
            `
        })
    }
    
    /**
     * 创建信息卡片
     */
    static createInfoCard(title, items) {
        const itemsHtml = items.map(item => `
            <div class="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                <span class="text-slate-400">${item.label}</span>
                <span class="text-white font-medium">${item.value}</span>
            </div>
        `).join('')
        
        return this.createCard({
            title,
            content: itemsHtml
        })
    }
    
    /**
     * 创建列表卡片
     */
    static createListCard(title, items, options = {}) {
        const {
            numbered = false,
            clickable = false,
            onItemClick = null
        } = options
        
        const listItems = items.map((item, index) => `
            <li class="${clickable ? 'cursor-pointer hover:bg-slate-700' : ''} py-2 px-3 rounded ${numbered ? 'flex items-center' : ''}">
                ${numbered ? `<span class="mr-3 text-slate-500">${index + 1}.</span>` : ''}
                <span>${item}</span>
            </li>
        `).join('')
        
        const card = this.createCard({
            title,
            content: `<ul class="space-y-1">${listItems}</ul>`
        })
        
        if (clickable && onItemClick) {
            const listItemsElements = card.querySelectorAll('li')
            listItemsElements.forEach((li, index) => {
                li.addEventListener('click', () => onItemClick(index, items[index]))
            })
        }
        
        return card
    }
    
    /**
     * 创建进度卡片
     */
    static createProgressCard(title, progress, options = {}) {
        const {
            color = 'blue',
            showPercentage = true,
            label = ''
        } = options
        
        const percentage = Math.min(100, Math.max(0, progress))
        
        return this.createCard({
            title,
            content: `
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">${label}</span>
                        ${showPercentage ? `<span class="text-${color}-400 font-semibold">${percentage}%</span>` : ''}
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-2">
                        <div class="bg-${color}-500 h-2 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `
        })
    }
    
    /**
     * 创建图片卡片
     */
    static createImageCard(title, imageUrl, description = '', options = {}) {
        const {
            imageHeight = 'h-48',
            overlay = false
        } = options
        
        const imageHtml = overlay ? `
            <div class="relative ${imageHeight}">
                <img src="${imageUrl}" alt="${title}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <h3 class="absolute bottom-4 left-4 text-white font-semibold">${title}</h3>
            </div>
        ` : `
            <img src="${imageUrl}" alt="${title}" class="w-full ${imageHeight} object-cover">
        `
        
        return this.createCard({
            content: `
                ${imageHtml}
                ${!overlay && title ? `<div class="p-4"><h3 class="text-lg font-semibold text-white">${title}</h3></div>` : ''}
                ${description ? `<p class="p-4 text-slate-400 text-sm">${description}</p>` : ''}
            `
        })
    }
    
    /**
     * 创建操作卡片
     */
    static createActionCard(title, description, actions) {
        const actionsHtml = actions.map(action => `
            <button class="btn ${action.className || 'btn-primary'}" data-action="${action.id}">
                ${action.icon ? `<span class="mr-2">${action.icon}</span>` : ''}
                ${action.label}
            </button>
        `).join('')
        
        const card = this.createCard({
            title,
            content: `
                <p class="text-slate-400 mb-4">${description}</p>
                <div class="flex space-x-3">
                    ${actionsHtml}
                </div>
            `
        })
        
        actions.forEach(action => {
            if (action.onClick) {
                const btn = card.querySelector(`[data-action="${action.id}"]`)
                if (btn) {
                    btn.addEventListener('click', action.onClick)
                }
            }
        })
        
        return card
    }
    
    /**
     * 创建警告卡片
     */
    static createAlertCard(type, title, message, options = {}) {
        const {
            dismissible = false,
            onDismiss = null
        } = options
        
        const configs = {
            info: {
                bgClass: 'bg-blue-900 border-blue-700',
                icon: 'ℹ',
                iconClass: 'text-blue-400'
            },
            success: {
                bgClass: 'bg-green-900 border-green-700',
                icon: '✓',
                iconClass: 'text-green-400'
            },
            warning: {
                bgClass: 'bg-yellow-900 border-yellow-700',
                icon: '⚠',
                iconClass: 'text-yellow-400'
            },
            error: {
                bgClass: 'bg-red-900 border-red-700',
                icon: '✗',
                iconClass: 'text-red-400'
            }
        }
        
        const config = configs[type] || configs.info
        
        const card = this.createCard({
            className: config.bgClass,
            content: `
                <div class="flex items-start">
                    <span class="text-2xl mr-3 ${config.iconClass}">${config.icon}</span>
                    <div class="flex-1">
                        <h4 class="font-semibold text-white">${title}</h4>
                        <p class="text-sm text-slate-300 mt-1">${message}</p>
                    </div>
                    ${dismissible ? `
                        <button class="dismiss-btn text-slate-400 hover:text-white ml-3">✕</button>
                    ` : ''}
                </div>
            `
        })
        
        if (dismissible && onDismiss) {
            const dismissBtn = card.querySelector('.dismiss-btn')
            if (dismissBtn) {
                dismissBtn.addEventListener('click', () => {
                    card.remove()
                    onDismiss()
                })
            }
        }
        
        return card
    }
    
    /**
     * 创建标签卡片
     */
    static createTagCard(title, tags, options = {}) {
        const {
            color = 'blue',
            removable = false,
            onRemove = null
        } = options
        
        const tagsHtml = tags.map((tag, index) => `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-${color}-900 text-${color}-300 border border-${color}-700">
                ${tag}
                ${removable ? `<button class="ml-2 hover:text-white" data-tag-index="${index}">✕</button>` : ''}
            </span>
        `).join('')
        
        const card = this.createCard({
            title,
            content: `<div class="flex flex-wrap gap-2">${tagsHtml}</div>`
        })
        
        if (removable && onRemove) {
            const removeButtons = card.querySelectorAll('[data-tag-index]')
            removeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-tag-index'))
                    onRemove(index, tags[index])
                    btn.parentElement.remove()
                })
            })
        }
        
        return card
    }
    
    /**
     * 创建时间线卡片
     */
    static createTimelineCard(title, events) {
        const eventsHtml = events.map((event, index) => `
            <div class="flex ${index < events.length - 1 ? 'mb-4' : ''}">
                <div class="flex flex-col items-center mr-4">
                    <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                    ${index < events.length - 1 ? '<div class="w-0.5 h-full bg-slate-700 mt-2"></div>' : ''}
                </div>
                <div class="flex-1">
                    <div class="text-sm text-slate-400">${event.time}</div>
                    <div class="text-white font-medium">${event.title}</div>
                    ${event.description ? `<div class="text-sm text-slate-400 mt-1">${event.description}</div>` : ''}
                </div>
            </div>
        `).join('')
        
        return this.createCard({
            title,
            content: eventsHtml
        })
    }
}

export { CardManager }
