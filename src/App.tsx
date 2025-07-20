import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import Budget from './pages/Budget'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import { BudgetProvider, useBudget } from './context/BudgetContext'
import { AuthProvider } from './context/AuthContext'
import { UserProvider } from './context/UserContext'
import { Menu } from 'lucide-react'

function ThemeEffect() {
  const { state } = useBudget()
  const theme = state.user?.preferences?.theme || 'light'

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.add('light')
    } else if (theme === 'auto') {
      // Use system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(isDark ? 'dark' : 'light')
    }
  }, [theme])

  return null
}

function App() {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // Changed from 768 to 1024 for better tablet support
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-72">
        {/* Mobile header */}
        {isMobile && (
          <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">💰</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">Budget App</span>
            </div>
            <div className="w-10"></div> {/* Spacer for centering */}
          </header>
        )}
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )

  return (
    <AuthProvider>
      <UserProvider>
        <BudgetProvider>
          <ThemeEffect />
          <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <Dashboard />
                </LayoutWrapper>
              </ProtectedRoute>
            } />
            
            <Route path="/income" element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <Income />
                </LayoutWrapper>
              </ProtectedRoute>
            } />
            
            <Route path="/expenses" element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <Expenses />
                </LayoutWrapper>
              </ProtectedRoute>
            } />
            
            <Route path="/budget" element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <Budget />
                </LayoutWrapper>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <Reports />
                </LayoutWrapper>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <Profile />
                </LayoutWrapper>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </BudgetProvider>
      </UserProvider>
    </AuthProvider>
  )
}

export default App 