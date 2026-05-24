import AsyncStorage from '@react-native-async-storage/async-storage'
import { Category } from '../types'

export const generateCurrentMonthData = () => {
  const now = new Date()

  const categories: Category[] = [
    { id: '1', name: 'Salary', type: 'income', color: '#10b981', icon: '💼' },
    { id: '2', name: 'Freelance', type: 'income', color: '#3b82f6', icon: '💻' },
    { id: '3', name: 'Investment', type: 'income', color: '#8b5cf6', icon: '📈' },
    { id: '4', name: 'Other Income', type: 'income', color: '#06b6d4', icon: '💰' },
    { id: '5', name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: '🍽️' },
    { id: '6', name: 'Transportation', type: 'expense', color: '#f59e0b', icon: '🚗' },
    { id: '7', name: 'Housing', type: 'expense', color: '#8b5cf6', icon: '🏠' },
    { id: '8', name: 'Utilities', type: 'expense', color: '#06b6d4', icon: '⚡' },
    { id: '9', name: 'Entertainment', type: 'expense', color: '#ec4899', icon: '🎬' },
    { id: '10', name: 'Shopping', type: 'expense', color: '#f97316', icon: '🛍️' },
    { id: '11', name: 'Healthcare', type: 'expense', color: '#10b981', icon: '🏥' },
    { id: '12', name: 'Education', type: 'expense', color: '#3b82f6', icon: '📚' },
    { id: '13', name: 'Stocks', type: 'investment', color: '#059669', icon: '📊' },
    { id: '14', name: 'Bonds', type: 'investment', color: '#0891b2', icon: '🏛️' },
    { id: '15', name: 'Real Estate', type: 'investment', color: '#7c3aed', icon: '🏘️' },
    { id: '16', name: 'Mutual Funds', type: 'investment', color: '#dc2626', icon: '💹' },
    { id: '17', name: 'Cryptocurrency', type: 'investment', color: '#ea580c', icon: '₿' },
    { id: '18', name: 'Retirement Fund', type: 'investment', color: '#4f46e5', icon: '🏦' },
    { id: '19', name: 'Emergency Fund', type: 'investment', color: '#16a34a', icon: '🚨' },
    { id: '20', name: 'Education Fund', type: 'investment', color: '#0d9488', icon: '🎓' },
  ]

  return {
    transactions: [],
    categories,
    budgets: [],
    user: {
      id: '',
      name: '',
      email: '',
      currency: 'USD',
      timezone: 'America/New_York',
      monthlyIncomeGoal: 0,
      monthlyExpenseGoal: 0,
      savingsGoal: 0,
      notifications: { email: true, push: true, budgetAlerts: true, weeklyReports: false },
      preferences: { theme: 'light' as const, language: 'en', dateFormat: 'MM/dd/yyyy', currencyFormat: '$#,##0.00' },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    stats: {
      totalIncome: 0,
      totalExpenses: 0,
      totalInvestments: 0,
      balance: 0,
      savingsRate: 0,
      monthlyBudget: 0,
      budgetUsed: 0,
    }
  }
}

export const resetToCurrentMonth = async () => {
  const newData = generateCurrentMonthData()
  await AsyncStorage.setItem('budget-app-data', JSON.stringify(newData))
  return newData
}

export const clearAllData = async () => {
  await AsyncStorage.removeItem('budget-app-data')
}
