import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface NotificationSettings {
  enabled: boolean;
  notificationTime: number; // Hour (0-23)
  notificationType: 'funny' | 'formal' | 'mixed';
  sendDaily: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  notificationTime: 18, // 6 PM
  notificationType: 'mixed',
  sendDaily: true,
};

// Notification message templates
const FUNNY_MESSAGES = [
  'Time to feed your budget! 🍽️ What did you spend today?',
  'Your wallet called... it wants to know what happened to it today 💸',
  'Plot twist: Did you really buy that? Let\'s log it! 🎬',
  'Breaking news: Your transactions are missing! 📰',
  'Your expenses are playing hide and seek... help them come out! 🙈',
  'Money doesn\'t grow on trees, so let\'s track where it went! 🌳',
  'Time to update your financial diary! 📖✨',
  'Your future self will thank you for logging these! 🙏',
  'Ka-ching! Any transactions waiting to be logged? 💰',
  'It\'s expense o\'clock! Let\'s see what\'s going on today 🕐',
];

const FORMAL_MESSAGES = [
  'Please log your transactions for today to maintain accurate financial records.',
  'Update your expense tracker with today\'s financial activities.',
  'Record your daily transactions for better financial management.',
  'Add your income and expenses for today to keep your budget on track.',
  'Complete your daily expense log for comprehensive financial insights.',
  'Review and record today\'s financial transactions.',
  'Update your account with today\'s income and expense entries.',
  'Maintain your financial tracking by logging today\'s transactions.',
  'Record your financial activities to ensure accurate budgeting.',
  'Add your daily transactions to track your spending patterns.',
];

/**
 * Get random notification message based on type
 */
export const getRandomNotificationMessage = (
  type: 'funny' | 'formal' | 'mixed' = 'mixed'
): string => {
  let messages: string[] = [];

  if (type === 'funny') {
    messages = FUNNY_MESSAGES;
  } else if (type === 'formal') {
    messages = FORMAL_MESSAGES;
  } else {
    messages = [...FUNNY_MESSAGES, ...FORMAL_MESSAGES];
  }

  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Load notification settings from storage
 */
export const loadNotificationSettings = async (
  userId: string
): Promise<NotificationSettings> => {
  try {
    const stored = await AsyncStorage.getItem(`notification_settings_${userId}`);
    return stored
      ? JSON.parse(stored)
      : DEFAULT_NOTIFICATION_SETTINGS;
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

/**
 * Save notification settings to storage
 */
export const saveNotificationSettings = async (
  userId: string,
  settings: NotificationSettings
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      `notification_settings_${userId}`,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error('Error saving notification settings:', error);
    throw error;
  }
};

/**
 * Schedule daily notification
 */
export const scheduleDailyNotification = async (
  hour: number,
  minute: number = 0,
  notificationType: 'funny' | 'formal' | 'mixed' = 'mixed'
): Promise<string> => {
  try {
    // Cancel any existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const message = getRandomNotificationMessage(notificationType);

    // Calculate trigger time - using daily notification type
    const trigger = {
      type: 'daily' as const,
      hour,
      minute,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💼 Add Your Transactions',
        body: message,
        data: { type: 'daily_reminder' },
        sound: 'default',
      },
      trigger,
    });

    // Store the notification ID for reference
    await AsyncStorage.setItem(
      'scheduled_notification_id',
      JSON.stringify(notificationId)
    );

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('scheduled_notification_id');
  } catch (error) {
    console.error('Error canceling notifications:', error);
    throw error;
  }
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Check if notifications are enabled
 */
export const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

/**
 * Send immediate test notification
 */
export const sendTestNotification = async (
  notificationType: 'funny' | 'formal' | 'mixed' = 'mixed'
): Promise<void> => {
  try {
    const message = getRandomNotificationMessage(notificationType);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💼 Add Your Transactions',
        body: message,
        data: { type: 'test_reminder' },
        sound: 'default',
      },
      trigger: { type: 'time-interval' as const, seconds: 2 },
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async (): Promise<
  Notifications.NotificationRequest[]
> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Setup notification handler for when notification is received
 */
export const setupNotificationHandlers = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponseReceived?: (
    response: Notifications.NotificationResponse
  ) => void
): (() => void) => {
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Handle notification tap
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      if (onNotificationResponseReceived) {
        onNotificationResponseReceived(response);
      }
    });

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};
