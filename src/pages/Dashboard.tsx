import { useBudget } from '../context/BudgetContext'
import { formatCurrency } from '../utils/formatters'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Plus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { useState, useMemo, useCallback } from 'react'
import MonthPicker from '../components/MonthPicker'

export default function Dashboard() {
  const { state, addTransaction } = useBudget()
  const { transactions, categories, user } = state
  
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  // Memoized calculations to prevent unnecessary re-computations
  const selectedMonth = useMemo(() => format(selectedDate, 'yyyy-MM'), [selectedDate])
  
  const monthlyTransactions = useMemo(() => 
    transactions.filter(t => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  )

  const expenseCategories = useMemo(() => 
    categories.filter(cat => cat.type === 'expense'),
    [categories]
  )

  // Prepare chart data with memoization
  const expenseByCategory = useMemo(() => {
    return expenseCategories
      .map(cat => {
        const total = monthlyTransactions
          .filter(t => t.type === 'expense' && t.category === cat.name)
          .reduce((sum, t) => sum + t.amount, 0)
        return {
          name: cat.name,
          value: total,
          color: cat.color,
          icon: cat.icon
        }
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [expenseCategories, monthlyTransactions])

  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [transactions])

  // Calculate stats for selected month with memoization
  const monthlyStats = useMemo(() => {
    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalInvestments = monthlyTransactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const balance = totalIncome - totalExpenses - totalInvestments
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
    
    return {
      totalIncome,
      totalExpenses,
      totalInvestments,
      balance,
      savingsRate
    }
  }, [monthlyTransactions])

  // Utility functions with useCallback to prevent re-creation
  const getMonthRange = useCallback(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)
    return { start, end }
  }, [selectedDate])

  const getMonthProgress = useCallback(() => {
    const { end } = getMonthRange()
    const now = new Date()
    const totalDays = end.getDate()
    const elapsedDays = Math.min(now.getDate(), totalDays)
    return (elapsedDays / totalDays) * 100
  }, [getMonthRange])

  const getChartColors = useCallback((count: number) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    return COLORS.slice(0, count)
  }, [])

  const getMonthStatus = useCallback(() => {
    const now = new Date()
    const isCurrentMonth = selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear()
    const isPastMonth = selectedDate < startOfMonth(now)
    const isFutureMonth = selectedDate > endOfMonth(now)
    
    return {
      isCurrent: isCurrentMonth,
      isPast: isPastMonth,
      isFuture: isFutureMonth,
      progress: isCurrentMonth ? getMonthProgress() : isPastMonth ? 100 : 0
    }
  }, [selectedDate, getMonthProgress])

  const getMonthComparison = useCallback(() => {
    const previousMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    const previousMonthStr = format(previousMonth, 'yyyy-MM')
    const previousMonthTransactions = transactions.filter(t => t.date.startsWith(previousMonthStr))
    
    const previousIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const previousExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const incomeChange = previousIncome > 0 ? ((monthlyStats.totalIncome - previousIncome) / previousIncome) * 100 : 0
    const expenseChange = previousExpenses > 0 ? ((monthlyStats.totalExpenses - previousExpenses) / previousExpenses) * 100 : 0
    
    return {
      incomeChange: incomeChange.toFixed(1),
      expenseChange: expenseChange.toFixed(1),
      isIncomeUp: incomeChange > 0,
      isExpenseUp: expenseChange > 0
    }
  }, [selectedDate, transactions, monthlyStats.totalIncome, monthlyStats.totalExpenses])

  const getMonthSummary = useCallback(() => {
    const { end } = getMonthRange()
    const totalDays = end.getDate()
    const transactionCount = monthlyTransactions.length
    const avgDailySpending = totalDays > 0 ? monthlyStats.totalExpenses / totalDays : 0
    
    return {
      totalDays,
      transactionCount,
      avgDailySpending,
      daysRemaining: getMonthStatus().isCurrent ? totalDays - new Date().getDate() : 0
    }
  }, [getMonthRange, monthlyTransactions.length, monthlyStats.totalExpenses, getMonthStatus().isCurrent])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || !formData.description || !formData.category) return

    addTransaction({
      type: formData.type as 'income' | 'expense' | 'investment',
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: formData.date
    })

    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowForm(false)
  }, [formData, addTransaction])

  const filteredCategories = useMemo(() => 
    categories.filter(cat => cat.type === formData.type),
    [categories, formData.type]
  )

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="animate-slide-up flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Welcome back! Here's your financial overview</p>
          {getMonthStatus().isCurrent && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Month Progress</span>
                <span>{getMonthStatus().progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getMonthStatus().progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end space-y-2 w-full sm:w-auto">
          <MonthPicker 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            className="animate-slide-up w-full sm:w-auto"
          />
          {(() => {
            const status = getMonthStatus()
            if (status.isCurrent) {
              return (
                <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Current Month</span>
                </div>
              )
            } else if (status.isPast) {
              return (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>Past Month</span>
                </div>
              )
            } else {
              return (
                <div className="flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Future Month</span>
                </div>
              )
            }
          })()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="stat-card-success animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Income</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text-success">
                {formatCurrency(monthlyStats.totalIncome, user)}
              </p>
              <div className="flex items-center mt-2 text-green-600">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">
                  {getMonthComparison().isIncomeUp ? '+' : ''}{getMonthComparison().incomeChange}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl ml-3">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-danger animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text-danger">
                {formatCurrency(monthlyStats.totalExpenses, user)}
              </p>
              <div className="flex items-center mt-2 text-red-600">
                <ArrowDownRight className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">
                  {getMonthComparison().isExpenseUp ? '+' : ''}{getMonthComparison().expenseChange}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl ml-3">
              <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-purple animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Investments</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">
                {formatCurrency(monthlyStats.totalInvestments, user)}
              </p>
              <div className="flex items-center mt-2 text-purple-600">
                <Target className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Future goals</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl ml-3">
              <PieChartIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-primary animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Balance</p>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${monthlyStats.balance >= 0 ? 'gradient-text-success' : 'gradient-text-danger'}`}>
                {formatCurrency(monthlyStats.balance, user)}
              </p>
              <div className="flex items-center mt-2 text-blue-600">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Available</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl ml-3">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-warning animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Savings Rate</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text-warning">
                {monthlyStats.savingsRate.toFixed(1)}%
              </p>
              <div className="flex items-center mt-2 text-yellow-600">
                <Target className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Goal: 20%</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl ml-3">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Month Summary Card */}
      <div className="card animate-slide-up" style={{ animationDelay: '450ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Month Summary</h3>
          <div className="text-sm text-gray-500">
            {format(selectedDate, 'MMMM yyyy')}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getMonthSummary().transactionCount}</div>
            <div className="text-sm text-gray-600">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{getMonthSummary().totalDays}</div>
            <div className="text-sm text-gray-600">Total Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(getMonthSummary().avgDailySpending, user)}
            </div>
            <div className="text-sm text-gray-600">Avg Daily</div>
          </div>
          {getMonthStatus().isCurrent && (
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{getMonthSummary().daysRemaining}</div>
              <div className="text-sm text-gray-600">Days Left</div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense by Category */}
        <div className="card animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Expenses by Category</h3>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          {expenseByCategory.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || getChartColors(expenseByCategory.length)[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number, user)}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingDown className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium">No expense data available</p>
                <p className="text-sm">Start tracking your expenses to see insights</p>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Overview */}
        <div className="card animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Monthly Overview</h3>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                {
                  name: 'Income',
                  amount: monthlyStats.totalIncome,
                  fill: '#10b981'
                },
                {
                  name: 'Expenses',
                  amount: monthlyStats.totalExpenses,
                  fill: '#ef4444'
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number, user)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="amount" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <div className="card animate-slide-up" style={{ animationDelay: '650ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Add Transaction</h3>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Transaction Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, category: '' })}
                  className="input"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="investment">Investment</option>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder={
                    formData.type === 'income' 
                      ? "e.g., Salary, Freelance work" 
                      : formData.type === 'investment'
                      ? "e.g., Stock purchase, Bond investment"
                      : "e.g., Groceries, Gas, Shopping"
                  }
                  required
                />
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
              <label className="label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                required
              >
                <option value="">Select a category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button 
                type="submit" 
                className={`flex-1 ${
                  formData.type === 'income' 
                    ? 'btn-success' 
                    : formData.type === 'investment'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors'
                    : 'btn-danger'
                } flex items-center justify-center space-x-2`}
              >
                <Plus className="w-4 h-4" />
                <span>Add {
                  formData.type === 'income' 
                    ? 'Income' 
                    : formData.type === 'investment'
                    ? 'Investment'
                    : 'Expense'
                }</span>
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

      {/* Recent Transactions */}
      <div className="card animate-slide-up" style={{ animationDelay: '700ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
        
        {recentTransactions.length > 0 ? (
          <div className="space-y-4">
            {recentTransactions.map((transaction, index) => {
              const category = categories.find(c => c.name === transaction.category)
              return (
                <div 
                  key={transaction.id} 
                  className="transaction-item animate-slide-up"
                  style={{ animationDelay: `${800 + index * 100}ms` }}
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
                  <div className="text-right">
                                    <p className={`font-bold text-lg ${
                  transaction.type === 'income' 
                    ? 'text-green-600' 
                    : transaction.type === 'investment'
                    ? 'text-purple-600'
                    : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : transaction.type === 'investment' ? '→' : '-'}{formatCurrency(transaction.amount, user)}
                    </p>
                    <p className="text-sm text-gray-500">{format(new Date(transaction.date), 'MMM dd')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-medium mb-2">No transactions yet</p>
            <p className="text-sm">Start by adding your first transaction to see your financial overview</p>
          </div>
        )}
      </div>
    </div>
  )
} 