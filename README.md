# Exptra-AI - Smart Expense Tracker

An intelligent expense tracking mobile application built with React Native (Expo) that automatically reads banking SMS messages to track income and expenses.

## Features

- 🔐 **Firebase Authentication** - Secure login and signup with persistent sessions
- 👆 **Biometric Login** - Fingerprint/Face ID authentication for quick access (NEW)
- 📱 **SMS Reading** - Automatic parsing of banking SMS for transaction detection
- 💰 **Budget Tracking** - Set monthly budgets and track spending with visual speedometer
- 📊 **Category Management** - Auto-categorize transactions with manual override options
- 🏦 **Multiple Bank Support** - Support for SBI, HDFC, ICICI, Axis, Kotak, and more
- 📅 **Custom Month Cycles** - Set your own month start date for expense tracking
- 💳 **Manual Transactions** - Add, edit, and delete transactions manually
- 📈 **Account-wise Tracking** - Monitor expenses across different bank accounts
- 🎨 **Modern UI** - Clean, animated interface with dark mode support
- 💾 **Offline Storage** - AsyncStorage for local caching

## Tech Stack

- **Frontend**: React Native 0.81.5
- **Framework**: Expo ~54.0.23
- **Navigation**: Expo Router ~6.0.14
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore (ready for cloud sync)
- **State Management**: React Context API
- **Local Storage**: AsyncStorage
- **Animations**: React Native Reanimated
- **Charts/Graphics**: React Native SVG

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd exptra-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on Android**
   ```bash
   npm run android
   ```

5. **Run on iOS** (macOS only)
   ```bash
   npm run ios
   ```

6. **Run on Web**
   ```bash
   npm run web
   ```

## Firebase Configuration

The app uses Firebase for authentication and storage. The configuration is already set up in `config/firebase.ts`:

```javascript
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
```

## Building for Production

### Android APK

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS Build**
   ```bash
   eas build:configure
   ```

4. **Build APK**
   ```bash
   npm run build:android:apk
   ```

5. **Build AAB (Play Store)**
   ```bash
   npm run build:android
   ```

### Alternative: Local Build

1. **Prebuild the native projects**
   ```bash
   npm run prebuild
   ```

2. **Build Android APK locally**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **Find your APK**
   The APK will be located at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

## Project Structure

```
exptra-app/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx        # Login/Signup screen (with biometric)
│   │   └── setup.tsx        # Initial setup screen
│   ├── (tabs)/              # Main app tabs
│   │   ├── index.tsx        # Dashboard screen
│   │   ├── explore.tsx      # Transactions screen
│   │   └── settings.tsx     # Settings screen
│   └── _layout.tsx          # Root layout with providers
├── components/              # Reusable components
│   └── Speedometer.tsx      # Budget speedometer component
├── config/                  # Configuration files
│   └── firebase.ts          # Firebase configuration
├── constants/               # App constants
│   ├── categories.ts        # Transaction categories
│   └── theme.ts             # Theme configuration
├── contexts/                # React Context providers
│   ├── AuthContext.tsx      # Authentication state (with biometric methods)
│   ├── AppContext.tsx       # App settings state
│   └── TransactionContext.tsx # Transaction management
├── hooks/                   # Custom React hooks
│   └── useBiometricPrompt.ts # Biometric setup prompt hook
├── utils/                   # Utility functions
│   ├── biometricUtils.ts    # Biometric authentication utilities (NEW)
│   └── smsParser.ts         # SMS parsing logic
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript configuration
```

## Key Features Implementation

### 1. SMS Reading & Parsing

The app uses pattern matching to detect banking transactions from SMS:

```typescript
// Example SMS patterns for different banks
const smsPatterns = [
  {
    bank: 'SBI',
    pattern: /SBI|State Bank/i,
    extractData: (msg) => {
      // Extract transaction details
    }
  }
];
```

**Note**: SMS reading requires user permission and only works on physical Android devices.

### 2. Budget Tracking

Visual speedometer shows spending progress against monthly budget:
- Green: Under 50% of budget
- Orange: 50-80% of budget
- Red: Over 80% of budget

### 3. Transaction Categories

Predefined categories with auto-detection:
- **Expenses**: Food & Dining, Shopping, Transportation, Utilities, Healthcare, Education, EMI, etc.
- **Income**: Salary, Business, Investment, Freelance, Gift, etc.

### 4. Month Cycle

Users can set custom month start dates (e.g., salary credit date) for accurate monthly tracking.

## Permissions

The app requires the following Android permissions:

- `READ_SMS` - To read banking SMS messages
- `RECEIVE_SMS` - To receive new SMS in real-time
- `READ_EXTERNAL_STORAGE` - For file access
- `WRITE_EXTERNAL_STORAGE` - For data caching

## Biometric Login Feature

### Quick Start
- Users are prompted to enable biometric after their first login
- Once enabled, a fingerprint button appears on the login screen
- One tap with your fingerprint = instant login
- See `BIOMETRIC_QUICK_REFERENCE.md` for details

### Supported Platforms
- **iOS**: Face ID (iPhone X+) and Touch ID
- **Android**: Fingerprint, Face ID, Iris Scanner

### Documentation
- `BIOMETRIC_FEATURE.md` - Complete technical documentation
- `BIOMETRIC_INTEGRATION_GUIDE.md` - Integration and testing guide
- `BIOMETRIC_QUICK_REFERENCE.md` - Quick reference guide

## Known Limitations

1. **Biometric Testing**: Requires physical device (not available in emulator/simulator)
2. **SMS Reading**: Only works on physical Android devices (not in emulators)
3. **iOS**: SMS reading is not supported on iOS due to platform restrictions
4. **Bank Support**: Currently supports major Indian banks; patterns can be extended
5. **Offline Mode**: Full offline support; cloud sync can be implemented using Firebase

## Future Enhancements

- [ ] Real-time SMS monitoring
- [ ] Cloud sync with Firebase Firestore
- [ ] Bill payment reminders with notifications
- [ ] Export transactions to CSV/PDF
- [ ] Charts and analytics
- [ ] Multiple currency support
- [ ] Recurring transaction patterns
- [ ] AI-powered category suggestions
- [ ] Budget forecasting

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clear cache and rebuild
npm run prebuild:clean
rm -rf node_modules
npm install
```

### Firebase Connection Issues

Ensure your Firebase project has:
- Authentication enabled
- Firestore database created
- Proper security rules configured

### SMS Not Reading

- Check if permissions are granted in app settings
- Verify SMS format matches the patterns in `utils/smsParser.ts`
- Test on a physical Android device (not emulator)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.

---

**Exptra-AI v1.0.0** - Smart Expense Tracker
Built with ❤️ using React Native and Expo
