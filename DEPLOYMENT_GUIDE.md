# Deployment Guide - Budget App

This guide covers deploying the Budget App to various platforms with proper domain configuration and Firebase authentication setup.

## Prerequisites

1. **Firebase Project**: Set up Firebase authentication (see `FIREBASE_SETUP.md`)
2. **Domain Name**: Purchase a domain name (optional but recommended)
3. **GitHub Account**: For version control and deployment
4. **Node.js**: Version 18 or higher

## Deployment Options

### Option 1: Firebase Hosting (Recommended)

Firebase Hosting is the best choice since we're using Firebase Authentication.

#### Setup Steps:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init hosting
   ```

4. **Deploy**:
   ```bash
   npm run deploy:firebase
   ```

#### Custom Domain Setup:

1. **Add Custom Domain in Firebase Console**:
   - Go to Firebase Console → Hosting
   - Click "Add custom domain"
   - Enter your domain (e.g., `budget.yourdomain.com`)
   - Follow the verification steps

2. **Configure DNS**:
   - Add A record pointing to Firebase IPs
   - Add CNAME record for www subdomain
   - Wait for DNS propagation (up to 48 hours)

3. **Update Firebase Auth Domains**:
   - Go to Firebase Console → Authentication → Settings
   - Add your custom domain to "Authorized domains"

### Option 2: Netlify

Great for static hosting with automatic deployments.

#### Setup Steps:

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   npm run deploy:netlify
   ```

3. **Or Connect to GitHub**:
   - Push code to GitHub
   - Connect Netlify to your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

#### Custom Domain Setup:

1. **Add Custom Domain in Netlify**:
   - Go to Netlify Dashboard → Site Settings → Domain Management
   - Click "Add custom domain"
   - Enter your domain

2. **Configure DNS**:
   - Add CNAME record pointing to your Netlify site
   - Or use Netlify DNS for easier management

3. **Update Firebase Auth Domains**:
   - Add your Netlify domain to Firebase authorized domains

### Option 3: Vercel

Excellent for React apps with automatic deployments.

#### Setup Steps:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   npm run deploy:vercel
   ```

3. **Or Connect to GitHub**:
   - Push code to GitHub
   - Import project in Vercel Dashboard
   - Vercel will auto-detect Vite configuration

#### Custom Domain Setup:

1. **Add Custom Domain in Vercel**:
   - Go to Vercel Dashboard → Project Settings → Domains
   - Add your custom domain

2. **Configure DNS**:
   - Add CNAME record pointing to Vercel
   - Or use Vercel DNS

3. **Update Firebase Auth Domains**:
   - Add your Vercel domain to Firebase authorized domains

### Option 4: GitHub Pages

Free hosting for public repositories.

#### Setup Steps:

1. **Deploy**:
   ```bash
   npm run deploy:github
   ```

2. **Configure GitHub Pages**:
   - Go to repository Settings → Pages
   - Set source to "Deploy from a branch"
   - Select `gh-pages` branch

#### Custom Domain Setup:

1. **Add Custom Domain**:
   - Go to repository Settings → Pages
   - Enter your custom domain
   - Add CNAME file to your repository

2. **Update Firebase Auth Domains**:
   - Add your GitHub Pages domain to Firebase authorized domains

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file:

```env
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Platform-Specific Environment Variables

#### Netlify:
- Go to Site Settings → Environment Variables
- Add all VITE_* variables

#### Vercel:
- Go to Project Settings → Environment Variables
- Add all VITE_* variables

#### Firebase:
- Environment variables are handled through the build process

## Domain Configuration Checklist

### 1. DNS Configuration

For each platform, ensure proper DNS records:

**Firebase Hosting**:
```
A     @     151.101.1.195
A     @     151.101.65.195
CNAME  www   your-project-id.web.app
```

**Netlify**:
```
CNAME  @     your-site.netlify.app
CNAME  www   your-site.netlify.app
```

**Vercel**:
```
CNAME  @     cname.vercel-dns.com
CNAME  www   cname.vercel-dns.com
```

### 2. SSL Certificate

All platforms provide automatic SSL certificates:
- **Firebase**: Automatic SSL with Let's Encrypt
- **Netlify**: Automatic SSL with Let's Encrypt
- **Vercel**: Automatic SSL with Let's Encrypt
- **GitHub Pages**: Automatic SSL with Let's Encrypt

### 3. Firebase Authentication Domains

Update Firebase Console → Authentication → Settings → Authorized domains:

```
localhost
your-domain.com
www.your-domain.com
your-site.netlify.app
your-site.vercel.app
your-username.github.io
```

### 4. Facebook App Configuration

Update Facebook App settings:

1. **App Domains**:
   ```
   your-domain.com
   your-site.netlify.app
   your-site.vercel.app
   ```

2. **Valid OAuth Redirect URIs**:
   ```
   https://your-domain.com/__/auth/handler
   https://your-site.netlify.app/__/auth/handler
   https://your-site.vercel.app/__/auth/handler
   ```

## Performance Optimization

### Build Optimization

The app is configured with:
- **Code Splitting**: Separate chunks for vendor, Firebase, charts, and icons
- **Minification**: Terser for JavaScript minification
- **Caching**: Proper cache headers for static assets
- **Compression**: Automatic gzip compression

### Monitoring

Set up monitoring for your deployed app:

1. **Firebase Analytics**: Track user behavior
2. **Error Monitoring**: Firebase Crashlytics or Sentry
3. **Performance Monitoring**: Firebase Performance Monitoring

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use platform-specific environment variable systems
- Rotate API keys regularly

### 2. Firebase Security Rules
- Set up proper Firestore security rules
- Restrict access based on user authentication
- Enable Firebase App Check for additional security

### 3. Content Security Policy
Add CSP headers to prevent XSS attacks:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com;"
}
```

## Troubleshooting

### Common Issues:

1. **Authentication Not Working**:
   - Check authorized domains in Firebase Console
   - Verify Facebook App configuration
   - Check browser console for errors

2. **Build Failures**:
   - Ensure all dependencies are installed
   - Check TypeScript compilation errors
   - Verify environment variables are set

3. **Domain Not Working**:
   - Wait for DNS propagation (up to 48 hours)
   - Check DNS records are correct
   - Verify SSL certificate is active

4. **Performance Issues**:
   - Check bundle size with `npm run build`
   - Optimize images and assets
   - Enable compression on your hosting platform

## Deployment Commands Summary

```bash
# Build the app
npm run build

# Deploy to Firebase
npm run deploy:firebase

# Deploy to Netlify
npm run deploy:netlify

# Deploy to Vercel
npm run deploy:vercel

# Deploy to GitHub Pages
npm run deploy:github
```

## Next Steps After Deployment

1. **Test Authentication**: Verify Google and Facebook login work
2. **Test All Features**: Ensure all app functionality works
3. **Set Up Monitoring**: Configure analytics and error tracking
4. **Set Up CI/CD**: Automate deployments from GitHub
5. **Performance Testing**: Test app performance on various devices
6. **Security Audit**: Review security settings and configurations

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review Firebase Console for authentication errors
3. Check browser console for JavaScript errors
4. Verify all configuration steps are completed
5. Test with different browsers and devices 