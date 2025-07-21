import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from './src/contexts/AuthContext'
import { BudgetProvider } from './src/contexts/BudgetContext'
import AppNavigator from './src/navigation/AppNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BudgetProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </BudgetProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}