import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const useBiometricPrompt = () => {
  const { enableBiometric, isBiometricAvailable } = useAuth();

  const promptEnableBiometric = async (email: string, password: string) => {
    try {
      const isAvailable = await isBiometricAvailable();
      if (!isAvailable) {
        return false;
      }

      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'Enable Biometric Login?',
          'Use your fingerprint to login faster next time.',
          [
            {
              text: 'Not Now',
              onPress: () => resolve(false),
              style: 'cancel',
            },
            {
              text: 'Enable',
              onPress: async () => {
                const success = await enableBiometric(email, password);
                resolve(success);
              },
              style: 'default',
            },
          ]
        );
      });
    } catch (error) {
      console.error('Error prompting for biometric setup:', error);
      return false;
    }
  };

  return { promptEnableBiometric };
};
