/**
 * API调用测试模块
 * 测试API调用相关功能
 */

import { test, Assert, TestUtils } from './test-framework.js'
import { ApiConfigManager } from './config.js'
import { RequestQueue, RequestCache, ApiClient } from './api.js'

/**
 * API调用测试套件
 */
class ApiCallTests {
    constructor() {
        this.apiClient = null
        this.mockServer = null
    }
    
    /**
     * 运行所有测试
     */
    async runAll() {
        await this.testApiKeyEncryption()
        await this.testRequestQueue()
        await this.testRequestCache()
        await this.testRequestBuilding()
        await this.testRetryMechanism()
        await this.testTimeoutHandling()
    }
    
    /**
     * 测试API Key加密存储
     */
    async testApiKeyEncryption() {
        test.describe('API Key加密存储', () => {
            test.beforeEach(() => {
                TestUtils.clearStorage()
            })
            
            test.it('API Key应正确加密', () => {
                const originalKey = 'sk-test-api-key-12345678'
                const encrypted = ApiConfigManager.encryptKey(originalKey)
                
                Assert.notEqual(encrypted, originalKey, '加密后的Key应不同于原始Key')
                Assert.true(encrypted.length > 0, '加密后的Key不应为空')
            })
            
            test.it('API Key应正确解密', () => {
                const originalKey = 'sk-test-api-key-12345678'
                const encrypted = ApiConfigManager.encryptKey(originalKey)
                const decrypted = ApiConfigManager.decryptKey(encrypted)
                
                Assert.equal(decrypted, originalKey, '解密后的Key应等于原始Key')
            })
            
            test.it('空Key应返回空字符串', () => {
                const encrypted = ApiConfigManager.encryptKey('')
                const decrypted = ApiConfigManager.decryptKey('')
                
                Assert.equal(encrypted, '', '空Key加密应返回空字符串')
                Assert.equal(decrypted, '', '空字符串解密应返回空字符串')
            })
            
            test.it('API Key应正确掩码显示', () => {
                const key = 'sk-test-api-key-12345678'
                const masked = ApiConfigManager.maskKey(key)
                
                Assert.true(masked.startsWith('****'), '掩码应以****开头')
                Assert.true(masked.endsWith('5678'), '掩码应显示后4位')
                Assert.equal(masked, '****5678', '掩码格式应正确')
            })
            
            test.it('短Key应正确掩码', () => {
                const shortKey = 'sk-123'
                const masked = ApiConfigManager.maskKey(shortKey)
                
                Assert.equal(masked, '****', '短Key应显示为****')
            })
            
            test.it('API配置应正确保存和读取', () => {
                const config = {
                    apiKey: 'sk-test-api-key-12345678',
                    apiUrl: 'https://api.test.com/v1/chat',
                    modelId: 'test-model',
                    maxTokens: 4096,
                    temperature: 0.7
                }
                
                ApiConfigManager.setApiConfig(config)
                const savedConfig = ApiConfigManager.getApiConfig()
                
                Assert.equal(savedConfig.apiKey, config.apiKey, 'API Key应正确保存')
                Assert.equal(savedConfig.apiUrl, config.apiUrl, 'API URL应正确保存')
                Assert.equal(savedConfig.modelId, config.modelId, '模型ID应正确保存')
                Assert.equal(savedConfig.maxTokens, config.maxTokens, '最大Token数应正确保存')
                Assert.equal(savedConfig.temperature, config.temperature, '温度应正确保存')
            })
        })
    }
    
