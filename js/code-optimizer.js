/**
 * 代码优化工具模块
 * 提供代码分析、优化建议等功能
 */

/**
 * 代码优化器类
 */
class CodeOptimizer {
    constructor() {
        this.issues = []
        this.suggestions = []
    }
    
    /**
     * 分析代码
     */
    analyzeCode(code) {
        this.issues = []
        this.suggestions = []
        
        this.checkDuplicateCode(code)
        this.checkLongFunctions(code)
        this.checkComplexConditions(code)
        this.checkNamingConventions(code)
        this.checkComments(code)
        
        return {
            issues: this.issues,
            suggestions: this.suggestions,
            score: this.calculateScore()
        }
    }
    
    /**
     * 检查重复代码
     */
    checkDuplicateCode(code) {
        const lines = code.split('\n')
        const lineCounts = {}
        
        lines.forEach((line, index) => {
            const trimmed = line.trim()
            if (trimmed.length > 10) {
                if (!lineCounts[trimmed]) {
                    lineCounts[trimmed] = []
                }
                lineCounts[trimmed].push(index + 1)
            }
        })
        
        Object.entries(lineCounts).forEach(([line, occurrences]) => {
            if (occurrences.length > 2) {
                this.issues.push({
                    type: 'duplicate',
                    severity: 'warning',
                    message: `发现重复代码行（出现${occurrences.length}次）`,
                    line: occurrences[0],
                    details: `行号: ${occurrences.join(', ')}`
                })
                
                this.suggestions.push({
                    type: 'refactor',
                    message: '建议将重复代码提取为独立函数',
                    example: `function extractCommonLogic() {\n  ${line}\n}`
                })
            }
        })
    }
    
    /**
     * 检查过长函数
     */
    checkLongFunctions(code) {
        const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*\{/g
        let match
        
        while ((match = functionRegex.exec(code)) !== null) {
            const startIndex = match.index
            let braceCount = 1
            let endIndex = startIndex
            
            for (let i = startIndex + match[0].length; i < code.length; i++) {
                if (code[i] === '{') braceCount++
                if (code[i] === '}') braceCount--
                
                if (braceCount === 0) {
                    endIndex = i
                    break
                }
            }
            
            const functionBody = code.substring(startIndex, endIndex)
            const lineCount = functionBody.split('\n').length
            
            if (lineCount > 50) {
                const lineNumber = code.substring(0, startIndex).split('\n').length
                
                this.issues.push({
                    type: 'long-function',
                    severity: 'warning',
                    message: `函数"${match[1]}"过长（${lineCount}行）`,
                    line: lineNumber,
                    details: '建议拆分为多个小函数'
                })
                
                this.suggestions.push({
                    type: 'split',
                    message: `建议将函数"${match[1]}"拆分为多个小函数`,
                    example: `// 将${match[1]}拆分为:\n// - ${match[1]}Part1\n// - ${match[1]}Part2`
                })
            }
        }
    }
    
    /**
     * 检查复杂条件
     */
    checkComplexConditions(code) {
        const lines = code.split('\n')
        
        lines.forEach((line, index) => {
            const conditionMatch = line.match(/if\s*\(([^)]+)\)/)
            
            if (conditionMatch) {
                const condition = conditionMatch[1]
                const operatorCount = (condition.match(/&&|\|\|/g) || []).length
                
                if (operatorCount > 3) {
                    this.issues.push({
                        type: 'complex-condition',
                        severity: 'info',
                        message: `条件过于复杂（${operatorCount}个逻辑运算符）`,
                        line: index + 1,
                        details: condition
                    })
                    
                    this.suggestions.push({
                        type: 'simplify',
                        message: '建议简化复杂条件',
                        example: `const isValid = ${condition};\nif (isValid) { ... }`
                    })
                }
            }
        })
    }
    
