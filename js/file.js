const FILE_CONSTRAINTS = {
    TXT_MAX_SIZE: 20 * 1024 * 1024,
    JSON_MAX_SIZE: 10 * 1024 * 1024,
    ALLOWED_TYPES: {
        txt: ['.txt'],
        json: ['.json']
    }
}

class FileHandler {
    static async importTxt(file) {
        this.validateFile(file, 'txt')
        
        const buffer = await file.arrayBuffer()
        const encoding = await this.detectEncoding(buffer)
        const decoder = new TextDecoder(encoding)
        const content = decoder.decode(buffer)
        
        return {
            content: content,
            filename: file.name,
            size: file.size,
            encoding: encoding
        }
    }
    
    static async detectEncoding(buffer) {
        const uint8Array = new Uint8Array(buffer)
        
        if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
            return 'utf-8'
        }
        
        if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
            return 'utf-16le'
        }
        
        if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
            return 'utf-16be'
        }
        
        let isGBK = true
        for (let i = 0; i < Math.min(uint8Array.length, 1000); i++) {
            const byte = uint8Array[i]
            if (byte > 0x7F) {
                if (i + 1 < uint8Array.length) {
                    const nextByte = uint8Array[i + 1]
                    if (!((byte >= 0x81 && byte <= 0xFE && nextByte >= 0x40 && nextByte <= 0xFE) ||
                          (byte >= 0xA1 && byte <= 0xF7 && nextByte >= 0xA1 && nextByte <= 0xFE))) {
                        isGBK = false
                        break
                    }
                    i++
                }
            }
        }
        
        return isGBK ? 'gbk' : 'utf-8'
    }
    
    static exportTxt(content, filename = 'export.txt') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        this.download(blob, filename)
    }
    
    static async importJson(file) {
        this.validateFile(file, 'json')
        
        const text = await file.text()
        
        try {
            const data = JSON.parse(text)
            return {
                data: data,
                filename: file.name,
                size: file.size
            }
        } catch (error) {
            throw new Error('JSON格式错误：' + error.message)
        }
    }
    
    static exportJson(data, filename = 'export.json') {
        const content = JSON.stringify(data, null, 2)
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
        this.download(blob, filename)
    }
    
    static validateFile(file, type) {
        const maxSize = type === 'txt' ? FILE_CONSTRAINTS.TXT_MAX_SIZE : FILE_CONSTRAINTS.JSON_MAX_SIZE
        const allowedExts = FILE_CONSTRAINTS.ALLOWED_TYPES[type]
        
        if (file.size > maxSize) {
            throw new Error(`文件过大，最大支持${maxSize / 1024 / 1024}MB`)
        }
        
        const ext = '.' + file.name.split('.').pop().toLowerCase()
        if (!allowedExts.includes(ext)) {
            throw new Error(`不支持的文件类型，仅支持${allowedExts.join(', ')}`)
        }
    }
    
    static download(blob, filename) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }
    
    static splitChapters(content) {
        const patterns = [
            /^第[一二三四五六七八九十百千万零\d]+章\s*.+$/gm,
            /^Chapter\s*\d+.*/gm,
            /^【第[一二三四五六七八九十百千万零\d]+章】.+$/gm
        ]
        
        let chapters = []
        
        for (const pattern of patterns) {
            const matches = [...content.matchAll(pattern)]
            if (matches.length > 0) {
                for (let i = 0; i < matches.length; i++) {
                    const start = matches[i].index
                    const end = i < matches.length - 1 ? matches[i + 1].index : content.length
                    chapters.push({
                        title: matches[i][0].trim(),
                        content: content.slice(start, end).trim(),
                        chapterNum: i + 1
                    })
                }
                break
            }
        }
        
        if (chapters.length === 0) {
            chapters.push({
                title: '全文',
                content: content,
                chapterNum: 1
            })
        }
        
        return chapters
    }
}

export { FileHandler, FILE_CONSTRAINTS }