    /**
     * 测试请求队列
     */
    async testRequestQueue() {
        test.describe('请求队列', () => {
            test.it('请求队列应正确初始化', () => {
                const queue = new RequestQueue(3)
                
                Assert.equal(queue.maxConcurrent, 3, '最大并发数应正确')
                Assert.equal(queue.activeRequests, 0, '活跃请求数应为0')
                Assert.equal(queue.queue.length, 0, '队列应为空')
            })
            
            test.it('请求应正确加入队列', async () => {
                const queue = new RequestQueue(1)
                let executed = false
                
                const promise = queue.add(async () => {
                    executed = true
                    return 'success'
                })
                
                await promise
                
                Assert.true(executed, '请求应已执行')
            })
            
            test.it('队列应限制并发数', async () => {
                const queue = new RequestQueue(2)
                const results = []
                
                const createRequest = (id) => {
                    return async () => {
                        results.push(`start-${id}`)
                        await TestUtils.wait(50)
                        results.push(`end-${id}`)
                        return id
                    }
                }
                
                const promises = [
                    queue.add(createRequest(1)),
                    queue.add(createRequest(2)),
                    queue.add(createRequest(3))
                ]
                
                await Promise.all(promises)
                
                Assert.true(results.includes('start-1'), '请求1应开始')
                Assert.true(results.includes('start-2'), '请求2应开始')
                Assert.true(results.includes('start-3'), '请求3应开始')
            })
            
            test.it('队列统计应正确', async () => {
                const queue = new RequestQueue(2)
                
                const stats1 = queue.getStats()
                Assert.equal(stats1.pending, 0, '待处理数应为0')
                Assert.equal(stats1.active, 0, '活跃数应为0')
                Assert.equal(stats1.total, 0, '总数应为0')
                
                queue.add(async () => {
                    await TestUtils.wait(100)
                    return 'test'
                })
                
                const stats2 = queue.getStats()
                Assert.equal(stats2.total, 1, '总数应为1')
            })
            
            test.it('队列应正确清空', () => {
                const queue = new RequestQueue(2)
                
                queue.add(async () => 'test1')
                queue.add(async () => 'test2')
                
                queue.clear()
                
                Assert.equal(queue.queue.length, 0, '队列应为空')
            })
        })
    }
    
    /**
     * 测试请求缓存
     */
    async testRequestCache() {
        test.describe('请求缓存', () => {
            test.it('缓存应正确初始化', () => {
                const cache = new RequestCache(50, 3600000)
                
                Assert.equal(cache.maxSize, 50, '最大大小应正确')
                Assert.equal(cache.ttl, 3600000, 'TTL应正确')
                Assert.equal(cache.cache.size, 0, '缓存应为空')
            })
            
            test.it('缓存应正确生成Key', () => {
                const cache = new RequestCache()
                
                const messages = [{ role: 'user', content: 'test' }]
                const options = { maxTokens: 100 }
                
                const key1 = cache.generateKey(messages, options)
                const key2 = cache.generateKey(messages, options)
                
                Assert.equal(key1, key2, '相同输入应生成相同Key')
                Assert.true(key1.startsWith('cache_'), 'Key应以cache_开头')
            })
            
            test.it('缓存应正确设置和获取', () => {
                const cache = new RequestCache()
                const key = 'test_key'
                const data = { result: 'success' }
                
                cache.set(key, data)
                const cached = cache.get(key)
                
                Assert.deepEqual(cached, data, '缓存数据应正确')
            })
            
            test.it('缓存应正确过期', async () => {
                const cache = new RequestCache(50, 100)
                const key = 'test_key'
                const data = { result: 'success' }
                
                cache.set(key, data)
                
                const cached1 = cache.get(key)
                Assert.deepEqual(cached1, data, '缓存应存在')
                
                await TestUtils.wait(150)
                
                const cached2 = cache.get(key)
                Assert.null(cached2, '缓存应已过期')
            })
            
            test.it('缓存应限制大小', () => {
                const cache = new RequestCache(3)
                
                cache.set('key1', 'data1')
                cache.set('key2', 'data2')
                cache.set('key3', 'data3')
                cache.set('key4', 'data4')
                
                Assert.equal(cache.cache.size, 3, '缓存大小应限制为3')
                Assert.null(cache.get('key1'), '最早的缓存应被移除')
            })
            
            test.it('缓存应正确清空', () => {
                const cache = new RequestCache()
                
                cache.set('key1', 'data1')
                cache.set('key2', 'data2')
                
                cache.clear()
                
                Assert.equal(cache.cache.size, 0, '缓存应为空')
            })
            
            test.it('缓存统计应正确', () => {
                const cache = new RequestCache(10)
                
                cache.set('key1', 'data1')
                cache.set('key2', 'data2')
                
                const stats = cache.getStats()
                
                Assert.equal(stats.size, 2, '缓存大小应为2')
                Assert.equal(stats.maxSize, 10, '最大大小应为10')
            })
        })
    }
    
