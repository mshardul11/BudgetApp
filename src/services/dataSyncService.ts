import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  deleteDoc,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Transaction, Category, Budget, User } from '../types'

export interface SyncResult {
  success: boolean
  message: string
  conflicts?: {
    transactions?: Transaction[]
    categories?: Category[]
    budgets?: Budget[]
  }
  data?: LocalData
}

export interface LocalData {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  user: User
}

export interface SyncListener {
  unsubscribe: () => void
  lastSync: number
}

class DataSyncService {
  private readonly syncKey = 'budget-app-sync-timestamp'
  private readonly dataKey = 'budget-app-data'
  private syncListeners: Map<string, SyncListener> = new Map()
  private isOnline: boolean = navigator.onLine

  constructor() {
    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.handleOnlineStatusChange()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  /**
   * Get the last sync timestamp from localStorage
   */
  private getLastSyncTimestamp(): number {
    const timestamp = localStorage.getItem(this.syncKey)
    return timestamp ? parseInt(timestamp, 10) : 0
  }

  /**
   * Update the last sync timestamp
   */
  private updateSyncTimestamp(): void {
    localStorage.setItem(this.syncKey, Date.now().toString())
  }

  /**
   * Get local data from localStorage
   */
  private getLocalData(): LocalData | null {
    const data = localStorage.getItem(this.dataKey)
    return data ? JSON.parse(data) : null
  }

  /**
   * Save data to localStorage
   */
  private saveLocalData(data: LocalData): void {
    localStorage.setItem(this.dataKey, JSON.stringify(data))
  }

  /**
   * Compare timestamps to determine which data is newer
   */
  private isNewer(localTimestamp: string, firestoreTimestamp: any): boolean {
    const localTime = new Date(localTimestamp).getTime()
    const firestoreTime = firestoreTimestamp instanceof Timestamp 
      ? firestoreTimestamp.toMillis() 
      : new Date(firestoreTimestamp).getTime()
    
    return localTime > firestoreTime
  }

  /**
   * Handle online status change - trigger sync when coming back online
   */
  private handleOnlineStatusChange(): void {
    // Trigger sync for all active listeners
    this.syncListeners.forEach((listener, userId) => {
      this.triggerSync(userId)
    })
  }

  /**
   * Trigger a sync for a specific user
   */
  private async triggerSync(userId: string): Promise<void> {
    const localData = this.getLocalData()
    if (localData) {
      await this.mergeData(userId, localData)
    }
  }

  /**
   * Set up real-time sync listeners for a user
   */
  setupRealtimeSync(userId: string, onDataChange: (data: LocalData) => void): Unsubscribe {
    // Remove existing listener if any
    this.removeRealtimeSync(userId)

    const listeners: Unsubscribe[] = []
    let lastSync = Date.now()

    // Listen to transactions
    const transactionsQuery = query(
      collection(db, 'users', userId, 'transactions'),
      orderBy('createdAt', 'desc')
    )
    const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactions: Transaction[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        transactions.push({
          id: doc.id,
          type: data.type,
          amount: data.amount,
          description: data.description,
          category: data.category,
          date: data.date,
          createdAt: data.createdAt,
        })
      })

      // Update local data
      const localData = this.getLocalData()
      if (localData) {
        const updatedData = { ...localData, transactions }
        this.saveLocalData(updatedData)
        onDataChange(updatedData)
        lastSync = Date.now()
      }
    })

    // Listen to categories
    const categoriesQuery = query(
      collection(db, 'users', userId, 'categories'),
      orderBy('name')
    )
    const categoriesUnsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const categories: Category[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        categories.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          color: data.color,
          icon: data.icon,
        })
      })

      // Update local data
      const localData = this.getLocalData()
      if (localData) {
        const updatedData = { ...localData, categories }
        this.saveLocalData(updatedData)
        onDataChange(updatedData)
        lastSync = Date.now()
      }
    })

    // Listen to budgets
    const budgetsQuery = query(
      collection(db, 'users', userId, 'budgets'),
      orderBy('startDate')
    )
    const budgetsUnsubscribe = onSnapshot(budgetsQuery, (snapshot) => {
      const budgets: Budget[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        budgets.push({
          id: doc.id,
          category: data.category,
          amount: data.amount,
          spent: data.spent,
          period: data.period,
          startDate: data.startDate,
        })
      })

      // Update local data
      const localData = this.getLocalData()
      if (localData) {
        const updatedData = { ...localData, budgets }
        this.saveLocalData(updatedData)
        onDataChange(updatedData)
        lastSync = Date.now()
      }
    })

    // Listen to user data
    const userUnsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        const userData = doc.data()
        const user: User = {
          id: userId,
          name: userData.name || '',
          email: userData.email || '',
          avatar: userData.avatar || undefined,
          currency: userData.currency || 'USD',
          timezone: userData.timezone || 'America/New_York',
          monthlyIncomeGoal: userData.monthlyIncomeGoal || 0,
          monthlyExpenseGoal: userData.monthlyExpenseGoal || 0,
          savingsGoal: userData.savingsGoal || 0,
          notifications: userData.notifications || {
            email: true,
            push: true,
            budgetAlerts: true,
            weeklyReports: false,
          },
          preferences: userData.preferences || {
            theme: 'light',
            language: 'en',
            dateFormat: 'MM/dd/yyyy',
            currencyFormat: '$#,##0.00',
          },
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        }

        // Update local data
        const localData = this.getLocalData()
        if (localData) {
          const updatedData = { ...localData, user }
          this.saveLocalData(updatedData)
          onDataChange(updatedData)
          lastSync = Date.now()
        }
      }
    })

    listeners.push(transactionsUnsubscribe, categoriesUnsubscribe, budgetsUnsubscribe, userUnsubscribe)

    // Store the listener
    this.syncListeners.set(userId, {
      unsubscribe: () => listeners.forEach(unsub => unsub()),
      lastSync
    })

    // Return unsubscribe function
    return () => this.removeRealtimeSync(userId)
  }

  /**
   * Remove real-time sync listeners for a user
   */
  removeRealtimeSync(userId: string): void {
    const listener = this.syncListeners.get(userId)
    if (listener) {
      listener.unsubscribe()
      this.syncListeners.delete(userId)
    }
  }

  /**
   * Sync local data to Firestore with conflict resolution
   */
  async syncToFirestore(userId: string, localData: LocalData): Promise<SyncResult> {
    try {
      const batch = writeBatch(db)
      const conflicts: any = {}

      // Sync transactions
      const transactionsRef = collection(db, 'users', userId, 'transactions')
      const existingTransactions = await getDocs(transactionsRef)
      const existingTransactionMap = new Map()
      
      existingTransactions.forEach(doc => {
        const data = doc.data()
        existingTransactionMap.set(doc.id, data)
      })

      for (const transaction of localData.transactions) {
        const existing = existingTransactionMap.get(transaction.id)
        
        if (!existing) {
          // New transaction - add to Firestore
          const transactionRef = doc(transactionsRef, transaction.id)
          batch.set(transactionRef, {
            ...transaction,
            updatedAt: serverTimestamp()
          })
        } else if (this.isNewer(transaction.createdAt, existing.updatedAt || existing.createdAt)) {
          // Local transaction is newer - update Firestore
          const transactionRef = doc(transactionsRef, transaction.id)
          batch.set(transactionRef, {
            ...transaction,
            updatedAt: serverTimestamp()
          })
        } else if (this.isNewer(existing.updatedAt || existing.createdAt, transaction.createdAt)) {
          // Firestore transaction is newer - mark as conflict
          if (!conflicts.transactions) conflicts.transactions = []
          conflicts.transactions.push(transaction)
        }
      }

      // Sync categories
      const categoriesRef = collection(db, 'users', userId, 'categories')
      const existingCategories = await getDocs(categoriesRef)
      const existingCategoryMap = new Map()
      
      existingCategories.forEach(doc => {
        const data = doc.data()
        existingCategoryMap.set(doc.id, data)
      })

      for (const category of localData.categories) {
        const existing = existingCategoryMap.get(category.id)
        
        if (!existing) {
          // New category - add to Firestore
          const categoryRef = doc(categoriesRef, category.id)
          batch.set(categoryRef, {
            ...category,
            updatedAt: serverTimestamp()
          })
        } else if (this.isNewer(category.id, existing.updatedAt || existing.createdAt)) {
          // Local category is newer - update Firestore
          const categoryRef = doc(categoriesRef, category.id)
          batch.set(categoryRef, {
            ...category,
            updatedAt: serverTimestamp()
          })
        } else if (this.isNewer(existing.updatedAt || existing.createdAt, category.id)) {
          // Firestore category is newer - mark as conflict
          if (!conflicts.categories) conflicts.categories = []
          conflicts.categories.push(category)
        }
      }

      // Sync budgets
      const budgetsRef = collection(db, 'users', userId, 'budgets')
      const existingBudgets = await getDocs(budgetsRef)
      const existingBudgetMap = new Map()
      
      existingBudgets.forEach(doc => {
        const data = doc.data()
        existingBudgetMap.set(doc.id, data)
      })

      for (const budget of localData.budgets) {
        const existing = existingBudgetMap.get(budget.id)
        
        if (!existing) {
          // New budget - add to Firestore
          const budgetRef = doc(budgetsRef, budget.id)
          batch.set(budgetRef, {
            ...budget,
            updatedAt: serverTimestamp()
          })
        } else if (this.isNewer(budget.id, existing.updatedAt || existing.createdAt)) {
          // Local budget is newer - update Firestore
          const budgetRef = doc(budgetsRef, budget.id)
          batch.set(budgetRef, {
            ...budget,
            updatedAt: serverTimestamp()
          })
        } else if (this.isNewer(existing.updatedAt || existing.createdAt, budget.id)) {
          // Firestore budget is newer - mark as conflict
          if (!conflicts.budgets) conflicts.budgets = []
          conflicts.budgets.push(budget)
        }
      }

      await batch.commit()
      this.updateSyncTimestamp()

      return {
        success: true,
        message: 'Data synced successfully',
        conflicts: Object.keys(conflicts).length > 0 ? conflicts : undefined
      }
    } catch (error) {
      console.error('Error syncing to Firestore:', error)
      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Sync Firestore data to local storage
   */
  async syncFromFirestore(userId: string): Promise<{ success: boolean; data?: LocalData; message: string }> {
    try {
      // Load transactions
      const transactionsQuery = query(
        collection(db, 'users', userId, 'transactions'),
        orderBy('createdAt', 'desc')
      )
      const transactionsSnapshot = await getDocs(transactionsQuery)
      const transactions: Transaction[] = []
      
      transactionsSnapshot.forEach((doc) => {
        const data = doc.data()
        transactions.push({
          id: doc.id,
          type: data.type,
          amount: data.amount,
          description: data.description,
          category: data.category,
          date: data.date,
          createdAt: data.createdAt,
        })
      })

      // Load categories
      const categoriesQuery = query(
        collection(db, 'users', userId, 'categories'),
        orderBy('name')
      )
      const categoriesSnapshot = await getDocs(categoriesQuery)
      const categories: Category[] = []
      
      categoriesSnapshot.forEach((doc) => {
        const data = doc.data()
        categories.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          color: data.color,
          icon: data.icon,
        })
      })

      // Load budgets
      const budgetsQuery = query(
        collection(db, 'users', userId, 'budgets'),
        orderBy('startDate')
      )
      const budgetsSnapshot = await getDocs(budgetsQuery)
      const budgets: Budget[] = []
      
      budgetsSnapshot.forEach((doc) => {
        const data = doc.data()
        budgets.push({
          id: doc.id,
          category: data.category,
          amount: data.amount,
          spent: data.spent,
          period: data.period,
          startDate: data.startDate,
        })
      })

      // Load user data
      const userDoc = await getDoc(doc(db, 'users', userId))
      let user: User
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        user = {
          id: userId,
          name: userData.name || '',
          email: userData.email || '',
          avatar: userData.avatar || undefined,
          currency: userData.currency || 'USD',
          timezone: userData.timezone || 'America/New_York',
          monthlyIncomeGoal: userData.monthlyIncomeGoal || 0,
          monthlyExpenseGoal: userData.monthlyExpenseGoal || 0,
          savingsGoal: userData.savingsGoal || 0,
          notifications: userData.notifications || {
            email: true,
            push: true,
            budgetAlerts: true,
            weeklyReports: false,
          },
          preferences: userData.preferences || {
            theme: 'light',
            language: 'en',
            dateFormat: 'MM/dd/yyyy',
            currencyFormat: '$#,##0.00',
          },
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        }
      } else {
        throw new Error('User document not found')
      }

      const data: LocalData = {
        transactions,
        categories,
        budgets,
        user
      }

      // Save to localStorage
      this.saveLocalData(data)
      this.updateSyncTimestamp()

      return {
        success: true,
        data,
        message: 'Data loaded from Firestore successfully'
      }
    } catch (error) {
      console.error('Error syncing from Firestore:', error)
      return {
        success: false,
        message: `Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Merge local and remote data with conflict resolution
   */
  async mergeData(userId: string, localData: LocalData): Promise<SyncResult> {
    try {
      // First, sync local data to Firestore
      const syncResult = await this.syncToFirestore(userId, localData)
      
      if (!syncResult.success) {
        return syncResult
      }

      // Then, load the latest data from Firestore
      const loadResult = await this.syncFromFirestore(userId)
      
      if (!loadResult.success) {
        return {
          success: false,
          message: `Merge failed: ${loadResult.message}`
        }
      }

      return {
        success: true,
        message: 'Data merged successfully',
        conflicts: syncResult.conflicts,
        data: loadResult.data
      }
    } catch (error) {
      console.error('Error merging data:', error)
      return {
        success: false,
        message: `Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check if sync is needed based on last sync timestamp
   */
  isSyncNeeded(): boolean {
    const lastSync = this.getLastSyncTimestamp()
    const now = Date.now()
    const syncInterval = 5 * 60 * 1000 // 5 minutes
    
    return (now - lastSync) > syncInterval
  }

  /**
   * Force a complete sync regardless of timestamp
   */
  async forceSync(userId: string, localData: LocalData): Promise<SyncResult> {
    return this.mergeData(userId, localData)
  }

  /**
   * Clear sync timestamp (useful for testing or reset)
   */
  clearSyncTimestamp(): void {
    localStorage.removeItem(this.syncKey)
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * Initialize sync for a user
   */
  async initializeSync(userId: string, onDataChange: (data: LocalData) => void): Promise<void> {
    // Load initial data from Firestore
    const loadResult = await this.syncFromFirestore(userId)
    
    if (loadResult.success && loadResult.data) {
      onDataChange(loadResult.data)
    }

    // Set up real-time sync
    this.setupRealtimeSync(userId, onDataChange)
  }

  /**
   * Cleanup sync for a user
   */
  cleanupSync(userId: string): void {
    this.removeRealtimeSync(userId)
  }
}

export const dataSyncService = new DataSyncService() 