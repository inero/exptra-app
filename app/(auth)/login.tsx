import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors as themeColors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useBiometricPrompt } from '../../hooks/useBiometricPrompt';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const { signIn, signUp, biometricLogin, isBiometricAvailable, isBiometricEnabled, getSavedEmail } = useAuth();
  const { promptEnableBiometric } = useBiometricPrompt();

  useEffect(() => {
    checkBiometricStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh biometric status when screen comes into focus (e.g., after settings change)
  useFocusEffect(
    useCallback(() => {
      checkBiometricStatus();
    }, [])
  );

  const checkBiometricStatus = async () => {
    try {
      const isAvailable = await isBiometricAvailable();
      setBiometricAvailable(isAvailable);

      if (isAvailable) {
        const isEnabled = await isBiometricEnabled();
        setBiometricEnabled(isEnabled);

        if (isEnabled) {
          const email = await getSavedEmail();
          setSavedEmail(email);
        }
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (isSignUp && password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleAuth = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      const currentEmail = email;
      const currentPassword = password;

      if (isSignUp) {
        await signUp(currentEmail, currentPassword);
        // Prompt for biometric in background (non-blocking)
        if (!biometricEnabled && biometricAvailable) {
          // Don't await - let it happen in background
          promptEnableBiometric(currentEmail, currentPassword)
            .then(() => checkBiometricStatus())
            .catch((error) => console.warn('Biometric setup skipped:', error));
        }
      } else {
        await signIn(currentEmail, currentPassword);
      }
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      await biometricLogin();
    } catch (error: any) {
      Alert.alert('Biometric Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // Note: To enable Google Sign-In, follow docs/GOOGLE_SIGNIN_SETUP.md
      // This requires OAuth credentials and configuration
      Alert.alert(
        'Google Sign-In Setup Required',
        'To enable Google Sign-In, please follow the setup guide in docs/GOOGLE_SIGNIN_SETUP.md',
        [{ text: 'OK' }]
      );
      setLoading(false);
    } catch (error: any) {
      Alert.alert('Error', 'Google Sign-In setup required');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          {/* <View style={styles.logo}>
            <Text style={styles.logoText}>💰</Text>
          </View>
          <Text style={styles.title}>Exptra</Text>
          <Text style={styles.subtitle}>Smart Expense Tracker</Text> */}
          <Image source={require('../../assets/images/exptra-logo.png')} style={{ width: 180, height: 180 }} />
        </View>

        <View style={styles.formContainer}>
          {biometricEnabled && savedEmail && !isSignUp && (
            <>
              <View style={styles.biometricContainer}>
                <TouchableOpacity
                  style={[styles.biometricButton, loading ? styles.buttonDisabled : null]}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                >
                  <MaterialIcons name="fingerprint" size={48} color={themeColors.primary} />
                  <Text style={styles.biometricText}>Quick Login</Text>
                  <Text style={styles.biometricSubtext}>{savedEmail}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              onBlur={() => validateEmail(email)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
              }}
              onBlur={() => validatePassword(password)}
              secureTextEntry
              placeholderTextColor="#999"
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.button, loading ? styles.buttonDisabled : null]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loadingText}>
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </Text>
              </>
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* {isSignUp && (
            <TouchableOpacity
              style={[styles.googleButton, loading ? styles.buttonDisabled : null]}
              onPress={handleGoogleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="g-translate" size={20} color="#fff" />
                  <Text style={styles.googleButtonText}>Sign Up with Google</Text>
                </>
              )}
            </TouchableOpacity>
          )} */}

          <TouchableOpacity
            onPress={() => {
              setIsSignUp(!isSignUp);
              setEmailError('');
              setPasswordError('');
            }}
            style={styles.switchButton}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Create one"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
    color: themeColors.background,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: themeColors.primary,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: themeColors.muted,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: themeColors.surface,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.03)',
    color: themeColors.text,
  },
  inputError: {
    borderColor: themeColors.danger,
  },
  errorText: {
    color: themeColors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: themeColors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: themeColors.background,
    fontSize: 18,
    fontWeight: '700',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: themeColors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  biometricContainer: {
    marginBottom: 24,
  },
  biometricButton: {
    backgroundColor: themeColors.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: themeColors.primary,
    elevation: 2,
  },
  biometricText: {
    color: themeColors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  biometricSubtext: {
    color: themeColors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: themeColors.muted,
    marginHorizontal: 12,
    fontSize: 14,
  },
  loadingText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 4,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
