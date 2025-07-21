import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Transaction, Category, Budget, BudgetStats, User } from '../types'
import { useAuth } from './AuthContext'
import { dataSyncService, LocalData } from '../services/dataSyncService'
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

interface BudgetState {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  stats: BudgetStats
  user: User | null
  isLoading: boolean
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
}

type BudgetAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: 'idle' | 'syncing' | 'synced' | 'error' }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'LOAD_DATA'; payload: LocalData }
  | { type: 'RESET_DATA' }

interface BudgetContextType {
  state: BudgetState
  dispatch: React.Dispatch<BudgetAction>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>
  updateBudget: (budget: Budget) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  updateUser: (user: User) => Promise<void>
  syncData: () => Promise<void>
  getOnlineStatus: () => boolean
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

const calculateStats = (transactions: Transaction[], budgets: Budget[]): BudgetStats => {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  
  const monthlyTransactions = transactions.filter(t => 
    t.date.startsWith(currentMonth)
  )
  
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
  
  const monthlyBudget = budgets
    .filter(b => b.period === 'monthly')
    .reduce((sum, b) => sum + b.amount, 0)
  
  const budgetUsed = budgets
    .filter(b => b.period === 'monthly')
    .reduce((sum, b) => sum + b.spent, 0)
  
  return {
    totalIncome,
    totalExpenses,
    totalInvestments,
    balance,
    savingsRate,
    monthlyBudget,
    budgetUsed
  }
}

const initialState: BudgetState = {
  transactions: [],
  categories: [],
  budgets: [],
  stats: {
    totalIncome: 0,
    totalExpenses: 0,
    totalInvestments: 0,
    balance: 0,
    savingsRate: 0,
    monthlyBudget: 0,
    budgetUsed: 0
  },
  user: null,
  isLoading: false,
  syncStatus: 'idle'
}

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload }
    
    case 'ADD_TRANSACTION':
      const newTransactions = [...state.transactions, action.payload]
      return {
        ...state,
        transactions: newTransactions,
        stats: calculateStats(newTransactions, state.budgets)
      }
    
    case 'DELETE_TRANSACTION':
      const filteredTransactions = state.transactions.filter(t => t.id !== action.payload)
      return {
        ...state,
        transactions: filteredTransactions,
        stats: calculateStats(filteredTransactions, state.budgets)
      }
    
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload]
      }
    
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload)
      }
    
    case 'ADD_BUDGET':
      const newBudgets = [...state.budgets, action.payload]
      return {
        ...state,
        budgets: newBudgets,
        stats: calculateStats(state.transactions, newBudgets)
      }
    
    case 'UPDATE_BUDGET':
      const updatedBudgets = state.budgets.map(b => 
        b.id === action.payload.id ? action.payload : b
      )
      return {
        ...state,
        budgets: updatedBudgets,
        stats: calculateStats(state.transactions, updatedBudgets)
      }
    
    case 'DELETE_BUDGET':
      const remainingBudgets = state.budgets.filter(b => b.id !== action.payload)
      return {
        ...state,
        budgets: remainingBudgets,
        stats: calculateStats(state.transactions, remainingBudgets)
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      }
    
    case 'LOAD_DATA':
      return {
        ...state,
        transactions: action.payload.transactions,
        categories: action.payload.categories,
        budgets: action.payload.budgets,
        user: action.payload.user,
        stats: calculateStats(action.payload.transactions, action.payload.budgets)
      }
    
    case 'RESET_DATA':
      return initialState
    
    default:
      return state
  }
}

export const useBudget = () => {
  const context = useContext(BudgetContext)
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider')
  }
  return context
}

interface BudgetProviderProps {
  children: React.ReactNode
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(budgetReducer, initialState)
  const { currentUser } = useAuth()

  // Initialize and sync data when user changes
  useEffect(() => {
    if (currentUser) {
      initializeUserData()
    } else {
      dispatch({ type: 'RESET_DATA' })
    }
  }, [currentUser])

  const initializeUserData = async () => {
    if (!currentUser) return

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' })

    try {
      // Set up real-time sync
      const syncListener = dataSyncService.setupRealtimeSync(
        currentUser.uid,
        (data: LocalData) => {
          dispatch({ type: 'LOAD_DATA', payload: data })
        }
      )

      // Initial sync
      const syncResult = await dataSyncService.syncData(currentUser.uid)
      if (syncResult.success && syncResult.data) {
        dispatch({ type: 'LOAD_DATA', payload: syncResult.data })
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' })
      } else {
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' })
      }

      // Clean up on unmount
      return () => {
        dataSyncService.removeRealtimeSync(currentUser.uid)
      }
    } catch (error) {
      console.error('Error initializing user data:', error)
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!currentUser) throw new Error('User not authenticated')

    const transaction: Transaction = {
      ...transactionData,
      id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }

    dispatch({ type: 'ADD_TRANSACTION', payload: transaction })

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'transactions', transaction.id), {
        ...transaction,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding transaction:', error)
      // TODO: Handle offline mode - transaction is already added locally
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!currentUser) throw new Error('User not authenticated')

    dispatch({ type: 'DELETE_TRANSACTION', payload: id })

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', id))
    } catch (error) {
      console.error('Error deleting transaction:', error)
      // TODO: Handle offline mode
    }
  }

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    if (!currentUser) throw new Error('User not authenticated')

    const category: Category = {
      ...categoryData,
      id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    dispatch({ type: 'ADD_CATEGORY', payload: category })

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'categories', category.id), {
        ...category,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!currentUser) throw new Error('User not authenticated')

    dispatch({ type: 'DELETE_CATEGORY', payload: id })

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'categories', id))
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const addBudget = async (budgetData: Omit<Budget, 'id'>) => {
    if (!currentUser) throw new Error('User not authenticated')

    const budget: Budget = {
      ...budgetData,
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    dispatch({ type: 'ADD_BUDGET', payload: budget })

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'budgets', budget.id), {
        ...budget,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding budget:', error)
    }
  }

  const updateBudget = async (budget: Budget) => {
    if (!currentUser) throw new Error('User not authenticated')

    dispatch({ type: 'UPDATE_BUDGET', payload: budget })

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'budgets', budget.id), {
        ...budget,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating budget:', error)
    }
  }

  const deleteBudget = async (id: string) => {
    if (!currentUser) throw new Error('User not authenticated')

    dispatch({ type: 'DELETE_BUDGET', payload: id })

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'budgets', id))
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const updateUser = async (user: User) => {
    if (!currentUser) throw new Error('User not authenticated')

    dispatch({ type: 'UPDATE_USER', payload: user })

    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...user,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const syncData = async () => {
    if (!currentUser) return

    dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' })

    try {
      const result = await dataSyncService.forceSync(currentUser.uid)
      if (result.success && result.data) {
        dispatch({ type: 'LOAD_DATA', payload: result.data })
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' })
      } else {
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' })
      }
    } catch (error) {
      console.error('Error syncing data:', error)
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' })
    }
  }

  const getOnlineStatus = () => {
    return dataSyncService.getOnlineStatus()
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
    syncData,
    getOnlineStatus
  }

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}