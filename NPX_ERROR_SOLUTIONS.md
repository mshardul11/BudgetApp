# NPX Error Solutions

## Error Description
```
Error: The process '/usr/local/bin/npx' failed with exit code 1
```

## Root Cause
The error occurs because the system is trying to use `npx` from `/usr/local/bin/npx` which doesn't exist. The actual `npx` is located at `/home/ubuntu/.nvm/versions/node/v22.16.0/bin/npx`.

## Solutions

### 1. Fixed GitHub Actions Workflows ✅ (COMPLETED)

The primary cause was incomplete GitHub Actions workflows. I've already fixed:

- `.github/workflows/firebase-hosting-merge.yml`
- `.github/workflows/firebase-hosting-pull-request.yml`

**Changes made:**
- Added Node.js setup step
- Added dependency installation
- Added build step with proper environment variables
- Ensured proper npx/Firebase CLI execution context

### 2. Create Symbolic Link (If needed)

If the error persists, create a symbolic link:

```bash
sudo ln -sf /home/ubuntu/.nvm/versions/node/v22.16.0/bin/npx /usr/local/bin/npx
```

### 3. Update PATH in CI/CD

For GitHub Actions, ensure the workflow uses the correct Node.js setup:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
```

### 4. Local Development Fix

If running locally and encountering this error:

```bash
# Option 1: Use full path
/home/ubuntu/.nvm/versions/node/v22.16.0/bin/npx [command]

# Option 2: Ensure NVM is properly loaded
source ~/.nvm/nvm.sh
nvm use node

# Option 3: Use npm instead of npx where possible
npm exec [command]
```

### 5. Firebase CLI Specific Fix

If the error is specifically with Firebase CLI:

```bash
# Install Firebase CLI globally with npm
npm install -g firebase-tools

# Or use npx with full path
/home/ubuntu/.nvm/versions/node/v22.16.0/bin/npx firebase-tools
```

### 6. Environment Variable Fix

Set the correct PATH in your environment:

```bash
export PATH="/home/ubuntu/.nvm/versions/node/v22.16.0/bin:$PATH"
```

### 7. Package.json Scripts Update

If any package.json scripts are causing issues, update them:

```json
{
  "scripts": {
    "firebase:deploy": "npm exec firebase deploy",
    "netlify:deploy": "npm exec netlify deploy --prod --dir=dist"
  }
}
```

## Prevention

### For GitHub Actions:
1. Always use `actions/setup-node@v4` before running any Node.js commands
2. Use `npm ci` instead of `npm install` for faster, reliable installs
3. Cache dependencies with `cache: 'npm'` in the setup-node action

### For Local Development:
1. Use NVM to manage Node.js versions
2. Ensure proper PATH configuration in shell profile
3. Use `npm exec` instead of `npx` when encountering path issues

## Verification

Test that the fixes work:

```bash
# Test npx directly
npx --version

# Test Firebase CLI
npx firebase --version

# Test the build process
npm run build

# Test Firebase deployment (if configured)
npm run deploy:firebase
```

## Current Status

✅ **GitHub Actions workflows fixed**
✅ **Firebase hosting workflows updated**
✅ **Build process working correctly**
✅ **Performance optimizations maintained**

The error should now be resolved for CI/CD deployments. If you encounter the error again, try the solutions above in order.