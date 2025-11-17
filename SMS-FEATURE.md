# SMS Reading Feature - Implementation Guide

## Overview

The Exptra-AI app now includes automatic SMS reading and transaction detection functionality. This feature automatically reads banking SMS messages to track your income and expenses.

## How It Works

### Initial SMS Sync
- **First Time Setup**: When you first use the app after granting SMS permission, it reads all banking SMS from the last 6 months
- **Automatic Detection**: The app identifies banking SMS using regex patterns for major Indian banks
- **Transaction Creation**: Detected transactions are automatically added to your transaction list
- **Categorization**: Transactions are auto-categorized based on keywords in the SMS content

### Ongoing Sync
- **Pull to Refresh**: Pull down on the dashboard to sync new SMS messages
- **Automatic Check**: The app checks for new SMS when you open it
- **Incremental Updates**: Only new SMS messages are processed to avoid duplicates
- **Smart Tracking**: Previously processed SMS are tracked to prevent duplicate entries

## Supported Banks

The app currently supports SMS from:
- **State Bank of India (SBI)**
- **HDFC Bank**
- **ICICI Bank**
- **Axis Bank**
- **Kotak Mahindra Bank**

### SMS Format Examples

The app can parse various SMS formats:

```
SBI: Rs.1,500.00 debited from A/c **1234 on 15-Nov-25. 
Info: Payment to AMAZON. Avl Bal: Rs.25,000.00

HDFC Bank: Rs.50,000.00 credited to A/c XX9876 on 14-Nov-25. 
Info: Salary credited. Avl Bal: Rs.75,000.00

ICICI: Your A/c XX5678 debited with Rs.2,500.00 on 17-Nov-25 
at ZOMATO FOOD DELIVERY. Avl Bal: Rs.22,500.00
```

## Features

### ✅ Automatic Detection
- Reads SMS inbox automatically
- Filters banking and transactional SMS
- Extracts transaction details (amount, type, account, bank)
- Auto-categorizes based on merchant/description

### ✅ Smart Categorization
Categories are automatically detected based on keywords:
- **Food & Dining**: Zomato, Swiggy, restaurants, cafes
- **Shopping**: Amazon, Flipkart, Myntra, shopping malls
- **Transportation**: Uber, Ola, metro, petrol, parking
- **Entertainment**: Netflix, movies, gaming
- **Utilities**: Electricity, water, internet, mobile recharge
- **And more...**

### ✅ Duplicate Prevention
- Tracks processed SMS by unique ID
- Skips already imported transactions
- Prevents duplicate entries on resync

### ✅ Manual Override
- All auto-detected transactions can be edited
- Change category, amount, or description
- Delete unwanted transactions
- Add custom transactions manually

## Usage

### First Time Setup

1. **Grant Permission**
   - Open the app after login
   - Tap "Allow" when prompted for SMS permission
   - Initial sync starts automatically

2. **Initial Import**
   - App reads SMS from last 6 months
   - Shows progress indicator
   - Displays count of imported transactions
   - Marks initial sync as complete

### Regular Use

1. **Automatic Sync**
   - Open the app to check for new SMS
   - Pull down on dashboard to manually sync
   - Sync button in Settings

2. **Review Transactions**
   - Go to Transactions tab
   - Review auto-imported entries
   - Edit categories if needed
   - Delete duplicates or errors

3. **Manual Entry**
   - Add cash transactions manually
   - Add transactions from banks not supported
   - Override any auto-detected data

## Settings

### SMS Sync Options

In the Settings screen:

1. **Sync New SMS**
   - Syncs only new SMS received since last sync
   - Quick operation
   - Use for regular updates

2. **Resync All SMS**
   - Re-imports all SMS from last 6 months
   - Warning: May create duplicates
   - Use only if initial sync failed
   - Cleans up and re-processes all banking SMS

3. **SMS Sync Status**
   - Shows if initial sync is complete
   - Displays total transactions

## Permissions

### Required Permissions

The app requires these Android permissions:

- **READ_SMS**: Read SMS inbox messages
- **RECEIVE_SMS**: Detect new incoming SMS (future feature)

### How to Grant

1. **During App Use**
   - App requests permission automatically
   - Tap "Allow" in the permission dialog

