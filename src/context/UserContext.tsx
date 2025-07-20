import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { userService, UserProfile, UpdateUserProfileData } from '../services/userService'

interface UserContextType {
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  updateProfile: (data: UpdateUserProfileData) => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUserProfile = async (uid: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user profile exists
      const exists = await userService.userProfileExists(uid)
      
      if (!exists) {
        // Create new user profile if it doesn't exist
        if (currentUser) {
          const newProfile = await userService.createUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'User',
            photoURL: currentUser.photoURL || undefined,
            phoneNumber: currentUser.phoneNumber || undefined
          })
          setUserProfile(newProfile)
        }
      } else {
        // Load existing profile
        const profile = await userService.getUserProfile(uid)
        if (profile) {
          setUserProfile(profile)
          // Update last login
          await userService.updateLastLogin(uid)
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: UpdateUserProfileData) => {
    if (!currentUser?.uid) {
      throw new Error('No authenticated user')
    }

    try {
      setError(null)
      const updatedProfile = await userService.updateUserProfile(currentUser.uid, data)
      setUserProfile(updatedProfile)
    } catch (err) {
      console.error('Error updating user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user profile')
      throw err
    }
  }

  const refreshProfile = async () => {
    if (currentUser?.uid) {
      await loadUserProfile(currentUser.uid)
    }
  }

  const clearError = () => {
    setError(null)
  }

  useEffect(() => {
    if (currentUser?.uid) {
      loadUserProfile(currentUser.uid)
    } else {
      setUserProfile(null)
      setLoading(false)
    }
  }, [currentUser])

  const value: UserContextType = {
    userProfile,
    loading,
    error,
    updateProfile,
    refreshProfile,
    clearError
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
} 