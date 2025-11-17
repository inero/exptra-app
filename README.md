# Exptra-AI - Smart Expense Tracker with Automatic SMS Reading

An intelligent expense tracking mobile application built with React Native (Expo) that **automatically reads banking SMS messages** to track income and expenses without manual entry.

## 🎯 Key Features

### 🤖 Automatic SMS Reading (NEW!)
- **Auto-detect transactions** from banking SMS
- **Initial bulk import** of last 6 months of SMS
- **Real-time sync** on app open and pull-to-refresh
- **Multi-bank support** (SBI, HDFC, ICICI, Axis, Kotak)
- **Smart categorization** based on merchant/description
- **Duplicate prevention** system
- **Privacy-first** - all processing done locally

### 💰 Core Features
- 🔐 Firebase authentication with persistent sessions
- 📊 Visual budget tracking with animated speedometer
- 📈 Category-wise expense analysis
- 🏦 Account-wise transaction tracking
- 💳 Manual transaction entry and editing
- 📅 Custom month cycles
- 🔔 Bill & EMI management (ready)
- 📱 Modern, intuitive UI

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd exptra-app

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android
```

### First Time Setup

1. **Create Account**
   - Enter email and password
   - Tap "Sign Up"

2. **Initial Setup**
   - Set nickname (e.g., "John")
   - Set monthly budget (e.g., 50000)
   - Set month start date (e.g., 1)

3. **Grant SMS Permission**
   - Allow SMS reading when prompted
   - App automatically imports banking SMS
   - Wait for initial sync to complete

4. **Start Tracking**
   - View auto-imported transactions
   - Pull down to sync new SMS
   - Add manual transactions as needed

## 📱 SMS Reading Feature

### How It Works

1. **Initial Import**
   - Reads all SMS from last 6 months on first setup
   - Filters only banking and transactional messages
   - Creates transactions automatically
   - Shows count of imported transactions

2. **Ongoing Sync**
   - Pull down on dashboard to sync new SMS
   - Automatically checks on app open
   - Only processes new messages
   - Prevents duplicate imports

3. **Smart Detection**
   - Recognizes debit/credit transactions
   - Extracts amount, account, bank name
   - Auto-categorizes based on merchant
   - Detects income vs. expense

### Supported Banks

- State Bank of India (SBI)
- HDFC Bank
- ICICI Bank
- Axis Bank
- Kotak Mahindra Bank

*More banks can be easily added via regex patterns*

### SMS Format Examples

```
✅ SBI: Rs.1,500.00 debited from A/c **1234 on 15-Nov-25
   Info: Payment to AMAZON

✅ HDFC: Rs.50,000.00 credited to A/c XX9876 on 14-Nov-25
   Info: Salary credited

✅ ICICI: Your A/c XX5678 debited with Rs.2,500.00 on 17-Nov-25
   at ZOMATO FOOD DELIVERY
```

## 📊 Features in Detail

### Dashboard
- **Budget Speedometer**: Visual gauge showing spending vs budget
  - Green: Under 50% spent
  - Orange: 50-80% spent
  - Red: Over 80% spent
- **Quick Stats**: Bank balance, pending bills, total spent
- **Recent Transactions**: Last 10 transactions with icons
- **Pull to Refresh**: Sync new SMS instantly

### Transactions
- **View All**: Complete transaction history
- **Add Manual**: Cash or non-SMS transactions
- **Edit**: Modify amount, category, description
- **Delete**: Remove with confirmation
- **Filter**: By type (Income/Expense)
- **Auto-Import**: From SMS with one tap

### Settings
- **Profile**: Nickname, budget, month start date
- **SMS Sync**: Manual sync and resync options
- **Account**: Sign out securely

## 🛠️ Technology Stack

- **Framework**: React Native 0.81.5 + Expo ~54.0.23
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: Firebase Auth
- **Storage**: AsyncStorage (local) + Firebase Firestore (ready)
- **State**: React Context API
- **Language**: TypeScript
- **SMS**: Native Android SMS reading
- **UI**: React Native SVG, Reanimated

## 📂 Project Structure

```
exptra-app/
├── app/
│   ├── (auth)/              # Auth screens
│   │   ├── login.tsx
│   │   └── setup.tsx
│   ├── (tabs)/              # Main app
│   │   ├── index.tsx        # Dashboard with SMS sync
│   │   ├── explore.tsx      # Transactions
│   │   └── settings.tsx     # Settings with sync options
│   └── _layout.tsx
├── components/
│   └── Speedometer.tsx      # Budget visualization
├── config/
│   └── firebase.ts          # Firebase config
├── constants/
│   ├── categories.ts        # Categories & icons
│   └── theme.ts
├── contexts/
│   ├── AuthContext.tsx
│   ├── AppContext.tsx
│   └── TransactionContext.tsx  # With SMS sync
├── utils/
│   ├── smsParser.ts         # Bank SMS patterns
│   ├── smsService.ts        # SMS sync service
│   └── nativeSMSReader.ts   # Native SMS access
└── docs/
    ├── SMS-FEATURE.md       # SMS feature docs
    └── DEPLOYMENT.md
