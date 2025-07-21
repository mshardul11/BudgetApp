import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Transaction, Category } from '../types'

interface TransactionSearchProps {
  transactions: Transaction[]
  categories: Category[]
  onFilterChange: (filtered: Transaction[]) => void
}

export default function TransactionSearch({ transactions, categories, onFilterChange }: TransactionSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'investment'>('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all')

  const handleSearch = () => {
    let filtered = transactions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter(t => new Date(t.date) >= startDate)
    }

    onFilterChange(filtered)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType('all')
    setSelectedCategory('all')
    setDateRange('all')
    onFilterChange(transactions)
  }

  // Auto-filter when any filter changes
  useState(() => {
    handleSearch()
  })

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
        >
          <X className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              handleSearch()
            }}
            className="input pl-10"
          />
        </div>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value as 'all' | 'income' | 'expense' | 'investment')
            handleSearch()
          }}
          className="input"
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="investment">Investment</option>
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            handleSearch()
          }}
          className="input"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>

        {/* Date Range Filter */}
        <select
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value as 'all' | 'week' | 'month' | 'year')
            handleSearch()
          }}
          className="input"
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>
  )
} 