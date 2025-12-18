# Biometric Authentication Feature

## Overview
This document outlines the biometric login feature implementation in the Exptra app, allowing users to authenticate using fingerprint/face recognition instead of entering credentials every time.

## Features Implemented

### 1. **Automatic Biometric Setup Prompt**
   - After successful login/signup, users are prompted to enable biometric authentication
   - Users can choose "Enable" to save credentials or "Not Now" to skip
   - The prompt only appears if biometric hardware is available on the device

### 2. **Quick Biometric Login**
   - Dedicated fingerprint button on login screen
   - Shows the user's saved email for convenience
   - Only visible when biometric is enabled for that account
   - One-tap authentication using fingerprint/face recognition

### 3. **Secure Credential Storage**
   - Credentials stored using `expo-secure-store` (encrypted)
   - Separate keys stored for:
     - Biometric enable flag
     - Encrypted credentials (email + password)
     - Saved email address
   - Can be disabled anytime by the user

### 4. **Device Compatibility**
   - Automatic detection of biometric hardware availability
   - Graceful fallback if biometric not available
   - Fallback to device passcode/PIN if fingerprint fails

## File Structure

### New Files Created:
```
utils/
  └── biometricUtils.ts          # Biometric utility functions
hooks/
  └── useBiometricPrompt.ts      # Custom hook for biometric setup prompt
```

### Modified Files:
```
contexts/
  └── AuthContext.tsx            # Added biometric auth methods
app/
  └── (auth)/
      └── login.tsx              # Added biometric UI and logic
package.json                      # (No new dependencies needed - uses existing expo packages)
```

## API Reference

### AuthContext Methods

#### `biometricLogin(): Promise<void>`
Performs biometric authentication using saved credentials.
```typescript
const { biometricLogin } = useAuth();
await biometricLogin();
```

#### `enableBiometric(email: string, password: string): Promise<boolean>`
Saves credentials for biometric authentication.
```typescript
const { enableBiometric } = useAuth();
const success = await enableBiometric(email, password);
```

#### `disableBiometric(): Promise<void>`
Removes saved biometric credentials.
```typescript
const { disableBiometric } = useAuth();
await disableBiometric();
```

#### `isBiometricAvailable(): Promise<boolean>`
Checks if device supports biometric authentication.
```typescript
const { isBiometricAvailable } = useAuth();
const available = await isBiometricAvailable();
```

#### `isBiometricEnabled(): Promise<boolean>`
Checks if biometric login is enabled for current user.
```typescript
const { isBiometricEnabled } = useAuth();
const enabled = await isBiometricEnabled();
```

#### `getSavedEmail(): Promise<string | null>`
Retrieves the email address associated with biometric login.
```typescript
const { getSavedEmail } = useAuth();
const email = await getSavedEmail();
```

## User Flow

### First Login:
1. User enters email and password
2. Credentials validated and user authenticated via Firebase
3. Biometric prompt appears: "Enable Biometric Login?"
4. User can choose:
   - **Enable**: Credentials saved securely, biometric login enabled
   - **Not Now**: Skipped, user proceeds to app normally

### Subsequent Logins (Biometric Enabled):
1. Login screen displays "Quick Login" button with fingerprint icon
2. Shows the saved email address
3. User can either:
   - **Tap fingerprint**: One-tap biometric login
   - **Use credentials**: Enter email/password manually (traditional login)

### Disable Biometric:
- Users can disable biometric from settings (to be implemented in settings screen)
- All biometric data will be securely deleted

## Security Considerations

1. **Secure Storage**: All credentials stored in `expo-secure-store` (encrypted keystore)
2. **Device Security**: Biometric data itself never stored - only enables device biometric APIs
3. **Fallback**: Device passcode/PIN as fallback if biometric fails
4. **Firebase Integration**: Biometric credentials still authenticate via Firebase for server-side validation
5. **Automatic Cleanup**: Biometric data cleared on sign out

## Implementation Details

### BiometricUtils Functions:

- `isBiometricAvailable()`: Checks hardware and enrolled biometrics
- `saveBiometricCredentials()`: Encrypts and stores credentials
- `getBiometricCredentials()`: Retrieves after successful biometric auth
- `isBiometricEnabled()`: Checks if feature enabled for user
- `disableBiometric()`: Clears all biometric data
- `getSavedEmail()`: Gets stored email for display
- `getSupportedBiometricTypes()`: Returns available biometric types

### Dependencies:
- `expo-local-authentication`: Device biometric APIs
- `expo-secure-store`: Encrypted credential storage (already in project)

## Testing

### Manual Testing Steps:

1. **Setup Test**:
   - Create new account
   - Verify biometric prompt appears
   - Choose "Enable"
   - Verify saved email displays on login screen

2. **Biometric Login Test**:
   - Sign out
   - Tap fingerprint button on login screen
   - Provide fingerprint/face recognition
   - Verify successful login

3. **Fallback Test**:
   - Attempt biometric login
   - Deny biometric when prompted
   - Choose device passcode as fallback
   - Verify login succeeds

4. **Disable Test**:
   - Sign out (in future settings screen)
   - Verify biometric button disappears from login screen

## Compatibility

- **Minimum Requirements**:
  - iOS 10+ (Face ID/Touch ID)
  - Android 6.0+ (Biometric API)
  - Expo SDK 54+

- **Supported Biometric Types**:
  - Fingerprint (Android)
  - Face ID (iOS 11+)
  - Touch ID (iOS 7+)
  - Iris Scanner (some Android devices)

## Future Enhancements

1. Settings screen option to disable biometric
2. Biometric re-authentication for sensitive operations
3. Support for multiple biometric types on same device
4. Biometric timeout configuration
5. Audit logs for biometric login attempts
6. Option to update saved credentials from settings

## Troubleshooting

### Biometric button not appearing:
- Device doesn't support biometric authentication
- Biometric not enrolled on device
- Biometric hasn't been enabled for the account yet

### "Biometric authentication failed":
- Check device biometric settings
- Ensure biometrics are enrolled
- Try device passcode as fallback

### Credentials not saving:
- Device secure store might be locked
- Insufficient device storage
- Check device security settings
