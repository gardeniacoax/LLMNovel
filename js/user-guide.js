/**
 * 使用说明弹窗组件
 * 首次打开显示使用说明，帮助用户快速上手
 */

/**
 * 使用说明管理器
 */
class UserGuide {
    constructor() {
        this.storageKey = 'llm-novel-guide-shown'
        this.currentStep = 0
        this.isVisible = false
        this.modal = null
    }
    
    /**
     * 检查是否需要显示指南
     */
    shouldShowGuide() {
        const shown = localStorage.getItem(this.storageKey)
        return !shown
    }
    
    /**
     * 标记指南已显示
     */
    markGuideAsShown() {
        localStorage.setItem(this.storageKey, 'true')
    }
    
    /**
     * 重置指南状态
     */
    resetGuide() {
        localStorage.removeItem(this.storageKey)
    }
    
    /**
     * 显示使用说明
     */
    showGuide() {
        if (this.isVisible) return
        
        this.isVisible = true
        this.createModal()
        document.body.appendChild(this.modal)
        
        requestAnimationFrame(() => {
            this.modal.classList.add('show')
        })
    }
    
    /**
     * 隐藏使用说明
     */
    hideGuide() {
        if (!this.isVisible || !this.modal) return
        
        this.modal.classList.remove('show')
        
        setTimeout(() => {
            if (this.modal && this.modal.parentNode) {
                this.modal.parentNode.removeChild(this.modal)
            }
            this.modal = null
            this.isVisible = false
        }, 300)
    }
    
