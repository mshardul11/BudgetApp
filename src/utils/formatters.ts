import { User } from '../types'

export function formatCurrency(amount: number, user?: User): string {
  const currency = user?.currency || 'USD'
  const currencyFormat = user?.preferences?.currencyFormat || '$#,##0.00'
  
  // Handle different currency formats
  if (currencyFormat.includes('₹')) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(date: string | Date, user?: User): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dateFormat = user?.preferences?.dateFormat || 'MM/dd/yyyy'
  
  // Handle different date formats
  if (dateFormat === 'dd/MM/yyyy') {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj)
  } else if (dateFormat === 'yyyy-MM-dd') {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj)
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj)
}

export function formatShortDate(date: string | Date, user?: User): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dateFormat = user?.preferences?.dateFormat || 'MM/dd/yyyy'
  
  // Handle different date formats
  if (dateFormat === 'dd/MM/yyyy') {
    return new Intl.DateTimeFormat('en-GB', {
      month: 'short',
      day: 'numeric',
    }).format(dateObj)
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(dateObj)
} 