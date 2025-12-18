import * as SecureStore from 'expo-secure-store';

let LocalAuthentication: any = null;

try {
  LocalAuthentication = require('expo-local-authentication');
} catch (error) {
  console.log('expo-local-authentication module not found, biometric features will be disabled');
}

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';

interface BiometricCredentials {
  email: string;
  password: string;
}

export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    if (!LocalAuthentication) {
      return false;
    }

    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return false;
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

export const saveBiometricCredentials = async (
  email: string,
  password: string
): Promise<boolean> => {
  try {
    if (!LocalAuthentication) {
      return false;
    }

    const biometricAvailable = await isBiometricAvailable();
    if (!biometricAvailable) {
      return false;
    }

    const credentials: BiometricCredentials = { email, password };
    await SecureStore.setItemAsync(
      BIOMETRIC_CREDENTIALS_KEY,
      JSON.stringify(credentials)
    );
    await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

    return true;
  } catch (error) {
    console.error('Error saving biometric credentials:', error);
    return false;
  }
};

export const getBiometricCredentials = async (
  reason: string = 'Authenticate to login'
): Promise<BiometricCredentials | null> => {
  try {
    if (!LocalAuthentication) {
      return null;
    }

    const biometricEnabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    if (biometricEnabled !== 'true') {
      return null;
    }

    const authenticated = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      reason,
      fallbackLabel: 'Use passcode',
    });

    if (!authenticated.success) {
      return null;
    }

    const credentialsJson = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (!credentialsJson) {
      return null;
    }

    return JSON.parse(credentialsJson) as BiometricCredentials;
  } catch (error) {
    console.error('Error getting biometric credentials:', error);
    return null;
  }
};

export const getSavedEmail = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
  } catch (error) {
    console.error('Error getting saved email:', error);
    return null;
  }
};

export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking if biometric is enabled:', error);
    return false;
  }
};

export const disableBiometric = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
  } catch (error) {
    console.error('Error disabling biometric:', error);
  }
};

export const getSupportedBiometricTypes = async (): Promise<string[]> => {
  try {
    if (!LocalAuthentication) {
      return [];
    }
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  } catch (error) {
    console.error('Error getting supported biometric types:', error);
    return [];
  }
};
