import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Card, List, Surface, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImprovedSpeedometer from '../../components/ImprovedSpeedometer';
import MonthSelector from '../../components/MonthSelector';
import PieChart from '../../components/PieChart';
import { CATEGORIES, CATEGORY_ICONS } from '../../constants/categories';
import { colors as themeColors } from '../../constants/theme';
import { useAccounts } from '../../contexts/AccountContext';
import { useApp } from '../../contexts/AppContext';
import { Transaction, useTransactions } from '../../contexts/TransactionContext';
import { getAppStartDate, getMonthsWithData } from '../../utils/dateUtils';

const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A3D5A3',
];

const ACCOUNT_CHART_COLORS = [
  '#667EEA', '#764BA2', '#F093FB', '#4158D0', '#FF6B6B',
  '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F',
];

export default function DashboardScreen() {
  const { settings } = useApp();
  const { getMonthlyTransactions, getTotalExpense, getTotalIncome, getPendingBills, getOverdueBills, getCategoryWiseExpense, getAccountWiseData, transactions, bills, addTransaction, updateTransaction } = useTransactions();
  const { accounts, getTotalBalance, updateAccountBalance } = useAccounts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAmounts, setShowAmounts] = useState(true);
  const [appStartDate, setAppStartDate] = useState(new Date());
  const [monthsWithData, setMonthsWithData] = useState<Set<string>>(new Set());
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    accountId: '',
    description: '',
  });
  const theme = useTheme();
  const fabScale = useRef(new Animated.Value(1)).current;

  // Calculate app start date and months with data
  useEffect(() => {
    const startDate = getAppStartDate(transactions, bills);
    setAppStartDate(startDate);
    setMonthsWithData(getMonthsWithData(transactions, bills));
  }, [transactions, bills]);

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      accountId: '',
      description: '',
    });
  };

  const handleQuickAddTransaction = async () => {
    const amount = parseFloat(formData.amount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!formData.accountId) {
      Alert.alert('Error', 'Please select an account');
      return;
    }

    const selectedAccount = accounts.find(a => a.id === formData.accountId);
    if (!selectedAccount) {
      Alert.alert('Error', 'Invalid account selected');
      return;
    }

    const transaction = {
      type: formData.type,
      amount,
      category: formData.category,
      accountId: formData.accountId,
      accountName: selectedAccount.name,
      bankName: selectedAccount.bankName || selectedAccount.name,
      description: formData.description,
      date: new Date(),
      isManual: true,
    };

    try {
      const operation = formData.type === 'income' ? 'add' : 'subtract';
      await updateAccountBalance(formData.accountId, amount, operation);
      await addTransaction(transaction);
      
      // Close silently without popup - dashboard will update automatically
      resetForm();
      setQuickAddModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
      console.error(error);
    }
  };

  const handleFABPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setQuickAddModalVisible(true);
  };

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
  
  // Calculate pending bills for selected month (not just current month)
  const totalPendingAmount = pendingBills.reduce((sum, bill) => {
    const hasPaidThisMonth = bill.payments?.some(p => p.year === selectedYear && p.month === selectedMonth);
    return hasPaidThisMonth ? sum : sum + bill.amount;
  }, 0);
  
  const bankBalance = getTotalBalance();
  
  // Get category-wise and account-wise spending data for charts
  const categoryWiseExpense = getCategoryWiseExpense(selectedYear, selectedMonth);
  const accountWiseData = getAccountWiseData(selectedYear, selectedMonth);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // simple fade-in animation for main content
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const getRemainingDaysInMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const remainingDays = lastDay - today.getDate();
    
    return remainingDays;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <List.Item
      title={item.category}
      description={`${item.accountName || item.bankName} • ${new Date(item.date).toLocaleDateString()}`}
      left={props => 
        (
          <View style={styles.transactionIcon}>
            <Text style={styles.iconText}>{CATEGORY_ICONS[item.category] || '📄'}</Text>
          </View>
        )
      }
      right={() => (
        <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>{item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString()}</Text>
      )}
      style={{backgroundColor: themeColors.surface}}
      titleStyle={{color: themeColors.text, fontWeight: '700'}}
      descriptionStyle={{color: themeColors.onSurfaceVariant}}
    />
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        style={[{ opacity: fadeAnim }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <Surface style={[styles.header, { backgroundColor: themeColors.primary, paddingTop: insets.top + 16 }] }>
        <Text style={[styles.greeting, { color: themeColors.background }]}>Hello, {settings.nickname || 'User'}</Text>
        <Text style={[styles.subtitle, { color: themeColors.background }]}>Here's your expense overview</Text>
      </Surface>

      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={(month, year) => {
          setSelectedMonth(month);
          setSelectedYear(year);
        }}
        allowFutureMonths={false}
        minDate={appStartDate}
        monthsWithData={monthsWithData}
      />

      <Animated.View style={[styles.speedometerContainer, { transform: [{ scale: fadeAnim.interpolate({ inputRange: [0,1], outputRange: [0.98,1] }) }] }] }>
        <Card style={{ backgroundColor: themeColors.surface, width: '100%', elevation: 4, borderRadius: 18, overflow: 'hidden' }}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: 0, paddingHorizontal: 0 }}>
            <ImprovedSpeedometer 
              value={totalExpense} 
              maxValue={settings.monthlyBudget || 1}
              title="Budget Status"
              size={300}
              showAnimation={true}
              onStatusChange={(status) => {
                // Optional: Handle status changes
                console.log('Budget status:', status);
              }}
            />
            <Text style={[styles.remainingText, { color: themeColors.onSurfaceVariant, paddingBottom: 16, paddingHorizontal: 20 }]}>
              {getRemainingDaysInMonth()} days remaining this month
            </Text>
          </Card.Content>
        </Card>
      </Animated.View>

      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { backgroundColor: themeColors.surface }]} onPress={() => router.push('/accounts' as any)}>
          <Card.Content>
            <Text style={[styles.statLabel, { color: themeColors.onSurfaceVariant }]}>Bank Balance</Text>
            <TouchableOpacity onPress={() => setShowAmounts(!showAmounts)}>
              {showAmounts ? <Text style={[styles.statValue, { color: themeColors.text }]}>₹ *** ***</Text> : <Text style={[styles.statValue, { color: themeColors.text }]}>₹ {bankBalance.toLocaleString()}</Text>}
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: themeColors.surface }]} onPress={() => router.push('/bills' as any)}>
          <Card.Content>
            <Text style={[styles.statLabel, { color: themeColors.onSurfaceVariant }]}>Pending Bills</Text>
            <Text style={[styles.statValue, { color: themeColors.text }]}>₹{totalPendingAmount.toLocaleString()}</Text>
            {overdueBills.length > 0 && (
              <Text style={styles.overdueHint}>{overdueBills.length} overdue</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: themeColors.surface }]}>
          <Card.Content>
            <Text style={[styles.statLabel, { color: themeColors.onSurfaceVariant }]}>Total Spent</Text>
            <Text style={[styles.statValue, { color: themeColors.text }]}>₹{totalExpense.toLocaleString()}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Transactions */}
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
            data={filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Category-wise Spending Chart */}
      {Object.keys(categoryWiseExpense).length > 0 && (
        <View style={styles.chartsContainer}>
          <PieChart
            title="Spending by Category"
            data={Object.entries(categoryWiseExpense).map(([category, amount], index) => ({
              label: category,
              value: amount,
              color: CHART_COLORS[index % CHART_COLORS.length],
            }))}
            size={240}
            strokeWidth={18}
          />
        </View>
      )}

      {/* Account-wise Spending Chart */}
      {Object.keys(accountWiseData).length > 0 && (
        <View style={styles.chartsContainer}>
          <PieChart
            title="Spending by Account"
            data={Object.entries(accountWiseData).map(([account, data], index) => ({
              label: account,
              value: data.expense,
              color: ACCOUNT_CHART_COLORS[index % ACCOUNT_CHART_COLORS.length],
            }))}
            size={240}
            strokeWidth={18}
          />
        </View>
      )}
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          { transform: [{ scale: fabScale }] },
          { bottom: insets.bottom + 20 },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleFABPress}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Add Modal - Compact */}
      <Modal
        visible={quickAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setQuickAddModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.compactModalOverlay}
        >
          <View style={styles.compactModalContent}>
            {/* Header */}
            <View style={styles.compactModalHeader}>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setQuickAddModalVisible(false);
                }}
              >
                <Text style={styles.compactCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Type Selector */}
            <View style={styles.compactTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.compactTypeButton,
                  formData.type === 'expense' && styles.compactTypeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, type: 'expense' })}
              >
                <Text style={styles.compactTypeButtonIcon}>💰</Text>
                <Text style={styles.compactTypeButtonText}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.compactTypeButton,
                  formData.type === 'income' && styles.compactTypeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, type: 'income' })}
              >
                <Text style={styles.compactTypeButtonIcon}>📈</Text>
                <Text style={styles.compactTypeButtonText}>Income</Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.compactAmountInput}>
              <Text style={styles.compactCurrencySymbol}>₹</Text>
              <TextInput
                style={styles.compactAmountField}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="Amount"
                keyboardType="decimal-pad"
                placeholderTextColor={themeColors.muted}
              />
            </View>

            {/* Category - Horizontal Scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.compactCategoryScroll}
              contentContainerStyle={styles.compactCategoryContent}
            >
              {Array.from(new Set([...CATEGORIES.EXPENSE, ...CATEGORIES.INCOME])).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.compactCategoryButton,
                    formData.category === cat && styles.compactCategoryButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text style={styles.compactCategoryIcon}>{CATEGORY_ICONS[cat] || '📄'}</Text>
                  <Text style={styles.compactCategoryLabel}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Account - Horizontal Scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.compactAccountScroll}
              contentContainerStyle={styles.compactAccountContent}
            >
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.compactAccountButton,
                    formData.accountId === acc.id && styles.compactAccountButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, accountId: acc.id })}
                >
                  <Text style={styles.compactAccountName}>{acc.name}</Text>
                  <Text style={styles.compactAccountBalance}>₹{(acc.balance / 1000).toFixed(0)}K</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.compactModalButtons}>
              <TouchableOpacity
                style={styles.compactAddButton}
                onPress={handleQuickAddTransaction}
              >
                <Text style={styles.compactAddButtonText}>Add Transaction</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => {
                  resetForm();
                  setQuickAddModalVisible(false);
                }}
              >
                <Text style={styles.compactCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    padding: 20,
    backgroundColor: themeColors.primary,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.background,
  },
  subtitle: {
    fontSize: 16,
    color: themeColors.background,
  },
  speedometerContainer: {
    backgroundColor: themeColors.surface,
    margin: 15,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  remainingText: {
    fontSize: 16,
    color: themeColors.muted,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 8,
    marginBottom: 5,
  },
  statCard: {
    flex: 1,
    backgroundColor: themeColors.surface,
    padding: 3,
    borderRadius: 10,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: themeColors.muted,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  chartsContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  statHint: {
    fontSize: 10,
    color: themeColors.muted,
    marginTop: 3,
  },
  overdueHint: {
    fontSize: 10,
    color: themeColors.danger,
    marginTop: 3,
    fontWeight: '600',
  },
  transactionsSection: {
    backgroundColor: themeColors.surface,
    margin: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAll: {
    color: themeColors.primary,
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
    backgroundColor: themeColors.surface,
  },
  activeTab: {
    backgroundColor: themeColors.primary,
  },
  tabText: {
    fontSize: 14,
    color: themeColors.muted,
    fontWeight: '500',
  },
  activeTabText: {
    color: themeColors.background,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  // transactionIcon: {
  //   width: 50,
  //   height: 50,
  //   borderRadius: 12,
  //   backgroundColor: 'rgba(255,255,255,0.03)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   marginRight: 12,
  //   shadowColor: '#000',
  //   elevation: 2,
  // },
  // iconText: {
  //   fontSize: 20,
  // },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.card,
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
    fontWeight: '700',
    color: themeColors.text,
  },
  transactionAccount: {
    fontSize: 12,
    color: themeColors.muted,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: themeColors.muted,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  incomeAmount: {
    color: '#34D399',
  },
  expenseAmount: {
    color: '#FB7185',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: themeColors.muted,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: themeColors.muted,
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: themeColors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: themeColors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  closeButton: {
    fontSize: 24,
    color: themeColors.muted,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: themeColors.card,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  typeButtonIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: themeColors.primary,
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: themeColors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryButtonActive: {
    borderColor: themeColors.primary,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  categoryButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryButtonLabel: {
    fontSize: 10,
    color: themeColors.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
  accountSelector: {
    gap: 10,
  },
  accountButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: themeColors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  accountButtonActive: {
    borderColor: themeColors.primary,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
  },
  accountType: {
    fontSize: 12,
    color: themeColors.muted,
    marginTop: 4,
  },
  input: {
    backgroundColor: themeColors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: themeColors.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: themeColors.card,
  },
  cancelButtonText: {
    color: themeColors.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: themeColors.primary,
  },
  addButtonText: {
    color: themeColors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  // Compact Modal Styles
  compactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  compactModalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    maxHeight: '50%',
  },
  compactModalHeader: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  compactCloseButton: {
    fontSize: 28,
    color: themeColors.muted,
    fontWeight: '600',
  },
  compactTypeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  compactTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: themeColors.card,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  compactTypeButtonActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  compactTypeButtonIcon: {
    fontSize: 24,
  },
  compactTypeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: themeColors.text,
  },
  compactAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  compactCurrencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.primary,
    marginRight: 8,
  },
  compactAmountField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    color: themeColors.text,
  },
  compactCategoryScroll: {
    marginBottom: 10,
  },
  compactCategoryContent: {
    gap: 8,
    paddingHorizontal: 0,
  },
  compactCategoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: themeColors.card,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 70,
  },
  compactCategoryButtonActive: {
    borderColor: themeColors.primary,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  compactCategoryIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  compactCategoryLabel: {
    fontSize: 9,
    color: themeColors.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
  compactAccountScroll: {
    marginBottom: 12,
  },
  compactAccountContent: {
    gap: 8,
    paddingHorizontal: 0,
  },
  compactAccountButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: themeColors.card,
    borderRadius: 8,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 90,
  },
  compactAccountButtonActive: {
    borderColor: themeColors.primary,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  compactAccountName: {
    fontSize: 11,
    fontWeight: '600',
    color: themeColors.text,
    textAlign: 'center',
  },
  compactAccountBalance: {
    fontSize: 9,
    color: themeColors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  compactModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  compactAddButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: themeColors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  compactAddButtonText: {
    color: themeColors.background,
    fontWeight: '700',
    fontSize: 13,
  },
  compactCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: themeColors.card,
    borderRadius: 10,
  },
  compactCancelButtonText: {
    color: themeColors.muted,
    fontWeight: '600',
    fontSize: 13,
  },
});

