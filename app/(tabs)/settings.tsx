import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { colors as themeColors } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useApp();
  const { user, signOut, disableBiometric, enableBiometric, isBiometricAvailable } = useAuth();
  
  const [nickname, setNickname] = useState(settings.nickname);
  const [budget, setBudget] = useState(settings.monthlyBudget.toString());
  const [monthStartDate, setMonthStartDate] = useState(settings.monthStartDate.toString());
  const [biometricEnabled, setBiometricEnabled] = useState(settings.biometricEnabled ?? false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
    };
    checkBiometricAvailability();
  }, [isBiometricAvailable]);

  const handleBiometricToggle = async (value: boolean) => {
    if (value && !biometricAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Your device does not have biometric capabilities or no biometric data is enrolled.'
      );
      return;
    }

    if (value) {
      // When enabling, show password modal
      setPasswordInput('');
      setShowPasswordModal(true);
    } else {
      // Disabling biometric
      try {
        await disableBiometric();
        setBiometricEnabled(false);
        await updateSettings({ biometricEnabled: false });
        Alert.alert(
          'Biometric Login Disabled',
          'Your biometric authentication has been disabled.'
        );
      } catch (error) {
        console.error('Error disabling biometric:', error);
        Alert.alert('Error', 'Failed to disable biometric login');
      }
    }
  };

  const handleEnableBiometric = async () => {
    if (!passwordInput.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsProcessing(true);
    try {
      const userEmail = user?.email || '';
      if (!userEmail) {
        Alert.alert('Error', 'Could not retrieve user email');
        setBiometricEnabled(false);
        setShowPasswordModal(false);
        setIsProcessing(false);
        return;
      }

      // Save biometric credentials
      const success = await enableBiometric(userEmail, passwordInput);
      if (success) {
        setBiometricEnabled(true);
        await updateSettings({ biometricEnabled: true });
        setShowPasswordModal(false);
        setPasswordInput('');
        Alert.alert(
          'Success',
          'Biometric login has been enabled successfully.'
        );
      } else {
        setBiometricEnabled(false);
        Alert.alert('Error', 'Failed to enable biometric. Please check your password and try again.');
      }
    } catch (error: any) {
      console.error('Error enabling biometric:', error);
      setBiometricEnabled(false);
      Alert.alert('Error', error.message || 'Failed to enable biometric');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBiometric = () => {
    setBiometricEnabled(false);
    setShowPasswordModal(false);
    setPasswordInput('');
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

  const handleDeveloperLink = () => {
    Linking.openURL('https://immanuel-kirubaharan.github.io/immanuel/').catch((err) =>
      Alert.alert('Error', 'Could not open developer profile')
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
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        {biometricAvailable && (
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.label}>Biometric Login</Text>
              <Text style={styles.helpText}>
                Use your fingerprint to login faster
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#767577', true: themeColors.primary }}
              thumbColor={biometricEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        )}
        
        {!biometricAvailable && (
          <View style={styles.notAvailableContainer}>
            <Text style={styles.notAvailableText}>
              Biometric login is not available on this device
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Exptra v1.0.0</Text>
        <Text style={styles.footerSubtext}>Smart Expense Tracker by</Text>
        <TouchableOpacity onPress={handleDeveloperLink}>
          <Text style={styles.developerLink}>Immanuel Kirubaharan</Text>
        </TouchableOpacity>
      </View>

      {/* Password Modal for Biometric Setup */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelBiometric}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Re-authenticate Required</Text>
            <Text style={styles.modalSubtitle}>
              Please enter your password to enable biometric login
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter your password"
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
              editable={!isProcessing}
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelBiometric}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.enableButton, isProcessing && styles.buttonDisabled]}
                onPress={handleEnableBiometric}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.enableButtonText}>Enable Biometric</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    padding: 20,
    backgroundColor: themeColors.primary,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.background,
  },
  section: {
    backgroundColor: themeColors.surface,
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: themeColors.text,
  },
  input: {
    backgroundColor: themeColors.card,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    color: themeColors.text,
  },
  helpText: {
    fontSize: 12,
    color: themeColors.muted,
    marginTop: 5,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: themeColors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: themeColors.danger,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: themeColors.card,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 10,
  },
  notAvailableContainer: {
    backgroundColor: themeColors.card,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  notAvailableText: {
    fontSize: 14,
    color: themeColors.muted,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: themeColors.muted,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: themeColors.muted,
    marginTop: 3,
  },
  developerLink: {
    fontSize: 12,
    color: themeColors.primary,
    marginTop: 4,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderRadius: 15,
    padding: 24,
    width: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: themeColors.muted,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: themeColors.card,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    color: themeColors.text,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: themeColors.card,
    borderWidth: 1,
    borderColor: themeColors.muted,
  },
  cancelButtonText: {
    color: themeColors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  enableButton: {
    backgroundColor: themeColors.primary,
  },
  enableButtonText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
