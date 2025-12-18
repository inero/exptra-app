import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  User,
  signInWithCredential,
  GoogleAuthProvider,
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
  isFirstTimeLogin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if this is first time login
        const isFirstTime = await checkFirstTimeLogin(user.uid);
        setIsFirstTimeLogin(isFirstTime);
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      // Trim whitespace for better matching
      const cleanEmail = email.trim().toLowerCase();
      await signInWithEmailAndPassword(auth, cleanEmail, password);
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
      // Trim whitespace for better matching
      const cleanEmail = email.trim().toLowerCase();
      const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      setIsFirstTimeLogin(true);
      // Mark first login asynchronously without blocking
      markFirstTimeLogin(result.user.uid).catch((e) => console.warn('Could not mark first login:', e));
    } catch (err: any) {
      const errorMessage = isNetworkError(err) 
        ? getNetworkErrorMessage() 
        : getErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      // This will be implemented with proper Google Sign-In integration
      throw new Error('Google Sign-In not yet configured. Please use email/password for now.');
    } catch (err: any) {
      const errorMessage = isNetworkError(err)
        ? getNetworkErrorMessage()
        : err.message || 'Google Sign-In failed';
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
      isFirstTimeLogin,
      signIn,
      signUp,
      signInWithGoogle,
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
};

const checkFirstTimeLogin = async (uid: string): Promise<boolean> => {
  try {
    const isFirstTime = await AsyncStorage.getItem(`first_login_${uid}`);
    return !isFirstTime;
  } catch (error) {
    console.error('Error checking first time login:', error);
    return false;
  }
};

const markFirstTimeLogin = async (uid: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(`first_login_${uid}`, 'true');
  } catch (error) {
    console.error('Error marking first time login:', error);
  }
};