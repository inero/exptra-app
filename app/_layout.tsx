import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { paperTheme } from '../constants/theme';
import { AccountProvider } from '../contexts/AccountContext';
import { AppProvider, useApp } from '../contexts/AppContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { TransactionProvider } from '../contexts/TransactionContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || settingsLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('Navigation check:', { user: !!user, inAuthGroup, inTabsGroup, setupComplete: settings.isInitialSetupComplete });

    if (!user) {
      if (!inAuthGroup) {
        console.log('Redirecting to login');
        router.replace('/(auth)/login');
      }
    } else if (user && !settings.isInitialSetupComplete) {
      if (!inAuthGroup) {
        console.log('Redirecting to setup');
        router.replace('/(auth)/setup');
      }
    } else if (user && settings.isInitialSetupComplete) {
      if (!inTabsGroup) {
        console.log('Redirecting to tabs');
        router.replace('/(tabs)');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, settingsLoading, settings.isInitialSetupComplete, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{flex:1, backgroundColor: paperTheme.colors.background}}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="light" />
      </View>
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
