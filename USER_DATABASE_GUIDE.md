# User Database Implementation Guide

This guide documents the user database implementation for the Budget App, built with Firebase Firestore and React.

## Overview

The user database system provides:
- User profile management with Firebase Authentication integration
- Secure data access with Firestore security rules
- Real-time user state management with React Context
- Comprehensive CRUD operations for user profiles
- Financial goals and preferences tracking

## Architecture

### 1. User Service (`src/services/userService.ts`)
The core service that handles all database operations:

```typescript
// Key interfaces
interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
  currency: string
  timezone: string
  monthlyIncomeGoal?: number
  monthlyExpenseGoal?: number
  savingsGoal?: number
  notifications: NotificationSettings
  preferences: UserPreferences
  isActive: boolean
  lastLoginAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 2. User Context (`src/context/UserContext.tsx`)
React Context for managing user state throughout the application:

```typescript
interface UserContextType {
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  updateProfile: (data: UpdateUserProfileData) => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}
```

### 3. Security Rules (`firestore.rules`)
Firestore security rules ensuring users can only access their own data:

```javascript
// Users can only read/write their own profile
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Setup Instructions

### 1. Firebase Configuration
Ensure your Firebase project is properly configured in `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
}
```

### 2. Deploy Security Rules
Deploy the Firestore security rules to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

### 3. Enable Authentication
In your Firebase Console:
1. Go to Authentication > Sign-in method
2. Enable Email/Password, Google, and Facebook providers
3. Configure OAuth consent screen for Google/Facebook

## Usage Examples

### 1. Using the User Context

```typescript
import { useUser } from '../context/UserContext'

function MyComponent() {
  const { userProfile, loading, error, updateProfile } = useUser()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Welcome, {userProfile?.displayName}</h1>
      <p>Currency: {userProfile?.currency}</p>
    </div>
  )
}
```

### 2. Updating User Profile

```typescript
const { updateProfile } = useUser()

const handleUpdate = async () => {
  try {
    await updateProfile({
      displayName: 'New Name',
      currency: 'EUR',
      monthlyIncomeGoal: 5000
    })
    console.log('Profile updated successfully')
  } catch (error) {
    console.error('Failed to update profile:', error)
  }
}
```

### 3. Direct Service Usage

```typescript
import { userService } from '../services/userService'

// Create a new user profile
const newProfile = await userService.createUserProfile({
  uid: 'user123',
  email: 'user@example.com',
  displayName: 'John Doe'
})

// Get user profile
const profile = await userService.getUserProfile('user123')

// Update profile
const updatedProfile = await userService.updateUserProfile('user123', {
  displayName: 'Jane Doe',
  currency: 'GBP'
})
```

## Database Schema

### Users Collection
```
users/{userId}
├── email: string
├── displayName: string
├── photoURL: string (optional)
├── phoneNumber: string (optional)
├── currency: string
├── timezone: string
├── monthlyIncomeGoal: number (optional)
├── monthlyExpenseGoal: number (optional)
├── savingsGoal: number (optional)
├── notifications: {
│   ├── email: boolean
│   ├── push: boolean
│   ├── budgetAlerts: boolean
│   └── weeklyReports: boolean
│ }
├── preferences: {
│   ├── theme: 'light' | 'dark' | 'auto'
│   ├── language: string
│   ├── dateFormat: string
│   └── currencyFormat: string
│ }
├── isActive: boolean
├── lastLoginAt: timestamp
├── createdAt: timestamp
└── updatedAt: timestamp
```

## Security Features

### 1. Authentication Required
All user data operations require Firebase Authentication.

### 2. User Isolation
Users can only access their own data through UID-based security rules.

### 3. Data Validation
Input validation is performed both client-side and server-side.

### 4. Timestamp Tracking
All records include creation and update timestamps for audit trails.

## Best Practices

### 1. Error Handling
Always wrap database operations in try-catch blocks:

```typescript
try {
  await updateProfile(data)
} catch (error) {
  console.error('Database operation failed:', error)
  // Handle error appropriately
}
```

### 2. Loading States
Show loading indicators during database operations:

```typescript
const [isLoading, setIsLoading] = useState(false)

const handleSave = async () => {
  setIsLoading(true)
  try {
    await updateProfile(data)
  } finally {
    setIsLoading(false)
  }
}
```

### 3. Data Validation
Validate data before sending to database:

```typescript
const validateProfileData = (data: UpdateUserProfileData) => {
  if (data.displayName && data.displayName.length < 2) {
    throw new Error('Display name must be at least 2 characters')
  }
  if (data.monthlyIncomeGoal && data.monthlyIncomeGoal < 0) {
    throw new Error('Income goal cannot be negative')
  }
}
```

### 4. Offline Support
Consider implementing offline support with Firestore's offline persistence:

```typescript
import { enableNetwork, disableNetwork } from 'firebase/firestore'

// Enable offline persistence
await enableNetwork(db)
```

## Testing

### 1. Unit Tests
Test individual service methods:

```typescript
describe('UserService', () => {
  it('should create user profile', async () => {
    const mockData = {
      uid: 'test123',
      email: 'test@example.com',
      displayName: 'Test User'
    }
    
    const result = await userService.createUserProfile(mockData)
    expect(result.uid).toBe(mockData.uid)
  })
})
```

### 2. Integration Tests
Test the complete user flow:

```typescript
describe('User Registration Flow', () => {
  it('should create profile after authentication', async () => {
    // Test complete registration flow
  })
})
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user is authenticated
   - Verify security rules are deployed
   - Ensure UID matches document ID

2. **Profile Not Found**
   - Check if profile was created during registration
   - Verify user authentication state
   - Check Firestore console for document existence

3. **Update Failures**
   - Validate input data
   - Check network connectivity
   - Verify user permissions

### Debug Mode
Enable debug logging in development:

```typescript
// In firebase.ts
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
```

## Performance Considerations

### 1. Indexing
Create composite indexes for complex queries:

```javascript
// In firebase.json
{
  "firestore": {
    "indexes": [
      {
        "collectionGroup": "users",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "isActive", "order": "ASCENDING" },
          { "fieldPath": "createdAt", "order": "DESCENDING" }
        ]
      }
    ]
  }
}
```

### 2. Caching
Implement client-side caching for frequently accessed data:

```typescript
const [cachedProfile, setCachedProfile] = useState(null)

useEffect(() => {
  if (userProfile) {
    setCachedProfile(userProfile)
  }
}, [userProfile])
```

### 3. Batch Operations
Use batch operations for multiple updates:

```typescript
import { writeBatch } from 'firebase/firestore'

const batch = writeBatch(db)
batch.update(userRef, { displayName: 'New Name' })
batch.update(userRef, { updatedAt: serverTimestamp() })
await batch.commit()
```

## Future Enhancements

### 1. Admin Panel
- User management interface
- Analytics and reporting
- Bulk operations

### 2. Advanced Features
- User roles and permissions
- Multi-tenant support
- Data export/import

### 3. Performance
- Real-time subscriptions
- Optimistic updates
- Background sync

## Support

For issues or questions:
1. Check the Firebase documentation
2. Review security rules syntax
3. Test with Firebase emulator
4. Check browser console for errors

## License

This implementation is part of the Budget App project and follows the same licensing terms. 