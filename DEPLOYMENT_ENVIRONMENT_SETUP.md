# Deployment Environment Setup Guide

## 🚀 Quick Start

### For Local Development:
```bash
# 1. Set up environment variables
npm run setup:env

# 2. Validate setup
npm run validate:env

# 3. Start development server
npm run dev
```

### For Deployment:
Follow the platform-specific instructions in `ENVIRONMENT_VARIABLES_GUIDE.md`

## 📋 Required Environment Variables

Your application requires these Firebase configuration variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyBJmLC5ksvbQ26QpW04UeTMG3n0YQ5wjQg` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `159607987904` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:159607987904:web:a6996f58714c9e57635725` |

### Optional Variables:
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID | `G-RV4YLRFS0F` |
| `VITE_APP_ENV` | Application Environment | `development` |
| `VITE_ENABLE_ANALYTICS` | Enable Analytics | `false` |

## 🔧 How to Get Firebase Configuration

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project**
3. **Go to Project Settings** (gear icon)
4. **Scroll to "Your apps" section**
5. **Click on your web app** (or create one)
6. **Copy the configuration values**

## 🛠️ Available Scripts

### Setup Scripts:
```bash
# Interactive environment setup
npm run setup:env

# Validate environment variables
npm run validate:env
```

### Deployment Scripts:
```bash
# Deploy to Firebase
npm run deploy:firebase

# Deploy to Netlify
npm run deploy:netlify

# Deploy to Vercel
npm run deploy:vercel

# Deploy to GitHub Pages
npm run deploy:github
```

## 🚀 Deployment Platforms

### Vercel (Recommended)
- **Dashboard**: Go to Project Settings > Environment Variables
- **CLI**: Use `vercel env add` commands
- **Auto-deployment**: Connects to GitHub for automatic deployments

### Netlify
- **Dashboard**: Go to Site Settings > Environment Variables
- **CLI**: Use `netlify env:set` commands
- **File**: Use `netlify.toml` configuration

### Firebase Hosting
- **CLI**: Use `firebase deploy` after setting variables
- **Console**: Configure in Firebase Console

### GitHub Pages
- **Secrets**: Set in Repository Settings > Secrets and Variables
- **Actions**: Use GitHub Actions workflow

## 🔒 Security Checklist

### Before Deployment:
- [ ] All environment variables are set in deployment platform
- [ ] Firebase project is properly configured
- [ ] Firestore security rules are active
- [ ] Authentication is enabled
- [ ] HTTPS is enabled (automatic on most platforms)
- [ ] Environment variables are not committed to git

### After Deployment:
- [ ] Application loads without errors
- [ ] Authentication works
- [ ] Data syncs properly
- [ ] No console errors
- [ ] All features work as expected

## 🐛 Troubleshooting

### Common Issues:

1. **"Missing required environment variable" error**
   ```bash
   # Check if variables are set
   npm run validate:env
   
   # Set up variables if missing
   npm run setup:env
   ```

2. **Firebase connection errors**
   - Verify API key is correct
   - Check Firebase project is active
   - Ensure Firebase services are enabled

3. **Build failures**
   - Check deployment platform logs
   - Verify all variables are set
   - Check variable names match exactly

### Testing Commands:
```bash
# Test local build
npm run build

# Test production build
npm run preview

# Validate environment
npm run validate:env
```

## 📚 Documentation

- **Environment Variables Guide**: `ENVIRONMENT_VARIABLES_GUIDE.md`
- **Security Documentation**: `SECURITY.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Firebase Setup**: `FIREBASE_SETUP.md`

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Netlify Dashboard](https://app.netlify.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 📞 Support

If you encounter issues:

1. **Check the logs** in your deployment platform
2. **Verify environment variables** are set correctly
3. **Test locally** with `npm run dev`
4. **Check browser console** for specific errors
5. **Review documentation** in the guides above

## 🎯 Quick Deployment Checklist

### For Vercel:
- [ ] Connect repository to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy automatically on push

### For Netlify:
- [ ] Connect repository to Netlify
- [ ] Set environment variables in Netlify dashboard
- [ ] Configure build settings

### For Firebase:
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login: `firebase login`
- [ ] Initialize: `firebase init`
- [ ] Deploy: `npm run deploy:firebase`

---

**Remember**: Never commit your `.env.local` file or any files containing real API keys to version control!