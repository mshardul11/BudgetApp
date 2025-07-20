import { useBudget } from '../context/BudgetContext'
import { formatCurrency, formatPercentage } from '../utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { format, subMonths } from 'date-fns'
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react'

export default function Reports() {
  const { state } = useBudget()
  const { transactions, categories, user } = state

  // Get last 6 months of data
  const getMonthlyData = () => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthKey = format(date, 'yyyy-MM')
      const monthName = format(date, 'MMM yyyy')
      
      const monthTransactions = transactions.filter(t => t.date.startsWith(monthKey))
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      months.push({
        month: monthName,
        income,
        expenses,
        balance: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
      })
    }
    return months
  }

  // Get expense breakdown by category
  const getExpenseBreakdown = () => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    const monthlyExpenses = transactions.filter(t => 
      t.type === 'expense' && t.date.startsWith(currentMonth)
    )

    return categories
      .filter(cat => cat.type === 'expense')
      .map(cat => {
        const total = monthlyExpenses
          .filter(t => t.category === cat.name)
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
  }

  // Get income breakdown by category
  const getIncomeBreakdown = () => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    const monthlyIncome = transactions.filter(t => 
      t.type === 'income' && t.date.startsWith(currentMonth)
    )

    return categories
      .filter(cat => cat.type === 'income')
      .map(cat => {
        const total = monthlyIncome
          .filter(t => t.category === cat.name)
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
  }

  const monthlyData = getMonthlyData()
  const expenseBreakdown = getExpenseBreakdown()
  const incomeBreakdown = getIncomeBreakdown()



  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold gradient-text mb-2">Reports & Analytics</h1>
        <p className="text-gray-600 text-lg">Detailed insights into your financial patterns and trends</p>
      </div>

      {/* Monthly Trends */}
      <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">6-Month Financial Trends</h3>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value as number, user)}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Savings Rate Trend */}
      <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Savings Rate Trend</h3>
          <div className="flex items-center space-x-2">
            <LineChartIcon className="w-5 h-5 text-blue-500" />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `${(value as number).toFixed(1)}%`}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="savingsRate" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Savings Rate"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense Breakdown */}
        <div className="card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Expense Breakdown</h3>
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-red-500" />
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
          {expenseBreakdown.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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

        {/* Income Breakdown */}
        <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Income Breakdown</h3>
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-green-500" />
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          {incomeBreakdown.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium">No income data available</p>
                <p className="text-sm">Start tracking your income to see insights</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card-success animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Average Monthly Income</p>
            <p className="text-2xl font-bold gradient-text-success">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length, user)}
            </p>
          </div>
        </div>

        <div className="stat-card-danger animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Average Monthly Expenses</p>
            <p className="text-2xl font-bold gradient-text-danger">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length, user)}
            </p>
          </div>
        </div>

        <div className="stat-card-primary animate-slide-up" style={{ animationDelay: '700ms' }}>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Average Monthly Savings</p>
            <p className="text-2xl font-bold gradient-text">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.balance, 0) / monthlyData.length, user)}
            </p>
          </div>
        </div>

        <div className="stat-card-warning animate-slide-up" style={{ animationDelay: '800ms' }}>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <LineChartIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Average Savings Rate</p>
            <p className="text-2xl font-bold gradient-text-warning">
              {formatPercentage(monthlyData.reduce((sum, m) => sum + m.savingsRate, 0) / monthlyData.length)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 