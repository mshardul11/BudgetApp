import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '../contexts/AuthContext'
import { NavigationParams } from '../types'

// Import screens
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import DashboardScreen from '../screens/DashboardScreen'
import TransactionsScreen from '../screens/TransactionsScreen'
import BudgetScreen from '../screens/BudgetScreen'
import ReportsScreen from '../screens/ReportsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import AddTransactionScreen from '../screens/AddTransactionScreen'

const Stack = createStackNavigator<NavigationParams>()
const Tab = createBottomTabNavigator<NavigationParams>()

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline'
              break
            case 'Transactions':
              iconName = focused ? 'list' : 'list-outline'
              break
            case 'Budget':
              iconName = focused ? 'pie-chart' : 'pie-chart-outline'
              break
            case 'Reports':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline'
              break
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline'
              break
            default:
              iconName = 'circle'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen}
        options={{
          headerShown: true,
          title: 'Add Transaction',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return null // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      {currentUser ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  )
}