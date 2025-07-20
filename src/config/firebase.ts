import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Lazy load analytics only when needed
let analytics: any = null

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJmLC5ksvbQ26QpW04UeTMG3n0YQ5wjQg",
  authDomain: "budgetapp-254a2.firebaseapp.com",
  projectId: "budgetapp-254a2",
  storageBucket: "budgetapp-254a2.firebasestorage.app",
  messagingSenderId: "159607987904",
  appId: "1:159607987904:web:a6996f58714c9e57635725",
  measurementId: "G-RV4YLRFS0F"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Lazy load analytics
export const getAnalytics = async () => {
  if (!analytics && typeof window !== 'undefined') {
    const { getAnalytics: getAnalyticsImpl } = await import('firebase/analytics')
    analytics = getAnalyticsImpl(app)
  }
  return analytics
}

// Auth providers with lazy initialization
let googleProvider: GoogleAuthProvider | null = null
let facebookProvider: FacebookAuthProvider | null = null

export const getGoogleProvider = () => {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider()
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    })
  }
  return googleProvider
}

export const getFacebookProvider = () => {
  if (!facebookProvider) {
    facebookProvider = new FacebookAuthProvider()
    facebookProvider.setCustomParameters({
      display: 'popup'
    })
  }
  return facebookProvider
}

export default app 