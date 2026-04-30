import { storageManager, StorageKeys } from './storageManager.js'

export class ImportManager {
    constructor() {
        this.supportedTypes = [
            'chapter_analysis',
            'all_chapter_analyses',
            'full_analysis',
            'rewrite_reference',
            'novel_text'
        ]
    }
    
    async importFile(file) {
        const extension = file.name.split('.').pop().toLowerCase()
        
        switch (extension) {
            case 'json':
                return await this.importJSON(file)
            case 'txt':
                return await this.importTXT(file)
            case 'md':
                return await this.importMarkdown(file)
            default:
                throw new Error(`不支持的文件格式: ${extension}`)
        }
    }
    
    async importJSON(file) {
        const text = await file.text()
        
        try {
            const data = JSON.parse(text)
            
            if (!this.validateImportData(data)) {
                throw new Error('无效的导入数据格式')
            }
            
            return {
                success: true,
                type: data.exportType,
                data: data,
                filename: file.name
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    async importTXT(file) {
        const text = await file.text()
        
        return {
            success: true,
            type: 'novel_text',
            data: {
                filename: file.name,
                content: text,
                wordCount: text.length
            }
        }
    }
    
    async importMarkdown(file) {
        const text = await file.text()
        
        const parsed = this.parseMarkdown(text)
        
        return {
            success: true,
            type: 'markdown_analysis',
            data: parsed
        }
    }
    
    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            return false
        }
        
        if (data.exportType && !this.supportedTypes.includes(data.exportType)) {
            return false
        }
        
        return true
    }
    
    parseMarkdown(text) {
        const lines = text.split('\n')
        const result = {
            title: '',
            sections: []
        }
        
        let currentSection = null
        
        lines.forEach(line => {
            if (line.startsWith('# ')) {
                result.title = line.substring(2).trim()
            } else if (line.startsWith('## ')) {
                if (currentSection) {
                    result.sections.push(currentSection)
                }
                currentSection = {
                    title: line.substring(3).trim(),
                    content: []
                }
            } else if (currentSection && line.trim()) {
                currentSection.content.push(line.trim())
            }
        })
        
        if (currentSection) {
            result.sections.push(currentSection)
        }
        
        return result
    }
    
    mergeImportedData(existingData, importedData, strategy = 'merge') {
        switch (strategy) {
            case 'replace':
                return importedData
            case 'merge':
                return this.mergeData(existingData, importedData)
            case 'append':
                return this.appendData(existingData, importedData)
            default:
                return importedData
        }
    }
    
    mergeData(existing, imported) {
        if (!existing) return imported
        if (!imported) return existing
        
        if (Array.isArray(existing) && Array.isArray(imported)) {
            const existingIds = new Set(existing.map(item => item.id || item.chapterNum))
            const newItems = imported.filter(item => !existingIds.has(item.id || item.chapterNum))
            return [...existing, ...newItems]
        }
        
        if (typeof existing === 'object' && typeof imported === 'object') {
            return { ...existing, ...imported }
        }
        
        return imported
    }
    
    appendData(existing, imported) {
        if (!existing) return imported
        if (!imported) return existing
        
        if (Array.isArray(existing) && Array.isArray(imported)) {
            return [...existing, ...imported]
        }
        
        return imported
    }
    
    async importChapterAnalysis(data) {
        if (data.exportType !== 'chapter_analysis') {
            throw new Error('不是章节分析数据')
        }
        
        const chapterNum = data.chapterNum
        const analysisData = data.data
        
        storageManager.saveChapterAnalysis(chapterNum, analysisData)
        
        return {
            success: true,
            chapterNum: chapterNum,
            message: `第${chapterNum}章分析数据导入成功`
        }
    }
    
    async importAllChapterAnalyses(data) {
        if (data.exportType !== 'all_chapter_analyses') {
            throw new Error('不是全部章节分析数据')
        }
        
        const allAnalyses = data.data
        let importedCount = 0
        
        Object.entries(allAnalyses).forEach(([chapterNum, analysis]) => {
            storageManager.saveChapterAnalysis(chapterNum, analysis)
            importedCount++
        })
        
        return {
            success: true,
            importedCount: importedCount,
            message: `成功导入 ${importedCount} 章分析数据`
        }
    }
    
    async importFullAnalysis(data) {
        if (data.exportType !== 'full_analysis') {
            throw new Error('不是完整分析数据')
        }
        
        if (data.chapterAnalyses) {
            Object.entries(data.chapterAnalyses).forEach(([chapterNum, analysis]) => {
                storageManager.saveChapterAnalysis(chapterNum, analysis)
            })
        }
        
        if (data.overallAnalysis) {
            storageManager.saveOverallAnalysis(data.overallAnalysis)
        }
        
        return {
            success: true,
            chapterCount: data.chapterAnalyses ? Object.keys(data.chapterAnalyses).length : 0,
            hasOverallAnalysis: !!data.overallAnalysis,
            message: '完整分析数据导入成功'
        }
    }
    
    async importRewriteReference(data) {
        if (data.exportType !== 'rewrite_reference') {
            throw new Error('不是改写参考数据')
        }
        
        if (data.chapterAnalyses) {
            data.chapterAnalyses.forEach(analysis => {
                storageManager.saveChapterAnalysis(analysis.chapterNum, {
                    chapterNum: analysis.chapterNum,
                    title: analysis.title,
                    plotOverview: analysis.plotOverview,
                    characterInfo: analysis.characterInfo
                })
            })
        }
        
        return {
            success: true,
            message: '改写参考数据导入成功'
        }
    }
    
    async processImport(importResult) {
        if (!importResult.success) {
            return importResult
        }
        
        switch (importResult.type) {
            case 'chapter_analysis':
                return await this.importChapterAnalysis(importResult.data)
            case 'all_chapter_analyses':
                return await this.importAllChapterAnalyses(importResult.data)
            case 'full_analysis':
                return await this.importFullAnalysis(importResult.data)
            case 'rewrite_reference':
                return await this.importRewriteReference(importResult.data)
            case 'novel_text':
                return {
                    success: true,
                    type: 'novel_text',
                    data: importResult.data,
                    message: '小说文本导入成功，请进行章节拆分'
                }
            default:
                return {
                    success: false,
                    error: '未知的导入类型'
                }
        }
    }
    
    getImportPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            
            reader.onload = (e) => {
                try {
                    const text = e.target.result
                    
                    if (file.name.endsWith('.json')) {
                        const data = JSON.parse(text)
                        resolve({
                            type: data.exportType,
                            info: this.getImportInfo(data)
                        })
                    } else if (file.name.endsWith('.txt')) {
                        resolve({
                            type: 'novel_text',
                            info: {
                                filename: file.name,
                                wordCount: text.length,
                                lineCount: text.split('\n').length
                            }
                        })
                    } else {
                        reject(new Error('不支持的文件格式'))
                    }
                } catch (error) {
                    reject(error)
                }
            }
            
            reader.onerror = () => reject(new Error('文件读取失败'))
            reader.readAsText(file)
        })
    }
    
    getImportInfo(data) {
        switch (data.exportType) {
            case 'chapter_analysis':
                return {
                    chapterNum: data.chapterNum,
                    exportedAt: data.exportedAt
                }
            case 'all_chapter_analyses':
                return {
                    chapterCount: data.chapterCount,
                    exportedAt: data.exportedAt
                }
            case 'full_analysis':
                return {
                    novelTitle: data.novelInfo?.title,
                    totalChapters: data.novelInfo?.totalChapters,
                    totalWords: data.novelInfo?.totalWords,
                    exportedAt: data.exportedAt
                }
            default:
                return {
                    type: data.exportType,
                    exportedAt: data.exportedAt
                }
        }
    }
}

export const importManager = new ImportManager()
