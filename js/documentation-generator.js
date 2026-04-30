/**
 * 部署文档生成器
 * 自动生成部署说明、使用手册等文档
 */

/**
 * 文档生成器
 */
class DocumentationGenerator {
    constructor() {
        this.projectName = 'LLMNovel'
        this.version = '1.0.0'
    }
    
    /**
     * 生成完整文档
     */
    generateAll() {
        return {
            readme: this.generateReadme(),
            deployment: this.generateDeploymentGuide(),
            userManual: this.generateUserManual(),
            apiDoc: this.generateApiDoc(),
            changelog: this.generateChangelog()
        }
    }
    
    /**
     * 生成README文档
     */
    generateReadme() {
        return `# ${this.projectName} - 小说AI改写/续写工具

## 📖 项目简介

${this.projectName} 是一个基于本地浏览器的小说AI改写/续写工具，支持智能分析小说内容、生成角色卡、智能续写和改写功能。

### ✨ 主要特性

- 📝 **文本导入导出** - 支持TXT文件导入导出，自动识别章节
- 🤖 **AI智能分析** - 自动分析剧情、角色、文风
- 👥 **角色卡管理** - 创建和管理角色信息
- ✍️ **智能续写** - 基于上下文AI续写
- 🔄 **智能改写** - 支持多种改写强度
- 💾 **本地存储** - 数据存储在本地浏览器
- 🌙 **深色主题** - 现代化暗色UI设计
- ⌨️ **快捷键支持** - 提高操作效率

## 🚀 快速开始

### 环境要求

- 现代浏览器：Chrome 90+、Edge 90+、Firefox 88+、Safari 14+
- 本地运行，无需服务器

### 安装步骤

1. 下载项目文件
2. 双击 \`start-server.bat\` 启动本地服务器
3. 浏览器自动打开 http://localhost:8000

### 配置API

1. 点击右上角"设置"按钮
2. 输入您的DeepSeek API密钥
3. 密钥将被加密存储在本地

## 📚 使用说明

### 基本流程

1. **导入小说** - 点击"导入TXT"选择文件
2. **AI分析** - 选择章节进行智能分析
3. **管理角色** - 查看和编辑角色卡
4. **续写/改写** - 使用AI生成内容
5. **导出结果** - 保存到本地文件

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+S | 保存当前内容 |
| Ctrl+I | 导入文件 |
| Ctrl+E | 导出文件 |
| Ctrl+, | 打开设置 |
| Ctrl+/ | 显示帮助 |
| Ctrl+G | AI分析 |
| Ctrl+Enter | 开始生成 |
| Esc | 关闭弹窗 |

## 🛠️ 技术栈

- **前端框架**: 原生JavaScript (ES6+)
- **样式框架**: TailwindCSS 3
- **数据存储**: localStorage
- **AI接口**: DeepSeek API

## 📁 项目结构

\`\`\`
${this.projectName}/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 主应用
│   ├── config.js       # 配置管理
│   ├── utils.js        # 工具函数
│   ├── ui.js           # UI组件
│   ├── file.js         # 文件处理
│   ├── api.js          # API调用
│   ├── continue.js     # 续写模块
│   ├── rewrite.js      # 改写模块
│   ├── roleCard.js     # 角色卡管理
│   └── ...             # 其他模块
├── docs/               # 文档目录
└── start-server.bat    # 启动脚本
\`\`\`

## 🔒 安全说明

- 所有数据存储在本地浏览器
- API密钥加密存储
- 无需联网即可使用（除AI功能外）
- 数据不会上传到服务器

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 联系方式

如有问题，请提交Issue或联系开发团队。

---

**版本**: v${this.version}
**更新日期**: ${new Date().toLocaleDateString('zh-CN')}
`
    }
    
