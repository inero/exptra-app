import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors as themeColors } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

export default function InitialSetupScreen() {
  const [nickname, setNickname] = useState('');
  const [budget, setBudget] = useState('');
  const [monthStartDate, setMonthStartDate] = useState('1');
  const { updateSettings } = useApp();
  const { user, isBiometricAvailable } = useAuth();
  const router = useRouter();

  // Prompt for biometric setup after initial setup is complete
  const promptBiometricSetup = async () => {
    try {
      const isAvailable = await isBiometricAvailable();
      if (isAvailable && user?.email) {
        // Note: For production, you would need to get the password from secure storage or skip this
        // For now, we'll just prompt without saving credentials again
        console.log('Biometric is available. Consider enabling from settings.');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const handleSave = async () => {
    const budgetNum = parseFloat(budget);
    const startDate = parseInt(monthStartDate);

    if (!nickname) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }

    if (isNaN(budgetNum) || budgetNum <= 0) {
      Alert.alert('Error', 'Please enter a valid budget');
      return;
    }

    if (isNaN(startDate) || startDate < 1 || startDate > 31) {
      Alert.alert('Error', 'Please enter a valid date (1-31)');
      return;
    }

    await updateSettings({
      nickname,
      monthlyBudget: budgetNum,
      monthStartDate: startDate,
      isInitialSetupComplete: true,
    });

    // Check and prompt for biometric after setup
    await promptBiometricSetup();

    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Setup',
      'You can complete this setup later from the settings menu.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            await updateSettings({ isInitialSetupComplete: true });
            await promptBiometricSetup();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Exptra! 🎉</Text>
          <Text style={styles.subtitle}>Let's set up your profile</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Nickname</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your nickname"
              value={nickname}
              onChangeText={setNickname}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Monthly Budget (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your monthly budget"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Month Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter date (1-31)"
              value={monthStartDate}
              onChangeText={setMonthStartDate}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>
              This is the date when your monthly expense cycle begins
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save & Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: themeColors.primary,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: themeColors.muted,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: themeColors.text,
  },
  input: {
    backgroundColor: themeColors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    color: themeColors.text,
  },
  helpText: {
    fontSize: 14,
    color: themeColors.muted,
    marginTop: -15,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: themeColors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: themeColors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  skipText: {
    color: themeColors.muted,
    fontSize: 16,
  },
});
