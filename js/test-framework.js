/**
 * 测试框架模块
 * 提供测试运行、断言、报告等功能
 */

/**
 * 测试框架类
 */
class TestFramework {
    constructor() {
        this.tests = []
        this.results = []
        this.currentSuite = null
        this.stats = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        }
    }
    
    /**
     * 定义测试套件
     */
    describe(name, fn) {
        const suite = {
            name,
            tests: [],
            beforeAll: [],
            beforeEach: [],
            afterEach: [],
            afterAll: []
        }
        
        this.currentSuite = suite
        fn()
        this.tests.push(suite)
        this.currentSuite = null
    }
    
    /**
     * 定义测试用例
     */
    it(name, fn) {
        if (!this.currentSuite) {
            throw new Error('测试用例必须在describe块中定义')
        }
        
        this.currentSuite.tests.push({
            name,
            fn,
            skip: false
        })
    }
    
    /**
     * 跳过测试用例
     */
    xit(name, fn) {
        if (!this.currentSuite) {
            throw new Error('测试用例必须在describe块中定义')
        }
        
        this.currentSuite.tests.push({
            name,
            fn,
            skip: true
        })
    }
    
    /**
     * 定义beforeAll钩子
     */
    beforeAll(fn) {
        if (!this.currentSuite) return
        this.currentSuite.beforeAll.push(fn)
    }
    
    /**
     * 定义beforeEach钩子
     */
    beforeEach(fn) {
        if (!this.currentSuite) return
        this.currentSuite.beforeEach.push(fn)
    }
    
    /**
     * 定义afterEach钩子
     */
    afterEach(fn) {
        if (!this.currentSuite) return
        this.currentSuite.afterEach.push(fn)
    }
    
    /**
     * 定义afterAll钩子
     */
    afterAll(fn) {
        if (!this.currentSuite) return
        this.currentSuite.afterAll.push(fn)
    }
    
    /**
     * 运行所有测试
     */
    async run() {
        console.log('🚀 开始运行测试...\n')
        const startTime = Date.now()
        
        for (const suite of this.tests) {
            await this.runSuite(suite)
        }
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        this.printReport(duration)
        
        return {
            stats: this.stats,
            results: this.results,
            duration
        }
    }
    
    /**
     * 运行测试套件
     */
    async runSuite(suite) {
        console.log(`📦 ${suite.name}`)
        
        for (const hook of suite.beforeAll) {
            await this.runHook(hook, 'beforeAll')
        }
        
        for (const test of suite.tests) {
            if (test.skip) {
                console.log(`  ⏭️  ${test.name} (跳过)`)
                this.stats.skipped++
                this.results.push({
                    suite: suite.name,
                    test: test.name,
                    status: 'skipped'
                })
                continue
            }
            
            for (const hook of suite.beforeEach) {
                await this.runHook(hook, 'beforeEach')
            }
            
            const result = await this.runTest(suite.name, test)
            
            for (const hook of suite.afterEach) {
                await this.runHook(hook, 'afterEach')
            }
            
            this.results.push(result)
            this.stats.total++
            
            if (result.status === 'passed') {
                this.stats.passed++
                console.log(`  ✅ ${test.name}`)
            } else {
                this.stats.failed++
                console.log(`  ❌ ${test.name}`)
                console.log(`     错误: ${result.error}`)
            }
        }
        
        for (const hook of suite.afterAll) {
            await this.runHook(hook, 'afterAll')
        }
        
        console.log('')
    }
    
    /**
     * 运行单个测试
     */
    async runTest(suiteName, test) {
        const startTime = Date.now()
        
        try {
            await test.fn()
            const endTime = Date.now()
            
            return {
                suite: suiteName,
                test: test.name,
                status: 'passed',
                duration: endTime - startTime
            }
        } catch (error) {
            const endTime = Date.now()
            
            return {
                suite: suiteName,
                test: test.name,
                status: 'failed',
                error: error.message,
                stack: error.stack,
                duration: endTime - startTime
            }
        }
    }
    
    /**
     * 运行钩子
     */
    async runHook(hook, name) {
        try {
            await hook()
        } catch (error) {
            console.error(`钩子 ${name} 执行失败:`, error)
        }
    }
    
    /**
     * 打印测试报告
     */
    printReport(duration) {
        console.log('═'.repeat(60))
        console.log('📊 测试报告')
        console.log('═'.repeat(60))
        console.log(`总计: ${this.stats.total}`)
        console.log(`✅ 通过: ${this.stats.passed}`)
        console.log(`❌ 失败: ${this.stats.failed}`)
        console.log(`⏭️  跳过: ${this.stats.skipped}`)
        console.log(`⏱️  耗时: ${duration}ms`)
        console.log('═'.repeat(60))
        
        if (this.stats.failed > 0) {
            console.log('\n❌ 失败的测试:')
            this.results
                .filter(r => r.status === 'failed')
                .forEach(r => {
                    console.log(`  - ${r.suite}: ${r.test}`)
                    console.log(`    ${r.error}`)
                })
        }
    }
    
    /**
     * 生成HTML报告
     */
    generateHtmlReport() {
        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试报告</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', sans-serif;
            background: #1a1a2e;
            color: #eee;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            padding: 20px;
            background: #16213e;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #16213e;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #888;
        }
        .passed { color: #22c55e; }
        .failed { color: #ef4444; }
        .skipped { color: #f59e0b; }
        .suite {
            background: #16213e;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
        }
        .suite-header {
            padding: 15px;
            background: #0f3460;
            cursor: pointer;
        }
        .suite-tests {
            padding: 15px;
        }
        .test-item {
            padding: 10px;
            border-bottom: 1px solid #2a2a4a;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .test-name {
            display: flex;
            align-items: center;
        }
        .test-icon {
            margin-right: 10px;
        }
        .test-error {
            margin-top: 10px;
            padding: 10px;
            background: #2a1a1a;
            border-radius: 4px;
            color: #ff6b6b;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 测试报告</h1>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${this.stats.total}</div>
                <div class="stat-label">总计</div>
            </div>
            <div class="stat-card">
                <div class="stat-number passed">${this.stats.passed}</div>
                <div class="stat-label">通过</div>
            </div>
            <div class="stat-card">
                <div class="stat-number failed">${this.stats.failed}</div>
                <div class="stat-label">失败</div>
            </div>
            <div class="stat-card">
                <div class="stat-number skipped">${this.stats.skipped}</div>
                <div class="stat-label">跳过</div>
            </div>
        </div>
        
        ${this.tests.map(suite => `
            <div class="suite">
                <div class="suite-header">
                    <h3>📦 ${suite.name}</h3>
                </div>
                <div class="suite-tests">
                    ${this.results
                        .filter(r => r.suite === suite.name)
                        .map(r => `
                            <div class="test-item">
                                <div class="test-name">
                                    <span class="test-icon">${r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⏭️'}</span>
                                    <span>${r.test}</span>
                                </div>
                                ${r.error ? `<div class="test-error">${r.error}</div>` : ''}
                            </div>
                        `).join('')}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
        `
        
        return html
    }
}

/**
 * 断言库
 */
class Assert {
    static equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message}\n期望: ${expected}\n实际: ${actual}`)
        }
    }
    
    static deepEqual(actual, expected, message = '') {
        const actualStr = JSON.stringify(actual)
        const expectedStr = JSON.stringify(expected)
        
        if (actualStr !== expectedStr) {
            throw new Error(`${message}\n期望: ${expectedStr}\n实际: ${actualStr}`)
        }
    }
    
    static true(value, message = '') {
        if (!value) {
            throw new Error(`${message}\n期望: true\n实际: ${value}`)
        }
    }
    
    static false(value, message = '') {
        if (value) {
            throw new Error(`${message}\n期望: false\n实际: ${value}`)
        }
    }
    
    static null(value, message = '') {
        if (value !== null) {
            throw new Error(`${message}\n期望: null\n实际: ${value}`)
        }
    }
    
    static notNull(value, message = '') {
        if (value === null) {
            throw new Error(`${message}\n期望: 非null\n实际: null`)
        }
    }
    
    static undefined(value, message = '') {
        if (value !== undefined) {
            throw new Error(`${message}\n期望: undefined\n实际: ${value}`)
        }
    }
    
    static defined(value, message = '') {
        if (value === undefined) {
            throw new Error(`${message}\n期望: 已定义\n实际: undefined`)
        }
    }
    
    static throws(fn, message = '') {
        let threw = false
        try {
            fn()
        } catch (e) {
            threw = true
        }
        
        if (!threw) {
            throw new Error(`${message}\n期望抛出异常，但没有抛出`)
        }
    }
    
    static async rejects(asyncFn, message = '') {
        let threw = false
        try {
            await asyncFn()
        } catch (e) {
            threw = true
        }
        
        if (!threw) {
            throw new Error(`${message}\n期望抛出异常，但没有抛出`)
        }
    }
    
    static instanceOf(value, constructor, message = '') {
        if (!(value instanceof constructor)) {
            throw new Error(`${message}\n期望: ${constructor.name}的实例\n实际: ${typeof value}`)
        }
    }
    
    static typeOf(value, type, message = '') {
        if (typeof value !== type) {
            throw new Error(`${message}\n期望类型: ${type}\n实际类型: ${typeof value}`)
        }
    }
    
    static includes(array, item, message = '') {
        if (!array.includes(item)) {
            throw new Error(`${message}\n期望数组包含: ${item}`)
        }
    }
    
    static lengthOf(value, length, message = '') {
        if (value.length !== length) {
            throw new Error(`${message}\n期望长度: ${length}\n实际长度: ${value.length}`)
        }
    }
    
    static match(value, regex, message = '') {
        if (!regex.test(value)) {
            throw new Error(`${message}\n值不匹配正则: ${regex}`)
        }
    }
    
    static greaterThan(actual, expected, message = '') {
        if (actual <= expected) {
            throw new Error(`${message}\n期望大于: ${expected}\n实际: ${actual}`)
        }
    }
    
    static lessThan(actual, expected, message = '') {
        if (actual >= expected) {
            throw new Error(`${message}\n期望小于: ${expected}\n实际: ${actual}`)
        }
    }
    
    static inRange(value, min, max, message = '') {
        if (value < min || value > max) {
            throw new Error(`${message}\n期望范围: ${min}-${max}\n实际: ${value}`)
        }
    }
}

/**
 * 测试工具类
 */
class TestUtils {
    /**
     * 创建模拟函数
     */
    static mock() {
        const fn = function(...args) {
            fn.calls.push(args)
            return fn.returnValue
        }
        
        fn.calls = []
        fn.returnValue = undefined
        fn.mockReturnValue = (value) => {
            fn.returnValue = value
            return fn
        }
        fn.mockResolvedValue = (value) => {
            fn.returnValue = Promise.resolve(value)
            return fn
        }
        fn.mockRejectedValue = (value) => {
            fn.returnValue = Promise.reject(value)
            return fn
        }
        
        return fn
    }
    
    /**
     * 等待
     */
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    /**
     * 创建临时DOM元素
     */
    static createDomElement(tag, options = {}) {
        const element = document.createElement(tag)
        
        if (options.id) element.id = options.id
        if (options.className) element.className = options.className
        if (options.innerHTML) element.innerHTML = options.innerHTML
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value)
            })
        }
        
        if (options.appendTo) {
            document.querySelector(options.appendTo).appendChild(element)
        }
        
        return element
    }
    
    /**
     * 清理临时DOM元素
     */
    static cleanupDom(selector) {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => el.remove())
    }
    
    /**
     * 模拟事件
     */
    static triggerEvent(element, eventName, options = {}) {
        const event = new Event(eventName, {
            bubbles: true,
            cancelable: true,
            ...options
        })
        
        element.dispatchEvent(event)
    }
    
    /**
     * 模拟文件
     */
    static createFile(content, name = 'test.txt', type = 'text/plain') {
        return new File([content], name, { type })
    }
    
    /**
     * 清除localStorage
     */
    static clearStorage() {
        localStorage.clear()
    }
    
    /**
     * 设置localStorage
     */
    static setStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value))
    }
    
    /**
     * 获取localStorage
     */
    static getStorage(key) {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value) : null
    }
}

const test = new TestFramework()

export { TestFramework, Assert, TestUtils, test }
