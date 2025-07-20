import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

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

// Initialize Firebase Analytics
export const analytics = getAnalytics(app)

// Auth providers
export const googleProvider = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

facebookProvider.setCustomParameters({
  display: 'popup'
})

export default app 