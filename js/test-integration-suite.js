/**
 * 集成测试套件
 * 整合所有测试模块，提供统一的测试运行入口
 */

import { test, TestFramework, TestUtils } from './test-framework.js'
import { DataIntegrationTests } from './test-data-integration.js'
import { ApiCallTests } from './test-api-calls.js'
import { FileHandlingTests } from './test-file-handling.js'
import { UIInteractionTests } from './test-ui-interaction.js'
import { ErrorHandlingTests } from './test-error-handling.js'
import { TestReportGenerator } from './test-report-generator.js'

/**
 * 集成测试套件类
 */
class IntegrationTestSuite {
    constructor() {
        this.testFramework = test
        this.reportGenerator = new TestReportGenerator()
        this.testSuites = []
        this.results = []
        this.isRunning = false
    }
    
    /**
     * 注册测试套件
     */
    registerTestSuite(name, testClass) {
        this.testSuites.push({
            name,
            testClass,
            enabled: true
        })
    }
    
    /**
     * 启用测试套件
     */
    enableTestSuite(name) {
        const suite = this.testSuites.find(s => s.name === name)
        if (suite) {
            suite.enabled = true
        }
    }
    
    /**
     * 禁用测试套件
     */
    disableTestSuite(name) {
        const suite = this.testSuites.find(s => s.name === name)
        if (suite) {
            suite.enabled = false
        }
    }
    
    /**
     * 初始化所有测试套件
     */
    initializeTestSuites() {
        this.registerTestSuite('数据互通测试', new DataIntegrationTests())
        this.registerTestSuite('API调用测试', new ApiCallTests())
        this.registerTestSuite('文件处理测试', new FileHandlingTests())
        this.registerTestSuite('UI交互测试', new UIInteractionTests())
        this.registerTestSuite('错误处理测试', new ErrorHandlingTests())
    }
    
    /**
     * 运行所有测试
     */
    async runAllTests(options = {}) {
        if (this.isRunning) {
            console.warn('测试正在运行中...')
            return null
        }
        
        this.isRunning = true
        this.results = []
        
        const {
            generateReport = true,
            reportFormat = 'html',
            saveReport = false
        } = options
        
        console.log('🚀 开始运行集成测试套件...\n')
        console.log('═'.repeat(60))
        
        const startTime = Date.now()
        
        for (const suite of this.testSuites) {
            if (!suite.enabled) {
                console.log(`⏭️  跳过测试套件: ${suite.name}`)
                continue
            }
            
            console.log(`\n📦 运行测试套件: ${suite.name}`)
            console.log('─'.repeat(60))
            
            try {
                await suite.testClass.runAll()
                
                const suiteResults = this.testFramework.results.filter(
                    r => r.suite && r.suite.includes(suite.name)
                )
                
                this.results.push(...suiteResults)
                
                console.log(`✅ 测试套件完成: ${suite.name}`)
            } catch (error) {
                console.error(`❌ 测试套件失败: ${suite.name}`)
                console.error(error)
            }
        }
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        console.log('\n═'.repeat(60))
        console.log('📊 集成测试完成')
        console.log('═'.repeat(60))
        
        const stats = this.calculateStats()
        
        console.log(`总计: ${stats.total}`)
        console.log(`✅ 通过: ${stats.passed}`)
        console.log(`❌ 失败: ${stats.failed}`)
        console.log(`⏭️  跳过: ${stats.skipped}`)
        console.log(`⏱️  耗时: ${duration}ms`)
        console.log(`📈 通过率: ${stats.passRate}%`)
        
        if (generateReport) {
            const report = this.reportGenerator.generate(this.results, {
                title: '小说AI改写/续写工具 - 集成测试报告',
                version: '1.0.0',
                environment: 'development'
            })
            
            if (saveReport) {
                this.reportGenerator.saveReport(report, reportFormat)
            }
            
            this.isRunning = false
            return report
        }
        
        this.isRunning = false
        return {
            stats,
            results: this.results,
            duration
        }
    }
    
    /**
     * 运行指定测试套件
     */
    async runTestSuite(suiteName) {
        const suite = this.testSuites.find(s => s.name === suiteName)
        
        if (!suite) {
            console.error(`测试套件不存在: ${suiteName}`)
            return null
        }
        
        console.log(`🚀 运行测试套件: ${suiteName}`)
        
        const startTime = Date.now()
        
        try {
            await suite.testClass.runAll()
            
            const endTime = Date.now()
            const duration = endTime - startTime
            
            console.log(`✅ 测试套件完成: ${suiteName}`)
            console.log(`⏱️  耗时: ${duration}ms`)
            
            return {
                success: true,
                duration
            }
        } catch (error) {
            console.error(`❌ 测试套件失败: ${suiteName}`)
            console.error(error)
            
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    /**
     * 计算统计数据
     */
    calculateStats() {
        const stats = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            passRate: 0
        }
        
        this.results.forEach(result => {
            stats.total++
            
            switch (result.status) {
                case 'passed':
                    stats.passed++
                    break
                case 'failed':
                    stats.failed++
                    break
                case 'skipped':
                    stats.skipped++
                    break
            }
        })
        
        if (stats.total > 0) {
            stats.passRate = ((stats.passed / stats.total) * 100).toFixed(2)
        }
        
        return stats
    }
    
    /**
     * 获取测试结果
     */
    getResults() {
        return this.results
    }
    
    /**
     * 清除测试结果
     */
    clearResults() {
        this.results = []
        this.testFramework.results = []
        this.testFramework.stats = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        }
    }
    
