#!/bin/bash

# Budget App Mobile Setup Script
echo "🚀 Setting up Budget App Mobile..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt "14" ]; then
    echo "❌ Node.js version 14 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the mobile app directory (android-app/BudgetApp)"
    exit 1
fi

# Install Expo CLI if not already installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Expo CLI"
        exit 1
    fi
    echo "✅ Expo CLI installed"
else
    echo "✅ Expo CLI is already installed"
fi

# Install dependencies
echo "📦 Installing project dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"

# Check Expo doctor
echo "🩺 Running Expo doctor to check for issues..."
npx expo doctor

# Create development environment info
echo "
📱 Budget App Mobile Setup Complete!

🚀 To start development:
   npx expo start

📱 To run on Android:
   npx expo start --android

📱 To run on iOS (macOS only):
   npx expo start --ios

🌐 To run on web:
   npx expo start --web

📋 Next steps:
1. Make sure your Firebase configuration is correct in src/config/firebase.ts
2. Install Expo Go app on your mobile device
3. Scan the QR code when running 'npx expo start'

🔗 Useful links:
   - Expo Documentation: https://docs.expo.dev/
   - React Native Documentation: https://reactnative.dev/
   - Firebase Documentation: https://firebase.google.com/docs

Happy coding! 🎉
"