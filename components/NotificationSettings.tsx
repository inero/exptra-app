import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from 'react-native-paper';
import { colors as themeColors } from '../constants/theme';
import { NotificationPreferences } from '../contexts/AppContext';
import {
  checkNotificationPermissions,
  requestNotificationPermissions,
  scheduleDailyNotification,
  sendTestNotification,
} from '../utils/notificationUtils';
import TimePicker from './TimePicker';

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onPreferencesChange: (preferences: NotificationPreferences) => void;
}

export default function NotificationSettings({
  preferences,
  onPreferencesChange,
}: NotificationSettingsProps) {
  const [loading, setLoading] = useState(false);

  const handleToggleNotifications = async (enabled: boolean) => {
    setLoading(true);
    try {
      if (enabled) {
        // Request permissions first
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) {
          const granted = await requestNotificationPermissions();
          if (!granted) {
            Alert.alert(
              'Permission Denied',
              'Please enable notifications in your device settings to use this feature.'
            );
            setLoading(false);
            return;
          }
        }

        // Schedule notification
        await scheduleDailyNotification(
          preferences.notificationTime,
          0,
          preferences.notificationType
        );
      } else {
        // Just update the flag - notifications will remain scheduled but won't be used
      }

      onPreferencesChange({
        ...preferences,
        enabled,
      });
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = async (hour: number) => {
    try {
      if (preferences.enabled) {
        // Reschedule with new time
        await scheduleDailyNotification(
          hour,
          0,
          preferences.notificationType
        );
      }

      onPreferencesChange({
        ...preferences,
        notificationTime: hour,
      });
    } catch (error) {
      console.error('Error changing notification time:', error);
      Alert.alert('Error', 'Failed to update notification time');
    }
  };

  const handleTypeChange = async (type: 'funny' | 'formal' | 'mixed') => {
    try {
      if (preferences.enabled) {
        // Reschedule with new type
        await scheduleDailyNotification(
          preferences.notificationTime,
          0,
          type
        );
      }

      onPreferencesChange({
        ...preferences,
        notificationType: type,
      });
    } catch (error) {
      console.error('Error changing notification type:', error);
      Alert.alert('Error', 'Failed to update notification type');
    }
  };

  const handleSendTest = async () => {
    setLoading(true);
    try {
      const hasPermission = await checkNotificationPermissions();
      if (!hasPermission) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          Alert.alert(
            'Permission Denied',
            'Please enable notifications in your device settings.'
          );
          setLoading(false);
          return;
        }
      }

      await sendTestNotification(preferences.notificationType);
      // Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          {/* Enable/Disable Toggle */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Reminders</Text>
              <Switch
                value={preferences.enabled}
                onValueChange={handleToggleNotifications}
                disabled={loading}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(99,102,241,0.3)' }}
                thumbColor={preferences.enabled ? themeColors.primary : '#999'}
              />
            </View>
            <Text style={styles.sectionDescription}>
              Get daily reminders to log your transactions
            </Text>
          </View>

          {/* Notification Time */}
          {preferences.enabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notification Time</Text>
                <TimePicker
                  selectedHour={preferences.notificationTime}
                  onTimeChange={handleTimeChange}
                />
              </View>

              {/* Notification Type */}
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Message Style</Text>
                <View style={styles.typeButtonsContainer}>
                  {['funny', 'formal', 'mixed'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        preferences.notificationType === type && styles.typeButtonActive,
                      ]}
                      onPress={() => handleTypeChange(type as 'funny' | 'formal' | 'mixed')}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          preferences.notificationType === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Test Notification */}
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleSendTest}
                disabled={loading}
              >
                <Text style={styles.testButtonText}>📬 Send Test Notification</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Card>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 Tips</Text>
        <Text style={styles.infoText}>
          • Enable notifications to get daily reminders to log your transactions
        </Text>
        <Text style={styles.infoText}>
          • Choose your preferred time and message style
        </Text>
        <Text style={styles.infoText}>
          • You can change these settings anytime
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
    padding: 15,
  },
  card: {
    backgroundColor: themeColors.surface,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
  },
  cardContent: {
    paddingVertical: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.text,
  },
  sectionDescription: {
    fontSize: 13,
    color: themeColors.muted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.muted,
  },
  typeButtonTextActive: {
    color: themeColors.background,
  },
  testButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: themeColors.primary,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.primary,
  },
  infoSection: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: themeColors.text,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: themeColors.muted,
    lineHeight: 18,
    marginBottom: 6,
  },
});