```

## 🔒 Privacy & Security

### SMS Data
- ✅ **Local Processing**: All SMS read and processed on device
- ✅ **No Server Upload**: SMS data never sent to any server
- ✅ **Selective Reading**: Only banking SMS processed
- ✅ **Encrypted Storage**: All data stored in encrypted AsyncStorage
- ✅ **User Control**: Can revoke permission anytime

### Authentication
- Firebase Auth with secure tokens
- Password never stored locally
- Session management with auto-logout

## 📋 Permissions

### Required (Android)
- **READ_SMS**: Read SMS inbox for transactions
- **RECEIVE_SMS**: Detect new SMS (future feature)

### How to Grant
1. App requests automatically on first use
2. Can also grant in Android Settings > Apps > Exptra-AI > Permissions

### How to Revoke
1. Android Settings > Apps > Exptra-AI > Permissions > SMS > Deny
2. App will continue working with manual entry only

## 🧪 Testing

### With Real SMS
1. Install APK on Android device
2. Grant SMS permission
3. App will read your actual banking SMS
4. Verify transactions are created

### Without SMS (Development)
1. App provides sample SMS data
2. Test with Expo Go or emulator
3. Sample transactions automatically created
4. Full functionality available

## 🏗️ Building

### Development Build
```bash
npm start
npm run android
```

### Preview APK (Testing)
```bash
npm install -g eas-cli
eas login
npm run build:android:apk
```

### Production AAB (Play Store)
```bash
npm run build:android
```

## 📖 Documentation

- **[SMS Feature Guide](SMS-FEATURE.md)** - Detailed SMS reading documentation
- **[Deployment Guide](DEPLOYMENT.md)** - Build and deployment instructions
- **[Quick Start](QUICKSTART.md)** - 5-minute setup guide
- **[Project Summary](PROJECT-SUMMARY.md)** - Complete feature list

## 🐛 Troubleshooting

### SMS Not Syncing
- ✅ Check SMS permission is granted
- ✅ Verify banking SMS exists in inbox
- ✅ Try manual sync in Settings
- ✅ Check if bank is supported

### App Won't Build
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### Permission Issues
- Grant in Android Settings > Apps > Exptra-AI
- Restart app after granting permission

## 🔄 Updates & Syncing

### Automatic
- App checks for new SMS on open
- Pull-to-refresh on dashboard
- Background sync (coming soon)

### Manual
- Settings > SMS Sync > Sync New SMS
- Settings > SMS Sync > Resync All (re-import all)

## 🎯 Roadmap

### Current Version (1.0.0)
- ✅ Automatic SMS reading
- ✅ Multi-bank support
- ✅ Smart categorization
- ✅ Budget tracking
- ✅ Manual transactions

### Coming Soon (1.1.0)
- [ ] Real-time SMS monitoring
- [ ] Bill reminders with notifications
- [ ] Charts and analytics
- [ ] Export to CSV/PDF
- [ ] More banks support
- [ ] Recurring transaction detection

### Future (2.0.0)
- [ ] Cloud sync with Firebase
- [ ] Multiple accounts
- [ ] Shared budgets
- [ ] AI-powered insights
- [ ] Balance forecasting

## 🤝 Contributing

We welcome contributions! Areas to contribute:

1. **Add Bank Patterns**: Support more banks
2. **Improve Categorization**: Better keyword detection
3. **UI Enhancements**: Better visualizations
4. **Documentation**: Improve guides
5. **Testing**: Test on different devices

## ❓ FAQ

**Q: Is my SMS data safe?**
A: Yes, all SMS processing happens locally on your device. No data is sent to any server.

**Q: Can I disable SMS reading?**
A: Yes, revoke SMS permission in Android settings. You can still use manual entry.

**Q: Does it work on iPhone?**
A: No, iOS doesn't allow apps to read SMS due to platform restrictions.

**Q: What if my bank isn't supported?**
A: You can add transactions manually, or we can add your bank's SMS pattern.

**Q: Will it create duplicate transactions?**
A: No, the app tracks processed SMS IDs to prevent duplicates.

**Q: Can I edit auto-detected transactions?**
A: Yes, all transactions can be edited or deleted regardless of source.

## 📞 Support

- **Issues**: [GitHub Issues](link-to-issues)
- **Email**: support@exptra.app
- **Documentation**: Check the docs/ folder

## 📜 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Firebase for authentication
- Expo for amazing React Native tools
- React Native community
- All contributors

---

**Exptra-AI v1.0.0** - Your Smart Financial Companion

*Automatically track expenses from SMS. Never miss a transaction.*

**Made with ❤️ for better financial management**
