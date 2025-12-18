import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

export interface UserSettings {
  nickname: string;
  monthlyBudget: number;
  monthStartDate: number;
  isInitialSetupComplete: boolean;
  biometricEnabled?: boolean;
}

interface AppContextType {
  settings: UserSettings;
  loading: boolean;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  nickname: '',
  monthlyBudget: 0,
  monthStartDate: 1,
  isInitialSetupComplete: false,
  biometricEnabled: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Try to load from Firestore first
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserSettings;
        setSettings(data);
        // Cache in AsyncStorage for offline access
        await AsyncStorage.setItem(`user_settings_${user.uid}`, JSON.stringify(data));
      } else {
        // Fallback to AsyncStorage if Firestore data doesn't exist
        const storedSettings = await AsyncStorage.getItem(`user_settings_${user.uid}`);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        } else {
          setSettings(defaultSettings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Try AsyncStorage as fallback
      try {
        const storedSettings = await AsyncStorage.getItem(`user_settings_${user.uid}`);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        } else {
          setSettings(defaultSettings);
        }
      } catch (e) {
        console.error('Error loading from AsyncStorage:', e);
        setSettings(defaultSettings);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      // Save to both Firestore and AsyncStorage
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, updatedSettings, { merge: true });
      
      await AsyncStorage.setItem(
        `user_settings_${user.uid}`,
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      // Still try to save to AsyncStorage if Firestore fails
      try {
        await AsyncStorage.setItem(
          `user_settings_${user.uid}`,
          JSON.stringify(updatedSettings)
        );
      } catch (e) {
        console.error('Error saving to AsyncStorage:', e);
      }
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  return (
    <AppContext.Provider value={{ settings, loading, updateSettings, loadSettings }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