    /**
     * 创建模态框
     */
    createModal() {
        this.modal = document.createElement('div')
        this.modal.className = 'user-guide-modal'
        
        this.modal.innerHTML = `
            <div class="guide-overlay"></div>
            <div class="guide-container">
                <div class="guide-header">
                    <h2>📚 小说AI改写/续写工具 - 使用指南</h2>
                    <button class="guide-close-btn" title="关闭">×</button>
                </div>
                
                <div class="guide-content">
                    <div class="guide-tabs">
                        <button class="guide-tab active" data-tab="quick-start">快速开始</button>
                        <button class="guide-tab" data-tab="features">功能介绍</button>
                        <button class="guide-tab" data-tab="shortcuts">快捷键</button>
                        <button class="guide-tab" data-tab="tips">使用技巧</button>
                    </div>
                    
                    <div class="guide-panels">
                        <div class="guide-panel active" data-panel="quick-start">
                            <h3>🚀 快速开始</h3>
                            <div class="guide-steps">
                                <div class="guide-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <h4>配置API密钥</h4>
                                        <p>点击右上角"设置"按钮，输入您的DeepSeek API密钥。密钥将被加密存储在本地。</p>
                                    </div>
                                </div>
                                <div class="guide-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <h4>导入小说文本</h4>
                                        <p>点击"导入TXT"按钮，选择您的小说文件。支持UTF-8编码的TXT文件。</p>
                                    </div>
                                </div>
                                <div class="guide-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <h4>AI分析文本</h4>
                                        <p>选择要分析的章节，点击"AI分析"按钮，系统将自动提取剧情大纲和角色信息。</p>
                                    </div>
                                </div>
                                <div class="guide-step">
                                    <div class="step-number">4</div>
                                    <div class="step-content">
                                        <h4>续写或改写</h4>
                                        <p>使用分析结果进行智能续写，或选择章节进行改写。支持多种改写强度。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="guide-panel" data-panel="features">
                            <h3>✨ 功能介绍</h3>
                            <div class="feature-list">
                                <div class="feature-item">
                                    <div class="feature-icon">📝</div>
                                    <div class="feature-content">
                                        <h4>文本导入导出</h4>
                                        <p>支持TXT文件导入导出，自动识别章节分割，保留原始格式。</p>
                                    </div>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">🤖</div>
                                    <div class="feature-content">
                                        <h4>AI智能分析</h4>
                                        <p>自动分析小说剧情、角色关系、文风特点，生成结构化数据。</p>
                                    </div>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">👥</div>
                                    <div class="feature-content">
                                        <h4>角色卡管理</h4>
                                        <p>创建和管理角色卡，记录角色信息，支持从分析结果自动导入。</p>
                                    </div>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">✍️</div>
                                    <div class="feature-content">
                                        <h4>智能续写</h4>
                                        <p>基于上下文和角色信息，AI自动生成符合文风的续写内容。</p>
                                    </div>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">🔄</div>
                                    <div class="feature-content">
                                        <h4>智能改写</h4>
                                        <p>支持轻度、中度、深度三种改写强度，保持原文核心内容。</p>
                                    </div>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">💾</div>
                                    <div class="feature-content">
                                        <h4>本地存储</h4>
                                        <p>所有数据存储在本地浏览器，无需联网即可使用，保护隐私安全。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="guide-panel" data-panel="shortcuts">
                            <h3>⌨️ 快捷键</h3>
                            <div class="shortcut-list">
                                <div class="shortcut-item">
                                    <kbd>Ctrl</kbd> + <kbd>S</kbd>
                                    <span>保存当前内容</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Ctrl</kbd> + <kbd>I</kbd>
                                    <span>导入文件</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Ctrl</kbd> + <kbd>E</kbd>
                                    <span>导出文件</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Ctrl</kbd> + <kbd>,</kbd>
                                    <span>打开设置</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Ctrl</kbd> + <kbd>/</kbd>
                                    <span>显示/隐藏使用说明</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Esc</kbd>
                                    <span>关闭弹窗/取消操作</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="guide-panel" data-panel="tips">
                            <h3>💡 使用技巧</h3>
                            <div class="tips-list">
                                <div class="tip-item">
                                    <div class="tip-icon">🎯</div>
                                    <div class="tip-content">
                                        <h4>提高分析质量</h4>
                                        <p>选择包含完整情节的章节进行分析，避免选择过渡性章节，可以获得更准确的分析结果。</p>
                                    </div>
                                </div>
                                <div class="tip-item">
                                    <div class="tip-icon">📝</div>
                                    <div class="tip-content">
                                        <h4>优化续写效果</h4>
                                        <p>在续写前完善角色卡信息和全局Prompt，可以让AI生成更符合预期的内容。</p>
                                    </div>
                                </div>
                                <div class="tip-item">
                                    <div class="tip-icon">🔄</div>
                                    <div class="tip-content">
                                        <h4>改写强度选择</h4>
                                        <p>轻度改写保留原文风格，中度改写优化表达，深度改写重新组织内容结构。</p>
                                    </div>
                                </div>
                                <div class="tip-item">
                                    <div class="tip-icon">💾</div>
                                    <div class="tip-content">
                                        <h4>数据备份</h4>
                                        <p>定期导出项目数据，避免浏览器数据丢失。支持JSON格式导出完整项目。</p>
                                    </div>
                                </div>
                                <div class="tip-item">
                                    <div class="tip-icon">⚡</div>
                                    <div class="tip-content">
                                        <h4>性能优化</h4>
                                        <p>处理大型小说时，建议分段导入和编辑，避免一次性加载过多内容。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="guide-footer">
                    <label class="dont-show-again">
                        <input type="checkbox" id="dont-show-guide">
                        <span>不再显示此指南</span>
                    </label>
                    <button class="guide-start-btn">开始使用</button>
                </div>
            </div>
            
            <style>
                .user-guide-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .user-guide-modal.show {
                    opacity: 1;
                }
                
                .guide-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                }
                
                .guide-container {
                    position: relative;
                    width: 90%;
                    max-width: 800px;
                    max-height: 85vh;
                    background: var(--color-surface, #1e293b);
                    border-radius: 16px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .guide-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--color-border, #334155);
                }
                
                .guide-header h2 {
                    margin: 0;
                    font-size: 20px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .guide-close-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    color: var(--color-text-secondary, #94a3b8);
                    font-size: 24px;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                
                .guide-close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-text, #f1f5f9);
                }
                
                .guide-content {
                    flex: 1;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .guide-tabs {
                    display: flex;
                    padding: 0 24px;
                    border-bottom: 1px solid var(--color-border, #334155);
                }
                
                .guide-tab {
                    padding: 12px 20px;
                    border: none;
                    background: transparent;
                    color: var(--color-text-secondary, #94a3b8);
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -1px;
                }
                
                .guide-tab:hover {
                    color: var(--color-text, #f1f5f9);
                }
                
                .guide-tab.active {
                    color: var(--color-primary, #3b82f6);
                    border-bottom-color: var(--color-primary, #3b82f6);
                }
                
                .guide-panels {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }
                
                .guide-panel {
                    display: none;
                }
                
                .guide-panel.active {
                    display: block;
                }
                
                .guide-panel h3 {
                    margin: 0 0 20px;
                    font-size: 18px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .guide-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .guide-step {
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                }
                
                .step-number {
                    width: 32px;
                    height: 32px;
                    background: var(--color-primary, #3b82f6);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    flex-shrink: 0;
                }
                
                .step-content h4 {
                    margin: 0 0 8px;
                    font-size: 16px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .step-content p {
                    margin: 0;
                    font-size: 14px;
                    color: var(--color-text-secondary, #94a3b8);
                    line-height: 1.6;
                }
                
                .feature-list,
                .tips-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .feature-item,
                .tip-item {
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                }
                
                .feature-icon,
                .tip-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }
                
                .feature-content h4,
                .tip-content h4 {
                    margin: 0 0 8px;
                    font-size: 16px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .feature-content p,
                .tip-content p {
                    margin: 0;
                    font-size: 14px;
                    color: var(--color-text-secondary, #94a3b8);
                    line-height: 1.6;
                }
                
                .shortcut-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .shortcut-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                
                .shortcut-item kbd {
                    padding: 4px 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid var(--color-border, #334155);
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 12px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .shortcut-item span {
                    color: var(--color-text-secondary, #94a3b8);
                    font-size: 14px;
                }
                
                .guide-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    border-top: 1px solid var(--color-border, #334155);
                }
                
                .dont-show-again {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--color-text-secondary, #94a3b8);
                    font-size: 14px;
                    cursor: pointer;
                }
                
                .dont-show-again input {
                    cursor: pointer;
                }
                
                .guide-start-btn {
                    padding: 10px 24px;
                    background: var(--color-primary, #3b82f6);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .guide-start-btn:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
            </style>
        `
        
        this.setupEventListeners()
    }
    
