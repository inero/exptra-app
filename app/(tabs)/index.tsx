import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Card, List, Surface, useTheme } from 'react-native-paper';
import ImprovedSpeedometer from '../../components/ImprovedSpeedometer';
import MonthSelector from '../../components/MonthSelector';
import PieChart from '../../components/PieChart';
import { CATEGORY_ICONS } from '../../constants/categories';
import { colors as themeColors } from '../../constants/theme';
import { useAccounts } from '../../contexts/AccountContext';
import { useApp } from '../../contexts/AppContext';
import { Transaction, useTransactions } from '../../contexts/TransactionContext';

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
  const { getMonthlyTransactions, getTotalExpense, getTotalIncome, getPendingBills, getOverdueBills, getCategoryWiseExpense, getAccountWiseData } = useTransactions();
  const { getTotalBalance } = useAccounts();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAmounts, setShowAmounts] = useState(true);
  const theme = useTheme();

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
    <Animated.ScrollView 
      style={[styles.container, { opacity: fadeAnim }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Surface style={[styles.header, { backgroundColor: themeColors.primary }] }>
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
              ⏰ {getRemainingDaysInMonth()} days remaining this month
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
    paddingTop: 60,
    paddingBottom: 8,
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
});

