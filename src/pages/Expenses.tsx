import { useState } from 'react'
import { useBudget } from '../context/BudgetContext'
import { formatCurrency, formatDate } from '../utils/formatters'
import { Plus, Trash2, Calendar, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'

export default function Expenses() {
  const { state, addTransaction, deleteTransaction } = useBudget()
  const { user } = state
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  })

  const expenseCategories = state.categories.filter(cat => cat.type === 'expense')
  const expenseTransactions = state.transactions.filter(t => t.type === 'expense')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || !formData.description || !formData.category) return

    addTransaction({
      type: 'expense',
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: formData.date
    })

    setFormData({
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowForm(false)
  }

  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="animate-slide-up flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">Expenses</h1>
          <p className="text-sm sm:text-base text-gray-600">Monitor and control your spending</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-danger flex items-center space-x-2 animate-bounce-in w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Total Expenses Card */}
      <div className="stat-card-danger animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text-danger">
              {formatCurrency(totalExpenses, user)}
            </p>
            <div className="flex items-center mt-3 text-red-600">
              <TrendingDown className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">This month</span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl ml-3">
            <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Add Expense</h3>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              <div>
                <label className="label">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder="e.g., Groceries, Gas, Restaurant, Shopping"
                required
              />
            </div>

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

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <button type="submit" className="btn-danger w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense Transactions */}
      <div className="card animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Expense History</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>All time</span>
          </div>
        </div>
        
        {expenseTransactions.length > 0 ? (
          <div className="space-y-4">
            {expenseTransactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction, index) => {
                const category = state.categories.find(c => c.name === transaction.category)
                return (
                  <div 
                    key={transaction.id} 
                    className="transaction-item animate-slide-up"
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="category-icon"
                        style={{ backgroundColor: category?.color + '20', color: category?.color }}
                      >
                        {category?.icon || '💰'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold text-lg text-red-600">
                          -{formatCurrency(transaction.amount, user)}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.date, user)}</p>
                      </div>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-medium mb-2">No expense transactions yet</p>
            <p className="text-sm">Start by adding your first expense to track your spending</p>
          </div>
        )}
      </div>
    </div>
  )
} 