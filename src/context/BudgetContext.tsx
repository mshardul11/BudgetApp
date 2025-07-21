import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { Transaction, Category, Budget, BudgetStats, User } from '../types'
import { generateCurrentMonthData } from '../utils/resetData'
import { useAuth } from './AuthContext'
import { dataSyncService, LocalData } from '../services/dataSyncService'
import { db } from '../config/firebase'
import { 
  doc, 
  setDoc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore'

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
  | { type: 'SYNC_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SYNC_CATEGORIES'; payload: Category[] }
  | { type: 'SYNC_BUDGETS'; payload: Budget[] }

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
  syncDataToFirestore: () => Promise<void>
  loadDataFromFirestore: () => Promise<void>
  forceSync: () => Promise<void>
  getOnlineStatus: () => boolean
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
    
    case 'SYNC_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      }
    
    case 'SYNC_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      }
    
    case 'SYNC_BUDGETS':
      return {
        ...state,
        budgets: action.payload,
      }
    
    default:
      return state
  }
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState)
  const { currentUser } = useAuth()
  const isInitialized = useRef(false)
  const syncInProgress = useRef(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncRef = useRef<{
    transactions: string
    categories: string
    budgets: string
    user: string
  }>({
    transactions: '',
    categories: '',
    budgets: '',
    user: ''
  })

  // Load data from localStorage on mount (for non-authenticated users)
  useEffect(() => {
    if (!currentUser) {
      const savedData = localStorage.getItem('budget-app-data')
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          // Ensure categories are properly structured
          if (!parsedData.categories || !Array.isArray(parsedData.categories) || parsedData.categories.length === 0) {
            console.log('Fixing missing or invalid categories in localStorage data')
            const defaultData = generateCurrentMonthData()
            parsedData.categories = defaultData.categories
          }
          dispatch({ type: 'LOAD_DATA', payload: parsedData })
        } catch (error) {
          console.error('Error loading saved data:', error)
        }
      }
    }
  }, [currentUser])

  // Initialize data sync when user authenticates
  useEffect(() => {
    if (currentUser && !isInitialized.current) {
      isInitialized.current = true
      
      // Initialize sync with the data sync service
      dataSyncService.initializeSync(currentUser.uid, (data: LocalData) => {
        // Update state when data changes from sync
        dispatch({ type: 'SYNC_TRANSACTIONS', payload: data.transactions })
        dispatch({ type: 'SYNC_CATEGORIES', payload: data.categories })
        dispatch({ type: 'SYNC_BUDGETS', payload: data.budgets })
        dispatch({ type: 'UPDATE_USER', payload: data.user })
      })
    }

    // Cleanup sync when user changes or component unmounts
    return () => {
      if (currentUser) {
        dataSyncService.cleanupSync(currentUser.uid)
      }
    }
  }, [currentUser])

  // Save data to localStorage for non-authenticated users
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('budget-app-data', JSON.stringify(state))
    }
  }, [state, currentUser])

  // Auto-sync effect for authenticated users
  useEffect(() => {
    if (!currentUser) return

    // Create current state snapshots
    const currentTransactions = JSON.stringify(state.transactions)
    const currentCategories = JSON.stringify(state.categories)
    const currentBudgets = JSON.stringify(state.budgets)
    const currentUserData = JSON.stringify(state.user)

    // Check if any data has changed
    const hasChanged = 
      currentTransactions !== lastSyncRef.current.transactions ||
      currentCategories !== lastSyncRef.current.categories ||
      currentBudgets !== lastSyncRef.current.budgets ||
      currentUserData !== lastSyncRef.current.user

    if (hasChanged) {
      // Clear existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      // Set new timeout for auto-sync (debounce for 2 seconds)
      syncTimeoutRef.current = setTimeout(() => {
        syncDataToFirestore()
        
        // Update last sync references
        lastSyncRef.current = {
          transactions: currentTransactions,
          categories: currentCategories,
          budgets: currentBudgets,
          user: currentUserData
        }
      }, 2000)
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [
    state.transactions,
    state.categories,
    state.budgets,
    state.user,
    currentUser
  ])

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
    
    const totalInvestments = monthlyTransactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const balance = totalIncome - totalExpenses - totalInvestments
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
      totalInvestments,
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

  const syncDataToFirestore = async () => {
    if (!currentUser || syncInProgress.current) return
    
    syncInProgress.current = true
    try {
      const localData: LocalData = {
        transactions: state.transactions,
        categories: state.categories,
        budgets: state.budgets,
        user: state.user
      }
      
      const result = await dataSyncService.syncToFirestore(currentUser.uid, localData)
      
      if (!result.success) {
        console.error('Sync failed:', result.message)
      }
    } catch (error) {
      console.error('Error syncing data to Firestore:', error)
    } finally {
      syncInProgress.current = false
    }
  }

  const loadDataFromFirestore = async () => {
    if (!currentUser) return
    
    try {
      const result = await dataSyncService.syncFromFirestore(currentUser.uid)
      
      if (result.success && result.data) {
        dispatch({ type: 'SYNC_TRANSACTIONS', payload: result.data.transactions })
        dispatch({ type: 'SYNC_CATEGORIES', payload: result.data.categories })
        dispatch({ type: 'SYNC_BUDGETS', payload: result.data.budgets })
        dispatch({ type: 'UPDATE_USER', payload: result.data.user })
      }
    } catch (error) {
      console.error('Error loading data from Firestore:', error)
    }
  }

  const forceSync = async () => {
    if (!currentUser) return
    
    try {
      const localData: LocalData = {
        transactions: state.transactions,
        categories: state.categories,
        budgets: state.budgets,
        user: state.user
      }
      
      const result = await dataSyncService.forceSync(currentUser.uid, localData)
      
      if (result.success && result.data) {
        dispatch({ type: 'SYNC_TRANSACTIONS', payload: result.data.transactions })
        dispatch({ type: 'SYNC_CATEGORIES', payload: result.data.categories })
        dispatch({ type: 'SYNC_BUDGETS', payload: result.data.budgets })
        dispatch({ type: 'UPDATE_USER', payload: result.data.user })
      }
    } catch (error) {
      console.error('Error forcing sync:', error)
    }
  }

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction })
    
    // Sync to Firestore if authenticated
    if (currentUser) {
      try {
        const transactionRef = doc(db, 'users', currentUser.uid, 'transactions', newTransaction.id)
        await setDoc(transactionRef, {
          ...newTransaction,
          updatedAt: serverTimestamp()
        })
      } catch (error) {
        console.error('Error saving transaction to Firestore:', error)
      }
    }
  }

  const deleteTransaction = async (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id })
    
    // Delete from Firestore if authenticated
    if (currentUser) {
      try {
        const transactionRef = doc(db, 'users', currentUser.uid, 'transactions', id)
        await deleteDoc(transactionRef)
      } catch (error) {
        console.error('Error deleting transaction from Firestore:', error)
      }
    }
  }

  const addCategory = async (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    }
    
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory })
    
    // Sync to Firestore if authenticated
    if (currentUser) {
      try {
        const categoryRef = doc(db, 'users', currentUser.uid, 'categories', newCategory.id)
        await setDoc(categoryRef, {
          ...newCategory,
          updatedAt: serverTimestamp()
        })
      } catch (error) {
        console.error('Error saving category to Firestore:', error)
      }
    }
  }

  const deleteCategory = async (id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id })
    
    // Delete from Firestore if authenticated
    if (currentUser) {
      try {
        const categoryRef = doc(db, 'users', currentUser.uid, 'categories', id)
        await deleteDoc(categoryRef)
      } catch (error) {
        console.error('Error deleting category from Firestore:', error)
      }
    }
  }

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
    }
    
    dispatch({ type: 'ADD_BUDGET', payload: newBudget })
    
    // Sync to Firestore if authenticated
    if (currentUser) {
      try {
        const budgetRef = doc(db, 'users', currentUser.uid, 'budgets', newBudget.id)
        await setDoc(budgetRef, {
          ...newBudget,
          updatedAt: serverTimestamp()
        })
      } catch (error) {
        console.error('Error saving budget to Firestore:', error)
      }
    }
  }

  const updateBudget = async (budget: Budget) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: budget })
    
    // Sync to Firestore if authenticated
    if (currentUser) {
      try {
        const budgetRef = doc(db, 'users', currentUser.uid, 'budgets', budget.id)
        await setDoc(budgetRef, {
          ...budget,
          updatedAt: serverTimestamp()
        }, { merge: true })
      } catch (error) {
        console.error('Error updating budget in Firestore:', error)
      }
    }
  }

  const deleteBudget = async (id: string) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id })
    
    // Delete from Firestore if authenticated
    if (currentUser) {
      try {
        const budgetRef = doc(db, 'users', currentUser.uid, 'budgets', id)
        await deleteDoc(budgetRef)
      } catch (error) {
        console.error('Error deleting budget from Firestore:', error)
      }
    }
  }

  const updateUser = async (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user })
    
    // Save to Firestore if user is authenticated
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await setDoc(userDocRef, {
          ...user,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      } catch (error) {
        console.error('Error saving user data to Firestore:', error)
      }
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
    syncDataToFirestore,
    loadDataFromFirestore,
    forceSync,
    getOnlineStatus,
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