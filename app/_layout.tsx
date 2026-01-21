import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import { paperTheme } from '../constants/theme';
import { AccountProvider } from '../contexts/AccountContext';
import { AppProvider, useApp } from '../contexts/AppContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { TransactionProvider } from '../contexts/TransactionContext';
import { useNotificationSetup } from '../hooks/useNotificationSetup';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  // Initialize notifications
  useNotificationSetup();

  interface UserSettings {
    nickname: string;
    email: string;
    monthlyBudget: number;
    monthStartDate: number;
    isInitialSetupComplete: boolean;
    biometricEnabled?: boolean;
  }

  useEffect(() => {
    // Don't navigate until both auth and settings are loaded
    if (authLoading || settingsLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('Navigation check:', { user: !!user, inAuthGroup, inTabsGroup, setupComplete: settings.isInitialSetupComplete, segments });

    if (!user) {
      // User is not authenticated - show login
      if (!inAuthGroup) {
        console.log('Redirecting to login');
        router.replace('/(auth)/login');
      }
    } else if (user && !settings.isInitialSetupComplete) {
      // User is authenticated but setup is incomplete - show setup page
      if (inAuthGroup && segments[1] === 'setup') {
        // Already on setup page
        console.log('Already on setup page');
        return;
      }
      console.log('Redirecting to setup (setup incomplete)');
      // router.replace('/(auth)/setup');
      getDocUserDetails(db, user);
    } else if (user && settings.isInitialSetupComplete) {
      // User is authenticated and setup is complete - show main app
      if (!inTabsGroup) {
        console.log('Redirecting to tabs (setup complete)');
        router.replace('/(tabs)');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, settingsLoading, settings.isInitialSetupComplete, segments]);

  const getDocUserDetails = async (db: any, user: any) => {
    try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const firestoreData = docSnap.data() as UserSettings;
          if(firestoreData.isInitialSetupComplete) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/setup');
          }
        } else {
          router.replace('/(auth)/setup');
        }
      } catch (syncError) {
        console.debug('Error syncing with Firestore (non-critical):', syncError);
      }
  }
  // Show loading splash while initializing
  if (authLoading || settingsLoading) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: paperTheme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
            {/* Loading splash - will be replaced when navigation fires */}
          </View>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  // Determine initial route based on auth state
  let initialRouteName: '(auth)' | '(tabs)' = '(auth)';
  if (user && settings.isInitialSetupComplete) {
    initialRouteName = '(tabs)';
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <View style={{flex:1, backgroundColor: paperTheme.colors.background}}>
          <Stack initialRouteName={initialRouteName}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <PaperProvider theme={paperTheme}>
          <AccountProvider>
            <TransactionProvider>
              <RootLayoutNav />
            </TransactionProvider>
          </AccountProvider>
        </PaperProvider>
      </AppProvider>
    </AuthProvider>
  );
}
