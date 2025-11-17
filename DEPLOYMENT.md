# Exptra-AI Deployment Guide

This guide provides step-by-step instructions for deploying the Exptra-AI application to Android devices.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Testing on Physical Device](#testing-on-physical-device)
3. [Building APK](#building-apk)
4. [Play Store Deployment](#play-store-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)

### Initial Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Or start with specific platform
npm run android  # For Android
npm run ios      # For iOS (macOS only)
npm run web      # For web browser
```

---

## Testing on Physical Device

### Using Expo Go (Quick Testing)

1. Install Expo Go app on your Android device from Play Store
2. Run `npm start` in your project directory
3. Scan the QR code with Expo Go app
4. **Note**: SMS reading won't work with Expo Go

### Using Development Build (Full Features)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Create development build
eas build --profile development --platform android

# Install on device
# Download the APK from the build link and install on device
```

---

## Building APK

### Option 1: Using EAS Build (Recommended)

**Step 1: Install EAS CLI**
```bash
npm install -g eas-cli
```

**Step 2: Login to Expo**
```bash
eas login
```

**Step 3: Configure Project**
```bash
eas build:configure
```

**Step 4: Build APK**

For preview/testing APK:
```bash
npm run build:android:apk
# or
eas build --platform android --profile preview
```

For production AAB (Google Play):
```bash
npm run build:android
# or
eas build --platform android --profile production
```

**Step 5: Download APK**
- Once build completes, you'll get a download link
- Download the APK and install on Android devices
- Share the link with testers

### Option 2: Local Build

**Step 1: Prebuild Native Projects**
```bash
npm run prebuild
```

**Step 2: Build Locally**
```bash
cd android
./gradlew assembleRelease
```

**Step 3: Find APK**
```
android/app/build/outputs/apk/release/app-release.apk
```

**Step 4: Sign APK (Production)**

Generate keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore exptra-release.keystore -alias exptra -keyalg RSA -keysize 2048 -validity 10000
```

Add to `android/gradle.properties`:
```
EXPTRA_UPLOAD_STORE_FILE=exptra-release.keystore
EXPTRA_UPLOAD_KEY_ALIAS=exptra
EXPTRA_UPLOAD_STORE_PASSWORD=your_password
EXPTRA_UPLOAD_KEY_PASSWORD=your_password
```

Update `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file(EXPTRA_UPLOAD_STORE_FILE)
            storePassword EXPTRA_UPLOAD_STORE_PASSWORD
            keyAlias EXPTRA_UPLOAD_KEY_ALIAS
            keyPassword EXPTRA_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

Build signed APK:
```bash
cd android
./gradlew assembleRelease
```

---

## Play Store Deployment

### Prerequisites

1. Google Play Developer Account ($25 one-time fee)
2. Signed AAB file
3. App assets (icons, screenshots, description)

### Steps

**1. Create App on Play Console**
- Go to Google Play Console
- Click "Create App"
- Fill in app details

**2. Prepare Store Listing**

Required assets:
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (at least 2, recommended 8)
- Short description (80 characters)
- Full description (4000 characters)
- Privacy policy URL

**3. Build Production AAB**
```bash
npm run build:android
```

**4. Upload to Play Console**
- Go to "Production" > "Create new release"
- Upload the AAB file
- Fill in release notes
- Review and rollout

**5. Content Rating**
- Complete the questionnaire
- Get your app rated

**6. Pricing & Distribution**
- Select countries
- Set pricing (Free/Paid)
- Accept agreements

**7. Submit for Review**
- Review all sections
- Submit app for review
- Wait for approval (usually 1-7 days)

---

## APK Distribution (Beta Testing)

### Internal Testing

1. Build preview APK:
   ```bash
   npm run build:android:apk
   ```

2. Distribute via:
   - Direct APK download link
   - Firebase App Distribution
   - TestFlight (for iOS)
   - Email/messaging apps

### Firebase App Distribution

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy
firebase appdistribution:distribute \
  path/to/app.apk \
  --app YOUR_APP_ID \
  --groups testers
```

---

## Environment Variables

For different environments (dev, staging, production):

**Create `.env` files:**

`.env.development`:
```
API_URL=https://dev-api.exptra.com
FIREBASE_PROJECT_ID=exptra-dev
```

`.env.production`:
```
API_URL=https://api.exptra.com
FIREBASE_PROJECT_ID=exptra-prod
```

**Install dotenv:**
```bash
npm install react-native-dotenv
```

---

## Permissions Setup

The app requires SMS permissions. Ensure users grant them on first launch.

**Test SMS permissions:**
1. Install APK on device
2. Open app
3. Grant SMS read permission when prompted
4. Send a test banking SMS to verify parsing

---

## Version Management

**Update version before each release:**

In `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

In `package.json`:
```json
{
  "version": "1.0.1"
}
```

**Version naming convention:**
- Major.Minor.Patch (e.g., 1.0.0)
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

---

## Troubleshooting

### Build Fails

```bash
# Clear caches
expo start -c
npm cache clean --force
rm -rf node_modules
npm install

# Clean prebuild
npm run prebuild:clean
```

### Firebase Issues

- Verify Firebase config in `config/firebase.ts`
- Check Firebase console for enabled services
- Ensure API keys are correct

### APK Not Installing

- Enable "Install from Unknown Sources" on Android
- Check if device has enough storage
- Verify APK is not corrupted (re-download)

### SMS Not Reading

- Grant SMS permissions in app settings
- Test on physical device (not emulator)
- Verify SMS format matches patterns in `utils/smsParser.ts`

### App Crashes on Launch

- Check logs: `adb logcat | grep ReactNative`
- Verify all dependencies are installed
- Check for missing permissions

---

## Monitoring & Analytics

### Add Crash Reporting

Install Sentry:
```bash
npm install @sentry/react-native
```

Configure in `app/_layout.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
});
```

### Add Analytics

Install Firebase Analytics:
```bash
npm install @react-native-firebase/analytics
```

---

## Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/build.yml`:

```yaml
name: Build APK

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:android:apk
```

---

## Release Checklist

Before each release:

- [ ] Update version numbers
- [ ] Test on multiple devices
- [ ] Verify all features work
- [ ] Check SMS parsing with real messages
- [ ] Test authentication flow
- [ ] Verify Firebase connection
- [ ] Update changelog
- [ ] Create git tag
- [ ] Build signed APK/AAB
- [ ] Test installation on clean device
- [ ] Submit to Play Store (if production)
- [ ] Update documentation

---

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Firebase**: https://firebase.google.com/docs
- **Play Console**: https://play.google.com/console

---

**Last Updated**: November 2025
**Version**: 1.0.0
