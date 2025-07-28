# Environment Variables Setup Guide

This guide will help you set up all required environment variables for your Personal Budget App on different deployment platforms.

## Required Environment Variables

Your application requires the following environment variables to function properly:

### 🔥 Firebase Configuration (Required)
```
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 🔧 Security Settings (Optional)
```
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
```

## How to Get Firebase Configuration Values

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**
3. **Go to Project Settings** (gear icon)
4. **Scroll down to "Your apps" section**
5. **Click on your web app** (or create one if you haven't)
6. **Copy the configuration values**

## Deployment Platform Setup

### 🚀 Vercel Deployment

#### Method 1: Vercel Dashboard
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** tab
4. Click on **Environment Variables**
5. Add each variable:
   ```
   Name: VITE_FIREBASE_API_KEY
   Value: your_actual_api_key
   Environment: Production, Preview, Development
   ```
6. Repeat for all required variables
7. Click **Save**

#### Method 2: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID

# Deploy
vercel --prod
```

#### Method 3: vercel.json (Not Recommended for Secrets)
```json
{
  "env": {
    "VITE_FIREBASE_API_KEY": "your_api_key",
    "VITE_FIREBASE_AUTH_DOMAIN": "your_auth_domain"
  }
}
```

### 🌐 Netlify Deployment

#### Method 1: Netlify Dashboard
1. Go to your site in [Netlify Dashboard](https://app.netlify.com/)
2. Go to **Site settings**
3. Click on **Environment variables**
4. Add each variable:
   ```
   Key: VITE_FIREBASE_API_KEY
   Value: your_actual_api_key
   ```
5. Click **Save**
6. Repeat for all required variables

#### Method 2: netlify.toml
```toml
[context.production.environment]
  VITE_FIREBASE_API_KEY = "your_api_key"
  VITE_FIREBASE_AUTH_DOMAIN = "your_auth_domain"
  VITE_FIREBASE_PROJECT_ID = "your_project_id"
  VITE_FIREBASE_STORAGE_BUCKET = "your_storage_bucket"
  VITE_FIREBASE_MESSAGING_SENDER_ID = "your_sender_id"
  VITE_FIREBASE_APP_ID = "your_app_id"
  VITE_FIREBASE_MEASUREMENT_ID = "your_measurement_id"

[context.deploy-preview.environment]
  VITE_FIREBASE_API_KEY = "your_api_key"
  VITE_FIREBASE_AUTH_DOMAIN = "your_auth_domain"
  VITE_FIREBASE_PROJECT_ID = "your_project_id"
  VITE_FIREBASE_STORAGE_BUCKET = "your_storage_bucket"
  VITE_FIREBASE_MESSAGING_SENDER_ID = "your_sender_id"
  VITE_FIREBASE_APP_ID = "your_app_id"
  VITE_FIREBASE_MEASUREMENT_ID = "your_measurement_id"
```

#### Method 3: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variables
netlify env:set VITE_FIREBASE_API_KEY "your_api_key"
netlify env:set VITE_FIREBASE_AUTH_DOMAIN "your_auth_domain"
netlify env:set VITE_FIREBASE_PROJECT_ID "your_project_id"
netlify env:set VITE_FIREBASE_STORAGE_BUCKET "your_storage_bucket"
netlify env:set VITE_FIREBASE_MESSAGING_SENDER_ID "your_sender_id"
netlify env:set VITE_FIREBASE_APP_ID "your_app_id"
netlify env:set VITE_FIREBASE_MEASUREMENT_ID "your_measurement_id"

# Deploy
netlify deploy --prod
```

### 🔥 Firebase Hosting

#### Method 1: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Hosting**
4. Click on **Environment variables**
5. Add each variable
6. Deploy using Firebase CLI

#### Method 2: Firebase CLI
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set environment variables (if supported)
firebase functions:config:set firebase.api_key="your_api_key"

# Deploy
firebase deploy
```

### 🐳 Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Set environment variables
ENV VITE_FIREBASE_API_KEY=your_api_key
ENV VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
ENV VITE_FIREBASE_PROJECT_ID=your_project_id
ENV VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
ENV VITE_FIREBASE_APP_ID=your_app_id
ENV VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  budget-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
      - VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
      - VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
      - VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
      - VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
      - VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
      - VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}
```

### ☁️ AWS Amplify

#### Method 1: Amplify Console
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Go to **Environment variables**
4. Add each variable
5. Save and redeploy

#### Method 2: amplify.yml
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
  environmentVariables:
    VITE_FIREBASE_API_KEY: $VITE_FIREBASE_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN: $VITE_FIREBASE_AUTH_DOMAIN
    VITE_FIREBASE_PROJECT_ID: $VITE_FIREBASE_PROJECT_ID
    VITE_FIREBASE_STORAGE_BUCKET: $VITE_FIREBASE_STORAGE_BUCKET
    VITE_FIREBASE_MESSAGING_SENDER_ID: $VITE_FIREBASE_MESSAGING_SENDER_ID
    VITE_FIREBASE_APP_ID: $VITE_FIREBASE_APP_ID
    VITE_FIREBASE_MEASUREMENT_ID: $VITE_FIREBASE_MEASUREMENT_ID
```

### 🐙 GitHub Pages

#### Method 1: GitHub Secrets
1. Go to your repository on GitHub
2. Go to **Settings** > **Secrets and variables** > **Actions**
3. Add repository secrets for each variable
4. Use in GitHub Actions workflow:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIREBASE_MEASUREMENT_ID: ${{ secrets.VITE_FIREBASE_MEASUREMENT_ID }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Local Development Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your Firebase values:**
   ```bash
   # Edit .env.local with your actual Firebase values
   nano .env.local
   ```

3. **Verify the setup:**
   ```bash
   npm run dev
   ```

## Environment Variable Validation

The application includes built-in validation for required environment variables. If any required variable is missing, you'll see an error like:

```
Error: Missing required environment variable: VITE_FIREBASE_API_KEY
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different values** for development, staging, and production
3. **Rotate API keys** regularly
4. **Use environment-specific Firebase projects** when possible
5. **Monitor usage** of your Firebase project

## Troubleshooting

### Common Issues:

1. **"Missing required environment variable" error**
   - Check that all required variables are set
   - Verify variable names start with `VITE_`
   - Restart your development server after adding variables

2. **Firebase connection errors**
   - Verify API key is correct
   - Check that Firebase project is active
   - Ensure Firebase services are enabled

3. **Build failures**
   - Check that all environment variables are set in your deployment platform
   - Verify variable names match exactly
   - Check deployment platform logs for specific errors

### Testing Environment Variables:

```bash
# Check if variables are loaded (development)
npm run dev

# Check build process
npm run build

# Test production build locally
npm run preview
```

## Support

If you encounter issues with environment variable setup:

1. Check the [Firebase Documentation](https://firebase.google.com/docs/web/setup)
2. Review your deployment platform's documentation
3. Verify all required variables are set
4. Check browser console for specific error messages

## Quick Setup Checklist

- [ ] Firebase project created and configured
- [ ] Firebase configuration values copied
- [ ] Environment variables set in deployment platform
- [ ] Local `.env.local` file created (for development)
- [ ] Application builds successfully
- [ ] Firebase services (Auth, Firestore) enabled
- [ ] Firestore security rules configured
- [ ] Application deployed and tested