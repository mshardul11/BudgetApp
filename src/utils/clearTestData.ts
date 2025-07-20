// Utility function to clear test data from localStorage
export const clearTestData = () => {
  try {
    // Clear the budget app data
    localStorage.removeItem('budget-app-data')
    
    // Clear any other test data
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('test') || key && key.includes('demo')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log('Test data cleared successfully')
    return true
  } catch (error) {
    console.error('Error clearing test data:', error)
    return false
  }
}

// Function to check if data contains test data
export const hasTestData = () => {
  try {
    const savedData = localStorage.getItem('budget-app-data')
    if (!savedData) return false
    
    const data = JSON.parse(savedData)
    
    // Check for John Doe test data
    if (data.user && data.user.name === 'John Doe') {
      return true
    }
    
    // Check for test transactions
    if (data.transactions && data.transactions.length > 0) {
      const testTransactions = data.transactions.filter((t: any) => 
        t.description === 'Monthly Salary' || 
        t.description === 'Freelance Project' ||
        t.description === 'Rent Payment' ||
        t.description === 'Grocery Shopping' ||
        t.description === 'Gas Station' ||
        t.description === 'Electricity Bill' ||
        t.description === 'Movie Tickets'
      )
      
      if (testTransactions.length > 0) {
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('Error checking for test data:', error)
    return false
  }
} 