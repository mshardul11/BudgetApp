import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your Firebase configuration (same as web app)
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

// Initialize Firebase Authentication for React Native
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Auth providers
let googleProvider: GoogleAuthProvider | null = null

export const getGoogleProvider = () => {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider()
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    })
  }
  return googleProvider
}

export default app 