    /**
     * 设置事件监听
     */
    setupEventListeners() {
        const overlay = this.modal.querySelector('.guide-overlay')
        const closeBtn = this.modal.querySelector('.guide-close-btn')
        const startBtn = this.modal.querySelector('.guide-start-btn')
        const tabs = this.modal.querySelectorAll('.guide-tab')
        const dontShowCheckbox = this.modal.querySelector('#dont-show-guide')
        
        overlay.addEventListener('click', () => this.hideGuide())
        closeBtn.addEventListener('click', () => this.hideGuide())
        startBtn.addEventListener('click', () => {
            if (dontShowCheckbox.checked) {
                this.markGuideAsShown()
            }
            this.hideGuide()
        })
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab
                
                tabs.forEach(t => t.classList.remove('active'))
                tab.classList.add('active')
                
                const panels = this.modal.querySelectorAll('.guide-panel')
                panels.forEach(panel => {
                    panel.classList.remove('active')
                    if (panel.dataset.panel === tabName) {
                        panel.classList.add('active')
                    }
                })
            })
        })
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideGuide()
            }
        })
    }
}

/**
 * 欢迎提示
 */
class WelcomeToast {
    /**
     * 显示欢迎提示
     */
    static show() {
        const toast = document.createElement('div')
        toast.className = 'welcome-toast'
        toast.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-icon">👋</div>
                <div class="welcome-text">
                    <h3>欢迎使用小说AI改写/续写工具！</h3>
                    <p>点击右上角"？"按钮查看使用指南</p>
                </div>
            </div>
            <style>
                .welcome-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--color-surface, #1e293b);
                    border: 1px solid var(--color-border, #334155);
                    border-radius: 12px;
                    padding: 16px 20px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .welcome-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .welcome-icon {
                    font-size: 24px;
                }
                
                .welcome-text h3 {
                    margin: 0 0 4px;
                    font-size: 14px;
                    color: var(--color-text, #f1f5f9);
                }
                
                .welcome-text p {
                    margin: 0;
                    font-size: 12px;
                    color: var(--color-text-secondary, #94a3b8);
                }
            </style>
        `
        
        document.body.appendChild(toast)
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse'
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast)
                }
            }, 300)
        }, 5000)
    }
}

const userGuide = new UserGuide()

export { UserGuide, WelcomeToast, userGuide }
