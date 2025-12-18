# Authentication & Biometric - Testing Guide

## Quick Start Test Procedure

Run these tests to verify all authentication fixes are working properly.

## Test Environment Setup

### Prerequisites
- Physical device (Android/iOS) for biometric testing
- Firebase project access (optional, for logs)
- Internet connection

### Device Requirements
- **Biometric**: Device must have fingerprint, Face ID, or iris scanner enrolled
- **Android**: API 23+ (Android 6.0+)
- **iOS**: iOS 12+ with Touch ID or Face ID

## Test Cases

### Test 1: New User Signup Flow ✅

**Steps**:
1. Launch app on fresh install (clear app data if needed)
2. Go to Login screen (should appear automatically)
3. Click "Don't have an account? Create one"
4. Enter email: `test.user.123@example.com`
5. Enter password: `TestPassword123!`
6. Click "Create Account"

**Expected Results**:
- ✅ Account created successfully
- ✅ No error messages
- ✅ If biometric available: "Enable Biometric Login?" prompt appears
  - Select "Enable" to test biometric setup
  - Or "Not Now" to skip
- ✅ After biometric prompt: redirects to setup page

**Biometric Prompt Details**:
- Should show: "Enable Biometric Login?"
- Should show: "Use your fingerprint to login faster next time."
- Should have "Enable" and "Not Now" buttons
- If enabled: Biometric enrolled on device

**Setup Page**:
- Should see: "Welcome to Exptra! 🎉"
- Should see: "Let's set up your profile"
- Required fields: Nickname, Monthly Budget, Month Start Date
- After fill: Click "Save & Continue"

**Expected Result After Setup**:
- ✅ Redirected to main app (tabs screen)
- ✅ All app tabs accessible
- ✅ Settings preserved

### Test 2: First-Time Setup Page ✅

**Steps**:
1. From Test 1, you're on setup page
2. Fill in:
   - Nickname: "Test User"
   - Monthly Budget: "50000"
   - Month Start Date: "1"
3. Click "Save & Continue"

**Expected Results**:
- ✅ No validation errors
- ✅ Redirected to main app
- ✅ Profile settings saved
- ✅ Can see nickname in settings (if available)

**Optional - Skip Setup**:
1. Click "Skip for now" on setup page
2. Confirm in alert

**Expected Results**:
- ✅ Still redirected to main app
- ✅ Setup can be completed later
- ✅ Default values used if needed

### Test 3: Returning User Login (No Biometric) ✅

**Steps**:
1. From Test 2, logout (find logout in settings)
2. Should return to login screen
3. Enter same email: `test.user.123@example.com`
4. Enter password: `TestPassword123!`
5. Click "Sign In"

**Expected Results**:
- ✅ Login successful
- ✅ No setup page shown (already completed)
- ✅ Directly redirected to main app
- ✅ Previous settings preserved

### Test 4: Biometric Quick Login ✅ (Requires Device with Biometric)

**Prerequisites**:
- Must have completed Test 1 with "Enable" for biometric
- Device must have biometric enrolled

**Steps**:
1. Logout from app (find in settings)
2. Return to login screen
3. Should see: "Quick Login" button with fingerprint icon
4. Should show: Your saved email below fingerprint icon
5. Click fingerprint/Quick Login button
6. Use your biometric (fingerprint/Face ID) when prompted

**Expected Results**:
- ✅ System biometric prompt appears
- ✅ Shows: "Use your fingerprint to login"
- ✅ After successful biometric: logged in
- ✅ Redirected to main app
- ✅ No email/password form shown

**Biometric Failure Handling**:
1. Fail biometric 3 times (on purpose)
2. Should see: Fallback option

**Expected Results**:
- ✅ Still can enter email/password
- ✅ Manual login as backup
- ✅ Can proceed normally

### Test 5: Biometric Disabled User ✅

**Steps**:
1. Logout
2. Click "Don't have an account? Create one"
3. Signup with email: `test.user.456@example.com`
4. When biometric prompt appears: Click "Not Now"
5. Continue through setup

**Expected Results**:
- ✅ Biometric prompt shown but skipped
- ✅ Redirected to setup (without biometric)
- ✅ Complete setup and go to main app
6. Logout and return to login
7. Should NOT see "Quick Login" button

**Expected Results**:
- ✅ Only email/password form visible
- ✅ Can login normally

### Test 6: Wrong Password ✅

**Steps**:
1. On login screen
2. Enter email: `test.user.123@example.com`
3. Enter password: `WrongPassword123!`
4. Click "Sign In"

**Expected Results**:
- ✅ Error alert appears
- ✅ Error message: "Incorrect password"
- ✅ Still on login screen
- ✅ Can retry

### Test 7: Non-Existent User ✅

**Steps**:
1. On login screen
2. Enter email: `nonexistent.user@example.com`
3. Enter password: `AnyPassword123!`
4. Click "Sign In"

**Expected Results**:
- ✅ Error alert appears
- ✅ Error message: "No account found with this email"
- ✅ Still on login screen
- ✅ Can try different email

### Test 8: Invalid Email Format ✅

**Steps**:
1. On login screen
2. Enter email: `invalid-email`
3. Enter password: `TestPassword123!`
4. Click "Sign In" or blur email field

**Expected Results**:
- ✅ Error message: "Please enter a valid email address"
- ✅ Email field highlighted in red
- ✅ Submit button disabled (until fixed)

### Test 9: Weak Password on Signup ✅

