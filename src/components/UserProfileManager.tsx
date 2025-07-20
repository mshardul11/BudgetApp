import React, { useState } from 'react'
import { useUser } from '../context/UserContext'
import { useAuth } from '../context/AuthContext'
import { User, Settings, Save, RefreshCw, AlertCircle } from 'lucide-react'

interface UserProfileManagerProps {
  className?: string
}

export default function UserProfileManager({ className = '' }: UserProfileManagerProps) {
  const { userProfile, loading, error, updateProfile, refreshProfile, clearError } = useUser()
  const { currentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    currency: '',
    timezone: '',
    monthlyIncomeGoal: 0,
    monthlyExpenseGoal: 0,
    savingsGoal: 0
  })
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName,
        currency: userProfile.currency,
        timezone: userProfile.timezone,
        monthlyIncomeGoal: userProfile.monthlyIncomeGoal || 0,
        monthlyExpenseGoal: userProfile.monthlyExpenseGoal || 0,
        savingsGoal: userProfile.savingsGoal || 0
      })
    }
  }, [userProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Goal') ? parseFloat(value) || 0 : value
    }))
  }

  const handleSave = async () => {
    if (!currentUser?.uid) return

    setIsSaving(true)
    try {
      await updateProfile({
        displayName: formData.displayName,
        currency: formData.currency,
        timezone: formData.timezone,
        monthlyIncomeGoal: formData.monthlyIncomeGoal,
        monthlyExpenseGoal: formData.monthlyExpenseGoal,
        savingsGoal: formData.savingsGoal
      })
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName,
        currency: userProfile.currency,
        timezone: userProfile.timezone,
        monthlyIncomeGoal: userProfile.monthlyIncomeGoal || 0,
        monthlyExpenseGoal: userProfile.monthlyExpenseGoal || 0,
        savingsGoal: userProfile.savingsGoal || 0
      })
    }
    setIsEditing(false)
    clearError()
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <span className="ml-2 text-gray-600">Profile not found</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">User Profile</h2>
              <p className="text-sm text-gray-500">Manage your account settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={refreshProfile}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Refresh profile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Profile Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your display name"
                />
              ) : (
                <p className="text-gray-900">{userProfile.displayName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{userProfile.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              {isEditing ? (
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              ) : (
                <p className="text-gray-900">{userProfile.currency}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              {isEditing ? (
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              ) : (
                <p className="text-gray-900">{userProfile.timezone}</p>
              )}
            </div>
          </div>

          {/* Financial Goals */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Financial Goals
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Income Goal
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="monthlyIncomeGoal"
                  value={formData.monthlyIncomeGoal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              ) : (
                <p className="text-gray-900">
                  {userProfile.currency} {userProfile.monthlyIncomeGoal?.toLocaleString() || '0'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Expense Goal
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="monthlyExpenseGoal"
                  value={formData.monthlyExpenseGoal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              ) : (
                <p className="text-gray-900">
                  {userProfile.currency} {userProfile.monthlyExpenseGoal?.toLocaleString() || '0'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Savings Goal
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="savingsGoal"
                  value={formData.savingsGoal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              ) : (
                <p className="text-gray-900">
                  {userProfile.currency} {userProfile.savingsGoal?.toLocaleString() || '0'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 