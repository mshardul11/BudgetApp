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
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '')
  }

  /**
   * Create a new user profile in Firestore
   */
  async createUserProfile(data: CreateUserProfileData): Promise<UserProfile> {
    try {
      // Input validation
      if (!data.uid || !data.email || !data.displayName) {
        throw new Error('Missing required fields')
      }

      if (!this.validateEmail(data.email)) {
        throw new Error('Invalid email format')
      }

      if (data.phoneNumber && !this.validatePhoneNumber(data.phoneNumber)) {
        throw new Error('Invalid phone number format')
      }

      // Sanitize inputs
      const sanitizedData = {
        ...data,
        email: this.sanitizeString(data.email),
        displayName: this.sanitizeString(data.displayName),
        phoneNumber: data.phoneNumber ? this.sanitizeString(data.phoneNumber) : undefined
      }

      const userRef = doc(db, this.collectionName, sanitizedData.uid)
      
      const userProfile: Omit<UserProfile, 'uid'> = {
        email: sanitizedData.email,
        displayName: sanitizedData.displayName,
        photoURL: sanitizedData.photoURL || undefined,
        phoneNumber: sanitizedData.phoneNumber || undefined,
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
      
      return { uid: sanitizedData.uid, ...userProfile }
    } catch (error) {
      throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user profile by UID
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      if (!uid) {
        throw new Error('User ID is required')
      }

      const userRef = doc(db, this.collectionName, uid)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        return null
      }
      
      return { uid, ...userDoc.data() } as UserProfile
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user profile by email (restricted to own profile)
   */
  async getUserProfileByEmail(email: string, currentUserId: string): Promise<UserProfile | null> {
    try {
      if (!email || !currentUserId) {
        throw new Error('Email and current user ID are required')
      }

      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format')
      }

      const usersRef = collection(db, this.collectionName)
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return null
      }
      
      const userDoc = querySnapshot.docs[0]
      const userProfile = { uid: userDoc.id, ...userDoc.data() } as UserProfile
      
      // Security: Only allow access to own profile
      if (userProfile.uid !== currentUserId) {
        throw new Error('Access denied')
      }
      
      return userProfile
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: string, data: UpdateUserProfileData): Promise<UserProfile> {
    try {
      if (!uid) {
        throw new Error('User ID is required')
      }

      // Validate inputs
      if (data.email && !this.validateEmail(data.email)) {
        throw new Error('Invalid email format')
      }

      if (data.phoneNumber && !this.validatePhoneNumber(data.phoneNumber)) {
        throw new Error('Invalid phone number format')
      }

      // Sanitize inputs
      const sanitizedData = {
        ...data,
        displayName: data.displayName ? this.sanitizeString(data.displayName) : undefined,
        phoneNumber: data.phoneNumber ? this.sanitizeString(data.phoneNumber) : undefined
      }

      const userRef = doc(db, this.collectionName, uid)
      
      const updateData = {
        ...sanitizedData,
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
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(uid: string): Promise<void> {
    try {
      if (!uid) {
        throw new Error('User ID is required')
      }

      const userRef = doc(db, this.collectionName, uid)
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      throw new Error(`Failed to update last login: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(uid: string): Promise<void> {
    try {
      if (!uid) {
        throw new Error('User ID is required')
      }

      const userRef = doc(db, this.collectionName, uid)
      await updateDoc(userRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Reactivate user account
   */
  async reactivateUser(uid: string): Promise<void> {
    try {
      if (!uid) {
        throw new Error('User ID is required')
      }

      const userRef = doc(db, this.collectionName, uid)
      await updateDoc(userRef, {
        isActive: true,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      throw new Error(`Failed to reactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete user profile (permanent deletion)
   */
  async deleteUserProfile(uid: string): Promise<void> {
    try {
      if (!uid) {
        throw new Error('User ID is required')
      }

      const userRef = doc(db, this.collectionName, uid)
      await deleteDoc(userRef)
    } catch (error) {
      throw new Error(`Failed to delete user profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if user profile exists
   */
  async userProfileExists(uid: string): Promise<boolean> {
    try {
      if (!uid) {
        throw new Error('User ID is required')
      }

      const userRef = doc(db, this.collectionName, uid)
      const userDoc = await getDoc(userRef)
      return userDoc.exists()
    } catch (error) {
      throw new Error(`Failed to check user profile existence: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const userService = new UserService()
export default userService 