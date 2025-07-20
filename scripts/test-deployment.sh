#!/bin/bash

# Test deployment script for debugging GitHub Actions issues
set -e

echo "🧪 Testing Budget App Deployment Pipeline"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "1. Checking Node.js and npm versions..."
node --version
npm --version
print_status $? "Node.js and npm are available"

echo ""
echo "2. Installing dependencies..."
npm ci
print_status $? "Dependencies installed successfully"

echo ""
echo "3. Running TypeScript compilation..."
npx tsc --noEmit
print_status $? "TypeScript compilation successful"

echo ""
echo "4. Building the project..."
npm run build
print_status $? "Build completed successfully"

echo ""
echo "5. Checking build output..."
if [ -d "dist" ]; then
    echo "Build directory contents:"
    ls -la dist/
    
    if [ -f "dist/index.html" ]; then
        print_status 0 "index.html found in dist/"
    else
        print_status 1 "index.html missing from dist/"
        exit 1
    fi
    
    if [ -d "dist/assets" ]; then
        print_status 0 "assets directory found"
        echo "Assets directory contents:"
        ls -la dist/assets/ | head -10
    else
        print_status 1 "assets directory missing"
        exit 1
    fi
else
    print_status 1 "dist directory not found"
    exit 1
fi

echo ""
echo "6. Testing Firebase CLI..."
if command -v firebase &> /dev/null; then
    firebase --version
    print_status $? "Firebase CLI (global) is available"
else
    print_warning "Firebase CLI not installed globally, testing npx..."
    npx firebase-tools --version
    print_status $? "Firebase CLI (npx) is available"
fi

echo ""
echo "7. Testing Firebase configuration..."
if [ -f "firebase.json" ]; then
    print_status 0 "firebase.json found"
    echo "Firebase configuration:"
    cat firebase.json | head -20
else
    print_status 1 "firebase.json missing"
fi

if [ -f ".firebaserc" ]; then
    print_status 0 ".firebaserc found"
    echo "Firebase project configuration:"
    cat .firebaserc
else
    print_status 1 ".firebaserc missing"
fi

echo ""
echo "8. Testing environment variables..."
echo "VITE_FIREBASE_PROJECT_ID: ${VITE_FIREBASE_PROJECT_ID:-'Not set (will use fallback)'}"
echo "VITE_FIREBASE_API_KEY: ${VITE_FIREBASE_API_KEY:-'Not set (will use fallback)'}"

echo ""
echo "9. Simulating Firebase deployment (dry run)..."
if [ -n "${GOOGLE_APPLICATION_CREDENTIALS}" ]; then
    echo "Google Application Credentials: Set"
    npx firebase-tools deploy --only hosting --project budgetapp-254a2 --dry-run
    print_status $? "Firebase dry run successful"
else
    print_warning "GOOGLE_APPLICATION_CREDENTIALS not set - normal for local testing"
    echo "Would run: npx firebase-tools deploy --only hosting --project budgetapp-254a2 --dry-run"
fi

echo ""
echo "10. Bundle size analysis..."
if [ -f "dist/index.html" ]; then
    echo "Build size summary:"
    du -sh dist/
    echo ""
    echo "Asset sizes:"
    find dist/ -name "*.js" -o -name "*.css" | xargs ls -lh | sort -k5 -hr
fi

echo ""
echo "🎉 Deployment test completed!"
echo "========================================"
echo ""
echo "If this script passes locally but GitHub Actions fails,"
echo "the issue is likely with:"
echo "1. Missing FIREBASE_SERVICE_ACCOUNT_BUDGETAPP_254A2 secret"
echo "2. Incorrect service account permissions"
echo "3. Firebase project access issues"
echo ""
echo "Consider using the fallback deployment workflow:"
echo "https://github.com/[username]/[repo]/actions/workflows/deploy-fallback.yml"