import 'react-native-screens'
import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import { UserProvider } from './src/context/UserContext'
import { BudgetProvider } from './src/context/BudgetContext'
import AppNavigator from './src/navigation/AppNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <BudgetProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </BudgetProvider>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