    /**
     * 生成测试报告
     */
    generateReport(format = 'html') {
        const report = this.reportGenerator.generate(this.results)
        
        if (format === 'html') {
            return this.reportGenerator.generateHtmlReport(report)
        } else {
            return this.reportGenerator.generateJsonReport(report)
        }
    }
    
    /**
     * 保存测试报告
     */
    saveReport(format = 'html') {
        const report = this.reportGenerator.generate(this.results)
        this.reportGenerator.saveReport(report, format)
    }
    
    /**
     * 创建测试UI
     */
    createTestUI(container) {
        const ui = document.createElement('div')
        ui.className = 'test-ui'
        ui.innerHTML = `
            <div class="test-ui-header">
                <h2>🧪 集成测试套件</h2>
                <div class="test-ui-controls">
                    <button class="btn btn-primary" id="run-all-tests">运行所有测试</button>
                    <button class="btn btn-secondary" id="clear-results">清除结果</button>
                    <button class="btn btn-secondary" id="generate-report">生成报告</button>
                </div>
            </div>
            
            <div class="test-ui-suites">
                <h3>测试套件</h3>
                <div class="suite-list">
                    ${this.testSuites.map(suite => `
                        <div class="suite-item">
                            <label>
                                <input type="checkbox" 
                                       class="suite-checkbox" 
                                       data-suite="${suite.name}"
                                       ${suite.enabled ? 'checked' : ''}>
                                <span>${suite.name}</span>
                            </label>
                            <button class="btn btn-sm btn-secondary run-suite-btn" data-suite="${suite.name}">
                                运行
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="test-ui-results">
                <h3>测试结果</h3>
                <div class="results-container" id="results-container">
                    <p class="no-results">暂无测试结果</p>
                </div>
            </div>
            
            <style>
                .test-ui {
                    background: #1a1a2e;
                    padding: 20px;
                    border-radius: 12px;
                    color: #eee;
                }
                
                .test-ui-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .test-ui-header h2 {
                    margin: 0;
                    font-size: 24px;
                }
                
                .test-ui-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #2563eb;
                }
                
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #eee;
                }
                
                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .btn-sm {
                    padding: 4px 12px;
                    font-size: 12px;
                }
                
                .test-ui-suites {
                    margin-bottom: 20px;
                }
                
                .test-ui-suites h3 {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #888;
                }
                
                .suite-list {
                    display: grid;
                    gap: 10px;
                }
                
                .suite-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                
                .suite-item label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                }
                
                .test-ui-results h3 {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #888;
                }
                
                .results-container {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    padding: 15px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .no-results {
                    text-align: center;
                    color: #666;
                    padding: 20px;
                }
                
                .result-item {
                    padding: 10px;
                    margin-bottom: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .result-item.passed {
                    border-left: 3px solid #22c55e;
                }
                
                .result-item.failed {
                    border-left: 3px solid #ef4444;
                }
                
                .result-item.skipped {
                    border-left: 3px solid #f59e0b;
                }
            </style>
        `
        
        container.appendChild(ui)
        
        this.setupUIEvents(ui)
        
        return ui
    }
    
    /**
     * 设置UI事件
     */
    setupUIEvents(ui) {
        const runAllBtn = ui.querySelector('#run-all-tests')
        const clearBtn = ui.querySelector('#clear-results')
        const reportBtn = ui.querySelector('#generate-report')
        const resultsContainer = ui.querySelector('#results-container')
        
        runAllBtn.addEventListener('click', async () => {
            runAllBtn.disabled = true
            runAllBtn.textContent = '运行中...'
            
            await this.runAllTests({ generateReport: false })
            
            this.updateResultsUI(resultsContainer)
            
            runAllBtn.disabled = false
            runAllBtn.textContent = '运行所有测试'
        })
        
        clearBtn.addEventListener('click', () => {
            this.clearResults()
            resultsContainer.innerHTML = '<p class="no-results">暂无测试结果</p>'
        })
        
        reportBtn.addEventListener('click', () => {
            this.saveReport('html')
        })
        
        ui.querySelectorAll('.suite-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const suiteName = e.target.dataset.suite
                if (e.target.checked) {
                    this.enableTestSuite(suiteName)
                } else {
                    this.disableTestSuite(suiteName)
                }
            })
        })
        
        ui.querySelectorAll('.run-suite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const suiteName = e.target.dataset.suite
                btn.disabled = true
                
                await this.runTestSuite(suiteName)
                
                this.updateResultsUI(resultsContainer)
                
                btn.disabled = false
            })
        })
    }
    
    /**
     * 更新结果UI
     */
    updateResultsUI(container) {
        if (this.results.length === 0) {
            container.innerHTML = '<p class="no-results">暂无测试结果</p>'
            return
        }
        
        container.innerHTML = this.results.map(result => `
            <div class="result-item ${result.status}">
                <div>
                    <span class="result-icon">
                        ${result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'}
                    </span>
                    <span>${result.suite}: ${result.test}</span>
                </div>
                <span class="result-duration">${result.duration || 0}ms</span>
            </div>
            ${result.error ? `<div class="result-error">${result.error}</div>` : ''}
        `).join('')
    }
}

const integrationTestSuite = new IntegrationTestSuite()
integrationTestSuite.initializeTestSuites()

export { IntegrationTestSuite, integrationTestSuite }
