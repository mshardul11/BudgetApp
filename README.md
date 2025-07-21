# Budget App Mobile 📱

A React Native/Expo mobile application that syncs with the Budget App web version. Track your income, expenses, budgets, and financial goals on the go with real-time synchronization across all devices.

## Features

### 🔄 **Real-time Sync**
- Seamless synchronization with the web app using Firebase Firestore
- Offline support with automatic sync when back online
- Real-time updates across all devices
- Conflict resolution for data integrity

### 📊 **Financial Management**
- Track income, expenses, and investments
- Set and monitor budgets
- View detailed financial reports and analytics
- Transaction categorization with custom categories
- Monthly and yearly budget tracking

### 📱 **Mobile-Optimized UI**
- Beautiful, intuitive mobile design
- Pull-to-refresh functionality
- Touch-friendly interface
- Responsive design for all screen sizes
- Smooth animations and transitions

### 🔐 **Secure Authentication**
- Firebase Authentication integration
- Email/password login
- Secure user data storage
- Session persistence

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Firebase (Firestore, Auth)
- **Navigation**: React Navigation 6
- **State Management**: Context API with useReducer
- **Storage**: AsyncStorage for offline data
- **Network**: NetInfo for connectivity detection
- **Icons**: Expo Vector Icons
- **UI Components**: React Native + Custom Components

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budget-app/android-app/BudgetApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Ensure Firebase is properly configured (uses same config as web app)
   - The Firebase configuration is located in `src/config/firebase.ts`

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/emulator**
   - For Android: Press `a` in the terminal or scan QR code with Expo Go
   - For iOS: Press `i` in the terminal or scan QR code with Expo Go

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   └── BudgetContext.tsx
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/           # App screens
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── TransactionsScreen.tsx
│   ├── BudgetScreen.tsx
│   ├── ReportsScreen.tsx
│   └── ProfileScreen.tsx
├── services/          # API and data services
│   └── dataSyncService.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
└── config/           # Configuration files
    └── firebase.ts
```

## Key Features

### Real-time Data Synchronization
The app uses a sophisticated sync service that:
- Monitors network connectivity
- Queues operations when offline
- Merges data conflicts intelligently
- Provides real-time updates via Firestore listeners

### Cross-Platform Compatibility
- Identical data structure with web app
- Shared Firebase backend
- Consistent user experience across platforms
- Same business logic and validation rules

### Offline Support
- Local data caching with AsyncStorage
- Queue operations when offline
- Automatic sync when connection restored
- Optimistic UI updates

## Configuration

### Firebase Setup
The app uses the same Firebase project as the web version:
- Project ID: `budgetapp-254a2`
- Authentication: Email/Password
- Database: Cloud Firestore
- Real-time sync enabled

### Environment Variables
No additional environment variables needed - uses same Firebase config as web app.

## Building for Production

### Android APK
```bash
npx expo build:android
```

### iOS IPA (macOS only)
```bash
npx expo build:ios
```

### Using EAS Build (Recommended)
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## Sync Architecture

The mobile app maintains perfect sync with the web app through:

1. **Shared Data Models**: Identical TypeScript interfaces
2. **Firebase Integration**: Same Firestore collections and documents
3. **Real-time Listeners**: Live updates via Firestore snapshots
4. **Conflict Resolution**: Timestamp-based merging
5. **Offline Queue**: Local operations synced when online

## Data Flow

```
Mobile App ←→ Firebase Firestore ←→ Web App
     ↓              ↓                ↓
AsyncStorage   Cloud Storage    localStorage
```

## Development

### Running in Development
```bash
# Start Expo development server
npx expo start

# Run on Android emulator
npx expo start --android

# Run on iOS simulator (macOS only)
npx expo start --ios
```

### Debugging
- Use Expo DevTools for debugging
- React Native Debugger for advanced debugging
- Flipper integration available
- Chrome DevTools for JavaScript debugging

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

## Deployment

### Expo Application Services (EAS)
1. Configure EAS:
   ```bash
   eas init
   ```

2. Build for stores:
   ```bash
   eas build --platform all
   ```

3. Submit to app stores:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

### Manual Deployment
- Android: Generate APK and upload to Google Play Console
- iOS: Generate IPA and upload to App Store Connect

## Troubleshooting

### Common Issues

1. **Sync not working**
   - Check network connection
   - Verify Firebase configuration
   - Check authentication status

2. **App crashes on startup**
   - Clear Expo cache: `npx expo r -c`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **Build failures**
   - Update Expo SDK: `npx expo install --fix`
   - Check compatibility: `npx expo doctor`

### Performance Optimization
- Image optimization with Expo Image
- Bundle size reduction with Metro bundler
- Memory management with proper cleanup
- Efficient re-renders with React.memo

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Ensure sync compatibility with web app
5. Submit a pull request

## Security

- All sensitive data encrypted in transit
- Local data stored securely in AsyncStorage
- Firebase security rules enforced
- No sensitive credentials in code

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ using React Native and Expo**

**Always in sync with the web app 🔄** 