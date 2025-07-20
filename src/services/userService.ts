import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'


export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
  currency: string
  timezone: string
  monthlyIncomeGoal?: number
  monthlyExpenseGoal?: number
  savingsGoal?: number
  notifications: {
    email: boolean
    push: boolean
    budgetAlerts: boolean
    weeklyReports: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    dateFormat: string
    currencyFormat: string
  }
  isActive: boolean
  lastLoginAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateUserProfileData {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
}

export interface UpdateUserProfileData {
  displayName?: string
  photoURL?: string
  phoneNumber?: string
  currency?: string
  timezone?: string
  monthlyIncomeGoal?: number
  monthlyExpenseGoal?: number
  savingsGoal?: number
  notifications?: Partial<UserProfile['notifications']>
  preferences?: Partial<UserProfile['preferences']>
}

class UserService {
  private readonly collectionName = 'users'

  /**
   * Create a new user profile in Firestore
   */
  async createUserProfile(data: CreateUserProfileData): Promise<UserProfile> {
    try {
      const userRef = doc(db, this.collectionName, data.uid)
      
      const userProfile: Omit<UserProfile, 'uid'> = {
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || undefined,
        phoneNumber: data.phoneNumber || undefined,
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        monthlyIncomeGoal: 0,
        monthlyExpenseGoal: 0,
        savingsGoal: 0,
        notifications: {
          email: true,
          push: true,
          budgetAlerts: true,
          weeklyReports: false
        },
        preferences: {
          theme: 'auto',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          currencyFormat: '$#,##0.00'
        },
        isActive: true,
        lastLoginAt: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      }

      await setDoc(userRef, userProfile)
      
      // Return the created profile
      const createdDoc = await getDoc(userRef)
      if (!createdDoc.exists()) {
        throw new Error('Failed to create user profile')
      }
      
      return { uid: data.uid, ...createdDoc.data() } as UserProfile
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  /**
   * Get user profile by UID
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, this.collectionName, uid)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        return null
      }
      
      return { uid, ...userDoc.data() } as UserProfile
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  /**
   * Get user profile by email
   */
  async getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      const usersRef = collection(db, this.collectionName)
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return null
      }
      
      const userDoc = querySnapshot.docs[0]
      return { uid: userDoc.id, ...userDoc.data() } as UserProfile
    } catch (error) {
      console.error('Error getting user profile by email:', error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: string, data: UpdateUserProfileData): Promise<UserProfile> {
    try {
      const userRef = doc(db, this.collectionName, uid)
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      }
      
      await updateDoc(userRef, updateData)
      
      // Return the updated profile
      const updatedDoc = await getDoc(userRef)
      if (!updatedDoc.exists()) {
        throw new Error('User profile not found')
      }
      
      return { uid, ...updatedDoc.data() } as UserProfile
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(uid: string): Promise<void> {
    try {
      const userRef = doc(db, this.collectionName, uid)
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating last login:', error)
      throw error
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(uid: string): Promise<void> {
    try {
      const userRef = doc(db, this.collectionName, uid)
      await updateDoc(userRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error deactivating user:', error)
      throw error
    }
  }

  /**
   * Reactivate user account
   */
  async reactivateUser(uid: string): Promise<void> {
    try {
      const userRef = doc(db, this.collectionName, uid)
      await updateDoc(userRef, {
        isActive: true,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error reactivating user:', error)
      throw error
    }
  }

  /**
   * Delete user profile (permanent deletion)
   */
  async deleteUserProfile(uid: string): Promise<void> {
    try {
      const userRef = doc(db, this.collectionName, uid)
      await deleteDoc(userRef)
    } catch (error) {
      console.error('Error deleting user profile:', error)
      throw error
    }
  }

  /**
   * Get all active users (admin function)
   */
  async getAllActiveUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, this.collectionName)
      const q = query(usersRef, where('isActive', '==', true))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[]
    } catch (error) {
      console.error('Error getting all active users:', error)
      throw error
    }
  }

  /**
   * Check if user profile exists
   */
  async userProfileExists(uid: string): Promise<boolean> {
    try {
      const userRef = doc(db, this.collectionName, uid)
      const userDoc = await getDoc(userRef)
      return userDoc.exists()
    } catch (error) {
      console.error('Error checking if user profile exists:', error)
      throw error
    }
  }

  /**
   * Get user statistics (for admin dashboard)
   */
  async getUserStatistics(): Promise<{
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    newUsersThisMonth: number
  }> {
    try {
      const usersRef = collection(db, this.collectionName)
      const querySnapshot = await getDocs(usersRef)
      
      const users = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[]
      
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      return {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.isActive).length,
        inactiveUsers: users.filter(user => !user.isActive).length,
        newUsersThisMonth: users.filter(user => 
          user.createdAt && user.createdAt.toDate() >= firstDayOfMonth
        ).length
      }
    } catch (error) {
      console.error('Error getting user statistics:', error)
      throw error
    }
  }
}

export const userService = new UserService()
export default userService 