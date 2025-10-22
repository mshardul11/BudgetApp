import { useState, useEffect } from 'react'
import { useBudget } from '../context/BudgetContext'
import { useAuth } from '../context/AuthContext'
import { User } from '../types'
import { 
  User as UserIcon, 
 
  Globe, 
  DollarSign, 
  Bell, 
  Settings, 
  Save, 
  Edit3,
  Camera,
  Target,
  Shield,

  Calendar,

  Download,
  Upload,
  FileText,
  Database,
  X,
  AlertCircle
} from 'lucide-react'
import { exportToCSV, exportToJSON, importFromJSON } from '../utils/exportData'
import { resetToCurrentMonth, clearAllData } from '../utils/resetData'
import { clearTestData, containsTestData } from '../utils/clearTestData'
import { formatCurrency } from '../utils/formatters'

export default function Profile() {
  const { state, updateUser } = useBudget()
  const { user } = state
  const { currentUser } = useAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<User>(user)
  const [activeTab, setActiveTab] = useState<'profile' | 'goals' | 'notifications' | 'preferences' | 'data'>('profile')
  const [showTestDataWarning, setShowTestDataWarning] = useState(containsTestData())
  const [isSaving, setIsSaving] = useState(false)

  // Sync formData with user data from context
  useEffect(() => {
    setFormData(user)
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const updatedUser = {
        ...formData,
        updatedAt: new Date().toISOString()
      }
      await updateUser(updatedUser)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(user)
    setIsEditing(false)
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'goals', name: 'Financial Goals', icon: Target },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'preferences', name: 'Preferences', icon: Settings },
    { id: 'data', name: 'Data Management', icon: Shield },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-bold gradient-text mb-2">Profile Settings</h1>
          <p className="text-gray-600 text-lg">Manage your account and preferences</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Test Data Warning */}
      {showTestDataWarning && (
        <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Test Data Detected</h3>
                <p className="text-sm text-gray-600">Your app contains sample data. Clear it to start fresh with your real data.</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Clear all test data? This will remove sample transactions and reset to a clean state.')) {
                  clearTestData()
                  setShowTestDataWarning(false)
                  window.location.reload()
                }
              }}
              className="btn-warning flex items-center space-x-2 text-sm"
            >
              <X className="w-4 h-4" />
              <span>Clear Test Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-full h-full rounded-full object-cover" />
              ) : user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                (currentUser?.displayName || user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()
              )}
            </div>
            {isEditing && (
              <button className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {currentUser?.displayName || user.name || 'User'}
            </h2>
            <p className="text-gray-600 mb-2">
              {currentUser?.email || user.email || 'No email'}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>{user.timezone}</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>{user.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="py-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={formData.name || currentUser?.displayName || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    disabled={!isEditing}
                    required
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email || currentUser?.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="input"
                    disabled={!isEditing}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="input"
                    disabled={!isEditing}
                  >
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="America/Chicago">Central Time (US)</option>
                    <option value="America/Denver">Mountain Time (US)</option>
                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                    <option value="Europe/London">London (UK)</option>
                    <option value="Europe/Paris">Paris (France)</option>
                    <option value="Asia/Kolkata">Mumbai (India)</option>
                    <option value="Asia/Tokyo">Tokyo (Japan)</option>
                  </select>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-4 pt-4">
                  <button 
                    type="submit" 
                    className="btn-primary flex items-center space-x-2"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    className="btn-secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'goals' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="label">Monthly Income Goal</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {formatCurrency(0, { ...user, monthlyIncomeGoal: undefined })[0]}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={formData.monthlyIncomeGoal ?? ''}
                      onChange={e => setFormData({ ...formData, monthlyIncomeGoal: Number(e.target.value) })}
                      className="input pl-10"
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  {!isEditing && (
                    <div className="mt-1 text-gray-600">
                      {formatCurrency(user.monthlyIncomeGoal || 0, user)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Monthly Expense Goal</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {formatCurrency(0, { ...user, monthlyExpenseGoal: undefined })[0]}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={formData.monthlyExpenseGoal ?? ''}
                      onChange={e => setFormData({ ...formData, monthlyExpenseGoal: Number(e.target.value) })}
                      className="input pl-10"
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  {!isEditing && (
                    <div className="mt-1 text-gray-600">
                      {formatCurrency(user.monthlyExpenseGoal || 0, user)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Savings Goal</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {formatCurrency(0, { ...user, savingsGoal: undefined })[0]}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={formData.savingsGoal ?? ''}
                      onChange={e => setFormData({ ...formData, savingsGoal: Number(e.target.value) })}
                      className="input pl-10"
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  {!isEditing && (
                    <div className="mt-1 text-gray-600">
                      {formatCurrency(user.savingsGoal || 0, user)}
                    </div>
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="flex space-x-4 pt-4">
                  <button 
                    onClick={handleSubmit} 
                    className="btn-primary flex items-center space-x-2"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Goals'}</span>
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="btn-secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {Object.entries(formData.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {key === 'email' && 'Receive notifications via email'}
                          {key === 'push' && 'Receive push notifications'}
                          {key === 'budgetAlerts' && 'Get alerts when approaching budget limits'}
                          {key === 'weeklyReports' && 'Receive weekly financial reports'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            [key]: e.target.checked
                          }
                        })}
                        disabled={!isEditing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              {isEditing && (
                <div className="flex space-x-4 pt-4">
                  <button 
                    onClick={handleSubmit} 
                    className="btn-primary flex items-center space-x-2"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Notifications'}</span>
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="btn-secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Theme</label>
                  <select
                    value={formData.preferences.theme}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        theme: e.target.value as 'light' | 'dark' | 'auto'
                      }
                    })}
                    className="input"
                    disabled={!isEditing}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Language</label>
                  <select
                    value={formData.preferences.language}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        language: e.target.value
                      }
                    })}
                    className="input"
                    disabled={!isEditing}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="fr">French (Français)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="ja">Japanese (日本語)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Date Format</label>
                  <select
                    value={formData.preferences.dateFormat}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        dateFormat: e.target.value
                      }
                    })}
                    className="input"
                    disabled={!isEditing}
                  >
                    <option value="MM/dd/yyyy">MM/DD/YYYY (US)</option>
                    <option value="dd/MM/yyyy">DD/MM/YYYY (India/UK)</option>
                    <option value="yyyy-MM-dd">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Currency Format</label>
                  <select
                    value={formData.preferences.currencyFormat}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        currencyFormat: e.target.value
                      }
                    })}
                    className="input"
                    disabled={!isEditing}
                  >
                    <option value="$#,##0.00">$1,234.56 (USD)</option>
                    <option value="₹#,##0.00">₹1,234.56 (INR)</option>
                    <option value="#,##0.00$">1,234.56$</option>
                    <option value="$# ##0.00">$1 234.56</option>
                  </select>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-4 pt-4">
                  <button onClick={handleSubmit} className="btn-primary flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Download className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Export Data</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Download your financial data for backup or analysis</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => exportToCSV(state.transactions)}
                        className="btn-primary flex items-center space-x-2 text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Export CSV</span>
                      </button>
                      <button
                        onClick={() => exportToJSON({
                          transactions: state.transactions,
                          categories: state.categories,
                          budgets: state.budgets,
                          user: state.user,
                          exportDate: new Date().toISOString(),
                          version: '1.0.0'
                        })}
                        className="btn-secondary flex items-center space-x-2 text-sm"
                      >
                        <Database className="w-4 h-4" />
                        <span>Export JSON</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Upload className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Import Data</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Restore your data from a previous backup</p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          try {
                            await importFromJSON(file)
                            // Here you would typically update the context with imported data
                            alert('Data imported successfully! Please refresh the page to see changes.')
                          } catch (error) {
                            alert('Failed to import data. Please check the file format.')
                          }
                        }
                      }}
                      className="hidden"
                      id="import-file"
                    />
                    <label
                      htmlFor="import-file"
                      className="btn-success flex items-center space-x-2 text-sm cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Import JSON</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Shield className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Data Security</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Your data is stored locally in your browser and is never sent to external servers.
                    Regular backups are recommended to prevent data loss.
                  </p>
                  <div className="text-xs text-gray-500">
                    <p>• Data is encrypted in localStorage</p>
                    <p>• No data is transmitted to external servers</p>
                    <p>• Export your data regularly for backup</p>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Database className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Reset Data</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Reset your data to current month or clear all data completely.
                    This action cannot be undone.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (confirm('Reset data to current month? This will replace all existing data with sample data for the current month.')) {
                          resetToCurrentMonth()
                          window.location.reload()
                        }
                      }}
                      className="btn-warning flex items-center space-x-2 text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Reset to Current Month</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Clear all data? This action cannot be undone.')) {
                          clearAllData()
                        }
                      }}
                      className="btn-danger flex items-center space-x-2 text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear All Data</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 