    /**
     * 检查命名规范
     */
    checkNamingConventions(code) {
        const varRegex = /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
        const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
        let match
        
        while ((match = varRegex.exec(code)) !== null) {
            const name = match[1]
            
            if (name.length < 2 && name !== 'i' && name !== 'j' && name !== 'k') {
                this.issues.push({
                    type: 'naming',
                    severity: 'info',
                    message: `变量名"${name}"过短`,
                    details: '建议使用更具描述性的名称'
                })
            }
            
            if (name.length > 30) {
                this.issues.push({
                    type: 'naming',
                    severity: 'info',
                    message: `变量名"${name}"过长`,
                    details: '建议简化名称'
                })
            }
        }
        
        while ((match = funcRegex.exec(code)) !== null) {
            const name = match[1]
            
            if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
                this.issues.push({
                    type: 'naming',
                    severity: 'info',
                    message: `函数名"${name}"不符合驼峰命名规范`,
                    details: '建议使用小驼峰命名法'
                })
            }
        }
    }
    
    /**
     * 检查注释
     */
    checkComments(code) {
        const lines = code.split('\n')
        let codeLines = 0
        let commentLines = 0
        
        lines.forEach(line => {
            const trimmed = line.trim()
            
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                commentLines++
            } else if (trimmed.length > 0) {
                codeLines++
            }
        })
        
        const commentRatio = codeLines > 0 ? (commentLines / codeLines * 100) : 0
        
        if (commentRatio < 10) {
            this.issues.push({
                type: 'comments',
                severity: 'info',
                message: `注释比例过低（${commentRatio.toFixed(2)}%）`,
                details: '建议增加代码注释'
            })
            
            this.suggestions.push({
                type: 'document',
                message: '建议添加更多注释',
                example: '// 功能说明\n// 参数说明\n// 返回值说明'
            })
        }
    }
    
    /**
     * 计算代码质量分数
     */
    calculateScore() {
        let score = 100
        
        this.issues.forEach(issue => {
            switch (issue.severity) {
                case 'error':
                    score -= 10
                    break
                case 'warning':
                    score -= 5
                    break
                case 'info':
                    score -= 2
                    break
            }
        })
        
        return Math.max(0, score)
    }
    
    /**
     * 生成优化报告
     */
    generateReport(analysis) {
        return {
            summary: {
                score: analysis.score,
                totalIssues: analysis.issues.length,
                errorCount: analysis.issues.filter(i => i.severity === 'error').length,
                warningCount: analysis.issues.filter(i => i.severity === 'warning').length,
                infoCount: analysis.issues.filter(i => i.severity === 'info').length
            },
            issues: analysis.issues,
            suggestions: analysis.suggestions,
            timestamp: Date.now()
        }
    }
}

/**
 * 代码风格检查器
 */
class CodeStyleChecker {
    constructor() {
        this.rules = {
            indent: 4,
            maxLineLength: 120,
            semicolons: true,
            quotes: 'single',
            trailingComma: 'es5'
        }
    }
    
    /**
     * 检查代码风格
     */
    checkStyle(code) {
        const violations = []
        const lines = code.split('\n')
        
        lines.forEach((line, index) => {
            if (line.length > this.rules.maxLineLength) {
                violations.push({
                    rule: 'max-line-length',
                    line: index + 1,
                    message: `行长度超过${this.rules.maxLineLength}字符`
                })
            }
            
            if (line.includes('\t')) {
                violations.push({
                    rule: 'indent',
                    line: index + 1,
                    message: '使用Tab缩进，建议使用空格'
                })
            }
            
            if (this.rules.semicolons && !line.trim().endsWith(';') && 
                !line.trim().endsWith('{') && !line.trim().endsWith('}') &&
                !line.trim().endsWith(',') && line.trim().length > 0 &&
                !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                const isStatement = /^(var|let|const|return|throw|break|continue)/.test(line.trim())
                if (isStatement) {
                    violations.push({
                        rule: 'semicolon',
                        line: index + 1,
                        message: '缺少分号'
                    })
                }
            }
        })
        
        return violations
    }
    
    /**
     * 格式化代码
     */
    formatCode(code) {
        let formatted = code
        
        formatted = formatted.replace(/\t/g, ' '.repeat(this.rules.indent))
        
        formatted = formatted.replace(/"{/g, "'{")
        formatted = formatted.replace(/}"/g, "}'")
        formatted = formatted.replace(/:\s*"([^"]*)"/g, ": '$1'")
        
        return formatted
    }
}

/**
 * 代码压缩器
 */
class CodeMinifier {
    /**
     * 压缩JavaScript代码
     */
    minifyJs(code) {
        let minified = code
        
        minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
        minified = minified.replace(/\/\/.*$/gm, '')
        
        minified = minified.replace(/\s+/g, ' ')
        minified = minified.replace(/\s*([{};,:])\s*/g, '$1')
        minified = minified.replace(/;\s*}/g, '}')
        minified = minified.replace(/\{\s*/g, '{')
        minified = minified.replace(/\s*\}/g, '}')
        
        return minified.trim()
    }
    
    /**
     * 压缩CSS代码
     */
    minifyCss(code) {
        let minified = code
        
        minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
        minified = minified.replace(/\s+/g, ' ')
        minified = minified.replace(/\s*([{};:,])\s*/g, '$1')
        minified = minified.replace(/;}/g, '}')
        
        return minified.trim()
    }
    
    /**
     * 计算压缩率
     */
    calculateCompressionRatio(original, minified) {
        const originalSize = original.length
        const minifiedSize = minified.length
        const ratio = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2)
        
        return {
            originalSize,
            minifiedSize,
            savedBytes: originalSize - minifiedSize,
            ratio: `${ratio}%`
        }
    }
}

export { CodeOptimizer, CodeStyleChecker, CodeMinifier }
