export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

export interface Budget {
  id: string
  category: string
  amount: number
  spent: number
  period: 'monthly' | 'yearly'
  startDate: string
}

export interface BudgetStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
  monthlyBudget: number
  budgetUsed: number
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  currency: string
  timezone: string
  monthlyIncomeGoal?: number
  monthlyExpenseGoal?: number
  savingsGoal?: number
  notifications: {
    email: boolean
    push: boolean
    budgetAlerts: boolean
    weeklyReports: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    dateFormat: string
    currencyFormat: string
  }
  createdAt: string
  updatedAt: string
} 