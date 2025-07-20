// Image optimization utilities
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

export const preloadImages = (srcs: string[]): Promise<void[]> => {
  return Promise.all(srcs.map(preloadImage))
}

// Lazy loading intersection observer
export const createLazyImageObserver = (callback: (entries: IntersectionObserverEntry[]) => void) => {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      root: null,
      rootMargin: '100px', // Load images 100px before they come into view
      threshold: 0.1
    })
  }
  return null
}

// WebP support detection
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5
}

// Image format optimization
export const getOptimizedImageSrc = (baseSrc: string, format: 'webp' | 'avif' | 'original' = 'original') => {
  if (format === 'original') return baseSrc
  
  const extension = baseSrc.split('.').pop()
  const baseWithoutExtension = baseSrc.replace(`.${extension}`, '')
  
  return `${baseWithoutExtension}.${format}`
}

// Progressive image loading component helper
export const createProgressiveImageLoader = () => {
  const loadedImages = new Set<string>()
  
  return {
    isLoaded: (src: string) => loadedImages.has(src),
    markAsLoaded: (src: string) => loadedImages.add(src),
    preload: (src: string) => {
      if (!loadedImages.has(src)) {
        preloadImage(src).then(() => loadedImages.add(src))
      }
    }
  }
}