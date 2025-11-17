# Exptra-AI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

### Step 3: Run on Android
```bash
npm run android
```

Or scan the QR code with Expo Go app (limited features)

---

## 📱 First Time Setup

1. **Create Account**
   - Open the app
   - Tap "Sign Up"
   - Enter email and password
   - Tap "Sign Up"

2. **Initial Setup**
   - Enter your nickname
   - Set monthly budget (e.g., 50000)
   - Set month start date (e.g., 1 for 1st of month)
   - Tap "Save & Continue"

3. **Grant Permissions** (Android only)
   - Allow SMS reading when prompted
   - This enables automatic transaction detection

---

## 💡 Using the App

### Dashboard
- View your budget speedometer
- See remaining budget
- Check total spent
- View recent transactions

### Adding Transactions
1. Go to "Transactions" tab
2. Tap "+ Add" button
3. Select Income or Expense
4. Enter amount
5. Choose category
6. Add optional details
7. Tap "Save"

### Managing Settings
1. Go to "Settings" tab
2. Update nickname, budget, or month start date
3. Tap "Save Settings"

---

## 🏦 SMS Auto-Detection

The app automatically reads banking SMS and creates transactions.

**Supported Banks:**
- State Bank of India (SBI)
- HDFC Bank
- ICICI Bank
- Axis Bank
- Kotak Mahindra Bank

**Example SMS:**
```
SBI: Rs.1,500.00 debited from A/c **1234
Info: Payment to AMAZON
```

This will automatically create an expense transaction.

---

## 🔨 Building APK

### Quick Build (Preview)
```bash
npm install -g eas-cli
eas login
npm run build:android:apk
```

### Production Build (Play Store)
```bash
npm run build:android
```

Download the APK from the build link and install on your device.

---

## 📝 Common Commands

```bash
npm start              # Start development server
npm run android        # Run on Android
npm run ios           # Run on iOS (macOS only)
npm run web           # Run in web browser
npm run lint          # Check code quality
npm run prebuild      # Generate native folders
npm run prebuild:clean # Clean prebuild
```

---

## ❓ Troubleshooting

**App won't start?**
```bash
npm install
npm start -- --clear
```

**Build fails?**
```bash
rm -rf node_modules
npm install
```

**SMS not reading?**
- Use a physical Android device (not emulator)
- Grant SMS permissions in app settings
- Check if SMS format matches supported banks

---

## 📚 Learn More

- Full documentation: `README.md`
- Deployment guide: `DEPLOYMENT.md`
- Project details: `PROJECT-SUMMARY.md`

---

## 🎯 Quick Tips

1. **Test with Manual Transactions First**: Before relying on SMS, add a few manual transactions to get familiar

2. **Set Realistic Budget**: Your budget should match your actual monthly spending capacity

3. **Customize Categories**: Edit transactions to assign appropriate categories

4. **Regular Updates**: Keep the app updated for best performance

5. **Backup Data**: While data is stored locally, consider exporting important transactions

---

## 🎉 You're All Set!

Start tracking your expenses and take control of your finances with Exptra-AI!

**Need Help?** Check the documentation files or create an issue on GitHub.

---

**Exptra-AI v1.0.0**
