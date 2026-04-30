import { StyleCardManager } from './style-card-manager.js'
import { modal } from '../modal.js'

class StyleImportExport {
    static exportCardToFile(cardId) {
        const card = StyleCardManager.getCard(cardId)
        if (!card) {
            modal.alert('文风卡不存在', { title: '错误', type: 'error' })
            return false
        }
        
        const jsonString = StyleCardManager.exportCard(cardId)
        if (!jsonString) {
            modal.alert('导出失败', { title: '错误', type: 'error' })
            return false
        }
        
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `${card.name.replace(/[\\/:*?"<>|]/g, '_')}_文风卡.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        return true
    }
    
    static exportAllCardsToFile() {
        const jsonString = StyleCardManager.exportAllCards()
        if (!jsonString) {
            modal.alert('没有可导出的文风卡', { title: '提示', type: 'warning' })
            return false
        }
        
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const timestamp = new Date().toISOString().slice(0, 10)
        const a = document.createElement('a')
        a.href = url
        a.download = `文风卡库_${timestamp}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        return true
    }
    
    static showImportDialog(onSuccess) {
        const content = `
            <div class="space-y-4">
                <div class="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors" id="import-drop-zone">
                    <svg class="w-12 h-12 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p class="text-slate-400">拖拽文件到此处或点击上传</p>
                    <p class="text-sm text-slate-500 mt-2">支持格式：.json</p>
                </div>
                <input type="file" id="import-file-input" accept=".json" class="hidden">
                <div id="import-preview" class="hidden">
                    <h4 class="text-white font-medium mb-2">预览</h4>
                    <div id="import-preview-content" class="bg-slate-700 rounded-lg p-4 max-h-48 overflow-auto"></div>
                </div>
            </div>
        `
        
        const importModal = modal.show({
            title: '导入文风卡',
            content,
            width: 'max-w-lg',
            footer: `
                <button class="btn btn-secondary modal-cancel">取消</button>
                <button class="btn btn-primary modal-confirm" id="btn-confirm-import" disabled>确认导入</button>
            `
        })
        
        let pendingData = null
        
        const dropZone = importModal.querySelector('#import-drop-zone')
        const fileInput = importModal.querySelector('#import-file-input')
        const preview = importModal.querySelector('#import-preview')
        const previewContent = importModal.querySelector('#import-preview-content')
        const confirmBtn = importModal.querySelector('#btn-confirm-import')
        const cancelBtn = importModal.querySelector('.modal-cancel')
        
        dropZone.addEventListener('click', () => fileInput.click())
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault()
            dropZone.classList.add('border-blue-500')
        })
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault()
            dropZone.classList.remove('border-blue-500')
        })
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault()
            dropZone.classList.remove('border-blue-500')
            const files = e.dataTransfer.files
            if (files.length > 0) {
                this.handleFileSelect(files[0], preview, previewContent, confirmBtn, (data) => {
                    pendingData = data
                })
            }
        })
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0]
            if (file) {
                this.handleFileSelect(file, preview, previewContent, confirmBtn, (data) => {
                    pendingData = data
                })
            }
        })
        
        confirmBtn.addEventListener('click', () => {
            if (pendingData) {
                const result = this.importData(pendingData)
                if (result.success) {
                    modal.close(importModal)
                    if (onSuccess) {
                        onSuccess(result.card || result.cards)
                    }
                } else {
                    modal.alert(result.error, { title: '导入失败', type: 'error' })
                }
            }
        })
        
        cancelBtn.addEventListener('click', () => {
            modal.close(importModal)
        })
    }
    
    static handleFileSelect(file, preview, previewContent, confirmBtn, setData) {
        if (!file.name.endsWith('.json')) {
            modal.alert('请选择JSON文件', { title: '格式错误', type: 'warning' })
            return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result)
                
                if (data.cards && Array.isArray(data.cards)) {
                    previewContent.innerHTML = `
                        <p class="text-slate-300 mb-2">检测到文风卡集合，共 ${data.cards.length} 张：</p>
                        <ul class="list-disc list-inside text-slate-400 text-sm">
                            ${data.cards.slice(0, 5).map(c => `<li>${c.name} - ${c.author || '未知作者'}</li>`).join('')}
                            ${data.cards.length > 5 ? `<li>... 还有 ${data.cards.length - 5} 张</li>` : ''}
                        </ul>
                    `
                    setData({ type: 'collection', data: data })
                } else if (data.style) {
                    previewContent.innerHTML = `
                        <p class="text-slate-300 mb-2">检测到单张文风卡：</p>
                        <div class="text-slate-400 text-sm">
                            <p><strong>名称：</strong>${data.name}</p>
                            <p><strong>作者：</strong>${data.author || '未知作者'}</p>
                            <p><strong>概述：</strong>${data.style?.style_overview || '无'}</p>
                        </div>
                    `
                    setData({ type: 'single', data: data })
                } else {
                    throw new Error('无法识别的文件格式')
                }
                
                preview.classList.remove('hidden')
                confirmBtn.disabled = false
            } catch (error) {
                modal.alert(`文件解析失败：${error.message}`, { title: '错误', type: 'error' })
                preview.classList.add('hidden')
                confirmBtn.disabled = true
            }
        }
        reader.readAsText(file)
    }
    
    static importData(pendingData) {
        try {
            if (pendingData.type === 'single') {
                const card = StyleCardManager.importCard(JSON.stringify(pendingData.data))
                if (card) {
                    return { success: true, card }
                } else {
                    return { success: false, error: '导入失败，请检查文件格式' }
                }
            } else if (pendingData.type === 'collection') {
                const cards = StyleCardManager.importMultipleCards(JSON.stringify(pendingData.data))
                if (cards.length > 0) {
                    return { success: true, cards }
                } else {
                    return { success: false, error: '导入失败，没有有效的文风卡' }
                }
            }
            return { success: false, error: '未知的数据类型' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }
    
    static async importFromClipboard() {
        try {
            const text = await navigator.clipboard.readText()
            const data = JSON.parse(text)
            
            if (data.style) {
                const card = StyleCardManager.importCard(text)
                if (card) {
                    return { success: true, card }
                }
            } else if (data.cards) {
                const cards = StyleCardManager.importMultipleCards(text)
                if (cards.length > 0) {
                    return { success: true, cards }
                }
            }
            
            return { success: false, error: '剪贴板内容不是有效的文风卡数据' }
        } catch (error) {
            return { success: false, error: '无法读取剪贴板或解析失败' }
        }
    }
    
    static async exportToClipboard(cardId) {
        const jsonString = StyleCardManager.exportCard(cardId)
        if (!jsonString) {
            modal.alert('导出失败', { title: '错误', type: 'error' })
            return false
        }
        
        try {
            await navigator.clipboard.writeText(jsonString)
            modal.alert('文风卡已复制到剪贴板', { title: '成功', type: 'success' })
            return true
        } catch (error) {
            modal.alert('复制到剪贴板失败', { title: '错误', type: 'error' })
            return false
        }
    }
    
    static validateImportFile(file) {
        return new Promise((resolve) => {
            if (!file.name.endsWith('.json')) {
                resolve({ valid: false, error: '文件格式错误，请选择JSON文件' })
                return
            }
            
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result)
                    
                    if (data.cards && Array.isArray(data.cards)) {
                        const invalidCards = data.cards.filter(c => !c.style || !c.name)
                        if (invalidCards.length > 0) {
                            resolve({ valid: false, error: '部分文风卡数据格式无效' })
                        } else {
                            resolve({ valid: true, type: 'collection', count: data.cards.length })
                        }
                    } else if (data.style && data.name) {
                        resolve({ valid: true, type: 'single', count: 1 })
                    } else {
                        resolve({ valid: false, error: '无法识别的文风卡格式' })
                    }
                } catch (error) {
                    resolve({ valid: false, error: 'JSON解析失败' })
                }
            }
            reader.onerror = () => {
                resolve({ valid: false, error: '文件读取失败' })
            }
            reader.readAsText(file)
        })
    }
}

export { StyleImportExport }
