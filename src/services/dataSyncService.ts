import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
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
    try {
      const data = localStorage.getItem(this.dataKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      // If localStorage data is corrupted, clear it
      localStorage.removeItem(this.dataKey)
      return null
    }
  }

  /**
   * Save data to localStorage
   */
  private saveLocalData(data: LocalData): void {
    try {
      localStorage.setItem(this.dataKey, JSON.stringify(data))
    } catch (error) {
      throw new Error('Failed to save data to local storage')
    }
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
   * Handle online status change
   */
  private handleOnlineStatusChange(): void {
    // Trigger sync for all active listeners when coming back online
    this.syncListeners.forEach((listener, userId) => {
      this.triggerSync(userId).catch(() => {
        // Silent fail for background sync
      })
    })
  }

  /**
   * Trigger sync for a specific user
   */
  private async triggerSync(userId: string): Promise<void> {
    const listener = this.syncListeners.get(userId)
    if (listener && this.isOnline) {
      // Trigger a sync when coming back online
      const localData = this.getLocalData()
      if (localData) {
        await this.syncToFirestore(userId, localData).catch(() => {
          // Silent fail for background sync
        })
      }
    }
  }

  /**
   * Setup real-time sync for a user
   */
  setupRealtimeSync(userId: string, onDataChange: (data: LocalData) => void): Unsubscribe {
    if (!userId) {
      throw new Error('User ID is required for real-time sync')
    }

    // Remove existing listener if any
    this.removeRealtimeSync(userId)

    // Setup listeners for transactions, categories, and budgets
    const transactionsRef = collection(db, 'users', userId, 'transactions')
    const categoriesRef = collection(db, 'users', userId, 'categories')
    const budgetsRef = collection(db, 'users', userId, 'budgets')

    const unsubscribeTransactions = onSnapshot(
      query(transactionsRef, orderBy('createdAt', 'desc')),
      (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[]

        const localData = this.getLocalData()
        if (localData) {
          localData.transactions = transactions
          this.saveLocalData(localData)
          onDataChange(localData)
        }
      },
      (error) => {
        throw new Error(`Failed to sync transactions: ${error.message}`)
      }
    )

    const unsubscribeCategories = onSnapshot(
      categoriesRef,
      (snapshot) => {
        const categories = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[]

        // Use default categories if none found
        if (categories.length === 0) {
          categories.push(
            { id: 'food', name: 'Food & Dining', color: '#FF6B6B', icon: '🍽️' },
            { id: 'transport', name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
            { id: 'entertainment', name: 'Entertainment', color: '#45B7D1', icon: '🎬' },
            { id: 'shopping', name: 'Shopping', color: '#96CEB4', icon: '🛍️' },
            { id: 'health', name: 'Healthcare', color: '#FFEAA7', icon: '🏥' },
            { id: 'utilities', name: 'Utilities', color: '#DDA0DD', icon: '⚡' },
            { id: 'income', name: 'Income', color: '#98D8C8', icon: '💰' }
          )
        }

        const localData = this.getLocalData()
        if (localData) {
          localData.categories = categories
          this.saveLocalData(localData)
          onDataChange(localData)
        }
      },
      (error) => {
        throw new Error(`Failed to sync categories: ${error.message}`)
      }
    )

    const unsubscribeBudgets = onSnapshot(
      budgetsRef,
      (snapshot) => {
        const budgets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Budget[]

        const localData = this.getLocalData()
        if (localData) {
          localData.budgets = budgets
          this.saveLocalData(localData)
          onDataChange(localData)
        }
      },
      (error) => {
        throw new Error(`Failed to sync budgets: ${error.message}`)
      }
    )

    // Store the unsubscribe function
    const unsubscribe = () => {
      unsubscribeTransactions()
      unsubscribeCategories()
      unsubscribeBudgets()
    }

    this.syncListeners.set(userId, {
      unsubscribe,
      lastSync: Date.now()
    })

    // Return unsubscribe function
    return unsubscribe
  }

  /**
   * Remove real-time sync for a user
   */
  removeRealtimeSync(userId: string): void {
    const listener = this.syncListeners.get(userId)
    if (listener) {
      listener.unsubscribe()
      this.syncListeners.delete(userId)
    }
  }

  /**
   * Sync local data to Firestore
   */
  async syncToFirestore(userId: string, localData: LocalData): Promise<SyncResult> {
    if (!userId) {
      throw new Error('User ID is required for sync')
    }

    if (!this.isOnline) {
      return {
        success: false,
        message: 'Cannot sync while offline'
      }
    }

    try {
      const batch = writeBatch(db)
      let conflictCount = 0
      const conflicts: SyncResult['conflicts'] = {
        transactions: [],
        categories: [],
        budgets: []
      }

      // Sync transactions
      for (const transaction of localData.transactions) {
        const transactionRef = doc(db, 'users', userId, 'transactions', transaction.id)
        
        try {
          const existingDoc = await getDoc(transactionRef)
          
          if (!existingDoc.exists()) {
            // New transaction
            batch.set(transactionRef, {
              ...transaction,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
          } else {
            // Check for conflicts
            const existingData = existingDoc.data()
            if (this.isNewer(transaction.updatedAt, existingData.updatedAt)) {
              batch.update(transactionRef, {
                ...transaction,
                updatedAt: serverTimestamp()
              })
            } else {
              conflictCount++
              conflicts.transactions?.push(transaction)
            }
          }
        } catch (error) {
          throw new Error(`Failed to sync transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Sync categories
      for (const category of localData.categories) {
        const categoryRef = doc(db, 'users', userId, 'categories', category.id)
        
        try {
          const existingDoc = await getDoc(categoryRef)
          
          if (!existingDoc.exists()) {
            batch.set(categoryRef, {
              ...category,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
          } else {
            const existingData = existingDoc.data()
            if (this.isNewer(category.updatedAt, existingData.updatedAt)) {
              batch.update(categoryRef, {
                ...category,
                updatedAt: serverTimestamp()
              })
            } else {
              conflictCount++
              conflicts.categories?.push(category)
            }
          }
        } catch (error) {
          throw new Error(`Failed to sync category ${category.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Sync budgets
      for (const budget of localData.budgets) {
        const budgetRef = doc(db, 'users', userId, 'budgets', budget.id)
        
        try {
          const existingDoc = await getDoc(budgetRef)
          
          if (!existingDoc.exists()) {
            batch.set(budgetRef, {
              ...budget,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
          } else {
            const existingData = existingDoc.data()
            if (this.isNewer(budget.updatedAt, existingData.updatedAt)) {
              batch.update(budgetRef, {
                ...budget,
                updatedAt: serverTimestamp()
              })
            } else {
              conflictCount++
              conflicts.budgets?.push(budget)
            }
          }
        } catch (error) {
          throw new Error(`Failed to sync budget ${budget.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Commit the batch
      await batch.commit()
      
      // Update sync timestamp
      this.updateSyncTimestamp()

      return {
        success: true,
        message: conflictCount > 0 
          ? `Sync completed with ${conflictCount} conflicts` 
          : 'Sync completed successfully',
        conflicts: conflictCount > 0 ? conflicts : undefined,
        data: localData
      }
    } catch (error) {
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Sync data from Firestore to local storage
   */
  async syncFromFirestore(userId: string): Promise<{ success: boolean; data?: LocalData; message: string }> {
    if (!userId) {
      throw new Error('User ID is required for sync')
    }

    if (!this.isOnline) {
      return {
        success: false,
        message: 'Cannot sync while offline'
      }
    }

    try {
      // Get transactions
      const transactionsRef = collection(db, 'users', userId, 'transactions')
      const transactionsQuery = query(transactionsRef, orderBy('createdAt', 'desc'))
      const transactionsSnapshot = await getDocs(transactionsQuery)
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[]

      // Get categories
      const categoriesRef = collection(db, 'users', userId, 'categories')
      const categoriesSnapshot = await getDocs(categoriesRef)
      let categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]

      // Use default categories if none found
      if (categories.length === 0) {
        categories = [
          { id: 'food', name: 'Food & Dining', color: '#FF6B6B', icon: '🍽️' },
          { id: 'transport', name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
          { id: 'entertainment', name: 'Entertainment', color: '#45B7D1', icon: '🎬' },
          { id: 'shopping', name: 'Shopping', color: '#96CEB4', icon: '🛍️' },
          { id: 'health', name: 'Healthcare', color: '#FFEAA7', icon: '🏥' },
          { id: 'utilities', name: 'Utilities', color: '#DDA0DD', icon: '⚡' },
          { id: 'income', name: 'Income', color: '#98D8C8', icon: '💰' }
        ]
      }

      // Get budgets
      const budgetsRef = collection(db, 'users', userId, 'budgets')
      const budgetsSnapshot = await getDocs(budgetsRef)
      const budgets = budgetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Budget[]

      // Create local data object
      const localData: LocalData = {
        transactions,
        categories,
        budgets,
        user: {
          id: userId,
          name: 'User',
          email: '',
          preferences: {
            theme: 'light',
            currency: 'USD'
          }
        }
      }

      // Save to localStorage
      this.saveLocalData(localData)
      this.updateSyncTimestamp()

      return {
        success: true,
        data: localData,
        message: 'Data synced from Firestore successfully'
      }
    } catch (error) {
      throw new Error(`Failed to sync from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Merge local and remote data
   */
  async mergeData(userId: string, localData: LocalData): Promise<SyncResult> {
    if (!userId) {
      throw new Error('User ID is required for merge')
    }

    try {
      // First sync from Firestore to get latest remote data
      const remoteSync = await this.syncFromFirestore(userId)
      if (!remoteSync.success || !remoteSync.data) {
        throw new Error('Failed to get remote data for merge')
      }

      const remoteData = remoteSync.data
      const mergedData: LocalData = {
        transactions: [...localData.transactions, ...remoteData.transactions],
        categories: remoteData.categories.length > 0 ? remoteData.categories : localData.categories,
        budgets: [...localData.budgets, ...remoteData.budgets],
        user: localData.user
      }

      // Save merged data
      this.saveLocalData(mergedData)

      return {
        success: true,
        message: 'Data merged successfully',
        data: mergedData
      }
    } catch (error) {
      throw new Error(`Failed to merge data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if sync is needed
   */
  isSyncNeeded(): boolean {
    const lastSync = this.getLastSyncTimestamp()
    const now = Date.now()
    return now - lastSync > 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Force sync regardless of timestamp
   */
  async forceSync(userId: string, localData: LocalData): Promise<SyncResult> {
    return this.syncToFirestore(userId, localData)
  }

  /**
   * Clear sync timestamp
   */
  clearSyncTimestamp(): void {
    localStorage.removeItem(this.syncKey)
  }

  /**
   * Get online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * Initialize sync for a user
   */
  async initializeSync(userId: string, onDataChange: (data: LocalData) => void): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required for sync initialization')
    }

    try {
      // Setup real-time sync
      this.setupRealtimeSync(userId, onDataChange)

      // Initial sync from Firestore
      await this.syncFromFirestore(userId)
    } catch (error) {
      throw new Error(`Failed to initialize sync: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Cleanup sync for a user
   */
  cleanupSync(userId: string): void {
    this.removeRealtimeSync(userId)
  }
}

export const dataSyncService = new DataSyncService()
export default dataSyncService 