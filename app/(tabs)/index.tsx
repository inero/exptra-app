import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Speedometer from '../../components/Speedometer';
import { CATEGORY_ICONS } from '../../constants/categories';
import { useAccounts } from '../../contexts/AccountContext';
import { useApp } from '../../contexts/AppContext';
import { Transaction, useTransactions } from '../../contexts/TransactionContext';

export default function DashboardScreen() {
  const { settings } = useApp();
  const { getMonthlyTransactions, getTotalExpense, getTotalIncome, getPendingBills, getOverdueBills } = useTransactions();
  const { getTotalBalance } = useAccounts();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAmounts, setShowAmounts] = useState(true);

  const monthlyTransactions = getMonthlyTransactions(selectedYear, selectedMonth);
  const filteredTransactions = monthlyTransactions.filter(t => {
    if (transactionFilter === 'all') return true;
    return t.type === transactionFilter;
  });
  const totalExpense = getTotalExpense(selectedYear, selectedMonth);
  const totalIncome = getTotalIncome(selectedYear, selectedMonth);
  const remainingBudget = Math.max(settings.monthlyBudget - totalExpense, 0);
  
  const pendingBills = getPendingBills(selectedYear, selectedMonth);
  const overdueBills = getOverdueBills();
  // Calculate total only for unpaid overdue bills and unpaid EMIs, avoiding double-counting
  const totalPendingAmount = (() => {
    const unique = new Map<any, any>();

    const isPaid = (bill: any) => {
      if (!bill) return false;
      if (typeof bill.paid === 'boolean') return bill.paid === true;
      if (typeof bill.status === 'string') return bill.status.toLowerCase() === 'paid';
      return false;
    };

    // Add unpaid overdue bills
    (overdueBills || []).forEach((bill: any) => {
      if (bill && !isPaid(bill)) {
        const key = bill && 'id' in bill && bill.id != null ? bill.id : JSON.stringify(bill);
        if (!unique.has(key)) unique.set(key, bill);
      }
    });

    // Add unpaid EMIs from pending bills
    (pendingBills || []).forEach((bill: any) => {
      const isEmi = bill && (bill.type === 'emi' || bill.isEmi === true || (typeof bill.category === 'string' && bill.category.toLowerCase() === 'emi'));
      if (isEmi && !isPaid(bill)) {
        const key = bill && 'id' in bill && bill.id != null ? bill.id : JSON.stringify(bill);
        if (!unique.has(key)) unique.set(key, bill);
      }
    });

    return Array.from(unique.values()).reduce((sum: number, bill: any) => sum + (bill.amount ?? 0), 0);
  })();
  const bankBalance = getTotalBalance();

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getRemainingDaysInMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const remainingDays = lastDay - today.getDate();
    
    return remainingDays;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.iconText}>{CATEGORY_ICONS[item.category] || '💰'}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionAccount}>
          {item.accountName || item.bankName}
        </Text>
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
        <Text style={styles.greeting}>Hello, {settings.nickname || 'User'}</Text>
        <Text style={styles.subtitle}>Here's your expense overview</Text>
      </View>

      <View style={styles.speedometerContainer}>
        <Text style={styles.sectionTitle}>
          {new Date(selectedYear, selectedMonth).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Speedometer value={totalExpense} maxValue={settings.monthlyBudget || 1} />
        <Text style={styles.remainingText}>
          {remainingBudget <= 0 ? 'Budget exceeded' : `Safe to spend ₹${remainingBudget.toLocaleString()}`} | {getRemainingDaysInMonth()} days left
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/accounts' as any)}
        >
          <Text style={styles.statLabel}>Bank Balance</Text>
          <TouchableOpacity onPress={() => setShowAmounts(!showAmounts)} >
              {showAmounts ? <Text style={styles.statValue}>₹ *** ***</Text> : <Text style={styles.statValue}>₹ {bankBalance.toLocaleString()}</Text>}
          </TouchableOpacity>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/bills' as any)}
        >
          <Text style={styles.statLabel}>Pending Bills</Text>
          <Text style={styles.statValue}>₹{totalPendingAmount.toLocaleString()}</Text>
          {overdueBills.length > 0 && (
            <Text style={styles.overdueHint}>{overdueBills.length} overdue</Text>
          )}
        </TouchableOpacity>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={styles.statValue}>₹{totalExpense.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/explore' as any)}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionTabs}>
          <TouchableOpacity 
            style={[styles.tab, transactionFilter === 'all' && styles.activeTab]}
            onPress={() => setTransactionFilter('all')}
          >
            <Text style={[styles.tabText, transactionFilter === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, transactionFilter === 'income' && styles.activeTab]}
            onPress={() => setTransactionFilter('income')}
          >
            <Text style={[styles.tabText, transactionFilter === 'income' && styles.activeTabText]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, transactionFilter === 'expense' && styles.activeTab]}
            onPress={() => setTransactionFilter('expense')}
          >
            <Text style={[styles.tabText, transactionFilter === 'expense' && styles.activeTabText]}>Expense</Text>
          </TouchableOpacity>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Transactions will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions.slice(0, 10)}
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
  speedometerContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
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
  },
  remainingText: {
    fontSize: 16,
    color: '#666',
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
  overdueHint: {
    fontSize: 10,
    color: '#F44336',
    marginTop: 3,
    fontWeight: '600',
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
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
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

