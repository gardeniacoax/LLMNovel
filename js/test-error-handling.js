/**
 * 错误处理测试模块
 * 测试错误处理功能
 */

import { test, Assert, TestUtils } from './test-framework.js'
import { ErrorHandler, Logger } from './monitor.js'
import { InputValidator, FileValidator, ApiResponseValidator } from './validator.js'

/**
 * 错误处理测试套件
 */
class ErrorHandlingTests {
    constructor() {
        this.errorHandler = null
        this.logger = null
    }
    
    /**
     * 运行所有测试
     */
    async runAll() {
        await this.testNetworkErrors()
        await this.testApiErrors()
        await this.testFileErrors()
        await this.testUserInputErrors()
    }
    
    /**
     * 测试网络错误处理
     */
    async testNetworkErrors() {
        test.describe('网络错误处理', () => {
            test.beforeEach(() => {
                this.errorHandler = new ErrorHandler()
            })
            
            test.it('网络错误应正确捕获', () => {
                const error = this.errorHandler.handleError({
                    type: 'network',
                    message: '网络连接失败',
                    timestamp: Date.now()
                })
                
                Assert.notNull(error.id, '错误应有ID')
                Assert.equal(error.type, 'network', '错误类型应为network')
                Assert.equal(error.message, '网络连接失败', '错误消息应正确')
            })
            
            test.it('超时错误应正确处理', () => {
                const error = this.errorHandler.handleError({
                    type: 'timeout',
                    message: '请求超时',
                    timestamp: Date.now()
                })
                
                Assert.equal(error.type, 'timeout', '错误类型应为timeout')
            })
            
            test.it('断网错误应正确识别', () => {
                const isOnline = navigator.onLine
                
                Assert.typeOf(isOnline, 'boolean', '应返回布尔值')
            })
            
            test.it('错误回调应正确触发', () => {
                let callbackCalled = false
                
                this.errorHandler.onError((error) => {
                    callbackCalled = true
                })
                
                this.errorHandler.handleError({
                    type: 'network',
                    message: '测试错误'
                })
                
                Assert.true(callbackCalled, '错误回调应被调用')
            })
            
            test.it('错误列表应正确管理', () => {
                this.errorHandler.handleError({ type: 'network', message: '错误1' })
                this.errorHandler.handleError({ type: 'network', message: '错误2' })
                
                const errors = this.errorHandler.getErrors()
                
                Assert.equal(errors.length, 2, '应有2个错误')
            })
            
            test.it('错误应正确清除', () => {
                this.errorHandler.handleError({ type: 'network', message: '错误' })
                
                this.errorHandler.clearErrors()
                
                const errors = this.errorHandler.getErrors()
                Assert.equal(errors.length, 0, '错误应已清除')
            })
        })
    }
    
    /**
     * 测试API错误处理
     */
    async testApiErrors() {
        test.describe('API错误处理', () => {
            test.beforeEach(() => {
                this.errorHandler = new ErrorHandler()
            })
            
            test.it('API错误应正确捕获', () => {
                const error = this.errorHandler.handleError({
                    type: 'api',
                    message: 'API调用失败',
                    statusCode: 500,
                    timestamp: Date.now()
                })
                
                Assert.equal(error.type, 'api', '错误类型应为api')
                Assert.equal(error.statusCode, 500, '状态码应正确')
            })
            
            test.it('401错误应正确处理', () => {
                const error = this.errorHandler.handleError({
                    type: 'api',
                    message: '未授权',
                    statusCode: 401,
                    timestamp: Date.now()
                })
                
                Assert.equal(error.statusCode, 401, '状态码应为401')
            })
            
            test.it('429错误应正确处理', () => {
                const error = this.errorHandler.handleError({
                    type: 'api',
                    message: '请求过于频繁',
                    statusCode: 429,
                    timestamp: Date.now()
                })
                
                Assert.equal(error.statusCode, 429, '状态码应为429')
            })
            
            test.it('500错误应正确处理', () => {
                const error = this.errorHandler.handleError({
                    type: 'api',
                    message: '服务器内部错误',
                    statusCode: 500,
                    timestamp: Date.now()
                })
                
                Assert.equal(error.statusCode, 500, '状态码应为500')
            })
            
            test.it('API响应验证应正确工作', () => {
                const validResponse = {
                    choices: [
                        {
                            message: {
                                content: '测试内容'
                            }
                        }
                    ]
                }
                
                const result = ApiResponseValidator.validate(validResponse)
                
                Assert.true(result.valid, '有效响应应通过验证')
            })
            
            test.it('无效API响应应被拒绝', () => {
                const invalidResponse = {}
                
                const result = ApiResponseValidator.validate(invalidResponse)
                
                Assert.false(result.valid, '无效响应应被拒绝')
            })
        })
    }
    
