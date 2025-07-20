@echo off
setlocal enabledelayedexpansion

REM Budget App Deployment Script for Windows
REM Usage: deploy.bat [platform]
REM Platforms: firebase, netlify, vercel, github

set PLATFORM=%1
if "%PLATFORM%"=="" set PLATFORM=firebase

echo 🚀 Deploying Budget App to %PLATFORM%...

REM Build the app
echo 📦 Building the app...
call npm run build

if "%PLATFORM%"=="firebase" (
    echo 🔥 Deploying to Firebase Hosting...
    firebase --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Firebase CLI not found. Installing...
        call npm install -g firebase-tools
    )
    call firebase deploy
) else if "%PLATFORM%"=="netlify" (
    echo 🌐 Deploying to Netlify...
    netlify --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Netlify CLI not found. Installing...
        call npm install -g netlify-cli
    )
    call netlify deploy --prod --dir=dist
) else if "%PLATFORM%"=="vercel" (
    echo ▲ Deploying to Vercel...
    vercel --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Vercel CLI not found. Installing...
        call npm install -g vercel
    )
    call vercel --prod
) else if "%PLATFORM%"=="github" (
    echo 📚 Deploying to GitHub Pages...
    call npm run deploy:github
) else (
    echo ❌ Unknown platform: %PLATFORM%
    echo Available platforms: firebase, netlify, vercel, github
    exit /b 1
)

echo ✅ Deployment to %PLATFORM% completed!
echo 🌍 Your app should be live in a few minutes.

pause 