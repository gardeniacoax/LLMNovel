/**
 * 动画效果管理模块
 * 提供各种动画效果和过渡功能
 */

/**
 * 动画管理器
 */
class AnimationManager {
    /**
     * 渐入动画
     */
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0'
        element.style.display = 'block'
        
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const opacity = Math.min(progress / duration, 1)
            
            element.style.opacity = opacity
            
            if (progress < duration) {
                requestAnimationFrame(animate)
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 渐出动画
     */
    static fadeOut(element, duration = 300) {
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const opacity = 1 - Math.min(progress / duration, 1)
            
            element.style.opacity = opacity
            
            if (progress < duration) {
                requestAnimationFrame(animate)
            } else {
                element.style.display = 'none'
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 向下滑入动画
     */
    static slideDown(element, duration = 300) {
        element.style.maxHeight = '0'
        element.style.overflow = 'hidden'
        element.style.display = 'block'
        
        const targetHeight = element.scrollHeight
        
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const height = Math.min((progress / duration) * targetHeight, targetHeight)
            
            element.style.maxHeight = height + 'px'
            
            if (progress < duration) {
                requestAnimationFrame(animate)
            } else {
                element.style.maxHeight = 'none'
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 向上滑出动画
     */
    static slideUp(element, duration = 300) {
        const targetHeight = element.scrollHeight
        element.style.maxHeight = targetHeight + 'px'
        element.style.overflow = 'hidden'
        
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const height = targetHeight - Math.min((progress / duration) * targetHeight, targetHeight)
            
            element.style.maxHeight = height + 'px'
            
            if (progress < duration) {
                requestAnimationFrame(animate)
            } else {
                element.style.display = 'none'
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 从左侧滑入
     */
    static slideInLeft(element, duration = 300) {
        element.style.transform = 'translateX(-100%)'
        element.style.opacity = '0'
        element.style.display = 'block'
        
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const percentage = Math.min(progress / duration, 1)
            
            element.style.transform = `translateX(${-100 + percentage * 100}%)`
            element.style.opacity = percentage
            
            if (progress < duration) {
                requestAnimationFrame(animate)
            } else {
                element.style.transform = ''
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 从右侧滑入
     */
    static slideInRight(element, duration = 300) {
        element.style.transform = 'translateX(100%)'
        element.style.opacity = '0'
        element.style.display = 'block'
        
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const percentage = Math.min(progress / duration, 1)
            
            element.style.transform = `translateX(${100 - percentage * 100}%)`
            element.style.opacity = percentage
            
            if (progress < duration) {
                requestAnimationFrame(animate)
            } else {
                element.style.transform = ''
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 抖动动画
     */
    static shake(element, intensity = 10, duration = 500) {
        const originalTransform = element.style.transform
        
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const remaining = duration - progress
            
            if (remaining > 0) {
                const offset = Math.sin(progress / 50) * intensity * (remaining / duration)
                element.style.transform = `translateX(${offset}px)`
                requestAnimationFrame(animate)
            } else {
                element.style.transform = originalTransform
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 脉冲动画
     */
    static pulse(element, scale = 1.05, duration = 200) {
        const originalTransform = element.style.transform
        
        element.style.transition = `transform ${duration}ms ease`
        element.style.transform = `scale(${scale})`
        
        setTimeout(() => {
            element.style.transform = originalTransform
        }, duration)
    }
    
    /**
     * 弹跳动画
     */
    static bounce(element, height = 20, duration = 500) {
        const originalTransform = element.style.transform
        
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const percentage = progress / duration
            
            if (percentage < 1) {
                const bounceHeight = Math.abs(Math.sin(percentage * Math.PI * 2)) * height
                element.style.transform = `translateY(-${bounceHeight}px)`
                requestAnimationFrame(animate)
            } else {
                element.style.transform = originalTransform
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 旋转动画
     */
    static rotate(element, degrees = 360, duration = 500) {
        const originalTransform = element.style.transform
        
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const percentage = Math.min(progress / duration, 1)
            
            const currentDegrees = percentage * degrees
            element.style.transform = `rotate(${currentDegrees}deg)`
            
            if (percentage < 1) {
                requestAnimationFrame(animate)
            } else {
                element.style.transform = originalTransform
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 缩放动画
     */
    static scale(element, fromScale, toScale, duration = 300) {
        element.style.transform = `scale(${fromScale})`
        element.style.display = 'block'
        
        let start = null
        
        const animate = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const percentage = Math.min(progress / duration, 1)
            
            const currentScale = fromScale + (toScale - fromScale) * percentage
            element.style.transform = `scale(${currentScale})`
            
            if (percentage < 1) {
                requestAnimationFrame(animate)
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 打字机效果
     */
    static typeWriter(element, text, speed = 50) {
        element.textContent = ''
        let index = 0
        
        const type = () => {
            if (index < text.length) {
                element.textContent += text.charAt(index)
                index++
                setTimeout(type, speed)
            }
        }
        
        type()
    }
    
    /**
     * 数字滚动动画
     */
    static countUp(element, start, end, duration = 1000) {
        let startTime = null
        
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = timestamp - startTime
            const percentage = Math.min(progress / duration, 1)
            
            const current = Math.floor(start + (end - start) * percentage)
            element.textContent = current
            
            if (percentage < 1) {
                requestAnimationFrame(animate)
            } else {
                element.textContent = end
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 波纹效果
     */
    static ripple(element, event, options = {}) {
        const {
            color = 'rgba(255, 255, 255, 0.3)',
            duration = 600
        } = options
        
        const rect = element.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        
        const ripple = document.createElement('span')
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: ${color};
            transform: scale(0);
            animation: ripple ${duration}ms ease-out;
            pointer-events: none;
            left: ${x}px;
            top: ${y}px;
            width: 10px;
            height: 10px;
            margin-left: -5px;
            margin-top: -5px;
        `
        
        element.style.position = 'relative'
        element.style.overflow = 'hidden'
        element.appendChild(ripple)
        
        setTimeout(() => ripple.remove(), duration)
    }
    
    /**
     * 添加CSS动画类
     */
    static addAnimationClass(element, className, duration = 300) {
        element.classList.add(className)
        
        setTimeout(() => {
            element.classList.remove(className)
        }, duration)
    }
    
    /**
     * 序列动画
     */
    static async sequence(animations) {
        for (const animation of animations) {
            await animation()
        }
    }
    
    /**
     * 并行动画
     */
    static parallel(animations) {
        return Promise.all(animations.map(animation => animation()))
    }
}

/**
 * 加载动画管理器
 */
class LoadingAnimation {
    /**
     * 创建旋转加载动画
     */
    static createSpinner(size = 'medium', color = 'blue') {
        const sizes = {
            small: 'w-4 h-4',
            medium: 'w-8 h-8',
            large: 'w-12 h-12'
        }
        
        const spinner = document.createElement('div')
        spinner.className = `${sizes[size]} border-2 border-${color}-200 border-t-${color}-600 rounded-full animate-spin`
        
        return spinner
    }
    
    /**
     * 创建点状加载动画
     */
    static createDotsLoader(color = 'blue') {
        const container = document.createElement('div')
        container.className = 'flex space-x-1'
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div')
            dot.className = `w-2 h-2 bg-${color}-500 rounded-full animate-bounce`
            dot.style.animationDelay = `${i * 0.1}s`
            container.appendChild(dot)
        }
        
        return container
    }
    
    /**
     * 创建进度条加载动画
     */
    static createProgressBarLoader(color = 'blue') {
        const container = document.createElement('div')
        container.className = 'w-full h-1 bg-slate-700 rounded-full overflow-hidden'
        
        const bar = document.createElement('div')
        bar.className = `h-full bg-${color}-500 rounded-full animate-pulse`
        bar.style.width = '30%'
        
        container.appendChild(bar)
        
        return container
    }
    
    /**
     * 创建骨架屏加载动画
     */
    static createSkeletonLoader(width = '100%', height = '20px') {
        const skeleton = document.createElement('div')
        skeleton.className = 'animate-pulse bg-slate-700 rounded'
        skeleton.style.width = width
        skeleton.style.height = height
        
        return skeleton
    }
}

/**
 * 过渡效果管理器
 */
class TransitionManager {
    /**
     * 创建淡入淡出过渡
     */
    static createFadeTransition(element, options = {}) {
        const {
            duration = 300,
            timingFunction = 'ease-in-out'
        } = options
        
        element.style.transition = `opacity ${duration}ms ${timingFunction}`
        
        return {
            show: () => {
                element.style.opacity = '1'
                element.style.display = 'block'
            },
            hide: () => {
                element.style.opacity = '0'
                setTimeout(() => {
                    element.style.display = 'none'
                }, duration)
            }
        }
    }
    
    /**
     * 创建滑动过渡
     */
    static createSlideTransition(element, options = {}) {
        const {
            duration = 300,
            direction = 'left',
            timingFunction = 'ease-in-out'
        } = options
        
        const transforms = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            up: 'translateY(-100%)',
            down: 'translateY(100%)'
        }
        
        element.style.transition = `transform ${duration}ms ${timingFunction}`
        
        return {
            show: () => {
                element.style.transform = 'translate(0)'
                element.style.display = 'block'
            },
            hide: () => {
                element.style.transform = transforms[direction]
                setTimeout(() => {
                    element.style.display = 'none'
                }, duration)
            }
        }
    }
    
    /**
     * 创建缩放过渡
     */
    static createScaleTransition(element, options = {}) {
        const {
            duration = 300,
            fromScale = 0.8,
            toScale = 1,
            timingFunction = 'ease-in-out'
        } = options
        
        element.style.transition = `transform ${duration}ms ${timingFunction}, opacity ${duration}ms ${timingFunction}`
        
        return {
            show: () => {
                element.style.transform = `scale(${toScale})`
                element.style.opacity = '1'
                element.style.display = 'block'
            },
            hide: () => {
                element.style.transform = `scale(${fromScale})`
                element.style.opacity = '0'
                setTimeout(() => {
                    element.style.display = 'none'
                }, duration)
            }
        }
    }
}

export { AnimationManager, LoadingAnimation, TransitionManager }