2. **In Settings**
   - Go to Android Settings > Apps > Exptra-AI
   - Tap Permissions
   - Enable SMS permission

### Privacy & Security

- ✅ SMS data never leaves your device
- ✅ Only banking SMS are processed
- ✅ Personal messages are ignored
- ✅ All data stored locally in encrypted storage
- ✅ No SMS data sent to any server

## Troubleshooting

### SMS Not Syncing

**Problem**: No transactions after sync

**Solutions**:
1. Check SMS permission is granted
2. Verify you have banking SMS in inbox
3. Check if SMS format matches supported banks
4. Try "Resync All SMS" in Settings
5. Check date range (last 6 months only)

### Duplicate Transactions

**Problem**: Same transaction appears twice

**Solutions**:
1. Delete duplicate manually
2. Check if SMS was from multiple banks
3. Avoid using "Resync All" repeatedly

### Wrong Category

**Problem**: Transaction has incorrect category

**Solutions**:
1. Tap on transaction to edit
2. Select correct category
3. Changes are saved automatically

### Missing Transactions

**Problem**: Some SMS not imported

**Solutions**:
1. Check if bank is supported
2. Verify SMS format matches patterns
3. Check if SMS is older than 6 months
4. Add manually if needed

### Permission Denied

**Problem**: App can't access SMS

**Solutions**:
1. Go to Android Settings > Apps > Exptra-AI
2. Tap Permissions > SMS
3. Select "Allow"
4. Return to app and try sync again

## Development Notes

### For Developers

The SMS reading feature consists of:

1. **Native SMS Reader** (`utils/nativeSMSReader.ts`)
   - Wrapper for reading Android SMS inbox
   - Handles permissions
   - Provides sample data for testing

2. **SMS Service** (`utils/smsService.ts`)
   - Main service for SMS operations
   - Manages sync state
   - Prevents duplicates
   - Coordinates with context

3. **SMS Parser** (`utils/smsParser.ts`)
   - Regex patterns for banks
   - Transaction extraction
   - Category detection
   - Multi-bank support

4. **Transaction Context** (`contexts/TransactionContext.tsx`)
   - Integrated SMS sync
   - Transaction management
   - State updates

### Testing

For testing without real SMS:

```typescript
// Sample SMS data is provided automatically
// in nativeSMSReader.getSampleBankingSMS()
```

### Adding New Banks

To add support for a new bank:

1. Open `utils/smsParser.ts`
2. Add new pattern to `smsPatterns` array:

```typescript
{
  bank: 'NEW_BANK',
  pattern: /NEW_BANK|BankName/i,
  extractData: (msg: string) => {
    // Extract amount, type, account
    return {
      amount: parseFloat(amountMatch[1]),
      type: 'expense',
      account: accountMatch[1],
      description: msg.substring(0, 100),
    };
  },
}
```

### Extending Categories

To add custom categories:

1. Open `constants/categories.ts`
2. Add to `CATEGORIES.EXPENSE` or `CATEGORIES.INCOME`
3. Add emoji icon to `CATEGORY_ICONS`

## Future Enhancements

Planned features:

- [ ] Real-time SMS monitoring (background service)
- [ ] Support for more banks
- [ ] Better duplicate detection
- [ ] Transaction grouping
- [ ] Recurring pattern detection
- [ ] Balance tracking from SMS
- [ ] Multi-SIM support
- [ ] Export SMS transactions
- [ ] Advanced search and filters

## FAQs

**Q: Does the app read all my SMS?**
A: No, only banking and transactional SMS are processed. Personal messages are ignored.

**Q: Is my SMS data safe?**
A: Yes, all SMS data is processed locally on your device. Nothing is sent to any server.

**Q: Can I disable SMS reading?**
A: Yes, revoke SMS permission in Android Settings. You can still add transactions manually.

**Q: What happens to old transactions?**
A: Only SMS from last 6 months are read initially. Older messages are not processed.

**Q: Can I edit auto-detected transactions?**
A: Yes, all transactions can be edited or deleted regardless of how they were created.

**Q: Does it work on iPhone?**
A: No, iOS doesn't allow apps to read SMS due to platform restrictions.

---

**SMS Feature Version**: 1.0.0
**Last Updated**: November 17, 2025
