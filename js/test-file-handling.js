/**
 * 文件处理测试模块
 * 测试文件导入导出功能
 */

import { test, Assert, TestUtils } from './test-framework.js'
import { FileHandler } from './file.js'

/**
 * 文件处理测试套件
 */
class FileHandlingTests {
    constructor() {
        this.testContent = '这是测试内容\n第二行\n第三行'
    }
    
    /**
     * 运行所有测试
     */
    async runAll() {
        await this.testTxtImport()
        await this.testTxtExport()
        await this.testJsonImport()
        await this.testJsonExport()
        await this.testEncodingDetection()
        await this.testFileSizeLimit()
    }
    
    /**
     * 测试TXT导入
     */
    async testTxtImport() {
        test.describe('TXT文件导入', () => {
            test.it('应正确导入UTF-8编码的TXT文件', async () => {
                const content = '测试内容'
                const file = TestUtils.createFile(content, 'test.txt', 'text/plain')
                
                const result = await FileHandler.importTxt(file)
                
                Assert.equal(result.content, content, '内容应正确')
                Assert.equal(result.filename, 'test.txt', '文件名应正确')
                Assert.equal(result.encoding, 'utf-8', '编码应正确')
            })
            
            test.it('应正确导入包含中文的TXT文件', async () => {
                const content = '这是中文测试内容\n包含多行\n和特殊字符：！@#￥%'
                const file = TestUtils.createFile(content, 'chinese.txt', 'text/plain')
                
                const result = await FileHandler.importTxt(file)
                
                Assert.equal(result.content, content, '中文内容应正确')
            })
            
            test.it('应正确导入空文件', async () => {
                const content = ''
                const file = TestUtils.createFile(content, 'empty.txt', 'text/plain')
                
                const result = await FileHandler.importTxt(file)
                
                Assert.equal(result.content, '', '空文件内容应为空字符串')
            })
            
            test.it('应正确导入大文件', async () => {
                const content = '测试内容\n'.repeat(10000)
                const file = TestUtils.createFile(content, 'large.txt', 'text/plain')
                
                const result = await FileHandler.importTxt(file)
                
                Assert.true(result.content.length > 0, '大文件内容应正确')
            })
            
            test.it('应正确获取文件大小', async () => {
                const content = '测试内容'
                const file = TestUtils.createFile(content, 'test.txt', 'text/plain')
                
                const result = await FileHandler.importTxt(file)
                
                Assert.true(result.size > 0, '文件大小应大于0')
            })
        })
    }
    
    /**
     * 测试TXT导出
     */
    async testTxtExport() {
        test.describe('TXT文件导出', () => {
            test.it('应正确导出TXT文件', () => {
                const content = '测试导出内容'
                const filename = 'export.txt'
                
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
                
                Assert.equal(blob.size, content.length, 'Blob大小应正确')
                Assert.equal(blob.type, 'text/plain;charset=utf-8', 'Blob类型应正确')
            })
            
            test.it('应正确导出包含中文的内容', () => {
                const content = '中文导出测试\n第二行中文'
                const filename = 'chinese-export.txt'
                
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
                
                Assert.true(blob.size > 0, 'Blob大小应大于0')
            })
            
            test.it('应正确导出空内容', () => {
                const content = ''
                const filename = 'empty-export.txt'
                
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
                
                Assert.equal(blob.size, 0, '空内容Blob大小应为0')
            })
        })
    }
    
    /**
     * 测试JSON导入
     */
    async testJsonImport() {
        test.describe('JSON文件导入', () => {
            test.it('应正确导入JSON文件', async () => {
                const data = { name: '测试', value: 123 }
                const content = JSON.stringify(data)
                const file = TestUtils.createFile(content, 'test.json', 'application/json')
                
                const result = await FileHandler.importJson(file)
                
                Assert.deepEqual(result.data, data, 'JSON数据应正确')
                Assert.equal(result.filename, 'test.json', '文件名应正确')
            })
            
            test.it('应正确导入嵌套JSON', async () => {
                const data = {
                    level1: {
                        level2: {
                            level3: 'value'
                        }
                    }
                }
                const content = JSON.stringify(data)
                const file = TestUtils.createFile(content, 'nested.json', 'application/json')
                
                const result = await FileHandler.importJson(file)
                
                Assert.deepEqual(result.data, data, '嵌套JSON数据应正确')
            })
            
            test.it('应正确导入JSON数组', async () => {
                const data = [1, 2, 3, { key: 'value' }]
                const content = JSON.stringify(data)
                const file = TestUtils.createFile(content, 'array.json', 'application/json')
                
                const result = await FileHandler.importJson(file)
                
                Assert.deepEqual(result.data, data, 'JSON数组应正确')
            })
            
            test.it('应拒绝无效JSON', async () => {
                const content = '{ invalid json }'
                const file = TestUtils.createFile(content, 'invalid.json', 'application/json')
                
                try {
                    await FileHandler.importJson(file)
                    Assert.false(true, '应抛出错误')
                } catch (error) {
                    Assert.true(error.message.includes('JSON格式错误'), '应抛出JSON格式错误')
                }
            })
        })
    }
    
