class WordCountValidator {
    static countWords(text) {
        if (!text) return 0
        
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
        const numbers = (text.match(/\d+/g) || []).length
        
        return chineseChars + englishWords + numbers
    }
    
    static validateRewrite(content, settings, originalWordCount) {
        const actualWordCount = this.countWords(content)
        
        let expectedRange
        let isValid
        
        switch (settings.mode) {
            case 'ratio':
                expectedRange = {
                    min: Math.floor(originalWordCount * settings.ratio.minRatio),
                    max: Math.ceil(originalWordCount * settings.ratio.maxRatio)
                }
                break
                
            case 'absolute':
                expectedRange = {
                    min: settings.absolute.minWords,
                    max: settings.absolute.maxWords
                }
                break
                
            case 'reference':
                expectedRange = {
                    min: Math.floor(originalWordCount * (1 - settings.reference.tolerance)),
                    max: Math.ceil(originalWordCount * (1 + settings.reference.tolerance))
                }
                break
                
            default:
                expectedRange = {
                    min: Math.floor(originalWordCount * 0.8),
                    max: Math.ceil(originalWordCount * 1.2)
                }
        }
        
        isValid = actualWordCount >= expectedRange.min && actualWordCount <= expectedRange.max
        
        const midpoint = (expectedRange.min + expectedRange.max) / 2
        const deviation = actualWordCount - midpoint
        const deviationPercent = midpoint > 0 ? Math.round((deviation / midpoint) * 100) : 0
        
        return {
            isValid,
            actualWordCount,
            expectedRange,
            deviation,
            deviationPercent,
            originalWordCount,
            status: this.getStatus(isValid, actualWordCount, expectedRange)
        }
    }
    
    static validateContinue(content, settings) {
        const actualWordCount = this.countWords(content)
        
        const expectedRange = {
            min: settings.minWords,
            max: settings.maxWords
        }
        
        const isValid = actualWordCount >= expectedRange.min && actualWordCount <= expectedRange.max
        const targetWords = settings.targetWords
        const deviation = actualWordCount - targetWords
        const deviationPercent = targetWords > 0 ? Math.round((deviation / targetWords) * 100) : 0
        
        return {
            isValid,
            actualWordCount,
            expectedRange,
            targetWords,
            deviation,
            deviationPercent,
            status: this.getStatus(isValid, actualWordCount, expectedRange)
        }
    }
    
    static getStatus(isValid, actual, range) {
        if (isValid) {
            return 'success'
        }
        
        if (actual < range.min) {
            return 'under'
        }
        
        if (actual > range.max) {
            return 'over'
        }
        
        return 'unknown'
    }
    
    static validateBatch(chapters, settings, mode = 'rewrite') {
        const results = []
        let totalValid = 0
        let totalInvalid = 0
        
        for (const chapter of chapters) {
            let result
            
            if (mode === 'rewrite') {
                result = this.validateRewrite(
                    chapter.rewriteContent || chapter.content,
                    settings,
                    chapter.originalWordCount || chapter.wordCount
                )
            } else {
                result = this.validateContinue(
                    chapter.content,
                    settings
                )
            }
            
            result.chapterNum = chapter.chapterNum
            result.title = chapter.title || `第${chapter.chapterNum}章`
            
            if (result.isValid) {
                totalValid++
            } else {
                totalInvalid++
            }
            
            results.push(result)
        }
        
        return {
            results,
            totalValid,
            totalInvalid,
            totalChapters: chapters.length,
            validRate: chapters.length > 0 ? Math.round((totalValid / chapters.length) * 100) : 0
        }
    }
    
    static getValidationMessage(result) {
        if (result.isValid) {
            return `字数达标：${result.actualWordCount}字（范围：${result.expectedRange.min}-${result.expectedRange.max}字）`
        }
        
        if (result.status === 'under') {
            const shortage = result.expectedRange.min - result.actualWordCount
            return `字数不足：${result.actualWordCount}字，还差${shortage}字（最少需要${result.expectedRange.min}字）`
        }
        
        if (result.status === 'over') {
            const excess = result.actualWordCount - result.expectedRange.max
            return `字数超标：${result.actualWordCount}字，超出${excess}字（最多允许${result.expectedRange.max}字）`
        }
        
        return '字数验证异常'
    }
    
    static formatWordCount(count) {
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万字'
        }
        return count.toLocaleString() + '字'
    }
    
    static calculateRatio(actual, original) {
        if (!original || original === 0) return 0
        return Math.round((actual / original) * 100)
    }
    
    static estimateReadingTime(wordCount, wordsPerMinute = 300) {
        const minutes = Math.ceil(wordCount / wordsPerMinute)
        
        if (minutes < 60) {
            return `${minutes}分钟`
        }
        
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        
        if (remainingMinutes === 0) {
            return `${hours}小时`
        }
        
        return `${hours}小时${remainingMinutes}分钟`
    }
}

export { WordCountValidator }
