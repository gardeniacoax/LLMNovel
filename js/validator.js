/**
 * 验证器模块
 * 本地程序，用户输入不存在内容限制
 */

/**
 * 输入框格式校验器
 */
class InputValidator {
    /**
     * 验证数字输入
     */
    static validateNumber(value, options = {}) {
        const { required = true } = options
        
        if (!value && required) {
            return { valid: false, message: '此项为必填项' }
        }
        
        if (!value && !required) {
            return { valid: true }
        }
        
        const num = Number(value)
        
        if (isNaN(num)) {
            return { valid: false, message: '请输入有效的数字' }
        }
        
        return { valid: true, value: num }
    }
    
    /**
     * 验证URL格式
     */
    static validateUrl(value, options = {}) {
        const { required = true } = options
        
        if (!value && required) {
            return { valid: false, message: '此项为必填项' }
        }
        
        if (!value && !required) {
            return { valid: true }
        }
        
        try {
            new URL(value)
            return { valid: true, value }
        } catch {
            return { valid: false, message: '请输入有效的URL' }
        }
    }
    
    /**
     * 验证必填项
     */
    static validateRequired(value, options = {}) {
        if (!value || value.trim() === '') {
            return { valid: false, message: '此项为必填项' }
        }
        
        return { valid: true, value }
    }
    
    /**
     * 验证邮箱格式
     */
    static validateEmail(value, options = {}) {
        const { required = true } = options
        
        if (!value && required) {
            return { valid: false, message: '此项为必填项' }
        }
        
        if (!value && !required) {
            return { valid: true }
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        
        if (!emailRegex.test(value)) {
            return { valid: false, message: '请输入有效的邮箱地址' }
        }
        
        return { valid: true, value }
    }
    
    /**
     * 验证API Key
     */
    static validateApiKey(value, options = {}) {
        const { required = true } = options
        
        if (!value && required) {
            return { valid: false, message: 'API Key不能为空' }
        }
        
        if (!value && !required) {
            return { valid: true }
        }
        
        return { valid: true, value }
    }
    
    /**
     * 验证文本（本地程序无长度限制）
     */
    static validateLength(value, options = {}) {
        const { required = false } = options
        
        if (!value && required) {
            return { valid: false, message: '此项为必填项' }
        }
        
        return { valid: true, value }
    }
    
    /**
     * 验证正则表达式
     */
    static validatePattern(value, pattern, options = {}) {
        const { required = true, message = '格式不正确' } = options
        
        if (!value && required) {
            return { valid: false, message: '此项为必填项' }
        }
        
        if (!value && !required) {
            return { valid: true }
        }
        
        if (!pattern.test(value)) {
            return { valid: false, message }
        }
        
        return { valid: true, value }
    }
    
    /**
     * 批量验证
     */
    static validateAll(validations) {
        const results = []
        let allValid = true
        
        for (const validation of validations) {
            const result = validation()
            results.push(result)
            
            if (!result.valid) {
                allValid = false
            }
        }
        
        return {
            valid: allValid,
            results
        }
    }
}

/**
 * 文件上传校验器
 */
class FileValidator {
    constructor() {
        this.allowedTypes = {
            txt: {
                extensions: ['.txt'],
                mimeTypes: ['text/plain'],
                maxSize: 20 * 1024 * 1024
            },
            json: {
                extensions: ['.json'],
                mimeTypes: ['application/json'],
                maxSize: 10 * 1024 * 1024
            }
        }
    }
    
    /**
     * 验证文件基本信息
     */
    validateFile(file, type = 'txt') {
        const config = this.allowedTypes[type]
        
        if (!config) {
            return { valid: false, message: '不支持的文件类型' }
        }
        
        const extension = '.' + file.name.split('.').pop().toLowerCase()
        if (!config.extensions.includes(extension)) {
            return {
                valid: false,
                message: `文件扩展名必须是 ${config.extensions.join(' 或 ')}`
            }
        }
        
        if (!config.mimeTypes.includes(file.type)) {
            return {
                valid: false,
                message: `文件类型必须是 ${config.mimeTypes.join(' 或 ')}`
            }
        }
        
        if (file.size > config.maxSize) {
            const maxSizeMB = (config.maxSize / 1024 / 1024).toFixed(0)
            return {
                valid: false,
                message: `文件大小不能超过 ${maxSizeMB}MB`
            }
        }
        
        if (file.size === 0) {
            return {
                valid: false,
                message: '文件不能为空'
            }
        }
        
        return { valid: true, file }
    }
    
