import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { getNetworkErrorMessage, isNetworkError } from '../utils/networkUtils';
import {
  saveBiometricCredentials,
  getBiometricCredentials,
  disableBiometric,
  isBiometricAvailable,
  isBiometricEnabled,
  getSavedEmail,
} from '../utils/biometricUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  biometricLogin: () => Promise<void>;
  enableBiometric: (email: string, password: string) => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  isBiometricAvailable: () => Promise<boolean>;
  isBiometricEnabled: () => Promise<boolean>;
  getSavedEmail: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const errorMessage = isNetworkError(err) 
        ? getNetworkErrorMessage() 
        : getErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const errorMessage = isNetworkError(err) 
        ? getNetworkErrorMessage() 
        : getErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const biometricLogin = async () => {
    try {
      setError(null);
      const credentials = await getBiometricCredentials('Use your fingerprint to login');
      if (!credentials) {
        throw new Error('Biometric authentication failed or was cancelled');
      }
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } catch (err: any) {
      const errorMessage = isNetworkError(err)
        ? getNetworkErrorMessage()
        : getErrorMessage(err.code || err.message);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const enableBiometric = async (email: string, password: string): Promise<boolean> => {
    try {
      const success = await saveBiometricCredentials(email, password);
      if (success) {
        setError(null);
      } else {
        setError('Biometric is not available on this device');
      }
      return success;
    } catch (err: any) {
      console.error('Error enabling biometric:', err);
      setError('Failed to enable biometric login');
      return false;
    }
  };

  const disableBiometricLogin = async () => {
    try {
      await disableBiometric();
      setError(null);
    } catch (err: any) {
      console.error('Error disabling biometric:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Clear cached data on sign out
      const uid = user?.uid;
      if (uid) {
        await AsyncStorage.removeItem(`user_settings_${uid}`);
      }
    } catch (err: any) {
      console.error('Error signing out:', err);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      clearError,
      biometricLogin,
      enableBiometric,
      disableBiometric: disableBiometricLogin,
      isBiometricAvailable,
      isBiometricEnabled,
      getSavedEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email address format';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    default:
      return 'An error occurred. Please try again';
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Save token
export const saveToken = async (key: any, value: any) => {
  await SecureStore.setItemAsync(key, value);
}

// Get token
export const getToken = async (key: any) => {
  return await SecureStore.getItemAsync(key);
}

// Delete token
export const deleteToken = async (key: any) => {
  await SecureStore.deleteItemAsync(key);
};

export const isTrueString = (str: any) => {
  return typeof str === "string" && str.trim().toLowerCase() === "true";
}