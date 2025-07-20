#!/bin/bash

# Budget App Deployment Script
# Usage: ./deploy.sh [platform]
# Platforms: firebase, netlify, vercel, github

set -e

PLATFORM=${1:-firebase}

echo "🚀 Deploying Budget App to $PLATFORM..."

# Build the app
echo "📦 Building the app..."
npm run build

case $PLATFORM in
  "firebase")
    echo "🔥 Deploying to Firebase Hosting..."
    if ! command -v firebase &> /dev/null; then
      echo "❌ Firebase CLI not found. Installing..."
      npm install -g firebase-tools
    fi
    firebase deploy
    ;;
    
  "netlify")
    echo "🌐 Deploying to Netlify..."
    if ! command -v netlify &> /dev/null; then
      echo "❌ Netlify CLI not found. Installing..."
      npm install -g netlify-cli
    fi
    netlify deploy --prod --dir=dist
    ;;
    
  "vercel")
    echo "▲ Deploying to Vercel..."
    if ! command -v vercel &> /dev/null; then
      echo "❌ Vercel CLI not found. Installing..."
      npm install -g vercel
    fi
    vercel --prod
    ;;
    
  "github")
    echo "📚 Deploying to GitHub Pages..."
    npm run deploy:github
    ;;
    
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo "Available platforms: firebase, netlify, vercel, github"
    exit 1
    ;;
esac

echo "✅ Deployment to $PLATFORM completed!"
echo "🌍 Your app should be live in a few minutes." 