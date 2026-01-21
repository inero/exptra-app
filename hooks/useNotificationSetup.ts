import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { setupNotificationHandlers } from '../utils/notificationUtils';

// Set notification handler to show notifications even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook to initialize notification system and set up listeners
 */
export const useNotificationSetup = () => {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Register notification handlers
    unsubscribeRef.current = setupNotificationHandlers(
      (notification) => {
        console.log('Notification received:', notification);
      },
      (response) => {
        console.log('Notification response:', response);
        // Handle notification tap here if needed
      }
    );

    return () => {
      // Cleanup notification listeners
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
};
