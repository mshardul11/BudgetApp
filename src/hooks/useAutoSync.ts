import { useEffect, useRef } from 'react'
import { useBudget } from '../context/BudgetContext'
import { useAuth } from '../context/AuthContext'

export const useAutoSync = () => {
  const { state, syncDataToFirestore } = useBudget()
  const { currentUser } = useAuth()
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
    currentUser,
    syncDataToFirestore
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])
} 