export class ExportManager {
    constructor() {
        this.version = '2.0'
    }
    
    exportChapterAnalysis(chapterNum, analysisData) {
        const exportData = {
            exportType: 'chapter_analysis',
            exportVersion: this.version,
            exportedAt: new Date().toISOString(),
            chapterNum: chapterNum,
            data: analysisData
        }
        
        return exportData
    }
    
    exportAllChapterAnalyses(allAnalyses) {
        const exportData = {
            exportType: 'all_chapter_analyses',
            exportVersion: this.version,
            exportedAt: new Date().toISOString(),
            chapterCount: Object.keys(allAnalyses).length,
            data: allAnalyses
        }
        
        return exportData
    }
    
    exportFullAnalysis(chapterAnalyses, overallAnalysis, novelInfo) {
        const exportData = {
            exportType: 'full_analysis',
            exportVersion: this.version,
            exportedAt: new Date().toISOString(),
            novelInfo: {
                title: novelInfo.title || '未知小说',
                totalChapters: novelInfo.totalChapters || 0,
                totalWords: novelInfo.totalWords || 0
            },
            chapterAnalyses: chapterAnalyses,
            overallAnalysis: overallAnalysis
        }
        
        return exportData
    }
    
    exportForRewrite(chapterAnalyses, styleGuide, overallPlot, characters) {
        const exportData = {
            exportType: 'rewrite_reference',
            exportVersion: this.version,
            exportedAt: new Date().toISOString(),
            chapterAnalyses: chapterAnalyses.map(analysis => ({
                chapterNum: analysis.chapterNum,
                title: analysis.title,
                plotOverview: analysis.plotOverview,
                characterInfo: analysis.characterInfo
            })),
            styleGuide: styleGuide,
            overallPlot: overallPlot,
            characters: characters
        }
        
        return exportData
    }
    
    exportAsJSON(data) {
        const jsonString = JSON.stringify(data, null, 2)
        return new Blob([jsonString], { type: 'application/json' })
    }
    
    exportAsMarkdown(analysisData, type) {
        let markdown = ''
        
        switch (type) {
            case 'chapter':
                markdown = this.chapterToMarkdown(analysisData)
                break
            case 'overall':
                markdown = this.overallToMarkdown(analysisData)
                break
            case 'full':
                markdown = this.fullToMarkdown(analysisData)
                break
        }
        
        return new Blob([markdown], { type: 'text/markdown' })
    }
    
    chapterToMarkdown(data) {
        const analysis = data.data
        let md = `# 第${analysis.chapterNum}章分析报告\n\n`
        md += `> 导出时间：${data.exportedAt}\n\n`
        
        if (analysis.analysisResult) {
            const result = analysis.analysisResult
            
            md += `## 章节主旨\n\n${result.summary || '暂无'}\n\n`
            
            md += `## 关键情节\n\n`
            if (result.key_events && result.key_events.length > 0) {
                result.key_events.forEach((event, i) => {
                    md += `${i + 1}. ${event}\n`
                })
            } else {
                md += '暂无\n'
            }
            md += '\n'
            
            md += `## 角色表现\n\n`
            if (result.character_performances && result.character_performances.length > 0) {
                result.character_performances.forEach(char => {
                    md += `### ${char.name}\n`
                    if (char.speech) md += `- **语言**：${char.speech}\n`
                    if (char.body_language) md += `- **动作**：${char.body_language}\n`
                    if (char.clothing_change) md += `- **衣着**：${char.clothing_change}\n`
                    md += '\n'
                })
            } else {
                md += '暂无\n\n'
            }
            
            md += `## 章节作用\n\n${(result.chapter_function || []).join('、') || '暂无'}\n`
        }
        
        return md
    }
    
