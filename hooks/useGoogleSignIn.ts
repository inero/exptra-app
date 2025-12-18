import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// This hook handles Google Sign-In integration
// Currently configured for Firebase Authentication
export const useGoogleSignIn = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      try {
        if (Platform.OS === 'web') {
          // Web-specific initialization if needed
          console.log('Google Sign-In: Web platform detected');
        } else {
          // Mobile-specific initialization
          console.log('Google Sign-In: Mobile platform detected');
        }
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        setIsReady(false);
      }
    };

    initializeGoogleSignIn();

    return () => {
      WebBrowser.dismissBrowser().catch(() => {
        // Ignore error if browser is not open
      });
    };
  }, []);

  return { isReady };
};
