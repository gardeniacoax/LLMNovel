class UIHelper {
    static showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        }
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        }
        
        const toast = document.createElement('div')
        toast.className = `toast fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-slide-in`
        toast.innerHTML = `
            <span class="text-lg">${icons[type]}</span>
            <span>${message}</span>
        `
        
        const container = document.getElementById('toast-container')
        if (container) {
            container.appendChild(toast)
        } else {
            document.body.appendChild(toast)
        }
        
        setTimeout(() => {
            toast.classList.add('animate-slide-out')
            setTimeout(() => toast.remove(), 300)
        }, 3000)
    }
    
    static showConfirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div')
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay'
            modal.innerHTML = `
                <div class="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700 modal-content">
                    <h3 class="text-xl font-bold mb-2">${title}</h3>
                    <p class="text-slate-400 mb-6">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button class="btn btn-secondary cancel-btn">取消</button>
                        <button class="btn btn-primary confirm-btn">确定</button>
                    </div>
                </div>
            `
            
            document.body.appendChild(modal)
            
            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                modal.remove()
                resolve(false)
            })
            
            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                modal.remove()
                resolve(true)
            })
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove()
                    resolve(false)
                }
            })
        })
    }
    
    static createDropZone(options) {
        const { accept, onDrop, onError, hint = '拖拽文件到此处或点击上传' } = options
        
        const zone = document.createElement('div')
        zone.className = 'border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors'
        zone.innerHTML = `
            <svg class="w-12 h-12 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <p class="text-slate-400">${hint}</p>
            <p class="text-sm text-slate-500 mt-2">支持格式：${accept}</p>
        `
        
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = accept
        input.className = 'hidden'
        
        zone.addEventListener('click', () => input.click())
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
                await onDrop(file)
            } catch (error) {
                if (onError) onError(error)
            }
            
            input.value = ''
        })
        
        zone.addEventListener('dragover', (e) => {
            e.preventDefault()
            zone.classList.add('drop-zone-active')
        })
        
        zone.addEventListener('dragleave', (e) => {
            e.preventDefault()
            zone.classList.remove('drop-zone-active')
        })
        
        zone.addEventListener('drop', async (e) => {
            e.preventDefault()
            zone.classList.remove('drop-zone-active')
            
            const files = e.dataTransfer.files
            if (files.length === 0) return
            
            try {
                await onDrop(files[0])
            } catch (error) {
                if (onError) onError(error)
            }
        })
        
        zone.appendChild(input)
        
        return zone
    }
    
    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    static formatTime(seconds) {
        if (seconds < 60) {
            return Math.round(seconds) + '秒'
        } else if (seconds < 3600) {
            return Math.round(seconds / 60) + '分钟'
        } else {
            const hours = Math.floor(seconds / 3600)
            const minutes = Math.round((seconds % 3600) / 60)
            return hours + '小时' + minutes + '分钟'
        }
    }
}

export { UIHelper }