**Steps**:
1. Click "Don't have an account? Create one"
2. Enter email: `test.weak.pass@example.com`
3. Enter password: `123` (too short)
4. Click "Create Account" or blur password field

**Expected Results**:
- ✅ Error message: "Password must be at least 6 characters"
- ✅ Password field highlighted in red
- ✅ Submit button disabled

### Test 10: Logout and Session Cleanup ✅

**Steps**:
1. Logged in to main app
2. Go to settings
3. Find and click "Logout" or "Sign Out"
4. Confirm logout

**Expected Results**:
- ✅ Redirected to login screen
- ✅ Previous session cleared
- ✅ Can login again as different user

### Test 11: Network Error Handling ✅

**Steps**:
1. Turn off WiFi/Mobile data
2. Try to login

**Expected Results**:
- ✅ Error alert appears
- ✅ Error message mentions "network"
- ✅ Message: "Check your internet connection"
- ✅ Can retry after reconnecting

### Test 12: App Restart Persistence ✅

**Steps**:
1. Login successfully
2. Navigate to main app
3. Force close app (Settings → Apps → Force Stop)
4. Relaunch app

**Expected Results**:
- ✅ Still logged in
- ✅ Shown main app immediately
- ✅ No re-login required (Firebase session persisted)

### Test 13: Multiple Signups ✅

**Steps**:
1. Logout
2. Signup with new email: `test.second.user@example.com`
3. Complete setup
4. Logout
5. Signup with another new email: `test.third.user@example.com`
6. Complete setup

**Expected Results**:
- ✅ Each signup creates separate account
- ✅ Settings isolated per user
- ✅ Can switch between accounts

### Test 14: Navigation Flow ✅

**Test 14a: Not Logged In**:
1. Force clear app storage (Settings → Apps)
2. Relaunch app

**Expected Results**:
- ✅ Shown login screen immediately
- ✅ Not on setup or main app

**Test 14b: Logged In, Setup Not Done**:
1. Manually edit app data to set `isInitialSetupComplete: false`
2. Relaunch app

**Expected Results**:
- ✅ Shown setup page, not main app

**Test 14c: Logged In, Setup Done**:
1. Login and complete setup
2. Relaunch app

**Expected Results**:
- ✅ Shown main app, not login or setup

## Platform-Specific Tests

### Android Tests ✅

1. **Biometric (Fingerprint)**:
   - Test with enrolled fingerprint
   - Test quick login
   - Test failure handling

2. **Storage**:
   - Credentials securely stored in KeyStore
   - Survives app restart
   - Cleared on logout

3. **Permissions**:
   - Biometric permission prompt appears
   - Can be granted/denied
   - App handles denial gracefully

### iOS Tests ✅

1. **Biometric (Face ID / Touch ID)**:
   - Test with enrolled Face ID/Touch ID
   - Test quick login
   - Test failure handling

2. **Storage**:
   - Credentials securely stored in Keychain
   - Survives app restart
   - Cleared on logout

3. **Permissions**:
   - Face ID permission prompt appears
   - Can be granted/denied
   - App handles denial gracefully

## Performance Tests

### Startup Time ✅
- [ ] App startup < 3 seconds (first launch)
- [ ] App startup < 1 second (returning user with session)
- [ ] Login < 2 seconds
- [ ] Biometric unlock < 1 second

### Memory Usage ✅
- [ ] No memory leaks on multiple logins
- [ ] No memory leaks on multiple signups
- [ ] Clean memory on logout

## Browser/Web Tests (If Applicable)

### Web Platform Tests ✅

1. **Email/Password**:
   - Signup works
   - Login works
   - Session persists across refresh

2. **Biometric**:
   - Not available on web (expected)
   - Quick login not shown
   - Password form shown instead

## Security Tests

### Test 1: Credential Security ✅
1. Biometric credentials not visible in logs
2. Passwords not logged anywhere
3. Session tokens secure

### Test 2: Account Security ✅
1. Cannot login without correct password
2. Cannot access other users' data
3. Logout clears session

## Regression Tests (Existing Features)

### Expense Tracking ✅
- [ ] Can add new expense
- [ ] Can view transactions
- [ ] Budget tracking works
- [ ] Reports generate

### Settings ✅
- [ ] Settings page loads
- [ ] Can update settings
- [ ] Changes persist

### Notifications ✅
- [ ] Notifications work (if implemented)
- [ ] No auth-related notifications broken

## Bug Report Template

If you find issues during testing:

```markdown
**Bug Title**: [Brief description]

**Platform**: Android / iOS / Web

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: 
[What should happen]

**Actual Result**: 
[What actually happened]

**Error Message**: 
[If applicable]

**Device/Emulator Info**:
- Device: [Model]
- OS: [Android 13 / iOS 16 / etc]
- App Version: [Version number]

**Screenshots/Logs**: 
[Attach if possible]
```

## Known Issues & Workarounds

### Issue: Biometric Not Available on Emulator
- **Expected**: Biometric features only work on physical devices
- **Workaround**: Test on physical Android/iOS device

### Issue: Firebase Auth Slow on Poor Connection
- **Expected**: Slower response on poor network
- **Workaround**: Test with good connection first, then poor connection

## Sign-Off

Once all tests pass, sign off:

- [ ] All test cases passed
- [ ] No regressions detected
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Ready for production build

---

**Tested By**: [Your Name]
**Date**: [Date]
**Platform**: [Android/iOS/Both]
**Result**: ✅ PASS / ❌ FAIL