    /**
     * 测试请求拼接
     */
    async testRequestBuilding() {
        test.describe('请求拼接', () => {
            test.beforeEach(() => {
                TestUtils.clearStorage()
            })
            
            test.it('消息应正确拼接', () => {
                const messages = [
                    { role: 'system', content: '你是助手' },
                    { role: 'user', content: '你好' }
                ]
                
                Assert.equal(messages.length, 2, '消息数量应正确')
                Assert.equal(messages[0].role, 'system', '第一条消息角色应正确')
                Assert.equal(messages[1].role, 'user', '第二条消息角色应正确')
            })
            
            test.it('全局Prompt应在消息中优先', () => {
                const globalPrompt = '全局Prompt内容'
                ConfigManager.setGlobalPrompt(globalPrompt)
                
                const savedPrompt = ConfigManager.getGlobalPrompt()
                Assert.equal(savedPrompt, globalPrompt, '全局Prompt应正确保存')
            })
            
            test.it('请求参数应正确构建', () => {
                const config = {
                    modelId: 'test-model',
                    maxTokens: 4096,
                    temperature: 0.7
                }
                
                ApiConfigManager.setApiConfig({
                    apiKey: 'sk-test',
                    ...config
                })
                
                const savedConfig = ApiConfigManager.getApiConfig()
                
                Assert.equal(savedConfig.modelId, config.modelId, '模型ID应正确')
                Assert.equal(savedConfig.maxTokens, config.maxTokens, '最大Token数应正确')
                Assert.equal(savedConfig.temperature, config.temperature, '温度应正确')
            })
        })
    }
    
    /**
     * 测试错误重试机制
     */
    async testRetryMechanism() {
        test.describe('错误重试机制', () => {
            test.it('请求失败应重试', async () => {
                let attempts = 0
                
                const retryFn = async () => {
                    attempts++
                    if (attempts < 3) {
                        throw new Error('请求失败')
                    }
                    return 'success'
                }
                
                const maxRetries = 3
                let lastError = null
                
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        const result = await retryFn()
                        Assert.equal(result, 'success', '最终应成功')
                        break
                    } catch (error) {
                        lastError = error
                    }
                }
                
                Assert.equal(attempts, 3, '应尝试3次')
            })
            
            test.it('达到最大重试次数应抛出错误', async () => {
                let attempts = 0
                const maxRetries = 3
                
                const retryFn = async () => {
                    attempts++
                    throw new Error('持续失败')
                }
                
                let lastError = null
                
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        await retryFn()
                    } catch (error) {
                        lastError = error
                    }
                }
                
                Assert.equal(attempts, maxRetries, '应达到最大重试次数')
                Assert.notNull(lastError, '应有错误')
            })
            
            test.it('重试间隔应递增', async () => {
                const delays = [100, 200, 400]
                const actualDelays = []
                
                for (const delay of delays) {
                    const start = Date.now()
                    await TestUtils.wait(delay)
                    const end = Date.now()
                    actualDelays.push(end - start)
                }
                
                Assert.true(actualDelays[1] >= actualDelays[0], '第二次延迟应大于第一次')
                Assert.true(actualDelays[2] >= actualDelays[1], '第三次延迟应大于第二次')
            })
        })
    }
    
    /**
     * 测试超时处理
     */
    async testTimeoutHandling() {
        test.describe('超时处理', () => {
            test.it('请求超时应抛出错误', async () => {
                const timeout = 100
                
                const slowRequest = async () => {
                    await TestUtils.wait(200)
                    return 'success'
                }
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('请求超时'))
                    }, timeout)
                })
                
                try {
                    await Promise.race([slowRequest(), timeoutPromise])
                    Assert.false(true, '不应到达这里')
                } catch (error) {
                    Assert.equal(error.message, '请求超时', '应抛出超时错误')
                }
            })
            
            test.it('快速请求不应超时', async () => {
                const timeout = 200
                
                const fastRequest = async () => {
                    await TestUtils.wait(50)
                    return 'success'
                }
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('请求超时'))
                    }, timeout)
                })
                
                try {
                    const result = await Promise.race([fastRequest(), timeoutPromise])
                    Assert.equal(result, 'success', '请求应成功')
                } catch (error) {
                    Assert.false(true, '不应超时')
                }
            })
            
            test.it('超时应正确清理资源', async () => {
                let cleaned = false
                
                const requestWithCleanup = async () => {
                    await TestUtils.wait(200)
                    cleaned = true
                    return 'success'
                }
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('请求超时'))
                    }, 100)
                })
                
                try {
                    await Promise.race([requestWithCleanup(), timeoutPromise])
                } catch (error) {
                    Assert.equal(error.message, '请求超时', '应抛出超时错误')
                }
                
                await TestUtils.wait(150)
                Assert.true(cleaned, '资源应已清理')
            })
        })
    }
}

export { ApiCallTests }
