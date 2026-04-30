/**
 * 数据互通测试模块
 * 测试模块间数据互通功能
 */

import { test, Assert, TestUtils } from './test-framework.js'
import { ConfigManager, ApiConfigManager } from './config.js'
import { RoleCardManager } from './roleCard.js'
import { ContinueWriter } from './continue.js'
import { RewriteWriter } from './rewrite.js'
import { DataStorageManager } from './storage.js'

/**
 * 数据互通测试套件
 */
class DataIntegrationTests {
    constructor() {
        this.storageManager = new DataStorageManager()
    }
    
    /**
     * 运行所有测试
     */
    async runAll() {
        await this.testAnalysisDataFlow()
        await this.testRoleCardSync()
        await this.testGlobalPromptPriority()
        await this.testStoragePersistence()
    }
    
    /**
     * 测试AI分析结果自动带入续写/改写
     */
    async testAnalysisDataFlow() {
        test.describe('AI分析结果数据流', () => {
            test.beforeEach(() => {
                TestUtils.clearStorage()
            })
            
            test.it('分析结果应正确传递给续写模块', () => {
                const plotData = {
                    mainPlot: '主角踏上冒险之旅',
                    characters: [
                        { name: '张三', role: '主角' }
                    ]
                }
                
                const styleData = {
                    writingStyle: '轻松幽默',
                    sentenceLength: '中等'
                }
                
                const continueWriter = new ContinueWriter()
                continueWriter.loadPlotData(plotData)
                continueWriter.loadStyleData(styleData)
                
                Assert.deepEqual(continueWriter.plotData, plotData, '剧情数据应正确加载')
                Assert.deepEqual(continueWriter.styleData, styleData, '文风数据应正确加载')
            })
            
            test.it('分析结果应正确传递给改写模块', () => {
                const plotData = {
                    mainPlot: '主角踏上冒险之旅',
                    characters: [
                        { name: '张三', role: '主角' }
                    ]
                }
                
                const styleData = {
                    writingStyle: '轻松幽默',
                    sentenceLength: '中等'
                }
                
                const rewriteWriter = new RewriteWriter()
                rewriteWriter.loadPlotData(plotData)
                rewriteWriter.loadStyleData(styleData)
                
                Assert.deepEqual(rewriteWriter.plotData, plotData, '剧情数据应正确加载')
                Assert.deepEqual(rewriteWriter.styleData, styleData, '文风数据应正确加载')
            })
            
            test.it('角色卡应正确传递给续写模块', () => {
                const roleCards = [
                    {
                        id: 'role_1',
                        name: '张三',
                        personality: '勇敢、正义'
                    }
                ]
                
                const continueWriter = new ContinueWriter()
                continueWriter.loadRoleCards(roleCards)
                
                Assert.deepEqual(continueWriter.roleCards, roleCards, '角色卡应正确加载')
            })
            
            test.it('角色卡应正确传递给改写模块', () => {
                const roleCards = [
                    {
                        id: 'role_1',
                        name: '张三',
                        personality: '勇敢、正义'
                    }
                ]
                
                const rewriteWriter = new RewriteWriter()
                rewriteWriter.loadRoleCards(roleCards)
                
                Assert.deepEqual(rewriteWriter.roleCards, roleCards, '角色卡应正确加载')
            })
        })
    }
    
    /**
     * 测试角色卡同步更新
     */
    async testRoleCardSync() {
        test.describe('角色卡同步更新', () => {
            test.beforeEach(() => {
                TestUtils.clearStorage()
            })
            
            test.it('添加角色卡应正确保存', () => {
                const card = {
                    name: '李四',
                    personality: '聪明、机智'
                }
                
                const savedCard = RoleCardManager.addRoleCard(card)
                
                Assert.notNull(savedCard.id, '角色卡应有ID')
                Assert.equal(savedCard.name, card.name, '角色卡名称应正确')
                Assert.notNull(savedCard.createdAt, '应有创建时间')
                
                const allCards = RoleCardManager.getRoleCards()
                Assert.equal(allCards.length, 1, '应有1张角色卡')
            })
            
            test.it('更新角色卡应正确同步', () => {
                const card = RoleCardManager.addRoleCard({
                    name: '王五',
                    personality: '勇敢'
                })
                
                const updatedCard = RoleCardManager.updateRoleCard(card.id, {
                    personality: '勇敢、善良'
                })
                
                Assert.equal(updatedCard.personality, '勇敢、善良', '角色卡应已更新')
                Assert.notNull(updatedCard.updatedAt, '应有更新时间')
                
                const allCards = RoleCardManager.getRoleCards()
                Assert.equal(allCards[0].personality, '勇敢、善良', '角色卡列表应同步更新')
            })
            
            test.it('删除角色卡应正确同步', () => {
                const card = RoleCardManager.addRoleCard({
                    name: '赵六',
                    personality: '神秘'
                })
                
                RoleCardManager.deleteRoleCard(card.id)
                
                const allCards = RoleCardManager.getRoleCards()
                Assert.equal(allCards.length, 0, '角色卡应已删除')
            })
            
            test.it('从分析结果导入角色卡应正确', () => {
                const plotAnalysis = {
                    characters: [
                        {
                            name: '主角',
                            appearance: '英俊',
                            personality: '勇敢',
                            relationships: ['朋友'],
                            plotChanges: ['成长']
                        }
                    ]
                }
                
                const cards = RoleCardManager.importFromAnalysis(plotAnalysis)
                
                Assert.equal(cards.length, 1, '应导入1张角色卡')
                Assert.equal(cards[0].name, '主角', '角色卡名称应正确')
                Assert.equal(cards[0].appearance, '英俊', '角色卡外貌应正确')
                Assert.equal(cards[0].personality, '勇敢', '角色卡性格应正确')
            })
            
            test.it('搜索角色卡应返回正确结果', () => {
                RoleCardManager.addRoleCard({
                    name: '张三',
                    personality: '勇敢'
                })
                
                RoleCardManager.addRoleCard({
                    name: '李四',
                    personality: '聪明'
                })
                
                const results = RoleCardManager.searchRoleCards('张')
                Assert.equal(results.length, 1, '应搜索到1张角色卡')
                Assert.equal(results[0].name, '张三', '搜索结果应正确')
            })
        })
    }
    
