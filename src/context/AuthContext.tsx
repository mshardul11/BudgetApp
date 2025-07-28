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
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    try {
      const provider = getGoogleProvider()
      const result = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      if (credential) {
        // User signed in successfully
      }
      return result.user
    } catch (error: any) {
      // Sanitize error message for security
      const sanitizedError = new Error(
        error.code === 'auth/popup-closed-by-user' 
          ? 'Sign-in was cancelled'
          : error.code === 'auth/popup-blocked'
          ? 'Sign-in popup was blocked. Please allow popups for this site.'
          : 'Failed to sign in with Google'
      )
      throw sanitizedError
    }
  }

  const signInWithFacebook = async () => {
    try {
      const provider = getFacebookProvider()
      const result = await signInWithPopup(auth, provider)
      const credential = FacebookAuthProvider.credentialFromResult(result)
      if (credential) {
        // User signed in successfully
      }
      return result.user
    } catch (error: any) {
      // Sanitize error message for security
      const sanitizedError = new Error(
        error.code === 'auth/popup-closed-by-user' 
          ? 'Sign-in was cancelled'
          : error.code === 'auth/popup-blocked'
          ? 'Sign-in popup was blocked. Please allow popups for this site.'
          : 'Failed to sign in with Facebook'
      )
      throw sanitizedError
    }
  }

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      // Validate inputs
      if (!email || !password || !displayName) {
        throw new Error('All fields are required')
      }
      
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password)
      // Update the user's display name
      await updateProfile(result.user, { displayName })
      return result.user
    } catch (error: any) {
      // Sanitize error messages for security
      const sanitizedError = new Error(
        error.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists'
          : error.code === 'auth/weak-password'
          ? 'Password is too weak'
          : error.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : 'Failed to create account'
      )
      throw sanitizedError
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required')
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error: any) {
      // Sanitize error messages for security
      const sanitizedError = new Error(
        error.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : error.code === 'auth/wrong-password'
          ? 'Incorrect password'
          : error.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : error.code === 'auth/too-many-requests'
          ? 'Too many failed attempts. Please try again later.'
          : 'Failed to sign in'
      )
      throw sanitizedError
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      throw new Error('Failed to sign out')
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