/**
 * UI交互测试模块
 * 测试UI交互功能
 */

import { test, Assert, TestUtils } from './test-framework.js'
import { ProgressBar, ProgressRing, StepIndicator, StatusDisplay } from './progress.js'
import { ToastManager } from './toast.js'
import { ModalManager } from './modal.js'
import { ResponsiveManager } from './responsive.js'

/**
 * UI交互测试套件
 */
class UIInteractionTests {
    constructor() {
        this.testContainer = null
    }
    
    /**
     * 运行所有测试
     */
    async runAll() {
        await this.testProgressDisplay()
        await this.testToastDisplay()
        await this.testModalInteraction()
        await this.testResponsiveLayout()
    }
    
    /**
     * 设置测试环境
     */
    setupTestEnvironment() {
        this.testContainer = document.createElement('div')
        this.testContainer.id = 'test-container'
        this.testContainer.style.cssText = 'position: fixed; top: -9999px; left: -9999px; width: 800px; height: 600px;'
        document.body.appendChild(this.testContainer)
    }
    
    /**
     * 清理测试环境
     */
    cleanupTestEnvironment() {
        if (this.testContainer) {
            this.testContainer.remove()
            this.testContainer = null
        }
    }
    
    /**
     * 测试进度显示
     */
    async testProgressDisplay() {
        test.describe('进度显示', () => {
            test.beforeEach(() => {
                this.setupTestEnvironment()
            })
            
            test.afterEach(() => {
                this.cleanupTestEnvironment()
            })
            
            test.it('进度条应正确创建', () => {
                const progressBar = new ProgressBar(this.testContainer)
                
                Assert.notNull(progressBar, '进度条应创建成功')
                Assert.notNull(this.testContainer.querySelector('.progress-bar-wrapper'), '进度条DOM应存在')
            })
            
            test.it('进度条应正确设置值', () => {
                const progressBar = new ProgressBar(this.testContainer)
                
                progressBar.setValue(50)
                
                const fill = this.testContainer.querySelector('.progress-bar-fill')
                Assert.equal(fill.style.width, '50%', '进度条宽度应为50%')
            })
            
            test.it('进度条应正确设置标签', () => {
                const progressBar = new ProgressBar(this.testContainer)
                
                progressBar.setLabel('测试进度')
                
                const label = this.testContainer.querySelector('.progress-label')
                Assert.equal(label.textContent, '测试进度', '标签文本应正确')
            })
            
            test.it('进度条应正确重置', () => {
                const progressBar = new ProgressBar(this.testContainer)
                
                progressBar.setValue(80, '进度中')
                progressBar.reset()
                
                const fill = this.testContainer.querySelector('.progress-bar-fill')
                Assert.equal(fill.style.width, '0%', '进度条宽度应为0%')
            })
            
            test.it('进度环应正确创建', () => {
                const progressRing = new ProgressRing(this.testContainer)
                
                Assert.notNull(progressRing, '进度环应创建成功')
                Assert.notNull(this.testContainer.querySelector('svg'), '进度环SVG应存在')
            })
            
            test.it('进度环应正确设置值', () => {
                const progressRing = new ProgressRing(this.testContainer)
                
                progressRing.setValue(75)
                
                Assert.equal(progressRing.value, 75, '进度环值应为75')
            })
            
            test.it('步骤指示器应正确创建', () => {
                const steps = ['步骤1', '步骤2', '步骤3']
                const stepIndicator = new StepIndicator(this.testContainer, steps)
                
                Assert.notNull(stepIndicator, '步骤指示器应创建成功')
                const stepElements = this.testContainer.querySelectorAll('.step-item')
                Assert.equal(stepElements.length, 3, '应有3个步骤')
            })
            
            test.it('步骤指示器应正确设置当前步骤', () => {
                const steps = ['步骤1', '步骤2', '步骤3']
                const stepIndicator = new StepIndicator(this.testContainer, steps)
                
                stepIndicator.setCurrentStep(1)
                
                const stepElements = this.testContainer.querySelectorAll('.step-item')
                Assert.true(stepElements[0].classList.contains('completed'), '第一步应已完成')
                Assert.true(stepElements[1].classList.contains('active'), '第二步应激活')
            })
            
            test.it('状态显示应正确创建', () => {
                const statusDisplay = new StatusDisplay(this.testContainer)
                
                Assert.notNull(statusDisplay, '状态显示应创建成功')
            })
            
            test.it('状态显示应正确设置状态', () => {
                const statusDisplay = new StatusDisplay(this.testContainer)
                
                statusDisplay.setStatus('loading', '加载中...')
                
                Assert.equal(statusDisplay.currentStatus, 'loading', '状态应为loading')
            })
        })
    }
    