    /**
     * 验证文件内容
     */
    async validateFileContent(file, type = 'txt') {
        return new Promise((resolve) => {
            const reader = new FileReader()
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result
                    
                    if (type === 'json') {
                        const data = JSON.parse(content)
                        
                        if (typeof data !== 'object') {
                            resolve({
                                valid: false,
                                message: 'JSON文件必须包含对象或数组'
                            })
                            return
                        }
                        
                        resolve({ valid: true, content, data })
                    } else {
                        if (content.trim().length === 0) {
                            resolve({
                                valid: false,
                                message: '文件内容不能为空'
                            })
                            return
                        }
                        
                        resolve({ valid: true, content })
                    }
                } catch (error) {
                    resolve({
                        valid: false,
                        message: `文件内容解析失败: ${error.message}`
                    })
                }
            }
            
            reader.onerror = () => {
                resolve({
                    valid: false,
                    message: '文件读取失败'
                })
            }
            
            reader.readAsText(file)
        })
    }
    
    /**
     * 验证多个文件
     */
    validateMultipleFiles(files, type = 'txt') {
        const results = []
        
        for (let i = 0; i < files.length; i++) {
            const result = this.validateFile(files[i], type)
            results.push({
                file: files[i],
                ...result
            })
        }
        
        const invalidFiles = results.filter(r => !r.valid)
        
        if (invalidFiles.length > 0) {
            return {
                valid: false,
                message: `${invalidFiles.length} 个文件验证失败`,
                results
            }
        }
        
        return { valid: true, results }
    }
    
    /**
     * 添加自定义文件类型
     */
    addFileType(type, config) {
        this.allowedTypes[type] = config
    }
    
    /**
     * 获取支持的文件类型
     */
    getSupportedTypes() {
        return Object.keys(this.allowedTypes)
    }
}

/**
 * API响应校验器
 */
class ApiResponseValidator {
    /**
     * 验证剧情分析数据
     */
    static validatePlotAnalysis(data) {
        const requiredFields = ['plotAnalysis']
        const errors = []
        
        requiredFields.forEach(field => {
            if (!data[field]) {
                errors.push(`缺少必需字段: ${field}`)
            }
        })
        
        if (errors.length > 0) {
            return { valid: false, errors }
        }
        
        const plot = data.plotAnalysis
        if (!plot.summary || !plot.chapters || !Array.isArray(plot.chapters)) {
            errors.push('plotAnalysis结构不完整')
        }
        
        if (plot.chapters) {
            plot.chapters.forEach((chapter, index) => {
                if (!chapter.chapterNum) {
                    errors.push(`第${index + 1}章缺少章节号`)
                }
                if (!chapter.summary) {
                    errors.push(`第${index + 1}章缺少摘要`)
                }
            })
        }
        
        return {
            valid: errors.length === 0,
            errors,
            data: errors.length === 0 ? data : null
        }
    }
    
    /**
     * 验证文风分析数据
     */
    static validateStyleAnalysis(data) {
        const requiredFields = ['styleAnalysis']
        const errors = []
        
        requiredFields.forEach(field => {
            if (!data[field]) {
                errors.push(`缺少必需字段: ${field}`)
            }
        })
        
        if (errors.length > 0) {
            return { valid: false, errors }
        }
        
        const style = data.styleAnalysis
        
        const requiredDimensions = ['sentencePatterns', 'vocabulary', 'rhythm', 'emotion']
        requiredDimensions.forEach(dim => {
            if (!style[dim]) {
                errors.push(`缺少文风分析维度: ${dim}`)
            }
        })
        
        return {
            valid: errors.length === 0,
            errors,
            data: errors.length === 0 ? data : null
        }
    }
    
    /**
     * 验证API响应结构
     */
    static validateApiResponse(response) {
        const errors = []
        
        if (!response.choices || !Array.isArray(response.choices)) {
            errors.push('API响应格式错误: 缺少choices字段')
            return { valid: false, errors }
        }
        
        if (response.choices.length === 0) {
            errors.push('API响应为空')
            return { valid: false, errors }
        }
        
        const choice = response.choices[0]
        
        if (!choice.message || !choice.message.content) {
            errors.push('API响应缺少内容')
            return { valid: false, errors }
        }
        
        return {
            valid: true,
            content: choice.message.content,
            errors: []
        }
    }
    
    /**
     * 验证JSON字符串
     */
    static validateJsonString(jsonString) {
        try {
            const data = JSON.parse(jsonString)
            return { valid: true, data }
        } catch (error) {
            return {
                valid: false,
                error: `JSON解析失败: ${error.message}`,
                position: this.findJsonErrorPosition(jsonString, error)
            }
        }
    }
    
    /**
     * 查找JSON错误位置
     */
    static findJsonErrorPosition(jsonString, error) {
        const match = error.message.match(/position (\d+)/)
        if (match) {
            const position = parseInt(match[1])
            const lines = jsonString.substring(0, position).split('\n')
            return {
                line: lines.length,
                column: lines[lines.length - 1].length + 1
            }
        }
        return null
    }
    
    /**
     * 验证续写结果
     */
    static validateContinueResult(data) {
        const errors = []
        
        if (!data.content || typeof data.content !== 'string') {
            errors.push('续写内容缺失或格式错误')
        }
        
        return {
            valid: errors.length === 0,
            errors,
            data: errors.length === 0 ? data : null
        }
    }
    
    /**
     * 验证改写结果
     */
    static validateRewriteResult(data) {
        const errors = []
        
        if (!data.content || typeof data.content !== 'string') {
            errors.push('改写内容缺失或格式错误')
        }
        
        return {
            valid: errors.length === 0,
            errors,
            data: errors.length === 0 ? data : null
        }
    }
}

export { InputValidator, FileValidator, ApiResponseValidator }