    overallToMarkdown(data) {
        const analysis = data.overallAnalysis
        let md = `# 整体分析报告\n\n`
        md += `> 导出时间：${data.exportedAt}\n\n`
        
        if (analysis.plotAnalysis) {
            const plot = analysis.plotAnalysis
            
            md += `## 剧情概览\n\n`
            if (plot.plot_overview) {
                md += `- **开端**：${plot.plot_overview.opening || '暂无'}\n`
                md += `- **发展**：${plot.plot_overview.development || '暂无'}\n`
                md += `- **高潮**：${plot.plot_overview.climax || '暂无'}\n`
                md += `- **当前进度**：${plot.plot_overview.current_progress || '暂无'}\n\n`
            }
            
            md += `## 核心冲突\n\n`
            if (plot.core_conflicts) {
                if (plot.core_conflicts.internal && plot.core_conflicts.internal.length > 0) {
                    md += `### 内在冲突\n`
                    plot.core_conflicts.internal.forEach(c => {
                        md += `- ${c.character}：${c.conflict}\n`
                    })
                    md += '\n'
                }
                if (plot.core_conflicts.external && plot.core_conflicts.external.length > 0) {
                    md += `### 外在冲突\n`
                    plot.core_conflicts.external.forEach(c => {
                        md += `- ${c.parties?.join(' vs ')}：${c.description}\n`
                    })
                    md += '\n'
                }
            }
        }
        
        if (analysis.styleAnalysis) {
            const style = analysis.styleAnalysis
            
            md += `## 文风分析\n\n`
            md += `**总体风格**：${style.style_overview || '暂无'}\n\n`
            
            if (style.mandatory_rules && style.mandatory_rules.length > 0) {
                md += `### 必须遵守\n`
                style.mandatory_rules.forEach(rule => {
                    md += `- ${rule}\n`
                })
                md += '\n'
            }
        }
        
        return md
    }
    
    fullToMarkdown(data) {
        let md = `# ${data.novelInfo.title} - 完整分析报告\n\n`
        md += `> 导出时间：${data.exportedAt}\n`
        md += `> 总章节数：${data.novelInfo.totalChapters}\n`
        md += `> 总字数：${data.novelInfo.totalWords}\n\n`
        
        md += `---\n\n`
        
        md += `## 整体分析\n\n`
        md += this.overallToMarkdown(data)
        
        md += `---\n\n`
        
        md += `## 章节分析\n\n`
        
        Object.values(data.chapterAnalyses).forEach(analysis => {
            md += `### 第${analysis.chapterNum}章 ${analysis.title}\n\n`
            if (analysis.analysisResult) {
                md += `**主旨**：${analysis.analysisResult.summary || '暂无'}\n\n`
                md += `**关键情节**：${(analysis.analysisResult.key_events || []).join('；') || '暂无'}\n\n`
            }
        })
        
        return md
    }
    
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }
    
    generateFilename(type, chapterNum = null, novelTitle = '') {
        const date = new Date().toISOString().split('T')[0]
        const title = novelTitle ? `_${novelTitle}` : ''
        
        switch (type) {
            case 'chapter':
                return `第${chapterNum}章分析_${date}.json`
            case 'all_chapters':
                return `全部章节分析${title}_${date}.json`
            case 'full':
                return `完整分析报告${title}_${date}.json`
            case 'rewrite':
                return `改写参考数据_${date}.json`
            case 'markdown':
                return `分析报告${title}_${date}.md`
            default:
                return `导出数据_${date}.json`
        }
    }
    
    exportToCSV(chapterAnalyses) {
        const headers = ['章节号', '标题', '字数', '主旨', '关键情节', '分析时间']
        const rows = [headers.join(',')]
        
        Object.values(chapterAnalyses).forEach(analysis => {
            const row = [
                analysis.chapterNum,
                `"${(analysis.title || '').replace(/"/g, '""')}"`,
                analysis.wordCount || 0,
                `"${(analysis.analysisResult?.summary || '').replace(/"/g, '""')}"`,
                `"${(analysis.analysisResult?.key_events || []).join('；').replace(/"/g, '""')}"`,
                analysis.analyzedAt || ''
            ]
            rows.push(row.join(','))
        })
        
        const csv = rows.join('\n')
        return new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    }
}

export const exportManager = new ExportManager()
