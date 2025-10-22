// Utility function to clear test data from localStorage
export function clearTestData() {
  localStorage.removeItem('budget-app-data')
  
  // Clear any other test-related data
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('test') || key.includes('demo') || key.includes('temp'))) {
      keysToRemove.push(key)
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

// Function to check if data contains test data
export function containsTestData(): boolean {
  const savedData = localStorage.getItem('budget-app-data')
  if (!savedData) return false
  
  try {
    const data = JSON.parse(savedData)
    // Check for common test indicators
    const testIndicators = ['test', 'demo', 'sample', 'example']
    const dataString = JSON.stringify(data).toLowerCase()
    
    return testIndicators.some(indicator => dataString.includes(indicator))
  } catch {
    return false
  }
} 