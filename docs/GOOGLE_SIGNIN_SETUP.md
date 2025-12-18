# Google Sign-In Integration Guide

## Overview
This guide explains how to enable Google Sign-In authentication to replace the deprecated Firebase Dynamic Links email link authentication.

## Current Status
✅ Firebase is configured with support for Google Sign-In providers
✅ Backend authentication methods are ready
⏳ UI integration and Google Credentials setup needed

## Prerequisites
Before enabling Google Sign-In, you need:

1. **Firebase Project Configuration**
   - Google OAuth Provider enabled in Firebase Console
   - OAuth 2.0 credentials created (Web, iOS, Android)

2. **Google Cloud Console Access**
   - Project ID from Firebase Console
   - Create OAuth 2.0 credentials for each platform

## Step-by-Step Setup

### 1. Firebase Console Setup (Essential)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `fir-auth-aaa2e`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Enable it and add your Support Email
6. Save the configuration

### 2. Google Cloud Console Setup (Essential)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `fir-auth-aaa2e`
3. Navigate to **APIs & Services** → **Credentials**

#### For Web App:
1. Create OAuth 2.0 credentials (Web Application)
2. Add authorized redirect URIs:
   - `https://fir-auth-aaa2e.firebaseapp.com/__/auth/handler`
   - `https://localhost:3000` (for local development)
3. Copy the Client ID

#### For Android App:
1. Create OAuth 2.0 credentials (Android)
2. Add your app's package name and SHA-1 fingerprint
   - Run: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey`
3. Get your Client ID

#### For iOS App:
1. Create OAuth 2.0 credentials (iOS)
2. Add your app's Bundle ID
3. Add URL schemes to `Info.plist`
4. Get your Client ID

### 3. Update App Configuration

#### Android (`app.json`):
```json
{
  "android": {
    "googleServicesFile": "./google-services.json"
  }
}
```

Download `google-services.json` from Firebase Console and place in project root.

#### iOS (`app.json`):
```json
{
  "ios": {
    "googleServicesFile": "./GoogleService-Info.plist"
  }
}
```

Download `GoogleService-Info.plist` from Firebase Console and place in project root.

### 4. Install Required Dependencies

Required packages are already installed:
- `@react-native-google-signin/google-signin` ✅
- `firebase` ✅

### 5. Configure in Code

The following files are ready for Google Sign-In integration:

- ✅ `contexts/AuthContext.tsx` - Has `signInWithGoogle()` method
- ✅ `hooks/useGoogleSignIn.ts` - Initialization hook
- ✅ `config/firebase.ts` - Firebase setup complete

### 6. Enable on Login Screen

Update `app/(auth)/login.tsx` to add Google Sign-In button:

```typescript
import { TouchableOpacity } from 'react-native';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';

// Inside LoginScreen component:
const { isReady: googleSignInReady } = useGoogleSignIn();
const { signInWithGoogle } = useAuth();

// Add button in JSX:
<TouchableOpacity
  style={[styles.googleButton, loading ? styles.buttonDisabled : null]}
  onPress={async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message);
    } finally {
      setLoading(false);
    }
  }}
  disabled={loading || !googleSignInReady}
>
  <MaterialIcons name="g-translate" size={24} color="white" />
  <Text style={styles.buttonText}>Sign in with Google</Text>
</TouchableOpacity>
```

## Security Considerations

### Do's ✅
- Use OAuth 2.0 credentials for each platform
- Keep Client IDs and secrets secure
- Enable reCAPTCHA protection in Firebase Console
- Implement rate limiting for auth attempts
- Use HTTPS for all communications

### Don'ts ❌
- Don't commit API keys to version control (use `.gitignore`)
- Don't share OAuth credentials
- Don't use web credentials on mobile and vice versa
- Don't hardcode secrets in the app

## Removing Deprecated Email Link Authentication

The following authentication methods are deprecated and should NOT be used:

❌ **Email Link Authentication** (Firebase Dynamic Links)
- **Status**: Deprecated, will stop working soon
- **Alternative**: Use traditional email/password (already implemented)
- **Action**: Remove from auth methods

### Migration Steps:
1. Existing users with email link auth should re-authenticate with email/password
2. New signups use email/password only
3. Enable Google Sign-In as additional option
4. Biometric login for faster access (already implemented)

## Testing

### Test Email/Password Login ✅
```
Email: test@example.com
Password: Test@123456
```

### Test Google Sign-In 🔄 (After Configuration)
1. Ensure credentials are configured
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify Firebase updates user record

### Test Biometric Login ✅
1. Complete signup
2. Enable biometric prompt
3. Use fingerprint/Face ID to login

## Troubleshooting

### "Google Sign-In not yet configured" error
- Ensure Google OAuth credentials are set up in Google Cloud Console
- Verify Firebase Google provider is enabled
- Check credentials match your app package name/bundle ID

### OAuth redirect URI issues
- For web: `https://fir-auth-aaa2e.firebaseapp.com/__/auth/handler`
- For local dev: Add `http://localhost:3000` to allowed URIs

### Android/iOS credentials not recognized
- Verify SHA-1 fingerprint (Android) or Bundle ID (iOS) matches exactly
- Download latest `google-services.json` or `GoogleService-Info.plist`
- Rebuild app after configuration changes

### Dynamic Links Deprecation Warning
- This is expected if email link auth was enabled
- Alternative: Use email/password or Google Sign-In
- Firebase will send migration guide emails

## Next Steps

1. ✅ Dependencies installed
2. ✅ Code structure ready
3. ⏳ Configure Google OAuth credentials (Platform-specific)
4. ⏳ Download and add configuration files (google-services.json, GoogleService-Info.plist)
5. ⏳ Add Google Sign-In button to login UI
6. ⏳ Test Google Sign-In flow
7. ⏳ Test on physical devices
8. ⏳ Deploy to production

## References

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In Setup](https://firebase.google.com/docs/auth/web/google-signin)
- [React Native Google Sign-In](https://react-native-google-signin.dev/)
- [Firebase Dynamic Links Deprecation](https://firebase.google.com/support/dynamic-links-shutdown)

## Support

For issues or questions:
1. Check Firebase Console authentication logs
2. Review Google Cloud Console OAuth consent screen
3. Verify app configuration (package name, bundle ID, SHA-1)
4. Enable debug logging in development
5. Check Firebase documentation and community forums
