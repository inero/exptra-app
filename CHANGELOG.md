# Changelog

All notable changes to the Exptra-AI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-17

### Added - SMS Reading Feature 🎉

#### Automatic SMS Processing
- Automatic SMS inbox reading for banking transactions
- Initial bulk import of last 6 months of SMS messages
- Incremental sync for new SMS on app open and pull-to-refresh
- Duplicate prevention system using SMS ID tracking
- Sample SMS data for development/testing without real SMS

#### SMS Service & Parser
- Native SMS reader integration (`utils/nativeSMSReader.ts`)
- Comprehensive SMS service (`utils/smsService.ts`)
- Enhanced SMS parser with multi-bank support (`utils/smsParser.ts`)
- Support for 5 major banks: SBI, HDFC, ICICI, Axis, Kotak

#### Transaction Management
- Auto-import transactions from SMS
- Auto-categorization based on merchant/description
- Manual override for all auto-detected transactions
- SMS-to-transaction mapping with unique IDs

#### UI Enhancements
- SMS sync button in Settings
- "Sync New SMS" and "Resync All SMS" options
- Sync progress indicators on Dashboard
- SMS sync status display in About section
- Pull-to-refresh triggers SMS sync

#### Context Updates
- Added `syncSMSTransactions()` to TransactionContext
- Added `isInitialSMSSyncComplete` to AppContext
- Integrated SMS service across the app

#### Developer Features
- Sample SMS data generator for testing
- Comprehensive error handling
- Permission management utilities
- Development mode detection

### Changed
- Dashboard now shows sync indicator
- Refresh control triggers SMS sync
- Settings screen expanded with SMS options
- Transaction count includes SMS-imported transactions

### Dependencies
- Added `expo-sms-retriever`
- Added `react-native-android-sms-listener`
- Updated context providers for SMS integration

### Documentation
- Created `SMS-FEATURE.md` - Complete SMS feature guide
- Updated `README.md` with SMS reading documentation
- Added troubleshooting section for SMS issues
- Updated project structure documentation

### Technical
- SMS permission handling
- AsyncStorage for processed SMS tracking
- Last read timestamp tracking
- Six-month lookback window for initial sync

## [1.0.0] - 2025-11-17

### Added

#### Authentication
- Firebase authentication integration with email/password
- Login screen with form validation
- Signup screen with account creation
- Persistent authentication using AsyncStorage
- Initial setup screen for new users
- Protected routing based on authentication state
- Sign out functionality

#### Dashboard
- Main dashboard screen with budget overview
- Animated speedometer component using React Native SVG
- Visual budget tracking with color indicators (green/orange/red)
- Recent transactions list with category icons
- Monthly expense and income summary
- Bank balance display (with hide/show option)
- Pending bills total display
- Total spent display
- Pull-to-refresh functionality

#### Transactions
- Comprehensive transactions screen
- Add manual transactions with modal form
- Edit existing transactions
- Delete transactions with confirmation
- Transaction type selection (Income/Expense)
- Category selection with visual icons
- Account and bank name tracking
- Transaction amount input with validation
- Optional description field
- Transaction list with date sorting
- Empty state handling

#### Categories
- 12 expense categories with emoji icons
- 6 income categories with emoji icons
- Auto-categorization based on keywords
- Manual category override
- Category-wise expense tracking (ready for charts)

#### Settings
- User profile settings screen
- Nickname configuration
- Monthly budget setting
- Custom month start date (1-31)
- Settings persistence with AsyncStorage
- App version display
- Transaction count display
- Sign out option with confirmation

#### SMS Parsing
- SMS parser utility with regex patterns
- Support for SBI, HDFC, ICICI, Axis, and Kotak banks
- Transaction amount extraction
- Account number detection
- Transaction type detection (debit/credit)
- Bank name identification
- Auto-categorization of parsed transactions

#### State Management
- AuthContext for authentication state
- AppContext for user settings and preferences
- TransactionContext for transaction management
- Proper context provider hierarchy
- Type-safe context hooks

#### Data Persistence
- AsyncStorage integration for offline support
- User-specific data storage
- Settings persistence
- Transaction caching
- Automatic data loading on app start

#### UI/UX
- Modern, clean interface design
- Tab-based navigation (Dashboard, Transactions, Settings)
- Smooth animations with React Native Reanimated
- Form validation with user feedback
- Loading states and indicators
- Error handling with user-friendly messages
- Empty states for better UX
- Consistent color scheme (#2196F3 primary)

#### Build & Deployment
- EAS Build configuration
- Android permissions for SMS reading
- APK build scripts
- Production build configuration
- App metadata and branding
- Bundle identifier setup

#### Documentation
- Comprehensive README with setup instructions
- Detailed deployment guide (DEPLOYMENT.md)
- Project summary document (PROJECT-SUMMARY.md)
- Quick start guide (QUICKSTART.md)
- Implementation checklist (CHECKLIST.md)
- This changelog

### Technical Details

#### Dependencies
- React Native 0.81.5
- Expo ~54.0.23
- Expo Router ~6.0.14
- Firebase 12.6.0
- AsyncStorage 2.2.0
- React Native SVG 15.15.0
- TypeScript 5.9.2

#### File Structure
- Well-organized folder structure
- Separation of concerns (screens, components, contexts, utils)
- TypeScript for type safety
- ESLint configuration for code quality

### Configuration
- Firebase project setup with authentication
- Android permissions (READ_SMS, RECEIVE_SMS)
- Expo configuration with proper metadata
- EAS build profiles (development, preview, production)

### Known Limitations
- SMS reading only works on physical Android devices
- iOS doesn't support SMS reading due to platform restrictions
- Cloud sync with Firebase Firestore not yet implemented
- Real-time SMS monitoring requires background service (future enhancement)

### Future Enhancements (Planned)
- Real-time SMS monitoring with background service
- Full Firebase Firestore cloud sync
- Bill payment reminder notifications
- Export transactions to CSV/PDF
- Charts and analytics dashboard
- Multiple currency support
- Recurring transaction detection
- AI-powered category suggestions
- Budget forecasting
- Shared accounts/family mode

---

## Version History

### [1.1.0] - 2025-11-17
- **Major Feature**: Automatic SMS reading and parsing
- Initial bulk SMS import (6 months)
- Real-time SMS sync
- Multi-bank support (5 banks)
- Auto-categorization
- Duplicate prevention
- Enhanced UI with sync indicators

### [1.0.0] - 2025-11-17
- Initial release
- Complete implementation of all core features
- Production-ready build
- Comprehensive documentation

---

## How to Update This File

When releasing a new version:

1. Create a new version section with the date
2. List changes under appropriate categories:
   - `Added` for new features
   - `Changed` for changes in existing functionality
   - `Deprecated` for soon-to-be removed features
   - `Removed` for now removed features
   - `Fixed` for bug fixes
   - `Security` for vulnerability fixes

3. Update version in:
   - `package.json`
   - `app.json`
   - This changelog

4. Create a git tag for the release:
   ```bash
   git tag -a v1.0.0 -m "Version 1.0.0"
   git push origin v1.0.0
   ```

---

**Exptra-AI** - Smart Expense Tracker
