import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Transaction, Category, Budget, BudgetStats, User } from '../types'
import { generateCurrentMonthData } from '../utils/resetData'
import { useAuth } from './AuthContext'
import { dataSyncService, LocalData } from '../services/dataSyncService'
import { db } from '../config/firebase'
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'

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
const STORAGE_KEY = 'budget-app-data'
const initialState: BudgetState = generateCurrentMonthData()

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] }
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) }
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] }
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) }
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] }
    case 'UPDATE_BUDGET':
      return { ...state, budgets: state.budgets.map(b => b.id === action.payload.id ? action.payload : b) }
    case 'DELETE_BUDGET':
      return { ...state, budgets: state.budgets.filter(b => b.id !== action.payload) }
    case 'UPDATE_USER':
      return { ...state, user: action.payload }
    case 'LOAD_DATA':
      return action.payload
    case 'SYNC_TRANSACTIONS':
      return { ...state, transactions: action.payload }
    case 'SYNC_CATEGORIES':
      return { ...state, categories: action.payload }
    case 'SYNC_BUDGETS':
      return { ...state, budgets: action.payload }
    default:
      return state
  }
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState)
  const { currentUser } = useAuth()
  const isInitialized = useRef(false)
  const syncInProgress = useRef(false)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSyncRef = useRef({ transactions: '', categories: '', budgets: '', user: '' })

  // Load from AsyncStorage for unauthenticated users
  useEffect(() => {
    if (!currentUser) {
      AsyncStorage.getItem(STORAGE_KEY).then(saved => {
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
              parsed.categories = generateCurrentMonthData().categories
            }
            dispatch({ type: 'LOAD_DATA', payload: parsed })
          } catch (e) {
            console.error('Error loading saved data:', e)
          }
        }
      })
    }
  }, [currentUser])

  // Initialize sync when authenticated
  useEffect(() => {
    if (currentUser && !isInitialized.current) {
      isInitialized.current = true
      dataSyncService.initializeSync(currentUser.uid, (data: LocalData) => {
        dispatch({ type: 'SYNC_TRANSACTIONS', payload: data.transactions })
        dispatch({ type: 'SYNC_CATEGORIES', payload: data.categories })
        dispatch({ type: 'SYNC_BUDGETS', payload: data.budgets })
        dispatch({ type: 'UPDATE_USER', payload: data.user })
      })
    }
    return () => {
      if (currentUser) dataSyncService.cleanupSync(currentUser.uid)
    }
  }, [currentUser])

  // Save to AsyncStorage for unauthenticated users
  useEffect(() => {
    if (!currentUser) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, currentUser])

  // Auto-sync for authenticated users
  useEffect(() => {
    if (!currentUser) return
    const curTxns = JSON.stringify(state.transactions)
    const curCats = JSON.stringify(state.categories)
    const curBudgets = JSON.stringify(state.budgets)
    const curUser = JSON.stringify(state.user)
    const hasChanged =
      curTxns !== lastSyncRef.current.transactions ||
      curCats !== lastSyncRef.current.categories ||
      curBudgets !== lastSyncRef.current.budgets ||
      curUser !== lastSyncRef.current.user

    if (hasChanged) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = setTimeout(() => {
        syncDataToFirestore()
        lastSyncRef.current = { transactions: curTxns, categories: curCats, budgets: curBudgets, user: curUser }
      }, 2000)
    }
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current) }
  }, [state.transactions, state.categories, state.budgets, state.user, currentUser])

  // Recalculate stats
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthly = state.transactions.filter(t => t.date.startsWith(currentMonth))
    const totalIncome = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalInvestments = monthly.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0)
    const balance = totalIncome - totalExpenses - totalInvestments
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
    const monthlyBudget = state.budgets.filter(b => b.period === 'monthly').reduce((s, b) => s + b.amount, 0)
    const budgetUsed = state.budgets.filter(b => b.period === 'monthly').reduce((s, b) => s + b.spent, 0)
    const newStats = { totalIncome, totalExpenses, totalInvestments, balance, savingsRate, monthlyBudget, budgetUsed }
    if (JSON.stringify(state.stats) !== JSON.stringify(newStats)) {
      dispatch({ type: 'LOAD_DATA', payload: { ...state, stats: newStats } })
    }
  }, [state.transactions, state.budgets])

  const syncDataToFirestore = async () => {
    if (!currentUser || syncInProgress.current) return
    syncInProgress.current = true
    try {
      await dataSyncService.syncToFirestore(currentUser.uid, {
        transactions: state.transactions,
        categories: state.categories,
        budgets: state.budgets,
        user: state.user,
      })
    } catch (e) {
      console.error('Sync error:', e)
    } finally {
      syncInProgress.current = false
    }
  }

  const loadDataFromFirestore = async () => {
    if (!currentUser) return
    const result = await dataSyncService.syncFromFirestore(currentUser.uid)
    if (result.success && result.data) {
      dispatch({ type: 'SYNC_TRANSACTIONS', payload: result.data.transactions })
      dispatch({ type: 'SYNC_CATEGORIES', payload: result.data.categories })
      dispatch({ type: 'SYNC_BUDGETS', payload: result.data.budgets })
      dispatch({ type: 'UPDATE_USER', payload: result.data.user })
    }
  }

  const forceSync = async () => {
    if (!currentUser) return
    const result = await dataSyncService.forceSync(currentUser.uid, {
      transactions: state.transactions,
      categories: state.categories,
      budgets: state.budgets,
      user: state.user,
    })
    if (result.success && result.data) {
      dispatch({ type: 'SYNC_TRANSACTIONS', payload: result.data.transactions })
      dispatch({ type: 'SYNC_CATEGORIES', payload: result.data.categories })
      dispatch({ type: 'SYNC_BUDGETS', payload: result.data.budgets })
      dispatch({ type: 'UPDATE_USER', payload: result.data.user })
    }
  }

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction })
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'transactions', newTransaction.id), {
          ...newTransaction, updatedAt: serverTimestamp()
        })
      } catch (e) { console.error('Error saving transaction:', e) }
    }
  }

  const deleteTransaction = async (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id })
    if (currentUser) {
      try { await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', id)) }
      catch (e) { console.error('Error deleting transaction:', e) }
    }
  }

  const addCategory = async (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    }
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory })
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'categories', newCategory.id), {
          ...newCategory, updatedAt: serverTimestamp()
        })
      } catch (e) { console.error('Error saving category:', e) }
    }
  }

  const deleteCategory = async (id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id })
    if (currentUser) {
      try { await deleteDoc(doc(db, 'users', currentUser.uid, 'categories', id)) }
      catch (e) { console.error('Error deleting category:', e) }
    }
  }

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    }
    dispatch({ type: 'ADD_BUDGET', payload: newBudget })
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'budgets', newBudget.id), {
          ...newBudget, updatedAt: serverTimestamp()
        })
      } catch (e) { console.error('Error saving budget:', e) }
    }
  }

  const updateBudget = async (budget: Budget) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: budget })
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'budgets', budget.id),
          { ...budget, updatedAt: serverTimestamp() }, { merge: true })
      } catch (e) { console.error('Error updating budget:', e) }
    }
  }

  const deleteBudget = async (id: string) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id })
    if (currentUser) {
      try { await deleteDoc(doc(db, 'users', currentUser.uid, 'budgets', id)) }
      catch (e) { console.error('Error deleting budget:', e) }
    }
  }

  const updateUser = async (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user })
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid),
          { ...user, updatedAt: new Date().toISOString() }, { merge: true })
      } catch (e) { console.error('Error saving user:', e) }
    }
  }

  const getOnlineStatus = () => dataSyncService.getOnlineStatus()

  return (
    <BudgetContext.Provider value={{
      state, dispatch,
      addTransaction, deleteTransaction,
      addCategory, deleteCategory,
      addBudget, updateBudget, deleteBudget,
      updateUser,
      syncDataToFirestore, loadDataFromFirestore, forceSync,
      getOnlineStatus,
    }}>
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudget() {
  const context = useContext(BudgetContext)
  if (context === undefined) throw new Error('useBudget must be used within a BudgetProvider')
  return context
}
