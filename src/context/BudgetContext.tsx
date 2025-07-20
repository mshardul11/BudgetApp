import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Transaction, Category, Budget, BudgetStats, User } from '../types'
import { generateCurrentMonthData } from '../utils/resetData'
import { useAuth } from './AuthContext'

interface BudgetState {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  stats: BudgetStats
  user: User
}

type BudgetAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'LOAD_DATA'; payload: BudgetState }

interface BudgetContextType {
  state: BudgetState
  dispatch: React.Dispatch<BudgetAction>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void
  deleteTransaction: (id: string) => void
  addCategory: (category: Omit<Category, 'id'>) => void
  deleteCategory: (id: string) => void
  addBudget: (budget: Omit<Budget, 'id'>) => void
  updateBudget: (budget: Budget) => void
  deleteBudget: (id: string) => void
  updateUser: (user: User) => void
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

const initialState: BudgetState = generateCurrentMonthData()

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      }
    
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      }
    
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      }
    
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload),
      }
    
    case 'ADD_BUDGET':
      return {
        ...state,
        budgets: [...state.budgets, action.payload],
      }
    
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b => b.id === action.payload.id ? action.payload : b),
      }
    
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload),
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      }
    
    case 'LOAD_DATA':
      return action.payload
    
    default:
      return state
  }
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState)
  const { currentUser } = useAuth()

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('budget-app-data')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        dispatch({ type: 'LOAD_DATA', payload: parsedData })
      } catch (error) {
        console.error('Error loading saved data:', error)
      }
    }
  }, [])

  // Sync user data with authenticated user
  useEffect(() => {
    if (currentUser && (!state.user.name || state.user.name !== currentUser.displayName)) {
      const updatedUser: User = {
        ...state.user,
        id: currentUser.uid,
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        avatar: currentUser.photoURL || undefined,
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: 'UPDATE_USER', payload: updatedUser })
    }
  }, [currentUser, state.user.name])

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('budget-app-data', JSON.stringify(state))
  }, [state])

  // Calculate stats whenever transactions change
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyTransactions = state.transactions.filter(t => 
      t.date.startsWith(currentMonth)
    )
    
    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
    
    const monthlyBudget = state.budgets
      .filter(b => b.period === 'monthly')
      .reduce((sum, b) => sum + b.amount, 0)
    
    const budgetUsed = state.budgets
      .filter(b => b.period === 'monthly')
      .reduce((sum, b) => sum + b.spent, 0)
    
    // Update stats in state
    const newStats = {
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
      monthlyBudget,
      budgetUsed,
    }
    
    // Only update if stats have changed
    if (JSON.stringify(state.stats) !== JSON.stringify(newStats)) {
      dispatch({ 
        type: 'LOAD_DATA', 
        payload: { ...state, stats: newStats }
      })
    }
  }, [state.transactions, state.budgets])

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction })
  }

  const deleteTransaction = (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id })
  }

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    }
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory })
  }

  const deleteCategory = (id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id })
  }

  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
    }
    dispatch({ type: 'ADD_BUDGET', payload: newBudget })
  }

  const updateBudget = (budget: Budget) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: budget })
  }

  const deleteBudget = (id: string) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id })
  }

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user })
  }

  const value: BudgetContextType = {
    state,
    dispatch,
    addTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget,
    updateUser,
  }

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudget() {
  const context = useContext(BudgetContext)
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider')
  }
  return context
} 