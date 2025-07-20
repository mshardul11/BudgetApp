# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication with Google and Facebook providers for the Budget App.

## Prerequisites

1. A Google account
2. A Facebook Developer account (for Facebook authentication)
3. Node.js and npm installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "budget-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:

### Google Authentication
1. Click on "Google" in the list of providers
2. Toggle the "Enable" switch
3. Add your authorized domain (localhost for development)
4. Click "Save"

### Facebook Authentication
1. Click on "Facebook" in the list of providers
2. Toggle the "Enable" switch
3. You'll need to configure Facebook App settings (see Step 3)
4. Click "Save"

## Step 3: Configure Facebook App (for Facebook Authentication)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" as the app type
4. Fill in the app details and create the app
5. In your Facebook app dashboard:
   - Go to "Settings" → "Basic"
   - Add your domain to "App Domains"
   - Add your privacy policy URL
   - Add your terms of service URL
6. Go to "Facebook Login" → "Settings"
   - Add your domain to "Valid OAuth Redirect URIs"
   - Format: `https://your-project-id.firebaseapp.com/__/auth/handler`
7. Copy your Facebook App ID and App Secret
8. Go back to Firebase Console → Authentication → Sign-in method → Facebook
9. Enter your Facebook App ID and App Secret
10. Click "Save"

## Step 4: Get Firebase Configuration

1. In Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (</>) to add a web app
4. Register your app with a nickname (e.g., "budget-app-web")
5. Copy the Firebase configuration object

## Step 5: Update Firebase Configuration

1. Open `src/config/firebase.ts`
2. Replace the placeholder configuration with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
}
```

## Step 6: Configure Authorized Domains

1. In Firebase Console → Authentication → Settings
2. Go to "Authorized domains" tab
3. Add your domains:
   - `localhost` (for development)
   - Your production domain (when deployed)

## Step 7: Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Try signing in with Google and Facebook
4. Check the browser console for any errors

## Troubleshooting

### Common Issues:

1. **"popup_closed_by_user" error**: This usually means the popup was blocked. Make sure popups are allowed for your domain.

2. **"unauthorized_domain" error**: Add your domain to the authorized domains list in Firebase Console.

3. **Facebook authentication not working**: 
   - Verify your Facebook App ID and Secret are correct
   - Make sure your domain is added to Facebook App settings
   - Check that Facebook Login is enabled in your Facebook app

4. **Google authentication not working**:
   - Verify your Firebase configuration is correct
   - Make sure Google sign-in is enabled in Firebase Console
   - Check that your domain is authorized

### Development vs Production:

- For development: Use `localhost` in authorized domains
- For production: Add your actual domain to authorized domains
- Update Facebook App settings with your production domain
- Update OAuth redirect URIs for production

## Security Best Practices

1. **Never commit your Firebase config to public repositories**
2. **Use environment variables for sensitive data**
3. **Set up proper security rules in Firestore**
4. **Regularly review your Firebase project settings**
5. **Monitor authentication usage in Firebase Console**

## Environment Variables (Recommended)

Create a `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Then update `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}
```

Don't forget to add `.env` to your `.gitignore` file!

## Next Steps

After setting up authentication:

1. Test the login flow thoroughly
2. Implement user data persistence in Firestore
3. Add user profile management
4. Set up proper error handling
5. Add loading states and user feedback
6. Implement logout functionality
7. Add password reset functionality (if needed)

## Support

If you encounter issues:

1. Check Firebase Console for error logs
2. Review Firebase documentation
3. Check browser console for JavaScript errors
4. Verify all configuration steps are completed
5. Test with different browsers and devices 