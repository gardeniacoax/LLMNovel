/**
 * 测试报告生成器模块
 * 生成详细的测试报告
 */

/**
 * 测试报告生成器类
 */
class TestReportGenerator {
    constructor() {
        this.reports = []
    }
    
    /**
     * 生成测试报告
     */
    generate(testResults, options = {}) {
        const {
            title = '测试报告',
            version = '1.0.0',
            environment = 'development'
        } = options
        
        const report = {
            id: this.generateReportId(),
            title,
            version,
            environment,
            timestamp: Date.now(),
            date: new Date().toLocaleString('zh-CN'),
            stats: this.calculateStats(testResults),
            results: testResults,
            summary: this.generateSummary(testResults),
            recommendations: this.generateRecommendations(testResults)
        }
        
        this.reports.push(report)
        
        return report
    }
    
    /**
     * 生成报告ID
     */
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    /**
     * 计算统计数据
     */
    calculateStats(testResults) {
        const stats = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            passRate: 0,
            failRate: 0
        }
        
        testResults.forEach(result => {
            stats.total++
            stats.duration += result.duration || 0
            
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
            stats.failRate = ((stats.failed / stats.total) * 100).toFixed(2)
        }
        
        return stats
    }
    
    /**
     * 生成摘要
     */
    generateSummary(testResults) {
        const stats = this.calculateStats(testResults)
        
        let summary = `本次测试共执行 ${stats.total} 个测试用例，`
        summary += `其中 ${stats.passed} 个通过，${stats.failed} 个失败，${stats.skipped} 个跳过。`
        summary += `通过率为 ${stats.passRate}%，总耗时 ${stats.duration}ms。`
        
        if (stats.failed > 0) {
            summary += `\n\n失败的测试需要重点关注和修复。`
        }
        
        if (stats.passRate >= 90) {
            summary += `\n\n整体测试质量良好。`
        } else if (stats.passRate >= 70) {
            summary += `\n\n整体测试质量一般，需要改进。`
        } else {
            summary += `\n\n整体测试质量较差，需要重点改进。`
        }
        
        return summary
    }
    
    /**
     * 生成建议
     */
    generateRecommendations(testResults) {
        const recommendations = []
        const failedTests = testResults.filter(r => r.status === 'failed')
        
        if (failedTests.length > 0) {
            recommendations.push({
                type: 'critical',
                message: `发现 ${failedTests.length} 个失败的测试，建议优先修复`,
                tests: failedTests.map(t => `${t.suite}: ${t.test}`)
            })
        }
        
        const slowTests = testResults.filter(r => (r.duration || 0) > 1000)
        if (slowTests.length > 0) {
            recommendations.push({
                type: 'performance',
                message: `发现 ${slowTests.length} 个耗时较长的测试，建议优化`,
                tests: slowTests.map(t => `${t.suite}: ${t.test} (${t.duration}ms)`)
            })
        }
        
        const errorTypes = {}
        failedTests.forEach(t => {
            if (t.error) {
                const errorType = t.error.split('\n')[0]
                errorTypes[errorType] = (errorTypes[errorType] || 0) + 1
            }
        })
        
        Object.entries(errorTypes).forEach(([errorType, count]) => {
            if (count > 1) {
                recommendations.push({
                    type: 'pattern',
                    message: `发现重复的错误模式: "${errorType}" (${count}次)`,
                    suggestion: '建议检查相关代码逻辑'
                })
            }
        })
        
        return recommendations
    }
    