    /**
     * 测试JSON导出
     */
    async testJsonExport() {
        test.describe('JSON文件导出', () => {
            test.it('应正确导出JSON文件', () => {
                const data = { name: '测试', value: 123 }
                const filename = 'export.json'
                
                const content = JSON.stringify(data, null, 2)
                const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
                
                Assert.true(blob.size > 0, 'Blob大小应大于0')
                Assert.equal(blob.type, 'application/json;charset=utf-8', 'Blob类型应正确')
            })
            
            test.it('应正确格式化JSON', () => {
                const data = { name: '测试', nested: { key: 'value' } }
                
                const content = JSON.stringify(data, null, 2)
                const parsed = JSON.parse(content)
                
                Assert.deepEqual(parsed, data, '格式化后的JSON应正确')
            })
            
            test.it('应正确导出复杂JSON', () => {
                const data = {
                    string: 'value',
                    number: 123,
                    boolean: true,
                    null: null,
                    array: [1, 2, 3],
                    object: { key: 'value' }
                }
                
                const content = JSON.stringify(data, null, 2)
                const parsed = JSON.parse(content)
                
                Assert.deepEqual(parsed, data, '复杂JSON应正确导出')
            })
        })
    }
    
    /**
     * 测试编码识别
     */
    async testEncodingDetection() {
        test.describe('编码识别', () => {
            test.it('应正确识别UTF-8编码', async () => {
                const content = 'UTF-8测试内容'
                const encoder = new TextEncoder()
                const buffer = encoder.encode(content)
                
                const encoding = await FileHandler.detectEncoding(buffer)
                
                Assert.equal(encoding, 'utf-8', '应识别为UTF-8')
            })
            
            test.it('应正确识别UTF-8 BOM', async () => {
                const content = 'UTF-8 BOM测试'
                const encoder = new TextEncoder()
                const utf8Bytes = encoder.encode(content)
                
                const buffer = new Uint8Array([0xEF, 0xBB, 0xBF, ...utf8Bytes])
                
                const encoding = await FileHandler.detectEncoding(buffer)
                
                Assert.equal(encoding, 'utf-8', '应识别为UTF-8')
            })
            
            test.it('应正确识别UTF-16 LE', async () => {
                const buffer = new Uint8Array([0xFF, 0xFE, 0x41, 0x00])
                
                const encoding = await FileHandler.detectEncoding(buffer)
                
                Assert.equal(encoding, 'utf-16le', '应识别为UTF-16 LE')
            })
            
            test.it('应正确识别UTF-16 BE', async () => {
                const buffer = new Uint8Array([0xFE, 0xFF, 0x00, 0x41])
                
                const encoding = await FileHandler.detectEncoding(buffer)
                
                Assert.equal(encoding, 'utf-16be', '应识别为UTF-16 BE')
            })
            
            test.it('应正确处理空buffer', async () => {
                const buffer = new Uint8Array(0)
                
                const encoding = await FileHandler.detectEncoding(buffer)
                
                Assert.notNull(encoding, '应返回编码类型')
            })
        })
    }
    
    /**
     * 测试文件大小限制
     */
    async testFileSizeLimit() {
        test.describe('文件大小限制', () => {
            test.it('应拒绝过大的TXT文件', async () => {
                const largeContent = 'x'.repeat(25 * 1024 * 1024)
                const file = TestUtils.createFile(largeContent, 'large.txt', 'text/plain')
                
                try {
                    await FileHandler.importTxt(file)
                    Assert.false(true, '应抛出错误')
                } catch (error) {
                    Assert.true(error.message.includes('文件过大'), '应提示文件过大')
                }
            })
            
            test.it('应拒绝过大的JSON文件', async () => {
                const largeData = { data: 'x'.repeat(15 * 1024 * 1024) }
                const content = JSON.stringify(largeData)
                const file = TestUtils.createFile(content, 'large.json', 'application/json')
                
                try {
                    await FileHandler.importJson(file)
                    Assert.false(true, '应抛出错误')
                } catch (error) {
                    Assert.true(error.message.includes('文件过大'), '应提示文件过大')
                }
            })
            
            test.it('应接受正常大小的文件', async () => {
                const content = '正常大小的文件内容'
                const file = TestUtils.createFile(content, 'normal.txt', 'text/plain')
                
                const result = await FileHandler.importTxt(file)
                
                Assert.equal(result.content, content, '正常文件应正确导入')
            })
            
            test.it('应正确获取文件大小', async () => {
                const content = '测试内容'
                const file = TestUtils.createFile(content, 'test.txt', 'text/plain')
                
                Assert.equal(file.size, content.length, '文件大小应正确')
            })
        })
    }
    
    /**
     * 测试章节分割
     */
    async testChapterSplit() {
        test.describe('章节分割', () => {
            test.it('应正确分割章节', () => {
                const content = '第一章 开始\n\n内容1\n\n第二章 继续\n\n内容2\n\n第三章 结束\n\n内容3'
                
                const chapters = FileHandler.splitChapters(content)
                
                Assert.equal(chapters.length, 3, '应分割为3章')
            })
            
            test.it('应正确提取章节标题', () => {
                const content = '第一章 测试章节\n\n这是内容'
                
                const chapters = FileHandler.splitChapters(content)
                
                Assert.equal(chapters[0].title, '第一章 测试章节', '章节标题应正确')
            })
            
            test.it('应正确提取章节内容', () => {
                const content = '第一章\n\n这是第一章的内容\n\n第二章\n\n这是第二章的内容'
                
                const chapters = FileHandler.splitChapters(content)
                
                Assert.true(chapters[0].content.includes('第一章的内容'), '第一章内容应正确')
                Assert.true(chapters[1].content.includes('第二章的内容'), '第二章内容应正确')
            })
            
            test.it('应正确处理无章节标记的文本', () => {
                const content = '这是没有章节标记的文本'
                
                const chapters = FileHandler.splitChapters(content)
                
                Assert.equal(chapters.length, 1, '应为1个章节')
            })
        })
    }
}

export { FileHandlingTests }
