import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'
import { auth, getGoogleProvider, getFacebookProvider } from '../config/firebase'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  signInWithGoogle: () => Promise<User>
  signInWithFacebook: () => Promise<User>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<User>
  signInWithEmail: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthContext] onAuthStateChanged:', user)
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    console.log('[AuthContext] currentUser:', currentUser)
    console.log('[AuthContext] loading:', loading)
  }, [currentUser, loading])

  const signInWithGoogle = async () => {
    try {
      const provider = getGoogleProvider()
      const result = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      if (credential) {
        // User signed in successfully
        console.log('Google sign-in successful', result.user)
      }
      return result.user
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  const signInWithFacebook = async () => {
    try {
      const provider = getFacebookProvider()
      const result = await signInWithPopup(auth, provider)
      const credential = FacebookAuthProvider.credentialFromResult(result)
      if (credential) {
        // User signed in successfully
        console.log('Facebook sign-in successful', result.user)
      }
      return result.user
    } catch (error: any) {
      console.error('Facebook sign-in error:', error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      // Update the user's display name
      await updateProfile(result.user, { displayName })
      console.log('Email sign-up successful', result.user)
      return result.user
    } catch (error: any) {
      console.error('Email sign-up error:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('Email sign-in successful', result.user)
      return result.user
    } catch (error: any) {
      console.error('Email sign-in error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      console.log('User signed out successfully')
    } catch (error) {
      console.error('Sign-out error:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    signInWithGoogle,
    signInWithFacebook,
    signUpWithEmail,
    signInWithEmail,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 