    /**
     * 生成部署指南
     */
    generateDeploymentGuide() {
        return `# 部署指南

## 📋 部署前检查清单

### 文件检查
- [ ] index.html 存在且完整
- [ ] css/style.css 存在且完整
- [ ] js/ 目录下所有必需文件存在
- [ ] start-server.bat 启动脚本存在

### 功能检查
- [ ] 页面能正常打开
- [ ] 导航功能正常
- [ ] 文件导入导出正常
- [ ] API配置功能正常
- [ ] AI分析功能正常
- [ ] 续写功能正常
- [ ] 改写功能正常

## 🚀 部署方式

### 方式一：本地直接运行

1. 确保所有文件完整
2. 双击 \`start-server.bat\`
3. 浏览器访问 http://localhost:8000

### 方式二：使用Python服务器

\`\`\`bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
\`\`\`

### 方式三：使用Node.js服务器

\`\`\`bash
# 安装serve
npm install -g serve

# 启动服务
serve -p 8000
\`\`\`

### 方式四：部署到Web服务器

1. 将所有文件上传到Web服务器
2. 配置Web服务器指向index.html
3. 确保支持静态文件访问

## ⚙️ 环境配置

### 浏览器要求

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |

### 功能支持

- localStorage API
- Fetch API
- ES6+ JavaScript
- CSS Grid/Flexbox
- TailwindCSS

## 🔧 配置说明

### API配置

1. 获取DeepSeek API密钥
2. 在设置页面输入密钥
3. 密钥将被加密存储

### 存储配置

- 默认使用localStorage
- 存储空间约5MB
- 可导出数据备份

## 📊 性能优化

### 加载优化

- 使用CDN加载TailwindCSS
- 按需加载JavaScript模块
- 压缩CSS和JS文件

### 运行优化

- 使用虚拟滚动处理大量数据
- 防抖和节流优化事件处理
- 缓存API请求结果

## 🔒 安全配置

### 数据安全

- 所有数据本地存储
- API密钥加密存储
- 不发送数据到第三方服务器

### 访问控制

- 仅支持本地访问
- 不暴露到公网
- 建议使用HTTPS（如需公网访问）

## 📝 维护说明

### 数据备份

定期导出数据：
1. 打开设置页面
2. 点击"导出数据"
3. 保存JSON文件

### 数据恢复

1. 打开设置页面
2. 点击"导入数据"
3. 选择备份文件

### 日志查看

打开浏览器控制台查看运行日志：
- Chrome: F12 -> Console
- Firefox: F12 -> 控制台

## 🆘 故障排除

### 页面无法打开

1. 检查服务器是否启动
2. 检查端口是否被占用
3. 清除浏览器缓存

### API调用失败

1. 检查API密钥是否正确
2. 检查网络连接
3. 查看控制台错误信息

### 数据丢失

1. 检查localStorage是否被清除
2. 尝试导入备份文件
3. 检查浏览器隐私设置

---

**文档版本**: v${this.version}
**更新日期**: ${new Date().toLocaleDateString('zh-CN')}
`
    }
    
    /**
     * 生成用户手册
     */
    generateUserManual() {
        return `# 用户手册

## 📖 目录

1. [快速入门](#快速入门)
2. [功能详解](#功能详解)
3. [操作指南](#操作指南)
4. [常见问题](#常见问题)

## 🚀 快速入门

### 第一步：配置API

1. 点击右上角"设置"图标
2. 在"API配置"选项卡中输入DeepSeek API密钥
3. 点击"保存配置"

### 第二步：导入小说

1. 点击左侧导航"导入TXT"
2. 选择您的小说文件（支持UTF-8编码）
3. 系统自动识别章节

### 第三步：AI分析

1. 选择要分析的章节
2. 点击"AI分析"按钮
3. 等待分析完成
4. 查看分析结果

### 第四步：续写/改写

1. 使用分析结果进行续写
2. 或选择章节进行改写
3. 编辑和调整生成内容
4. 导出最终结果

## 📚 功能详解

### 1. 文件管理

#### 导入TXT文件

- 支持UTF-8编码
- 自动识别章节（基于"第X章"格式）
- 显示章节列表

#### 导出文件

- 支持TXT格式导出
- 支持JSON格式导出（完整数据）
- 可选择导出范围

### 2. AI分析

#### 剧情分析

- 提取主要剧情线
- 识别关键事件
- 分析故事结构

#### 角色分析

- 识别主要角色
- 提取角色特征
- 生成角色卡

#### 文风分析

- 分析写作风格
- 识别句式特点
- 提取用词习惯

### 3. 角色卡管理

#### 创建角色卡

- 手动创建
- 从分析结果导入
- 批量导入

#### 编辑角色卡

- 修改角色信息
- 添加角色描述
- 设置角色关系

### 4. 续写功能

#### 配置续写参数

- 选择续写章节
- 设置续写长度
- 配置续写风格

#### 生成续写内容

- 基于上下文生成
- 保持角色一致性
- 遵循原文风格

### 5. 改写功能

#### 选择改写强度

- 轻度：保留原文风格，优化表达
- 中度：重新组织句子，优化结构
- 深度：大幅改写，保留核心内容

#### 执行改写

- 选择改写章节
- 设置改写要求
- 生成改写结果

## 📋 操作指南

### 快捷键使用

| 操作 | 快捷键 |
|------|--------|
| 保存 | Ctrl+S |
| 导入 | Ctrl+I |
| 导出 | Ctrl+E |
| 设置 | Ctrl+, |
| 帮助 | Ctrl+/ |
| 分析 | Ctrl+G |
| 生成 | Ctrl+Enter |
| 取消 | Esc |

### 数据管理

#### 备份数据

1. 打开设置页面
2. 点击"导出数据"
3. 选择保存位置
4. 确认导出

#### 恢复数据

1. 打开设置页面
2. 点击"导入数据"
3. 选择备份文件
4. 确认导入

### 性能优化建议

1. **分段处理**：大型小说建议分段导入
2. **定期备份**：定期导出数据备份
3. **清理缓存**：定期清理浏览器缓存
4. **关闭不用的标签页**：减少内存占用

## ❓ 常见问题

### Q1: API密钥如何获取？

**A**: 访问DeepSeek官网注册账号，在API设置中获取密钥。

### Q2: 支持哪些文件格式？

**A**: 目前支持UTF-8编码的TXT文件。

### Q3: 数据存储在哪里？

**A**: 所有数据存储在浏览器的localStorage中，不会上传到服务器。

### Q4: 如何处理大型小说？

**A**: 建议分段导入，每次处理10-20章。

### Q5: 续写/改写效果不理想怎么办？

**A**: 
- 完善角色卡信息
- 优化全局Prompt
- 调整生成参数
- 尝试不同的改写强度

### Q6: 如何提高分析质量？

**A**: 
- 选择包含完整情节的章节
- 避免选择过渡性章节
- 确保文本格式正确

### Q7: 遇到错误怎么办？

**A**: 
1. 查看控制台错误信息
2. 刷新页面重试
3. 清除浏览器缓存
4. 检查API配置

---

**手册版本**: v${this.version}
**更新日期**: ${new Date().toLocaleDateString('zh-CN')}
`
    }
    
