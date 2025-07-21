import AsyncStorage from '@react-native-async-storage/async-storage'
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
import NetInfo from '@react-native-community/netinfo'

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
  private isOnline: boolean = true

  constructor() {
    // Listen for network status changes in React Native
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline
      this.isOnline = state.isConnected ?? false
      
      if (!wasOnline && this.isOnline) {
        this.handleOnlineStatusChange()
      }
    })
  }

  /**
   * Get the last sync timestamp from AsyncStorage
   */
  private async getLastSyncTimestamp(): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem(this.syncKey)
      return timestamp ? parseInt(timestamp, 10) : 0
    } catch (error) {
      console.error('Error getting sync timestamp:', error)
      return 0
    }
  }

  /**
   * Update the last sync timestamp
   */
  private async updateSyncTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.syncKey, Date.now().toString())
    } catch (error) {
      console.error('Error updating sync timestamp:', error)
    }
  }

  /**
   * Get local data from AsyncStorage
   */
  private async getLocalData(): Promise<LocalData | null> {
    try {
      const data = await AsyncStorage.getItem(this.dataKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error getting local data:', error)
      return null
    }
  }

  /**
   * Save data to AsyncStorage
   */
  private async saveLocalData(data: LocalData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.dataKey, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving local data:', error)
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
   * Handle network connection change
   */
  private async handleOnlineStatusChange(): Promise<void> {
    if (this.isOnline) {
      // Auto-sync when coming back online
      try {
        await this.syncData()
      } catch (error) {
        console.error('Auto-sync failed:', error)
      }
    }
  }

  /**
   * Check if device is online
   */
  public getOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * Sync data with Firestore
   */
  public async syncData(userId?: string): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        message: 'Device is offline. Data will sync when connection is restored.'
      }
    }

    try {
      const localData = await this.getLocalData()
      const lastSync = await this.getLastSyncTimestamp()

      if (!userId && !localData?.user?.id) {
        return {
          success: false,
          message: 'No user ID provided and no local user data found'
        }
      }

      const userIdToUse = userId || localData!.user.id

      // Fetch data from Firestore
      const firestoreData = await this.fetchFirestoreData(userIdToUse)

      if (!localData) {
        // First time sync - save Firestore data locally
        await this.saveLocalData(firestoreData)
        await this.updateSyncTimestamp()
        return {
          success: true,
          message: 'Initial sync completed',
          data: firestoreData
        }
      }

      // Merge local and Firestore data
      const mergedData = await this.mergeData(localData, firestoreData)
      
      // Save merged data locally
      await this.saveLocalData(mergedData)
      
      // Upload any local changes to Firestore
      await this.uploadToFirestore(userIdToUse, mergedData)
      
      await this.updateSyncTimestamp()

      return {
        success: true,
        message: 'Data synchronized successfully',
        data: mergedData
      }
    } catch (error) {
      console.error('Sync error:', error)
      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Fetch data from Firestore
   */
  private async fetchFirestoreData(userId: string): Promise<LocalData> {
    const [transactions, categories, budgets, userData] = await Promise.all([
      this.fetchCollection('transactions', userId),
      this.fetchCollection('categories', userId),
      this.fetchCollection('budgets', userId),
      this.fetchUser(userId)
    ])

    return {
      transactions: transactions as Transaction[],
      categories: categories as Category[],
      budgets: budgets as Budget[],
      user: userData as User
    }
  }

  /**
   * Fetch a collection from Firestore
   */
  private async fetchCollection(collectionName: string, userId: string): Promise<any[]> {
    const q = query(
      collection(db, 'users', userId, collectionName),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  /**
   * Fetch user data from Firestore
   */
  private async fetchUser(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', userId))
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as User : null
  }

  /**
   * Merge local and Firestore data
   */
  private async mergeData(localData: LocalData, firestoreData: LocalData): Promise<LocalData> {
    return {
      transactions: this.mergeArrays(localData.transactions, firestoreData.transactions),
      categories: this.mergeArrays(localData.categories, firestoreData.categories),
      budgets: this.mergeArrays(localData.budgets, firestoreData.budgets),
      user: this.mergeUser(localData.user, firestoreData.user)
    }
  }

  /**
   * Merge arrays of items based on ID and timestamp
   */
  private mergeArrays(localItems: any[], firestoreItems: any[]): any[] {
    const merged = new Map<string, any>()

    // Add Firestore items first
    firestoreItems.forEach(item => {
      merged.set(item.id, item)
    })

    // Add local items, overwriting if they're newer
    localItems.forEach(item => {
      const existing = merged.get(item.id)
      if (!existing || this.isNewer(item.createdAt || item.updatedAt, existing.createdAt || existing.updatedAt)) {
        merged.set(item.id, item)
      }
    })

    return Array.from(merged.values())
  }

  /**
   * Merge user data
   */
  private mergeUser(localUser: User, firestoreUser: User | null): User {
    if (!firestoreUser) return localUser
    
    return this.isNewer(localUser.updatedAt, firestoreUser.updatedAt) 
      ? localUser 
      : firestoreUser
  }

  /**
   * Upload data to Firestore
   */
  private async uploadToFirestore(userId: string, data: LocalData): Promise<void> {
    const batch = writeBatch(db)

    // Upload user data
    batch.set(doc(db, 'users', userId), {
      ...data.user,
      updatedAt: serverTimestamp()
    })

    // Upload transactions
    data.transactions.forEach(transaction => {
      const docRef = doc(db, 'users', userId, 'transactions', transaction.id)
      batch.set(docRef, {
        ...transaction,
        updatedAt: serverTimestamp()
      })
    })

    // Upload categories
    data.categories.forEach(category => {
      const docRef = doc(db, 'users', userId, 'categories', category.id)
      batch.set(docRef, {
        ...category,
        updatedAt: serverTimestamp()
      })
    })

    // Upload budgets
    data.budgets.forEach(budget => {
      const docRef = doc(db, 'users', userId, 'budgets', budget.id)
      batch.set(docRef, {
        ...budget,
        updatedAt: serverTimestamp()
      })
    })

    await batch.commit()
  }

  /**
   * Set up real-time listeners for a user
   */
  public setupRealtimeSync(userId: string, onDataChange: (data: LocalData) => void): SyncListener {
    const listeners: Unsubscribe[] = []

    // Listen to transactions
    const transactionsQuery = query(
      collection(db, 'users', userId, 'transactions'),
      orderBy('createdAt', 'desc')
    )
    
    listeners.push(onSnapshot(transactionsQuery, async (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[]
      const localData = await this.getLocalData()
      if (localData) {
        const updatedData = { ...localData, transactions }
        await this.saveLocalData(updatedData)
        onDataChange(updatedData)
      }
    }))

    // Listen to categories
    const categoriesQuery = query(
      collection(db, 'users', userId, 'categories'),
      orderBy('createdAt', 'desc')
    )
    
    listeners.push(onSnapshot(categoriesQuery, async (snapshot) => {
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]
      const localData = await this.getLocalData()
      if (localData) {
        const updatedData = { ...localData, categories }
        await this.saveLocalData(updatedData)
        onDataChange(updatedData)
      }
    }))

    // Listen to budgets
    const budgetsQuery = query(
      collection(db, 'users', userId, 'budgets'),
      orderBy('createdAt', 'desc')
    )
    
    listeners.push(onSnapshot(budgetsQuery, async (snapshot) => {
      const budgets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Budget[]
      const localData = await this.getLocalData()
      if (localData) {
        const updatedData = { ...localData, budgets }
        await this.saveLocalData(updatedData)
        onDataChange(updatedData)
      }
    }))

    const unsubscribe = () => {
      listeners.forEach(unsub => unsub())
    }

    const syncListener: SyncListener = {
      unsubscribe,
      lastSync: Date.now()
    }

    this.syncListeners.set(userId, syncListener)
    return syncListener
  }

  /**
   * Remove real-time listeners for a user
   */
  public removeRealtimeSync(userId: string): void {
    const listener = this.syncListeners.get(userId)
    if (listener) {
      listener.unsubscribe()
      this.syncListeners.delete(userId)
    }
  }

  /**
   * Force sync data (useful for manual refresh)
   */
  public async forceSync(userId: string): Promise<SyncResult> {
    return this.syncData(userId)
  }

  /**
   * Clear all local data
   */
  public async clearLocalData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.dataKey, this.syncKey])
    } catch (error) {
      console.error('Error clearing local data:', error)
    }
  }
}

export const dataSyncService = new DataSyncService() 