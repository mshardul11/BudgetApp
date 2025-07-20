import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'

interface MonthPickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  className?: string
}

export default function MonthPicker({ selectedDate, onDateChange, className = '' }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePreviousMonth = () => {
    onDateChange(subMonths(selectedDate, 1))
  }

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
    setIsOpen(false)
  }

  const handleMonthSelect = (monthOffset: number) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + monthOffset, 1)
    onDateChange(newDate)
    setIsOpen(false)
  }

  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    
    // Generate 12 months back and 12 months forward
    for (let i = -12; i <= 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      options.push({
        date,
        label: format(date, 'MMMM yyyy'),
        isCurrent: i === 0,
        isSelected: date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear()
      })
    }
    
    return options
  }

  const monthOptions = generateMonthOptions()

  return (
    <div className={`relative ${className}`}>
      {/* Main Display */}
      <div 
        className="flex items-center space-x-3 text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 cursor-pointer hover:bg-white/80 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="w-4 h-4" />
        <span className="font-medium">{format(selectedDate, 'MMMM yyyy')}</span>
        <Sparkles className="w-4 h-4 text-yellow-500" />
      </div>

      {/* Navigation Arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handlePreviousMonth()
          }}
          className="p-1 bg-white/80 rounded-full shadow-sm hover:bg-white transition-all duration-200 pointer-events-auto -ml-2"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleNextMonth()
          }}
          className="p-1 bg-white/80 rounded-full shadow-sm hover:bg-white transition-all duration-200 pointer-events-auto -mr-2"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-slide-down">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Select Month</h3>
              <button
                onClick={handleToday}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Today
              </button>
            </div>

            {/* Month List */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {monthOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMonthSelect(option.date.getMonth() - new Date().getMonth() + (option.date.getFullYear() - new Date().getFullYear()) * 12)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 min-h-[44px] flex items-center justify-between ${
                    option.isSelected
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : option.isCurrent
                      ? 'bg-gray-100 text-gray-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.isCurrent && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 