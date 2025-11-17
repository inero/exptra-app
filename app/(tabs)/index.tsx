import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { useTransactions, Transaction } from '../../contexts/TransactionContext';
import Speedometer from '../../components/Speedometer';
import { CATEGORY_ICONS } from '../../constants/categories';
import SMSService from '../../utils/smsService';

export default function DashboardScreen() {
  const { settings, updateSettings } = useApp();
  const { 
    getMonthlyTransactions, 
    getTotalExpense, 
    getTotalIncome, 
    bills,
    syncSMSTransactions 
  } = useTransactions();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Initial SMS sync on first load
  useEffect(() => {
    const performInitialSync = async () => {
      if (!settings.isInitialSMSSyncComplete) {
        const hasPermission = await SMSService.checkSMSPermission();
        if (!hasPermission) {
          const granted = await SMSService.requestSMSPermission();
          if (granted) {
            await syncSMS(true);
          }
        } else {
          await syncSMS(true);
        }
      }
    };

    performInitialSync();
  }, [settings.isInitialSMSSyncComplete]);

  const syncSMS = async (isInitial: boolean = false) => {
    setSyncing(true);
    try {
      const count = await syncSMSTransactions(isInitial);
      
      if (isInitial && count > 0) {
        await updateSettings({ isInitialSMSSyncComplete: true });
        Alert.alert(
          'SMS Sync Complete',
          `Successfully imported ${count} transactions from your SMS messages.`,
          [{ text: 'OK' }]
        );
      } else if (!isInitial && count > 0) {
        Alert.alert(
          'New Transactions',
          `Found ${count} new transactions from SMS.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error syncing SMS:', error);
      Alert.alert('Sync Error', 'Failed to sync SMS messages. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const monthlyTransactions = getMonthlyTransactions(selectedYear, selectedMonth);
  const totalExpense = getTotalExpense(selectedYear, selectedMonth);
  const totalIncome = getTotalIncome(selectedYear, selectedMonth);
  const remainingBudget = Math.max(settings.monthlyBudget - totalExpense, 0);
  
  const pendingBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const bankBalance = 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await syncSMS(false); // Sync new SMS on refresh
    setRefreshing(false);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.iconText}>{CATEGORY_ICONS[item.category]}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionAccount}>{item.bankName} • {item.account}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        item.type === 'income' ? styles.incomeAmount : styles.expenseAmount
      ]}>
        {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {settings.nickname || 'User'}! 👋</Text>
          <Text style={styles.subtitle}>Here's your expense overview</Text>
        </View>
        {syncing && (
          <View style={styles.syncIndicator}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.syncText}>Syncing...</Text>
          </View>
        )}
      </View>

      <View style={styles.speedometerContainer}>
        <Text style={styles.sectionTitle}>Remaining Budget</Text>
        <Speedometer value={totalExpense} maxValue={settings.monthlyBudget || 1} />
        <Text style={styles.remainingText}>
          ₹{remainingBudget.toLocaleString()} remaining
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Bank Balance</Text>
          <Text style={styles.statValue}>₹****</Text>
          <Text style={styles.statHint}>Tap to reveal</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Bills</Text>
          <Text style={styles.statValue}>₹{pendingBills.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={styles.statValue}>₹{totalExpense.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionTabs}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Expense</Text>
          </TouchableOpacity>
        </View>

        {monthlyTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Transactions will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={monthlyTransactions.slice(0, 10)}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  syncText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
  },
  speedometerContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  remainingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statHint: {
    fontSize: 10,
    color: '#999',
    marginTop: 3,
  },
  transactionsSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAll: {
    color: '#2196F3',
    fontSize: 14,
  },
  transactionTabs: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionAccount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});

