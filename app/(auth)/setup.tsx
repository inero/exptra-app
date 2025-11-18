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
import { useApp } from '../../contexts/AppContext';

export default function InitialSetupScreen() {
  const [nickname, setNickname] = useState('');
  const [budget, setBudget] = useState('');
  const [monthStartDate, setMonthStartDate] = useState('1');
  const { updateSettings } = useApp();
  const router = useRouter();

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
    backgroundColor: '#f5f5f5',
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
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: -15,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  skipText: {
    color: '#666',
    fontSize: 16,
  },
});
