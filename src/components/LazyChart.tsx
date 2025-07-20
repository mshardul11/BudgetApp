import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

interface ChartLoadingProps {
  height?: number
  className?: string
}

const ChartLoading = ({ height = 200, className = '' }: ChartLoadingProps) => (
  <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
  </div>
)

interface LazyChartWrapperProps {
  height?: number
  className?: string
  children: React.ReactNode
}

export const LazyChartWrapper = ({ height = 200, className = '', children }: LazyChartWrapperProps) => (
  <Suspense fallback={<ChartLoading height={height} className={className} />}>
    {children}
  </Suspense>
)

// Preload charts when user hovers over dashboard
export const preloadCharts = () => {
  const componentImport = import('recharts')
  return componentImport
}