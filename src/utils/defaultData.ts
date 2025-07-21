import { Transaction, Category, Budget, User } from '../types'

export const generateDefaultCategories = (): Category[] => [
  // Income Categories
  { id: 'cat_salary', name: 'Salary', type: 'income', color: '#10B981', icon: 'briefcase' },
  { id: 'cat_freelance', name: 'Freelance', type: 'income', color: '#059669', icon: 'laptop' },
  { id: 'cat_bonus', name: 'Bonus', type: 'income', color: '#047857', icon: 'gift' },
  { id: 'cat_investment_income', name: 'Investment Returns', type: 'income', color: '#065F46', icon: 'trending-up' },

  // Expense Categories
  { id: 'cat_food', name: 'Food & Dining', type: 'expense', color: '#EF4444', icon: 'restaurant' },
  { id: 'cat_transport', name: 'Transportation', type: 'expense', color: '#DC2626', icon: 'car' },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', color: '#B91C1C', icon: 'bag' },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', color: '#991B1B', icon: 'film' },
  { id: 'cat_bills', name: 'Bills & Utilities', type: 'expense', color: '#7F1D1D', icon: 'receipt' },
  { id: 'cat_healthcare', name: 'Healthcare', type: 'expense', color: '#F87171', icon: 'medical' },
  { id: 'cat_education', name: 'Education', type: 'expense', color: '#FCA5A5', icon: 'school' },

  // Investment Categories
  { id: 'cat_stocks', name: 'Stocks', type: 'investment', color: '#8B5CF6', icon: 'bar-chart' },
  { id: 'cat_crypto', name: 'Cryptocurrency', type: 'investment', color: '#7C3AED', icon: 'logo-bitcoin' },
  { id: 'cat_real_estate', name: 'Real Estate', type: 'investment', color: '#6D28D9', icon: 'home' },
  { id: 'cat_mutual_funds', name: 'Mutual Funds', type: 'investment', color: '#5B21B6', icon: 'pie-chart' },
]

export const generateSampleTransactions = (): Transaction[] => {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const transactions: Transaction[] = []

  // Generate sample transactions for the current month
  for (let i = 0; i < 15; i++) {
    const day = Math.floor(Math.random() * 28) + 1
    const date = new Date(currentYear, currentMonth, day)
    const createdAt = date.toISOString()

    if (i < 5) {
      // Income transactions
      transactions.push({
        id: `trans_income_${i}`,
        type: 'income',
        amount: Math.floor(Math.random() * 2000) + 1000,
        description: ['Salary Payment', 'Freelance Project', 'Bonus', 'Investment Return'][Math.floor(Math.random() * 4)],
        category: ['Salary', 'Freelance', 'Bonus', 'Investment Returns'][Math.floor(Math.random() * 4)],
        date: date.toISOString().split('T')[0],
        createdAt
      })
    } else if (i < 12) {
      // Expense transactions
      const expenseCategories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare']
      const expenseDescriptions = [
        'Grocery Shopping', 'Gas Station', 'Online Shopping', 'Movie Tickets', 'Electricity Bill', 'Doctor Visit',
        'Restaurant', 'Uber Ride', 'Coffee Shop', 'Netflix Subscription', 'Water Bill', 'Pharmacy'
      ]
      
      transactions.push({
        id: `trans_expense_${i}`,
        type: 'expense',
        amount: Math.floor(Math.random() * 200) + 20,
        description: expenseDescriptions[Math.floor(Math.random() * expenseDescriptions.length)],
        category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
        date: date.toISOString().split('T')[0],
        createdAt
      })
    } else {
      // Investment transactions
      const investmentCategories = ['Stocks', 'Cryptocurrency', 'Mutual Funds']
      const investmentDescriptions = ['Stock Purchase', 'Bitcoin Investment', 'Index Fund', 'ETF Purchase']
      
      transactions.push({
        id: `trans_investment_${i}`,
        type: 'investment',
        amount: Math.floor(Math.random() * 500) + 100,
        description: investmentDescriptions[Math.floor(Math.random() * investmentDescriptions.length)],
        category: investmentCategories[Math.floor(Math.random() * investmentCategories.length)],
        date: date.toISOString().split('T')[0],
        createdAt
      })
    }
  }

  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const generateSampleBudgets = (): Budget[] => {
  const currentDate = new Date()
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]

  return [
    {
      id: 'budget_food',
      category: 'Food & Dining',
      amount: 800,
      spent: Math.floor(Math.random() * 600) + 200,
      period: 'monthly',
      startDate
    },
    {
      id: 'budget_transport',
      category: 'Transportation',
      amount: 300,
      spent: Math.floor(Math.random() * 250) + 50,
      period: 'monthly',
      startDate
    },
    {
      id: 'budget_entertainment',
      category: 'Entertainment',
      amount: 200,
      spent: Math.floor(Math.random() * 150) + 25,
      period: 'monthly',
      startDate
    },
    {
      id: 'budget_shopping',
      category: 'Shopping',
      amount: 400,
      spent: Math.floor(Math.random() * 350) + 50,
      period: 'monthly',
      startDate
    }
  ]
}

export const generateDefaultUser = (email: string, name: string): User => ({
  id: '', // Will be set by Firebase
  name,
  email,
  currency: 'USD',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  monthlyIncomeGoal: 5000,
  monthlyExpenseGoal: 3000,
  savingsGoal: 2000,
  notifications: {
    email: true,
    push: true,
    budgetAlerts: true,
    weeklyReports: false
  },
  preferences: {
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/dd/yyyy',
    currencyFormat: '$#,##0.00'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

export const generateInitialData = (email: string, name: string) => {
  return {
    user: generateDefaultUser(email, name),
    categories: generateDefaultCategories(),
    transactions: generateSampleTransactions(),
    budgets: generateSampleBudgets()
  }
}