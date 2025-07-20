import { useEffect, useState } from 'react'
import { auth } from '../config/firebase'

export default function FirebaseTest() {
  const [status, setStatus] = useState('Testing...')

  useEffect(() => {
    const testFirebase = async () => {
      try {
        // Test if Firebase is initialized
        if (auth) {
          setStatus('✅ Firebase connected successfully!')
        } else {
          setStatus('❌ Firebase not connected')
        }
      } catch (error) {
        setStatus(`❌ Firebase error: ${error}`)
      }
    }

    testFirebase()
  }, [])

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold text-blue-900">Firebase Connection Test</h3>
      <p className="text-blue-700">{status}</p>
    </div>
  )
} 