import { Link, useLocation } from 'react-router-dom'
import { useBudget } from '../context/BudgetContext'
import { useAuth } from '../context/AuthContext'
import { 
  Home, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  Target, 
  BarChart3,
  X,
  Settings,
  User,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isMobile: boolean
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Overview of your finances' },
  { name: 'Income', href: '/income', icon: TrendingUp, description: 'Track your income sources' },
  { name: 'Expenses', href: '/expenses', icon: TrendingDown, description: 'Monitor your spending' },
  { name: 'Investments', href: '/investments', icon: PieChart, description: 'Build your future goals' },
  { name: 'Budget', href: '/budget', icon: Target, description: 'Set and track budgets' },
  { name: 'Reports', href: '/reports', icon: BarChart3, description: 'Analytics and insights' },
]

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const location = useLocation()
  const { state } = useBudget()
  const { currentUser, logout } = useAuth()

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-md border-r border-white/30">
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">💰</span>
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Budget App</h1>
            <p className="text-xs text-gray-500">Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => isMobile && onClose()}
              className={`group relative ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <item.icon className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              <span>{item.name}</span>
              
              {/* Tooltip for desktop */}
              {!isMobile && (
                <div className="tooltip left-full ml-2 top-1/2 transform -translate-y-1/2">
                  {item.description}
                </div>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full animate-bounce-in" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-gray-200/50 space-y-2">
        <Link 
          to="/profile"
          onClick={() => isMobile && onClose()}
          className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50/80 transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || 'User'} 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {currentUser?.displayName || state?.user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500">{currentUser?.email || 'Premium User'}</p>
          </div>
          <Settings className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </Link>
        
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 p-3 rounded-xl bg-red-50/50 hover:bg-red-50/80 transition-colors text-red-600 hover:text-red-700"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200/50">
        <div className="text-xs text-gray-500 text-center">
          <p>© 2024 Budget App</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={onClose}
          />
        )}
        
        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 sm:w-72 transform transition-all duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="relative h-full">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-3 text-gray-400 hover:text-gray-600 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            
            {sidebarContent}
          </div>
        </div>
      </>
    )
  }

  // Desktop sidebar
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:bg-transparent">
      {sidebarContent}
    </div>
  )
} 