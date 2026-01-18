import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BarChart from '../../components/BarChart';
import HamburgerMenu from '../../components/HamburgerMenu';
import MonthSelector from '../../components/MonthSelector';
import PieChart from '../../components/PieChart';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { CATEGORY_ICONS } from '../../constants/categories';
import { colors as themeColors } from '../../constants/theme';
import { Transaction, useTransactions } from '../../contexts/TransactionContext';

const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A3D5A3',
];

export default function ReportsScreen() {
  const { getMonthlyTransactions, getTotalExpense, getTotalIncome, getCategoryWiseExpense, getAccountWiseData } = useTransactions();
  const insets = useSafeAreaInsets();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [menuVisible, setMenuVisible] = useState(false);

  const monthlyTransactions = getMonthlyTransactions(selectedYear, selectedMonth);
  const currentMonthIncome = getTotalIncome(selectedYear, selectedMonth);
  const currentMonthExpense = getTotalExpense(selectedYear, selectedMonth);
  const currentMonthSavings = currentMonthIncome - currentMonthExpense;

  // Get yearly data (all months in selected year)
  const getYearlyData = () => {
    const yearlyIncome: number[] = [];
    const yearlyExpense: number[] = [];
    const monthlyDetails: { month: number; income: number; expense: number; savings: number }[] = [];

    for (let month = 0; month < 12; month++) {
      const income = getTotalIncome(selectedYear, month);
      const expense = getTotalExpense(selectedYear, month);
      yearlyIncome.push(income);
      yearlyExpense.push(expense);
      monthlyDetails.push({ month, income, expense, savings: income - expense });
    }

    return {
      totalIncome: yearlyIncome.reduce((a, b) => a + b, 0),
      totalExpense: yearlyExpense.reduce((a, b) => a + b, 0),
      averageIncome: yearlyIncome.reduce((a, b) => a + b, 0) / 12,
      averageExpense: yearlyExpense.reduce((a, b) => a + b, 0) / 12,
      monthlyDetails,
      barChartData: monthlyDetails.map((detail, idx) => ({
        label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx],
        income: detail.income,
        expense: detail.expense,
      })),
    };
  };

  const yearlyData = getYearlyData();
  const categoryWiseExpense = getCategoryWiseExpense(selectedYear, selectedMonth);
  const accountWiseData = getAccountWiseData(selectedYear, selectedMonth);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const renderMonthlyTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.iconText}>{CATEGORY_ICONS[item.category] || '📄'}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionAccount}>{item.accountName || item.bankName}</Text>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {item.description || 'No description'}
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

  const renderMonthlyStatsCard = () => (
    <Card style={{ backgroundColor: themeColors.surface, marginBottom: 15, elevation: 2, marginHorizontal: 15 }}>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Income</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>₹{currentMonthIncome.toLocaleString()}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Expense</Text>
          <Text style={[styles.statValue, { color: '#F44336' }]}>₹{currentMonthExpense.toLocaleString()}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Net Savings</Text>
          <Text style={[styles.statValue, { color: currentMonthSavings >= 0 ? '#4CAF50' : '#F44336' }]}>
            ₹{currentMonthSavings.toLocaleString()}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderYearlyStatsCard = () => (
    <Card style={{ backgroundColor: themeColors.surface, marginBottom: 15, elevation: 2, marginHorizontal: 15 }}>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Yearly Income</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>₹{yearlyData.totalIncome.toLocaleString()}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Yearly Expense</Text>
          <Text style={[styles.statValue, { color: '#F44336' }]}>₹{yearlyData.totalExpense.toLocaleString()}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Yearly Savings</Text>
          <Text style={[styles.statValue, { color: (yearlyData.totalIncome - yearlyData.totalExpense) >= 0 ? '#4CAF50' : '#F44336' }]}>
            ₹{(yearlyData.totalIncome - yearlyData.totalExpense).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.averageStatsContainer}>
        <View style={styles.averageStatBox}>
          <Text style={styles.averageStatLabel}>Avg Monthly Income</Text>
          <Text style={[styles.averageStatValue, { color: '#4CAF50' }]}>
            ₹{Math.round(yearlyData.averageIncome).toLocaleString()}
          </Text>
        </View>
        <View style={styles.averageStatBox}>
          <Text style={styles.averageStatLabel}>Avg Monthly Expense</Text>
          <Text style={[styles.averageStatValue, { color: '#F44336' }]}>
            ₹{Math.round(yearlyData.averageExpense).toLocaleString()}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderMonthlyDetails = () => (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={(month, year) => {
          setSelectedMonth(month);
          setSelectedYear(year);
        }}
        allowFutureMonths={false}
      />

      {renderMonthlyStatsCard()}

      {/* Category-wise breakdown */}
      {Object.keys(categoryWiseExpense).length > 0 && (
        <PieChart
          title="Expense by Category"
          data={Object.entries(categoryWiseExpense).map(([category, amount], index) => ({
            label: category,
            value: amount,
            color: CHART_COLORS[index % CHART_COLORS.length],
          }))}
          size={240}
          strokeWidth={18}
        />
      )}

      {/* Account-wise breakdown */}
      {Object.keys(accountWiseData).length > 0 && (
        <PieChart
          title="Expense by Account"
          data={Object.entries(accountWiseData).map(([account, data], index) => ({
            label: account,
            value: data.expense,
            color: CHART_COLORS[index % CHART_COLORS.length],
          }))}
          size={240}
          strokeWidth={18}
        />
      )}

      {/* Transactions list */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        {monthlyTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions this month</Text>
          </View>
        ) : (
          <FlatList
            data={monthlyTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            renderItem={renderMonthlyTransactionItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );

  const renderYearlyDetails = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const canNavigateNextYear = selectedYear < currentYear;

    return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Year selector */}
      <View style={styles.yearSelectorContainer}>
        <TouchableOpacity
          onPress={() => setSelectedYear(selectedYear - 1)}
          style={styles.yearButton}
        >
          <Text style={styles.yearButtonText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.yearDisplay}>{selectedYear}</Text>
        <TouchableOpacity
          onPress={() => setSelectedYear(selectedYear + 1)}
          style={[styles.yearButton, !canNavigateNextYear && styles.disabledYearButton]}
          disabled={!canNavigateNextYear}
        >
          <Text style={[styles.yearButtonText, !canNavigateNextYear && styles.disabledYearButtonText]}>▶</Text>
        </TouchableOpacity>
      </View>

      {renderYearlyStatsCard()}

      {/* Monthly breakdown bar chart */}
      <BarChart
        title="Monthly Income vs Expense"
        data={yearlyData.barChartData}
        height={300}
      />

      {/* Monthly details table */}
      <View style={styles.monthlyTableContainer}>
        <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
        
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Month</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Income</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Expense</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Savings</Text>
        </View>

        {yearlyData.monthlyDetails.map((detail, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][detail.month]}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, color: '#4CAF50' }]}>
              ₹{(detail.income / 1000).toFixed(1)}K
            </Text>
            <Text style={[styles.tableCell, { flex: 1, color: '#F44336' }]}>
              ₹{(detail.expense / 1000).toFixed(1)}K
            </Text>
            <Text style={[styles.tableCell, { flex: 1, color: detail.savings >= 0 ? '#4CAF50' : '#F44336' }]}>
              ₹{(detail.savings / 1000).toFixed(1)}K
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
    );
  };

  return (
    <Animated.View style={[{ opacity: fadeAnim }, { flex: 1, backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.hamburgerButton}>
            <IconSymbol name="line.3.horizontal" size={24} color={themeColors.background} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.background }]}>Reports</Text>
        </View>
      </View>

      <HamburgerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        currentRoute="reports"
      />

      <View style={styles.viewModeSelector}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'monthly' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.viewModeButtonText, viewMode === 'monthly' && styles.viewModeButtonTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'yearly' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('yearly')}
        >
          <Text style={[styles.viewModeButtonText, viewMode === 'yearly' && styles.viewModeButtonTextActive]}>
            Yearly
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'monthly' ? renderMonthlyDetails() : renderYearlyDetails()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: 'column',
    padding: 20,
    backgroundColor: themeColors.primary,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  hamburgerButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  viewModeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: themeColors.background,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: themeColors.primary,
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.muted,
  },
  viewModeButtonTextActive: {
    color: themeColors.background,
  },
  yearSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: themeColors.surface,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    gap: 12,
  },
  yearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  yearButtonText: {
    color: themeColors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  disabledYearButton: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.5,
  },
  disabledYearButtonText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 16,
  },
  yearDisplay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: themeColors.muted,
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  averageStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  averageStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  averageStatLabel: {
    fontSize: 11,
    color: themeColors.muted,
    marginBottom: 6,
    fontWeight: '500',
  },
  averageStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionsSection: {
    backgroundColor: themeColors.surface,
    margin: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 3,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
  },
  transactionAccount: {
    fontSize: 11,
    color: themeColors.muted,
    marginTop: 2,
  },
  transactionDescription: {
    fontSize: 11,
    color: themeColors.muted,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 10,
    color: themeColors.muted,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
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
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: themeColors.muted,
  },
  monthlyTableContainer: {
    backgroundColor: themeColors.surface,
    margin: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 3,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: themeColors.primary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tableCell: {
    fontSize: 12,
    fontWeight: '500',
    color: themeColors.text,
    textAlign: 'center',
  },
});
