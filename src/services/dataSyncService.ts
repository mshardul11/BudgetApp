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
import NetInfo from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
  private isOnline: boolean = true

  constructor() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline
      this.isOnline = state.isConnected ?? true
      if (wasOffline && this.isOnline) {
        this.handleOnlineStatusChange()
      }
    })
  }

  private async getLastSyncTimestamp(): Promise<number> {
    const timestamp = await AsyncStorage.getItem(this.syncKey)
    return timestamp ? parseInt(timestamp, 10) : 0
  }

  private async updateSyncTimestamp(): Promise<void> {
    await AsyncStorage.setItem(this.syncKey, Date.now().toString())
  }

  private async getLocalData(): Promise<LocalData | null> {
    const data = await AsyncStorage.getItem(this.dataKey)
    return data ? JSON.parse(data) : null
  }

  private async saveLocalData(data: LocalData): Promise<void> {
    await AsyncStorage.setItem(this.dataKey, JSON.stringify(data))
  }

  private isNewer(localTimestamp: string, firestoreTimestamp: any): boolean {
    const localTime = new Date(localTimestamp).getTime()
    const firestoreTime = firestoreTimestamp instanceof Timestamp
      ? firestoreTimestamp.toMillis()
      : new Date(firestoreTimestamp).getTime()
    return localTime > firestoreTime
  }

  private handleOnlineStatusChange(): void {
    this.syncListeners.forEach((_, userId) => {
      this.triggerSync(userId)
    })
  }

  private async triggerSync(userId: string): Promise<void> {
    const localData = await this.getLocalData()
    if (localData) {
      await this.mergeData(userId, localData)
    }
  }

  setupRealtimeSync(userId: string, onDataChange: (data: LocalData) => void): Unsubscribe {
    this.removeRealtimeSync(userId)
    const listeners: Unsubscribe[] = []
    let lastSync = Date.now()

    const transactionsQuery = query(
      collection(db, 'users', userId, 'transactions'),
      orderBy('createdAt', 'desc')
    )
    const transactionsUnsubscribe = onSnapshot(transactionsQuery, async (snapshot) => {
      const transactions: Transaction[] = []
      snapshot.forEach((d) => {
        const data = d.data()
        transactions.push({ id: d.id, type: data.type, amount: data.amount, description: data.description, category: data.category, date: data.date, createdAt: data.createdAt })
      })
      const localData = await this.getLocalData()
      if (localData) {
        const updated = { ...localData, transactions }
        await this.saveLocalData(updated)
        onDataChange(updated)
        lastSync = Date.now()
      }
    })

    const categoriesQuery = query(collection(db, 'users', userId, 'categories'), orderBy('name'))
    const categoriesUnsubscribe = onSnapshot(categoriesQuery, async (snapshot) => {
      let categories: Category[] = []
      snapshot.forEach((d) => {
        const data = d.data()
        categories.push({ id: d.id, name: data.name, type: data.type, color: data.color, icon: data.icon })
      })
      if (!categories || categories.length === 0) {
        const { generateCurrentMonthData } = await import('../utils/resetData')
        categories = generateCurrentMonthData().categories
      }
      const localData = await this.getLocalData()
      if (localData) {
        const updated = { ...localData, categories }
        await this.saveLocalData(updated)
        onDataChange(updated)
        lastSync = Date.now()
      }
    })

    const budgetsQuery = query(collection(db, 'users', userId, 'budgets'), orderBy('startDate'))
    const budgetsUnsubscribe = onSnapshot(budgetsQuery, async (snapshot) => {
      const budgets: Budget[] = []
      snapshot.forEach((d) => {
        const data = d.data()
        budgets.push({ id: d.id, category: data.category, amount: data.amount, spent: data.spent, period: data.period, startDate: data.startDate })
      })
      const localData = await this.getLocalData()
      if (localData) {
        const updated = { ...localData, budgets }
        await this.saveLocalData(updated)
        onDataChange(updated)
        lastSync = Date.now()
      }
    })

    const userUnsubscribe = onSnapshot(doc(db, 'users', userId), async (d) => {
      if (d.exists()) {
        const userData = d.data()
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
          notifications: userData.notifications || { email: true, push: true, budgetAlerts: true, weeklyReports: false },
          preferences: userData.preferences || { theme: 'light', language: 'en', dateFormat: 'MM/dd/yyyy', currencyFormat: '$#,##0.00' },
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        }
        const localData = await this.getLocalData()
        if (localData) {
          const updated = { ...localData, user }
          await this.saveLocalData(updated)
          onDataChange(updated)
          lastSync = Date.now()
        }
      }
    })

    listeners.push(transactionsUnsubscribe, categoriesUnsubscribe, budgetsUnsubscribe, userUnsubscribe)
    this.syncListeners.set(userId, { unsubscribe: () => listeners.forEach(u => u()), lastSync })
    return () => this.removeRealtimeSync(userId)
  }

  removeRealtimeSync(userId: string): void {
    const listener = this.syncListeners.get(userId)
    if (listener) { listener.unsubscribe(); this.syncListeners.delete(userId) }
  }

  async syncToFirestore(userId: string, localData: LocalData): Promise<SyncResult> {
    try {
      const batch = writeBatch(db)

      const transactionsRef = collection(db, 'users', userId, 'transactions')
      const existingTxns = await getDocs(transactionsRef)
      const existingTxnMap = new Map<string, any>()
      existingTxns.forEach(d => existingTxnMap.set(d.id, d.data()))

      for (const t of localData.transactions) {
        const existing = existingTxnMap.get(t.id)
        if (!existing || this.isNewer(t.createdAt, existing.updatedAt || existing.createdAt)) {
          batch.set(doc(transactionsRef, t.id), { ...t, updatedAt: serverTimestamp() })
        }
      }

      const categoriesRef = collection(db, 'users', userId, 'categories')
      const existingCats = await getDocs(categoriesRef)
      const existingCatMap = new Map<string, any>()
      existingCats.forEach(d => existingCatMap.set(d.id, d.data()))

      for (const c of localData.categories) {
        if (!existingCatMap.has(c.id)) {
          batch.set(doc(categoriesRef, c.id), { ...c, updatedAt: serverTimestamp() })
        }
      }

      const budgetsRef = collection(db, 'users', userId, 'budgets')
      const existingBudgets = await getDocs(budgetsRef)
      const existingBudgetMap = new Map<string, any>()
      existingBudgets.forEach(d => existingBudgetMap.set(d.id, d.data()))

      for (const b of localData.budgets) {
        if (!existingBudgetMap.has(b.id)) {
          batch.set(doc(budgetsRef, b.id), { ...b, updatedAt: serverTimestamp() })
        }
      }

      await batch.commit()
      await this.updateSyncTimestamp()
      return { success: true, message: 'Data synced successfully' }
    } catch (error) {
      console.error('Error syncing to Firestore:', error)
      return { success: false, message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  async syncFromFirestore(userId: string): Promise<{ success: boolean; data?: LocalData; message: string }> {
    try {
      const txnsSnap = await getDocs(query(collection(db, 'users', userId, 'transactions'), orderBy('createdAt', 'desc')))
      const transactions: Transaction[] = []
      txnsSnap.forEach(d => {
        const data = d.data()
        transactions.push({ id: d.id, type: data.type, amount: data.amount, description: data.description, category: data.category, date: data.date, createdAt: data.createdAt })
      })

      const catsSnap = await getDocs(query(collection(db, 'users', userId, 'categories'), orderBy('name')))
      let categories: Category[] = []
      catsSnap.forEach(d => {
        const data = d.data()
        categories.push({ id: d.id, name: data.name, type: data.type, color: data.color, icon: data.icon })
      })
      if (categories.length === 0) {
        const { generateCurrentMonthData } = await import('../utils/resetData')
        categories = generateCurrentMonthData().categories
      }

      const budgetsSnap = await getDocs(query(collection(db, 'users', userId, 'budgets'), orderBy('startDate')))
      const budgets: Budget[] = []
      budgetsSnap.forEach(d => {
        const data = d.data()
        budgets.push({ id: d.id, category: data.category, amount: data.amount, spent: data.spent, period: data.period, startDate: data.startDate })
      })

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
          notifications: userData.notifications || { email: true, push: true, budgetAlerts: true, weeklyReports: false },
          preferences: userData.preferences || { theme: 'light', language: 'en', dateFormat: 'MM/dd/yyyy', currencyFormat: '$#,##0.00' },
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        }
      } else {
        throw new Error('User document not found')
      }

      const data: LocalData = { transactions, categories, budgets, user }
      await this.saveLocalData(data)
      await this.updateSyncTimestamp()
      return { success: true, data, message: 'Data loaded from Firestore successfully' }
    } catch (error) {
      console.error('Error syncing from Firestore:', error)
      return { success: false, message: `Load failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  async mergeData(userId: string, localData: LocalData): Promise<SyncResult> {
    const syncResult = await this.syncToFirestore(userId, localData)
    if (!syncResult.success) return syncResult
    const loadResult = await this.syncFromFirestore(userId)
    if (!loadResult.success) return { success: false, message: `Merge failed: ${loadResult.message}` }
    return { success: true, message: 'Data merged successfully', data: loadResult.data }
  }

  async forceSync(userId: string, localData: LocalData): Promise<SyncResult> {
    return this.mergeData(userId, localData)
  }

  getOnlineStatus(): boolean {
    return this.isOnline
  }

  async initializeSync(userId: string, onDataChange: (data: LocalData) => void): Promise<void> {
    const loadResult = await this.syncFromFirestore(userId)
    if (loadResult.success && loadResult.data) onDataChange(loadResult.data)
    this.setupRealtimeSync(userId, onDataChange)
  }

  cleanupSync(userId: string): void {
    this.removeRealtimeSync(userId)
  }
}

export const dataSyncService = new DataSyncService()
