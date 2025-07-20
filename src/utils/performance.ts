import React from 'react'

// Performance monitoring utilities
export const measurePageLoad = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      // Critical metrics
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
      firstInputDelay: (performance.getEntriesByName('first-input')[0] as any)?.processingStart || 0,
      cumulativeLayoutShift: performance.getEntriesByName('layout-shift')?.reduce((sum, entry: any) => sum + entry.value, 0) || 0,
      
      // Load timing
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Resource timing
      totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      networkTime: navigation.responseEnd - navigation.fetchStart,
      processingTime: navigation.loadEventEnd - navigation.responseEnd,
    }
  }
  return null
}

// Bundle size tracking
export const trackBundleMetrics = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    const jsResources = resources.filter(r => r.name.includes('.js'))
    const cssResources = resources.filter(r => r.name.includes('.css'))
    
    const jsSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    const cssSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    
    return {
      totalJS: jsSize,
      totalCSS: cssSize,
      totalSize: jsSize + cssSize,
      resourceCount: resources.length,
      jsFiles: jsResources.length,
      cssFiles: cssResources.length,
    }
  }
  return null
}

// Memory usage tracking
export const trackMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    }
  }
  return null
}

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func.apply(null, args)
    }
  }
}

// Performance observer for Core Web Vitals
export const observeCoreWebVitals = (callback: (metric: any) => void) => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      callback({
        name: 'LCP',
        value: lastEntry.startTime,
        id: 'lcp',
      })
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        callback({
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          id: 'fid',
        })
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      callback({
        name: 'CLS',
        value: clsValue,
        id: 'cls',
      })
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// Component performance tracker
export const withPerformanceTracking = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) => {
  return React.memo((props: T) => {
    const startTime = performance.now()
    
    React.useEffect(() => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 16) { // Log if render takes longer than 16ms (60fps)
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`)
      }
    })
    
    return React.createElement(Component, props)
  })
}