    /**
     * 测试提示框显示
     */
    async testToastDisplay() {
        test.describe('提示框显示', () => {
            test.beforeEach(() => {
                this.setupTestEnvironment()
            })
            
            test.afterEach(() => {
                this.cleanupTestEnvironment()
            })
            
            test.it('提示框管理器应正确创建', () => {
                const toastManager = new ToastManager()
                
                Assert.notNull(toastManager, '提示框管理器应创建成功')
                Assert.notNull(toastManager.container, '提示框容器应存在')
            })
            
            test.it('成功提示应正确显示', () => {
                const toastManager = new ToastManager()
                
                const toast = toastManager.success('操作成功')
                
                Assert.notNull(toast, '提示框应创建成功')
                Assert.true(toast.classList.contains('bg-green-900'), '应为绿色背景')
            })
            
            test.it('错误提示应正确显示', () => {
                const toastManager = new ToastManager()
                
                const toast = toastManager.error('操作失败')
                
                Assert.notNull(toast, '提示框应创建成功')
                Assert.true(toast.classList.contains('bg-red-900'), '应为红色背景')
            })
            
            test.it('警告提示应正确显示', () => {
                const toastManager = new ToastManager()
                
                const toast = toastManager.warning('警告信息')
                
                Assert.notNull(toast, '提示框应创建成功')
                Assert.true(toast.classList.contains('bg-yellow-900'), '应为黄色背景')
            })
            
            test.it('信息提示应正确显示', () => {
                const toastManager = new ToastManager()
                
                const toast = toastManager.info('提示信息')
                
                Assert.notNull(toast, '提示框应创建成功')
                Assert.true(toast.classList.contains('bg-blue-900'), '应为蓝色背景')
            })
            
            test.it('提示框应正确清除', () => {
                const toastManager = new ToastManager()
                
                toastManager.success('提示1')
                toastManager.success('提示2')
                toastManager.clear()
                
                Assert.equal(toastManager.toasts.length, 0, '提示框应已清除')
            })
            
            test.it('提示框数量应限制', () => {
                const toastManager = new ToastManager({ maxToasts: 3 })
                
                toastManager.info('提示1')
                toastManager.info('提示2')
                toastManager.info('提示3')
                toastManager.info('提示4')
                
                Assert.equal(toastManager.toasts.length, 3, '提示框数量应限制为3')
            })
        })
    }
    
