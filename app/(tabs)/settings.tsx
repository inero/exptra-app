import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const { settings, updateSettings } = useApp();
  const { signOut } = useAuth();
  const router = useRouter();
  
  const [nickname, setNickname] = useState(settings.nickname);
  const [budget, setBudget] = useState(settings.monthlyBudget.toString());
  const [monthStartDate, setMonthStartDate] = useState(settings.monthStartDate.toString());

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
    });

    Alert.alert('Success', 'Settings saved successfully!');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Settings</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Enter your nickname"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monthly Budget (₹)</Text>
          <TextInput
            style={styles.input}
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            placeholder="Enter your monthly budget"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Month Start Date</Text>
          <TextInput
            style={styles.input}
            value={monthStartDate}
            onChangeText={setMonthStartDate}
            keyboardType="numeric"
            placeholder="Enter date (1-31)"
          />
          <Text style={styles.helpText}>
            The date when your monthly expense cycle begins
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Exptra v1.0.0</Text>
        <Text style={styles.footerSubtext}>Smart Expense Tracker</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
});
