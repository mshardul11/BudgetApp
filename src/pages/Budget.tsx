import { useState } from 'react'
import { useBudget } from '../context/BudgetContext'
import { formatCurrency, formatPercentage } from '../utils/formatters'
import { Plus, Trash2, Target, AlertTriangle, TrendingUp, TrendingDown, Edit3, Save, X } from 'lucide-react'

export default function Budget() {
  const { state, addBudget, updateBudget, deleteBudget } = useBudget()
  const { user } = state
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'yearly'
  })
  const [editFormData, setEditFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'yearly'
  })

  const expenseCategories = state.categories.filter(cat => cat.type === 'expense')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category || !formData.amount) return

    addBudget({
      category: formData.category,
      amount: parseFloat(formData.amount),
      spent: 0,
      period: formData.period,
      startDate: new Date().toISOString()
    })

    setFormData({
      category: '',
      amount: '',
      period: 'monthly'
    })
    setShowForm(false)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBudget || !editFormData.category || !editFormData.amount) return

    const budgetToUpdate = state.budgets.find(b => b.id === editingBudget)
    if (!budgetToUpdate) return

    updateBudget({
      ...budgetToUpdate,
      category: editFormData.category,
      amount: parseFloat(editFormData.amount),
      period: editFormData.period
    })

    setEditFormData({
      category: '',
      amount: '',
      period: 'monthly'
    })
    setEditingBudget(null)
  }

  const startEditing = (budget: any) => {
    setEditingBudget(budget.id)
    setEditFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period
    })
  }

  const cancelEditing = () => {
    setEditingBudget(null)
    setEditFormData({
      category: '',
      amount: '',
      period: 'monthly'
    })
  }

  const getCategorySpent = (categoryName: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return state.transactions
      .filter(t => t.type === 'expense' && t.category === categoryName && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const totalBudget = state.budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = state.budgets.reduce((sum, b) => sum + b.spent, 0)
  const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-bold gradient-text mb-2">Budget</h1>
          <p className="text-gray-600 text-lg">Set and track your spending limits</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2 animate-bounce-in"
        >
          <Plus className="w-4 h-4" />
          <span>Add Budget</span>
        </button>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card-primary animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Budget</p>
              <p className="text-3xl font-bold gradient-text">
                {formatCurrency(totalBudget, user)}
              </p>
              <div className="flex items-center mt-2 text-blue-600">
                <Target className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Set limit</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-warning animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Spent</p>
              <p className="text-3xl font-bold gradient-text-warning">
                {formatCurrency(totalSpent, user)}
              </p>
              <div className="flex items-center mt-2 text-yellow-600">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">This month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl">
              <TrendingDown className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-success animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Usage</p>
              <p className={`text-3xl font-bold ${budgetUsage > 100 ? 'gradient-text-danger' : budgetUsage > 80 ? 'gradient-text-warning' : 'gradient-text-success'}`}>
                {formatPercentage(budgetUsage)}
              </p>
              <div className="flex items-center mt-2 text-gray-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">
                  {budgetUsage > 100 ? 'Over budget' : budgetUsage > 80 ? 'Warning' : 'On track'}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Budget Form */}
      {showForm && (
        <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Add Budget</h3>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select a category</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {user?.currency === 'INR' ? '₹' : user?.currency === 'EUR' ? '€' : user?.currency === 'GBP' ? '£' : user?.currency === 'JPY' ? '¥' : user?.currency === 'CAD' ? 'C$' : '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input pl-8"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as 'monthly' | 'yearly' })}
                className="input"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <button type="submit" className="btn-primary flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Categories */}
      <div className="card animate-slide-up" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Budget Categories</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Target className="w-4 h-4 text-blue-500" />
            <span>Monthly tracking</span>
          </div>
        </div>
        
        {state.budgets.length > 0 ? (
          <div className="space-y-6">
            {state.budgets.map((budget, index) => {
              const category = state.categories.find(c => c.name === budget.category)
              const spent = getCategorySpent(budget.category)
              const usage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
              
              return (
                <div 
                  key={budget.id} 
                  className="p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-slide-up"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="category-icon"
                        style={{ backgroundColor: category?.color + '20', color: category?.color }}
                      >
                        {category?.icon || '💰'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{budget.category}</p>
                        <p className="text-sm text-gray-500">{budget.period} budget</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditing(budget)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-all duration-200 hover:scale-110"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteBudget(budget.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Spent: {formatCurrency(spent, user)}</span>
                      <span className="text-gray-600 font-medium">Budget: {formatCurrency(budget.amount, user)}</span>
                    </div>
                    
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${
                          usage > 100 ? 'progress-fill-danger' : usage > 80 ? 'progress-fill-warning' : 'progress-fill-success'
                        }`}
                        style={{ width: `${Math.min(usage, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`font-bold text-sm ${
                        usage > 100 ? 'text-red-600' : usage > 80 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {formatPercentage(usage)} used
                      </span>
                      {usage > 100 && (
                        <span className="text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded-full">
                          {formatCurrency(spent - budget.amount, user)} over budget
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-medium mb-2">No budgets set yet</p>
            <p className="text-sm">Start by adding your first budget to track your spending limits</p>
          </div>
        )}

        {/* Edit Budget Form */}
        {editingBudget && (
          <div className="card animate-slide-up border-2 border-blue-200 bg-blue-50/30" style={{ animationDelay: '700ms' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Budget</h3>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select a category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {user?.currency === 'INR' ? '₹' : user?.currency === 'EUR' ? '€' : user?.currency === 'GBP' ? '£' : user?.currency === 'JPY' ? '¥' : user?.currency === 'CAD' ? 'C$' : '$'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editFormData.amount}
                      onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                      className="input pl-8"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Period</label>
                <select
                  value={editFormData.period}
                  onChange={(e) => setEditFormData({ ...editFormData, period: e.target.value as 'monthly' | 'yearly' })}
                  className="input"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <button type="submit" className="btn-success flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
                <button 
                  type="button" 
                  onClick={cancelEditing}
                  className="btn-secondary"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
} 