    /**
     * 测试文件错误处理
     */
    async testFileErrors() {
        test.describe('文件错误处理', () => {
            test.beforeEach(() => {
                this.errorHandler = new ErrorHandler()
            })
            
            test.it('文件类型错误应正确处理', () => {
                const result = FileValidator.validateType('test.exe', ['.txt', '.json'])
                
                Assert.false(result.valid, '不支持的文件类型应被拒绝')
                Assert.true(result.errors.length > 0, '应有错误信息')
            })
            
            test.it('文件大小错误应正确处理', () => {
                const result = FileValidator.validateSize(30 * 1024 * 1024, 20 * 1024 * 1024)
                
                Assert.false(result.valid, '过大的文件应被拒绝')
            })
            
            test.it('文件不存在错误应正确处理', () => {
                const error = this.errorHandler.handleError({
                    type: 'file',
                    message: '文件不存在',
                    timestamp: Date.now()
                })
                
                Assert.equal(error.type, 'file', '错误类型应为file')
            })
            
            test.it('文件读取错误应正确处理', () => {
                const error = this.errorHandler.handleError({
                    type: 'file',
                    message: '文件读取失败',
                    timestamp: Date.now()
                })
                
                Assert.equal(error.type, 'file', '错误类型应为file')
            })
            
            test.it('文件编码错误应正确处理', () => {
                const error = this.errorHandler.handleError({
                    type: 'file',
                    message: '不支持的文件编码',
                    timestamp: Date.now()
                })
                
                Assert.equal(error.type, 'file', '错误类型应为file')
            })
            
            test.it('有效文件应通过验证', () => {
                const result = FileValidator.validate({
                    name: 'test.txt',
                    size: 1024
                }, {
                    maxSize: 20 * 1024 * 1024,
                    allowedTypes: ['.txt', '.json']
                })
                
                Assert.true(result.valid, '有效文件应通过验证')
            })
        })
    }
    
    /**
     * 测试用户输入错误处理
     */
    async testUserInputErrors() {
        test.describe('用户输入错误处理', () => {
            test.beforeEach(() => {
                this.errorHandler = new ErrorHandler()
            })
            
            test.it('空输入应被检测', () => {
                const result = InputValidator.validateRequired('', '测试字段')
                
                Assert.false(result.valid, '空输入应被拒绝')
            })
            
            test.it('必填字段应被验证', () => {
                const result = InputValidator.validateRequired('测试内容', '测试字段')
                
                Assert.true(result.valid, '非空输入应通过验证')
            })
            
            test.it('数字输入应正确验证', () => {
                const result1 = InputValidator.validateNumber('123', { min: 0, max: 1000 })
                const result2 = InputValidator.validateNumber('abc', { min: 0, max: 1000 })
                
                Assert.true(result1.valid, '有效数字应通过验证')
                Assert.false(result2.valid, '无效数字应被拒绝')
            })
            
            test.it('URL输入应正确验证', () => {
                const result1 = InputValidator.validateUrl('https://example.com')
                const result2 = InputValidator.validateUrl('invalid-url')
                
                Assert.true(result1.valid, '有效URL应通过验证')
                Assert.false(result2.valid, '无效URL应被拒绝')
            })
            
            test.it('邮箱输入应正确验证', () => {
                const result1 = InputValidator.validateEmail('test@example.com')
                const result2 = InputValidator.validateEmail('invalid-email')
                
                Assert.true(result1.valid, '有效邮箱应通过验证')
                Assert.false(result2.valid, '无效邮箱应被拒绝')
            })
            
            test.it('长度限制应正确验证', () => {
                const result1 = InputValidator.validateLength('测试', { min: 1, max: 10 })
                const result2 = InputValidator.validateLength('测试内容过长', { min: 1, max: 5 })
                
                Assert.true(result1.valid, '符合长度的输入应通过验证')
                Assert.false(result2.valid, '超长输入应被拒绝')
            })
            
            test.it('输入错误应正确记录', () => {
                const error = this.errorHandler.handleError({
                    type: 'input',
                    message: '输入验证失败',
                    field: 'username',
                    timestamp: Date.now()
                })
                
                Assert.equal(error.type, 'input', '错误类型应为input')
                Assert.equal(error.field, 'username', '字段名应正确')
            })
        })
    }
    
    /**
     * 测试日志记录
     */
    async testLogging() {
        test.describe('日志记录', () => {
            test.beforeEach(() => {
                this.logger = new Logger()
            })
            
            test.it('日志应正确记录', () => {
                this.logger.info('测试日志')
                
                const logs = this.logger.getLogs()
                
                Assert.equal(logs.length, 1, '应有1条日志')
            })
            
            test.it('不同级别日志应正确记录', () => {
                this.logger.debug('调试日志')
                this.logger.info('信息日志')
                this.logger.warn('警告日志')
                this.logger.error('错误日志')
                
                const logs = this.logger.getLogs()
                
                Assert.equal(logs.length, 4, '应有4条日志')
            })
            
            test.it('日志级别应正确过滤', () => {
                this.logger.setLevel('warn')
                
                this.logger.debug('调试日志')
                this.logger.info('信息日志')
                this.logger.warn('警告日志')
                this.logger.error('错误日志')
                
                const logs = this.logger.getLogs()
                
                Assert.equal(logs.length, 2, '应只有2条日志（warn和error）')
            })
            
            test.it('日志应正确清除', () => {
                this.logger.info('测试日志')
                this.logger.clear()
                
                const logs = this.logger.getLogs()
                
                Assert.equal(logs.length, 0, '日志应已清除')
            })
        })
    }
}

export { ErrorHandlingTests }