    /**
     * 生成API文档
     */
    generateApiDoc() {
        return `# API文档

## 📖 概述

本文档描述${this.projectName}的内部API接口。

## 🔧 配置API

### ApiConfigManager

管理API配置的类。

#### 方法

\`\`\`javascript
// 保存API密钥
ApiConfigManager.saveApiKey(key)

// 获取API密钥
ApiConfigManager.getApiKey()

// 加密密钥
ApiConfigManager.encryptKey(key)

// 解密密钥
ApiConfigManager.decryptKey(encryptedKey)
\`\`\`

### 示例

\`\`\`javascript
// 保存API密钥
ApiConfigManager.saveApiKey('sk-xxxxxxxx')

// 获取API密钥
const key = ApiConfigManager.getApiKey()
\`\`\`

## 📁 文件处理API

### FileHandler

处理文件导入导出的类。

#### 方法

\`\`\`javascript
// 导入TXT文件
await FileHandler.importTxt(file)

// 导出TXT文件
FileHandler.exportTxt(content, filename)

// 导入JSON文件
await FileHandler.importJson(file)

// 导出JSON文件
FileHandler.exportJson(data, filename)
\`\`\`

### 示例

\`\`\`javascript
// 导入TXT文件
const file = document.querySelector('input[type="file"]').files[0]
const result = await FileHandler.importTxt(file)
console.log(result.content)

// 导出TXT文件
FileHandler.exportTxt('小说内容', 'novel.txt')
\`\`\`

## 🤖 AI分析API

### AIAnalyzer

AI分析功能的类。

#### 方法

\`\`\`javascript
// 分析剧情
await AIAnalyzer.analyzePlot(content)

// 分析角色
await AIAnalyzer.analyzeCharacters(content)

// 分析文风
await AIAnalyzer.analyzeStyle(content)

// 完整分析
await AIAnalyzer.analyze(content)
\`\`\`

### 示例

\`\`\`javascript
// 分析内容
const content = '小说文本内容...'
const result = await AIAnalyzer.analyze(content)
console.log(result.plot)
console.log(result.characters)
console.log(result.style)
\`\`\`

## ✍️ 续写API

### ContinueWriter

续写功能的类。

#### 方法

\`\`\`javascript
// 设置上下文
ContinueWriter.setContext(context)

// 设置角色卡
ContinueWriter.setRoleCards(cards)

// 续写
await ContinueWriter.continue(options)
\`\`\`

### 示例

\`\`\`javascript
// 配置续写
ContinueWriter.setContext('前文内容...')
ContinueWriter.setRoleCards([{ name: '张三', role: '主角' }])

// 执行续写
const result = await ContinueWriter.continue({
    length: 1000,
    style: '轻松幽默'
})
\`\`\`

## 🔄 改写API

### Rewriter

改写功能的类。

#### 方法

\`\`\`javascript
// 设置原文
Rewriter.setOriginalText(text)

// 设置改写强度
Rewriter.setIntensity(intensity)

// 改写
await Rewriter.rewrite(options)
\`\`\`

### 示例

\`\`\`javascript
// 配置改写
Rewriter.setOriginalText('原文内容...')
Rewriter.setIntensity('medium')

// 执行改写
const result = await Rewriter.rewrite({
    requirements: '保持原意，优化表达'
})
\`\`\`

## 👥 角色卡API

### RoleCardManager

角色卡管理的类。

#### 方法

\`\`\`javascript
// 添加角色卡
RoleCardManager.addCard(card)

// 获取角色卡
RoleCardManager.getCard(id)

// 更新角色卡
RoleCardManager.updateCard(id, data)

// 删除角色卡
RoleCardManager.deleteCard(id)

// 获取所有角色卡
RoleCardManager.getAllCards()
\`\`\`

### 示例

\`\`\`javascript
// 添加角色卡
RoleCardManager.addCard({
    name: '张三',
    role: '主角',
    description: '勇敢善良的少年'
})

// 获取所有角色卡
const cards = RoleCardManager.getAllCards()
\`\`\`

## 💾 存储API

### DataStorageManager

数据存储管理的类。

#### 方法

\`\`\`javascript
// 保存数据
DataStorageManager.save(key, value)

// 获取数据
DataStorageManager.get(key)

// 删除数据
DataStorageManager.remove(key)

// 清空数据
DataStorageManager.clear()

// 导出数据
DataStorageManager.exportData()

// 导入数据
DataStorageManager.importData(data)
\`\`\`

### 示例

\`\`\`javascript
// 保存数据
DataStorageManager.save('novel', { title: '我的小说', content: '...' })

// 获取数据
const novel = DataStorageManager.get('novel')

// 导出数据
const backup = DataStorageManager.exportData()
\`\`\`

## 📊 进度API

### ProgressManager

进度管理的类。

#### 方法

\`\`\`javascript
// 创建进度条
ProgressManager.createProgressBar(container, options)

// 更新进度
ProgressManager.updateProgress(id, value)

// 完成进度
ProgressManager.completeProgress(id)

// 创建步骤指示器
ProgressManager.createStepIndicator(container, steps)
\`\`\`

### 示例

\`\`\`javascript
// 创建进度条
const progressBar = ProgressManager.createProgressBar(container, {
    label: '分析进度'
})

// 更新进度
ProgressManager.updateProgress(progressBar.id, 50)
\`\`\`

---

**API版本**: v${this.version}
**更新日期**: ${new Date().toLocaleDateString('zh-CN')}
`
    }
    
