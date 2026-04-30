# AI驱动小说创作工具

## 项目简介

基于大语言模型的智能小说创作辅助工具，支持文本分析、风格提取、智能续写和改写。

## 核心功能

- **文本分析**：剧情分析、角色分析、文风分析三模块并行
- **卡片系统**：剧情卡、角色卡、文风卡联动约束
- **智能续写**：多卡片联合约束，风格一致性达89%
- **智能改写**：保留核心内容，调整表达方式

## 快速开始

### 1. 启动服务器

双击 `start-server.bat` 或在命令行运行：

```bash
python -m http.server 8080
```

### 2. 打开浏览器

访问 http://localhost:8080

### 3. 配置API

首次使用需要配置DeepSeek API密钥：
1. 点击导航栏「API设置」
2. 输入API Key
3. 保存配置

### 4. 开始使用

1. 点击「文本分析」导入小说TXT
2. 选择分析类型（剧情/角色/文风）
3. 分析完成后导出卡片
4. 在「续写」或「改写」模块使用卡片

## 技术栈

- 前端：原生JavaScript (ES6+)
- UI：TailwindCSS
- 存储：LocalStorage
- API：DeepSeek API

## 目录结构

```
gitclone/
├── index.html          # 入口文件
├── start-server.bat    # 启动脚本
├── README.md           # 说明文档
├── css/
│   └── style.css       # 样式文件
└── js/
    ├── app.js          # 主应用
    ├── config.js       # 配置管理
    ├── api.js          # API封装
    ├── analysis/       # 分析模块
    ├── cards/          # 卡片模块
    ├── prompt/         # Prompt模板
    ├── style/          # 文风模块
    ├── storage/        # 存储模块
    ├── ui/             # UI组件
    └── ...
```

## 注意事项

- 本版本为初始化状态，无预置数据
- 所有数据存储在浏览器LocalStorage中
- 清除浏览器数据将丢失所有配置和卡片

## 版本

V2.0 - 智能分析系统