    /**
     * 生成HTML报告
     */
    generateHtmlReport(report) {
        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #eee;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            padding: 30px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .header .meta {
            color: #888;
            font-size: 14px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-number {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .stat-label {
            color: #888;
            font-size: 14px;
        }
        
        .passed { color: #22c55e; }
        .failed { color: #ef4444; }
        .skipped { color: #f59e0b; }
        .total { color: #3b82f6; }
        
        .summary {
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .summary h2 {
            margin-bottom: 15px;
            color: #3b82f6;
        }
        
        .summary p {
            line-height: 1.8;
            color: #ccc;
        }
        
        .recommendations {
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .recommendations h2 {
            margin-bottom: 15px;
            color: #f59e0b;
        }
        
        .recommendation {
            padding: 15px;
            margin-bottom: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
        }
        
        .recommendation.critical {
            border-left-color: #ef4444;
        }
        
        .recommendation.performance {
            border-left-color: #3b82f6;
        }
        
        .recommendation h3 {
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .recommendation ul {
            list-style: none;
            padding-left: 15px;
        }
        
        .recommendation li {
            padding: 5px 0;
            font-size: 13px;
            color: #aaa;
        }
        
        .test-results {
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .test-results h2 {
            margin-bottom: 20px;
            color: #3b82f6;
        }
        
        .suite {
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .suite-header {
            padding: 15px 20px;
            background: rgba(0, 0, 0, 0.3);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .suite-header h3 {
            font-size: 16px;
        }
        
        .suite-stats {
            font-size: 14px;
            color: #888;
        }
        
        .suite-tests {
            padding: 15px;
        }
        
        .test-item {
            padding: 12px 15px;
            margin-bottom: 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .test-item:last-child {
            margin-bottom: 0;
        }
        
        .test-name {
            display: flex;
            align-items: center;
        }
        
        .test-icon {
            margin-right: 10px;
            font-size: 18px;
        }
        
        .test-duration {
            color: #888;
            font-size: 12px;
        }
        
        .test-error {
            margin-top: 10px;
            padding: 10px;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 4px;
            color: #ff6b6b;
            font-family: 'Consolas', monospace;
            font-size: 12px;
            white-space: pre-wrap;
            word-break: break-all;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 20px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #22c55e, #3b82f6);
            transition: width 0.5s ease;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 ${report.title}</h1>
            <div class="meta">
                <span>版本: ${report.version}</span>
                <span> | </span>
                <span>环境: ${report.environment}</span>
                <span> | </span>
                <span>生成时间: ${report.date}</span>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number total">${report.stats.total}</div>
                <div class="stat-label">总计</div>
            </div>
            <div class="stat-card">
                <div class="stat-number passed">${report.stats.passed}</div>
                <div class="stat-label">通过</div>
            </div>
            <div class="stat-card">
                <div class="stat-number failed">${report.stats.failed}</div>
                <div class="stat-label">失败</div>
            </div>
            <div class="stat-card">
                <div class="stat-number skipped">${report.stats.skipped}</div>
                <div class="stat-label">跳过</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.stats.passRate}%</div>
                <div class="stat-label">通过率</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.stats.duration}ms</div>
                <div class="stat-label">总耗时</div>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${report.stats.passRate}%"></div>
        </div>
        
        <div class="summary">
            <h2>📝 测试摘要</h2>
            <p>${report.summary.replace(/\n/g, '<br>')}</p>
        </div>
        
        ${report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>💡 改进建议</h2>
                ${report.recommendations.map(rec => `
                    <div class="recommendation ${rec.type}">
                        <h3>${rec.message}</h3>
                        ${rec.tests ? `
                            <ul>
                                ${rec.tests.map(t => `<li>• ${t}</li>`).join('')}
                            </ul>
                        ` : ''}
                        ${rec.suggestion ? `<p style="margin-top: 8px; color: #888;">${rec.suggestion}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="test-results">
            <h2>📋 测试结果详情</h2>
            ${this.groupBySuite(report.results).map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        <h3>📦 ${suite.name}</h3>
                        <div class="suite-stats">
                            <span class="passed">✓ ${suite.passed}</span>
                            <span class="failed">✗ ${suite.failed}</span>
                            <span class="skipped">○ ${suite.skipped}</span>
                        </div>
                    </div>
                    <div class="suite-tests">
                        ${suite.tests.map(test => `
                            <div class="test-item">
                                <div class="test-name">
                                    <span class="test-icon">
                                        ${test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️'}
                                    </span>
                                    <span>${test.test}</span>
                                </div>
                                <div class="test-duration">${test.duration || 0}ms</div>
                            </div>
                            ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>测试报告由自动化测试系统生成</p>
            <p>报告ID: ${report.id}</p>
        </div>
    </div>
    
    <script>
        document.querySelectorAll('.suite-header').forEach(header => {
            header.addEventListener('click', () => {
                const tests = header.nextElementSibling
                tests.style.display = tests.style.display === 'none' ? 'block' : 'none'
            })
        })
    </script>
</body>
</html>
        `
        
        return html
    }
    
    /**
     * 按套件分组
     */
    groupBySuite(results) {
        const suites = {}
        
        results.forEach(result => {
            if (!suites[result.suite]) {
                suites[result.suite] = {
                    name: result.suite,
                    tests: [],
                    passed: 0,
                    failed: 0,
                    skipped: 0
                }
            }
            
            suites[result.suite].tests.push(result)
            
            switch (result.status) {
                case 'passed':
                    suites[result.suite].passed++
                    break
                case 'failed':
                    suites[result.suite].failed++
                    break
                case 'skipped':
                    suites[result.suite].skipped++
                    break
            }
        })
        
        return Object.values(suites)
    }
    
    /**
     * 生成JSON报告
     */
    generateJsonReport(report) {
        return JSON.stringify(report, null, 2)
    }
    
    /**
     * 保存报告到文件
     */
    saveReport(report, format = 'html') {
        const content = format === 'html' 
            ? this.generateHtmlReport(report)
            : this.generateJsonReport(report)
        
        const blob = new Blob([content], {
            type: format === 'html' ? 'text/html' : 'application/json'
        })
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `test-report-${Date.now()}.${format}`
        a.click()
        URL.revokeObjectURL(url)
    }
    
    /**
     * 获取所有报告
     */
    getReports() {
        return this.reports
    }
    
    /**
     * 获取最新报告
     */
    getLatestReport() {
        return this.reports[this.reports.length - 1]
    }
}

export { TestReportGenerator }