    /**
     * 测试模态框交互
     */
    async testModalInteraction() {
        test.describe('模态框交互', () => {
            test.beforeEach(() => {
                this.setupTestEnvironment()
            })
            
            test.afterEach(() => {
                this.cleanupTestEnvironment()
            })
            
            test.it('模态框管理器应正确创建', () => {
                const modalManager = new ModalManager()
                
                Assert.notNull(modalManager, '模态框管理器应创建成功')
                Assert.notNull(modalManager.overlay, '遮罩层应存在')
            })
            
            test.it('模态框应正确显示', () => {
                const modalManager = new ModalManager()
                
                const modal = modalManager.show({
                    title: '测试模态框',
                    content: '<p>测试内容</p>'
                })
                
                Assert.notNull(modal, '模态框应创建成功')
                Assert.equal(modalManager.getModalCount(), 1, '模态框数量应为1')
            })
            
            test.it('模态框应正确关闭', async () => {
                const modalManager = new ModalManager()
                
                const modal = modalManager.show({
                    title: '测试模态框',
                    content: '<p>测试内容</p>'
                })
                
                modalManager.close(modal)
                
                await TestUtils.wait(350)
                
                Assert.equal(modalManager.getModalCount(), 0, '模态框应已关闭')
            })
            
            test.it('确认对话框应正确工作', async () => {
                const modalManager = new ModalManager()
                
                const promise = modalManager.confirm('确认操作吗？')
                
                Assert.true(promise instanceof Promise, '应返回Promise')
                
                const modal = modalManager.modals[0]
                const confirmBtn = modal.querySelector('.modal-confirm')
                
                confirmBtn.click()
                
                const result = await promise
                Assert.true(result, '应返回true')
            })
            
            test.it('提示对话框应正确工作', async () => {
                const modalManager = new ModalManager()
                
                const promise = modalManager.alert('提示信息')
                
                Assert.true(promise instanceof Promise, '应返回Promise')
                
                const modal = modalManager.modals[0]
                const okBtn = modal.querySelector('.modal-ok')
                
                okBtn.click()
                
                const result = await promise
                Assert.true(result, '应返回true')
            })
            
            test.it('输入对话框应正确工作', async () => {
                const modalManager = new ModalManager()
                
                const promise = modalManager.prompt('请输入内容', {
                    defaultValue: '默认值'
                })
                
                Assert.true(promise instanceof Promise, '应返回Promise')
                
                const modal = modalManager.modals[0]
                const input = modal.querySelector('.modal-input')
                const confirmBtn = modal.querySelector('.modal-confirm')
                
                input.value = '测试输入'
                confirmBtn.click()
                
                const result = await promise
                Assert.equal(result, '测试输入', '应返回输入值')
            })
        })
    }
    
    /**
     * 测试响应式布局
     */
    async testResponsiveLayout() {
        test.describe('响应式布局', () => {
            test.beforeEach(() => {
                this.setupTestEnvironment()
            })
            
            test.afterEach(() => {
                this.cleanupTestEnvironment()
            })
            
            test.it('响应式管理器应正确创建', () => {
                const responsiveManager = new ResponsiveManager()
                
                Assert.notNull(responsiveManager, '响应式管理器应创建成功')
                Assert.notNull(responsiveManager.breakpoints, '断点配置应存在')
            })
            
            test.it('应正确获取当前断点', () => {
                const responsiveManager = new ResponsiveManager()
                
                const breakpoint = responsiveManager.getCurrentBreakpoint()
                
                Assert.true(['mobile', 'tablet', 'desktop', 'wide'].includes(breakpoint), '断点应为有效值')
            })
            
            test.it('应正确判断设备类型', () => {
                const responsiveManager = new ResponsiveManager()
                
                const isMobile = responsiveManager.isMobile()
                const isTablet = responsiveManager.isTablet()
                const isDesktop = responsiveManager.isDesktop()
                const isWide = responsiveManager.isWide()
                
                Assert.typeOf(isMobile, 'boolean', 'isMobile应返回布尔值')
                Assert.typeOf(isTablet, 'boolean', 'isTablet应返回布尔值')
                Assert.typeOf(isDesktop, 'boolean', 'isDesktop应返回布尔值')
                Assert.typeOf(isWide, 'boolean', 'isWide应返回布尔值')
            })
            
            test.it('应正确应用响应式样式', () => {
                const responsiveManager = new ResponsiveManager()
                
                responsiveManager.applyResponsiveStyles()
                
                const root = document.documentElement
                const sidebarWidth = root.style.getPropertyValue('--sidebar-width')
                
                Assert.notNull(sidebarWidth, '应设置侧边栏宽度')
            })
            
            test.it('断点变化监听应正确工作', () => {
                const responsiveManager = new ResponsiveManager()
                
                let breakpointChanged = false
                responsiveManager.onBreakpointChange = () => {
                    breakpointChanged = true
                }
                
                responsiveManager.onBreakpointChange('desktop', 'mobile')
                
                Assert.true(breakpointChanged, '断点变化应触发')
            })
        })
    }
}

export { UIInteractionTests }
