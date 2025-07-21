import { Transaction, Category, Budget, User } from '../types'

export interface ExportData {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  user: User
  exportDate: string
  version: string
}

export const exportToCSV = (transactions: Transaction[]) => {
  // Create CSV header
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Created At']
  const csvContent = [
    headers.join(','),
    ...transactions.map(t => [
      t.date,
      t.type,
      t.category,
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes in description
      t.amount,
      t.createdAt
    ].join(','))
  ].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `budget-transactions-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToJSON = (data: ExportData) => {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `budget-data-${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const importFromJSON = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export const generateReport = (transactions: Transaction[], categories: Category[]) => {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth))
  
  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalInvestments = monthlyTransactions
    .filter(t => t.type === 'investment')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpenses - totalInvestments
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0

  // Category breakdown
  const expenseByCategory = categories
    .filter(cat => cat.type === 'expense')
    .map(cat => {
      const total = monthlyTransactions
        .filter(t => t.type === 'expense' && t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0)
      return { category: cat.name, amount: total, percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0 }
    })
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  return {
    period: currentMonth,
    totalIncome,
    totalExpenses,
    totalInvestments,
    balance,
    savingsRate,
    expenseByCategory,
    transactionCount: monthlyTransactions.length,
    generatedAt: new Date().toISOString()
  }
} 