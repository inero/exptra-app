# Biometric Settings Screen - Example Implementation

This document provides an example of how to add biometric management to your settings screen.

## Example Settings Component Code

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors as themeColors } from '../constants/theme';

export const BiometricSettingsSection = () => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  
  const { 
    isBiometricAvailable, 
    isBiometricEnabled, 
    getSavedEmail, 
    disableBiometric 
  } = useAuth();

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);

      if (available) {
        const enabled = await isBiometricEnabled();
        setBiometricEnabled(enabled);

        if (enabled) {
          const email = await getSavedEmail();
          setSavedEmail(email);
        }
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleToggleBiometric = async () => {
    if (biometricEnabled) {
      Alert.alert(
        'Disable Biometric Login?',
        'You will need to enter your password on next login.',
        [
          {
            text: 'Cancel',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'Disable',
            onPress: async () => {
              try {
                await disableBiometric();
                setBiometricEnabled(false);
                setSavedEmail(null);
                Alert.alert('Success', 'Biometric login has been disabled');
              } catch (error) {
                Alert.alert('Error', 'Failed to disable biometric login');
              }
            },
            style: 'destructive',
          },
        ]
      );
    } else {
      Alert.alert(
        'Info',
        'Biometric is not available on this device. Please ensure you have enrolled biometrics in your device settings.'
      );
    }
  };

  if (!biometricAvailable) {
    return null; // Don't show section if biometric not available
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="fingerprint" size={24} color={themeColors.primary} />
        <Text style={styles.title}>Biometric Login</Text>
      </View>

      {biometricEnabled && savedEmail && (
        <Text style={styles.email}>Enabled for: {savedEmail}</Text>
      )}

      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingLabel}>Enable Fingerprint Login</Text>
          <Text style={styles.settingDescription}>
            {biometricEnabled 
              ? 'Tap to disable biometric authentication' 
              : 'Biometric not available on this device'}
          </Text>
        </View>
        <Switch
          value={biometricEnabled}
          onValueChange={handleToggleBiometric}
          disabled={!biometricAvailable}
          trackColor={{ false: '#767577', true: themeColors.primary }}
          thumbColor={biometricEnabled ? themeColors.primary : '#f4f3f4'}
        />
      </View>

      {biometricEnabled && (
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={16} color={themeColors.muted} />
          <Text style={styles.infoText}>
            Your fingerprint is used only by your device. It is never shared with our servers.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text,
    marginLeft: 12,
  },
  email: {
    fontSize: 13,
    color: themeColors.muted,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: themeColors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: themeColors.muted,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    color: themeColors.muted,
    marginLeft: 8,
    flex: 1,
  },
});
```

## Integration Steps

### 1. Add to Settings Screen
```typescript
import { BiometricSettingsSection } from '../components/BiometricSettingsSection';

export function SettingsScreen() {
  return (
    <ScrollView>
      {/* Other settings */}
      <BiometricSettingsSection />
      {/* Other settings */}
    </ScrollView>
  );
}
```

### 2. Add to Account/Profile Settings
Place the biometric section within an existing settings structure:
```
⚙️ Settings
├── Profile
├── Account
│   ├── Email
│   ├── Password
│   └── 👆 Biometric Login (NEW)
├── Preferences
└── About
```

### 3. Enhanced Settings with History (Optional)
```typescript
const [biometricAttempts, setBiometricAttempts] = useState(0);
const [lastBiometricAttempt, setLastBiometricAttempt] = useState<Date | null>(null);

// Add to BiometricSettingsSection
{biometricEnabled && (
  <View style={styles.statsBox}>
    <Text style={styles.statsLabel}>Biometric Logins</Text>
    <Text style={styles.statsValue}>{biometricAttempts} times</Text>
    {lastBiometricAttempt && (
      <Text style={styles.statsDate}>
        Last: {lastBiometricAttempt.toLocaleDateString()}
      </Text>
    )}
  </View>
)}
```

## Security Considerations for Settings

### What Users Should Know
1. Biometric is stored securely on device only
2. Disabling will require password on next login
3. Biometric can be changed in device settings
4. No biometric data shared with servers

### Admin/Developer Considerations
1. Cannot override user's biometric settings
2. Biometric disabled = normal password auth only
3. Lost device = need account recovery process
4. Regular security audits recommended

## Advanced Features (Future)

### 1. Biometric Challenge for Sensitive Operations
```typescript
export const requireBiometricForAction = async (
  actionName: string
): Promise<boolean> => {
  const credentials = await getBiometricCredentials(
    `Confirm identity to ${actionName}`
  );
  return !!credentials;
};

// Usage
const handleDeleteAccount = async () => {
  const confirmed = await requireBiometricForAction('delete your account');
  if (confirmed) {
    // Proceed with deletion
  }
};
```

### 2. Biometric Timeout
```typescript
const BIOMETRIC_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const shouldRequireBiometric = async (): Promise<boolean> => {
  const lastBiometricTime = await AsyncStorage.getItem('last_biometric_auth');
  if (!lastBiometricTime) return true;
  
  const elapsed = Date.now() - parseInt(lastBiometricTime);
  return elapsed > BIOMETRIC_TIMEOUT;
};
```

### 3. Multiple Device Management
```typescript
// Store device ID with biometric
const deviceId = await Constants.getDeviceIdAsync();
const credentialsKey = `biometric_${deviceId}`;

// Could support biometric on multiple devices
const devices = await SecureStore.getItemAsync('registered_devices');
```

## Testing the Settings Screen

### Test Cases
1. ✅ Biometric enabled - verify toggle shows correct state
2. ✅ Biometric disabled - verify settings are cleared
3. ✅ No biometric - verify section hidden or disabled
4. ✅ Email display - verify saved email shows correctly
5. ✅ Disable confirmation - verify alert appears

### User Experience Test
1. Enable biometric from settings
2. Sign out and test biometric login
3. Go back to settings and verify toggle state
4. Disable from settings
5. Sign out and verify password login required
6. Verify biometric button gone from login screen

## Accessibility

Ensure settings are accessible:
```typescript
// Add accessibility labels
<Switch
  accessible
  accessibilityLabel="Enable biometric login"
  accessibilityHint="Use fingerprint to login faster"
  accessibilityRole="switch"
  accessibilityState={{ checked: biometricEnabled }}
  // ...
/>
```

## Related Documentation
- See `BIOMETRIC_FEATURE.md` for full feature documentation
- See `BIOMETRIC_INTEGRATION_GUIDE.md` for integration details