    /**
     * 测试全局Prompt优先级
     */
    async testGlobalPromptPriority() {
        test.describe('全局Prompt优先级', () => {
            test.beforeEach(() => {
                TestUtils.clearStorage()
            })
            
            test.it('全局Prompt应正确保存', () => {
                const prompt = '这是测试的全局Prompt'
                ConfigManager.setGlobalPrompt(prompt)
                
                const savedPrompt = ConfigManager.getGlobalPrompt()
                Assert.equal(savedPrompt, prompt, '全局Prompt应正确保存')
            })
            
            test.it('全局Prompt应正确重置', () => {
                ConfigManager.setGlobalPrompt('自定义Prompt')
                ConfigManager.resetGlobalPrompt()
                
                const savedPrompt = ConfigManager.getGlobalPrompt()
                Assert.true(savedPrompt.includes('专业小说创作助手'), '应重置为默认Prompt')
            })
            
            test.it('全局Prompt信息应正确获取', () => {
                const prompt = '测试Prompt'
                ConfigManager.setGlobalPrompt(prompt)
                
                const info = ConfigManager.getPromptInfo()
                Assert.equal(info.content, prompt, 'Prompt内容应正确')
                Assert.notNull(info.updatedAt, '应有更新时间')
                Assert.equal(info.version, 1, '版本号应正确')
            })
            
            test.it('全局Prompt应在API调用中优先使用', () => {
                const globalPrompt = '全局Prompt内容'
                ConfigManager.setGlobalPrompt(globalPrompt)
                
                const savedPrompt = ConfigManager.getGlobalPrompt()
                Assert.equal(savedPrompt, globalPrompt, '全局Prompt应可获取')
            })
        })
    }
    
    /**
     * 测试localStorage数据持久化
     */
    async testStoragePersistence() {
        test.describe('localStorage数据持久化', () => {
            test.beforeEach(() => {
                TestUtils.clearStorage()
            })
            
            test.it('数据应正确保存到localStorage', () => {
                const key = 'test_data'
                const value = { name: '测试', value: 123 }
                
                this.storageManager.set(key, value)
                
                const saved = this.storageManager.get(key)
                Assert.deepEqual(saved, value, '数据应正确保存')
            })
            
            test.it('数据应正确从localStorage读取', () => {
                const key = 'test_read'
                const value = { data: '读取测试' }
                
                localStorage.setItem(key, JSON.stringify(value))
                
                const saved = this.storageManager.get(key)
                Assert.deepEqual(saved, value, '数据应正确读取')
            })
            
            test.it('数据应正确删除', () => {
                const key = 'test_delete'
                const value = { data: '删除测试' }
                
                this.storageManager.set(key, value)
                this.storageManager.remove(key)
                
                const saved = this.storageManager.get(key)
                Assert.null(saved, '数据应已删除')
            })
            
            test.it('数据应正确清空', () => {
                this.storageManager.set('key1', 'value1')
                this.storageManager.set('key2', 'value2')
                
                this.storageManager.clear()
                
                const saved1 = this.storageManager.get('key1')
                const saved2 = this.storageManager.get('key2')
                
                Assert.null(saved1, '数据1应已清空')
                Assert.null(saved2, '数据2应已清空')
            })
            
            test.it('API配置应正确加密存储', () => {
                const config = {
                    apiKey: 'sk-test-api-key-12345',
                    apiUrl: 'https://api.test.com',
                    modelId: 'test-model'
                }
                
                ApiConfigManager.setApiConfig(config)
                const savedConfig = ApiConfigManager.getApiConfig()
                
                Assert.equal(savedConfig.apiKey, config.apiKey, 'API Key应正确解密')
                Assert.equal(savedConfig.apiUrl, config.apiUrl, 'API URL应正确')
            })
            
            test.it('API Key应正确加密', () => {
                const key = 'sk-test-api-key-12345'
                const encrypted = ApiConfigManager.encryptKey(key)
                const decrypted = ApiConfigManager.decryptKey(encrypted)
                
                Assert.equal(decrypted, key, 'API Key应正确加密解密')
                Assert.notEqual(encrypted, key, '加密后的Key应不同')
            })
            
            test.it('API Key应正确掩码显示', () => {
                const key = 'sk-test-api-key-12345'
                const masked = ApiConfigManager.maskKey(key)
                
                Assert.true(masked.startsWith('****'), '掩码应以****开头')
                Assert.true(masked.endsWith('2345'), '掩码应显示后4位')
            })
        })
    }
}

export { DataIntegrationTests }
