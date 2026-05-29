import { initializeApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: "AIzaSyBJmLC5ksvbQ26QpW04UeTMG3n0YQ5wjQg",
  authDomain: "budgetapp-254a2.firebaseapp.com",
  projectId: "budgetapp-254a2",
  storageBucket: "budgetapp-254a2.firebasestorage.app",
  messagingSenderId: "159607987904",
  appId: "1:159607987904:web:a6996f58714c9e57635725",
  measurementId: "G-RV4YLRFS0F"
}

const app = initializeApp(firebaseConfig)

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
})

export const db = getFirestore(app)

let googleProvider: GoogleAuthProvider | null = null
let facebookProvider: FacebookAuthProvider | null = null

export const getGoogleProvider = () => {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider()
    googleProvider.setCustomParameters({ prompt: 'select_account' })
  }
  return googleProvider
}

export const getFacebookProvider = () => {
  if (!facebookProvider) {
    facebookProvider = new FacebookAuthProvider()
  }
  return facebookProvider
}

export default app