    /**
     * 生成更新日志
     */
    generateChangelog() {
        return `# 更新日志

## [${this.version}] - ${new Date().toLocaleDateString('zh-CN')}

### 新增功能

- ✨ TXT文件导入导出功能
- ✨ AI智能分析功能（剧情、角色、文风）
- ✨ 角色卡管理系统
- ✨ 智能续写功能
- ✨ 智能改写功能（三种强度）
- ✨ 全局Prompt配置
- ✨ API Key加密存储
- ✨ 深色主题UI
- ✨ 快捷键支持
- ✨ 使用说明弹窗
- ✨ 数据备份恢复
- ✨ 响应式布局
- ✨ 进度可视化
- ✨ 错误处理系统
- ✨ 性能优化模块

### 技术特性

- 📦 纯前端实现，无需后端
- 💾 本地存储，数据安全
- 🎨 TailwindCSS样式
- ⚡ ES6+ JavaScript
- 🔒 API密钥加密
- 📱 响应式设计

### 浏览器支持

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

### 已知问题

- 大文件处理可能较慢
- 部分浏览器可能不支持所有功能

### 下一步计划

- [ ] 支持更多文件格式
- [ ] 添加更多AI模型支持
- [ ] 优化大文件处理性能
- [ ] 添加协作功能

---

**版本**: v${this.version}
**发布日期**: ${new Date().toLocaleDateString('zh-CN')}
`
    }
    
    /**
     * 导出所有文档
     */
    exportAllDocuments() {
        const docs = this.generateAll()
        
        return {
            'README.md': docs.readme,
            'DEPLOYMENT.md': docs.deployment,
            'USER_MANUAL.md': docs.userManual,
            'API.md': docs.apiDoc,
            'CHANGELOG.md': docs.changelog
        }
    }
}

const documentationGenerator = new DocumentationGenerator()

export { DocumentationGenerator, documentationGenerator }
