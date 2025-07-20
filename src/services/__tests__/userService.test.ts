import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userService } from '../userService'
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date() })),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() }))
  }
}))

// Mock Firebase config
vi.mock('../firebase', () => ({
  db: {}
}))

describe('UserService', () => {
  const mockUserId = 'test-user-123'
  const mockUserData = {
    uid: mockUserId,
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    phoneNumber: '+1234567890'
  }

  const mockUserProfile = {
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    phoneNumber: '+1234567890',
    currency: 'USD',
    timezone: 'America/New_York',
    monthlyIncomeGoal: 5000,
    monthlyExpenseGoal: 3000,
    savingsGoal: 1000,
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
    lastLoginAt: { toDate: () => new Date() },
    createdAt: { toDate: () => new Date() },
    updatedAt: { toDate: () => new Date() }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUserProfile', () => {
    it('should create a new user profile successfully', async () => {
      const mockDocRef = { id: mockUserId }
      const mockDocSnap = {
        exists: () => true,
        data: () => mockUserProfile
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(setDoc).mockResolvedValue(undefined)
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any)

      const result = await userService.createUserProfile(mockUserData)

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', mockUserId)
      expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        email: mockUserData.email,
        displayName: mockUserData.displayName
      }))
      expect(result).toEqual({ uid: mockUserId, ...mockUserProfile })
    })

    it('should throw error if profile creation fails', async () => {
      const mockDocRef = { id: mockUserId }
      const mockDocSnap = {
        exists: () => false
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(setDoc).mockResolvedValue(undefined)
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any)

      await expect(userService.createUserProfile(mockUserData))
        .rejects.toThrow('Failed to create user profile')
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile when it exists', async () => {
      const mockDocRef = { id: mockUserId }
      const mockDocSnap = {
        exists: () => true,
        data: () => mockUserProfile
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any)

      const result = await userService.getUserProfile(mockUserId)

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', mockUserId)
      expect(result).toEqual({ uid: mockUserId, ...mockUserProfile })
    })

    it('should return null when profile does not exist', async () => {
      const mockDocRef = { id: mockUserId }
      const mockDocSnap = {
        exists: () => false
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any)

      const result = await userService.getUserProfile(mockUserId)

      expect(result).toBeNull()
    })
  })

  describe('getUserProfileByEmail', () => {
    it('should return user profile when found by email', async () => {
      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: mockUserId,
          data: () => mockUserProfile
        }]
      }

      vi.mocked(collection).mockReturnValue({} as any)
      vi.mocked(query).mockReturnValue({} as any)
      vi.mocked(where).mockReturnValue({} as any)
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const result = await userService.getUserProfileByEmail('test@example.com')

      expect(collection).toHaveBeenCalledWith(expect.anything(), 'users')
      expect(where).toHaveBeenCalledWith('email', '==', 'test@example.com')
      expect(result).toEqual({ uid: mockUserId, ...mockUserProfile })
    })

    it('should return null when no profile found by email', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      }

      vi.mocked(collection).mockReturnValue({} as any)
      vi.mocked(query).mockReturnValue({} as any)
      vi.mocked(where).mockReturnValue({} as any)
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const result = await userService.getUserProfileByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockDocRef = { id: mockUserId }
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ ...mockUserProfile, displayName: 'Updated Name' })
      }

      const updateData = {
        displayName: 'Updated Name',
        currency: 'EUR'
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(updateDoc).mockResolvedValue(undefined)
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any)

      const result = await userService.updateUserProfile(mockUserId, updateData)

      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining(updateData))
      expect(result.displayName).toBe('Updated Name')
    })

    it('should throw error if profile not found during update', async () => {
      const mockDocRef = { id: mockUserId }
      const mockDocSnap = {
        exists: () => false
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(updateDoc).mockResolvedValue(undefined)
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any)

      await expect(userService.updateUserProfile(mockUserId, { displayName: 'New Name' }))
        .rejects.toThrow('User profile not found')
    })
  })

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const mockDocRef = { id: mockUserId }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      await userService.updateLastLogin(mockUserId)

      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        lastLoginAt: expect.anything(),
        updatedAt: expect.anything()
      }))
    })
  })

  describe('deactivateUser', () => {
    it('should deactivate user account', async () => {
      const mockDocRef = { id: mockUserId }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      await userService.deactivateUser(mockUserId)

      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        isActive: false,
        updatedAt: expect.anything()
      }))
    })
  })

  describe('reactivateUser', () => {
    it('should reactivate user account', async () => {
      const mockDocRef = { id: mockUserId }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      await userService.reactivateUser(mockUserId)

      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        isActive: true,
        updatedAt: expect.anything()
      }))
    })
  })

  describe('deleteUserProfile', () => {
    it('should delete user profile', async () => {
      const mockDocRef = { id: mockUserId }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(deleteDoc).mockResolvedValue(undefined)

      await userService.deleteUserProfile(mockUserId)

      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef)
    })
  })

  describe('userProfileExists', () => {
    it('should return true when profile exists', async () => {
      const mockDocRef = { id: mockUserId }
      const mockDocSnap = {
        exists: () => true
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any)

      const result = await userService.userProfileExists(mockUserId)

      expect(result).toBe(true)
    })

    it('should return false when profile does not exist', async () => {
      const mockDocRef = { id: mockUserId }
      const mockDocSnap = {
        exists: () => false
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as any)
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any)

      const result = await userService.userProfileExists(mockUserId)

      expect(result).toBe(false)
    })
  })

  describe('getAllActiveUsers', () => {
    it('should return all active users', async () => {
      const mockQuerySnapshot = {
        docs: [
          { id: 'user1', data: () => ({ ...mockUserProfile, uid: 'user1' }) },
          { id: 'user2', data: () => ({ ...mockUserProfile, uid: 'user2' }) }
        ]
      }

      vi.mocked(collection).mockReturnValue({} as any)
      vi.mocked(query).mockReturnValue({} as any)
      vi.mocked(where).mockReturnValue({} as any)
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const result = await userService.getAllActiveUsers()

      expect(collection).toHaveBeenCalledWith(expect.anything(), 'users')
      expect(where).toHaveBeenCalledWith('isActive', '==', true)
      expect(result).toHaveLength(2)
      expect(result[0].uid).toBe('user1')
      expect(result[1].uid).toBe('user2')
    })
  })

  describe('getUserStatistics', () => {
    it('should return user statistics', async () => {
      const mockUsers = [
        { ...mockUserProfile, uid: 'user1', isActive: true, createdAt: { toDate: () => new Date() } },
        { ...mockUserProfile, uid: 'user2', isActive: true, createdAt: { toDate: () => new Date() } },
        { ...mockUserProfile, uid: 'user3', isActive: false, createdAt: { toDate: () => new Date() } }
      ]

      const mockQuerySnapshot = {
        docs: mockUsers.map(user => ({ id: user.uid, data: () => user }))
      }

      vi.mocked(collection).mockReturnValue({} as any)
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const result = await userService.getUserStatistics()

      expect(result).toEqual({
        totalUsers: 3,
        activeUsers: 2,
        inactiveUsers: 1,
        newUsersThisMonth: expect.any(Number)
      })
    })
  })
}) 