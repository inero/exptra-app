import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MonthSelector from '../../components/MonthSelector';
import { CATEGORIES, CATEGORY_ICONS } from '../../constants/categories';
import { colors as themeColors } from '../../constants/theme';
import { useAccounts } from '../../contexts/AccountContext';
import { useApp } from '../../contexts/AppContext';
import { Transaction, useTransactions } from '../../contexts/TransactionContext';
import { getAppStartDate, getMonthsWithData } from '../../utils/dateUtils';

export default function TransactionsScreen() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, getMonthlyTransactions, bills } = useTransactions();
  const { accounts, updateAccountBalance } = useAccounts();
  const { settings } = useApp();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [appStartDate, setAppStartDate] = useState(new Date());
  const [monthsWithData, setMonthsWithData] = useState<Set<string>>(new Set());
  
  // Calculate app start date and months with data
  useEffect(() => {
    const startDate = getAppStartDate(transactions, bills);
    setAppStartDate(startDate);
    setMonthsWithData(getMonthsWithData(transactions, bills));
  }, [transactions, bills]);
  
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    accountId: '',
    description: '',
  });

  const monthlyTransactions = getMonthlyTransactions(selectedYear, selectedMonth);

  const handleAddTransaction = async () => {
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

    if (editingTransaction) {
      // Update account balances
      const oldAccount = accounts.find(a => a.id === editingTransaction.accountId);
      if (oldAccount && oldAccount.id === formData.accountId) {
        // Same account, adjust the difference
        const diff = amount - editingTransaction.amount;
        const operation = formData.type === 'income' ? 'add' : 'subtract';
        await updateAccountBalance(formData.accountId, Math.abs(diff), operation);
      } else {
        // Different account, reverse old and apply new
        if (oldAccount) {
          const reverseOp = editingTransaction.type === 'income' ? 'subtract' : 'add';
          await updateAccountBalance(oldAccount.id, editingTransaction.amount, reverseOp);
        }
        const operation = formData.type === 'income' ? 'add' : 'subtract';
        await updateAccountBalance(formData.accountId, amount, operation);
      }
      await updateTransaction(editingTransaction.id, transaction);
    } else {
      // Update account balance
      const operation = formData.type === 'income' ? 'add' : 'subtract';
      await updateAccountBalance(formData.accountId, amount, operation);
      await addTransaction(transaction);
    }
    
    resetForm();
    setModalVisible(false);
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      accountId: '',
      description: '',
    });
    setEditingTransaction(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      accountId: transaction.accountId,
      description: transaction.description,
    });
    setModalVisible(true);
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onLongPress={() => handleDeleteTransaction(item.id)}
      onPress={() => handleEditTransaction(item)}
    >
      <View style={styles.transactionIcon}>
        <Text style={styles.iconText}>{CATEGORY_ICONS[item.category] || '📄'}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionAccount}>{item.bankName} • {item.accountName}</Text>
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
    </TouchableOpacity>
  );

  const categories = formData.type === 'expense' ? CATEGORIES.EXPENSE : CATEGORIES.INCOME;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

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

      <FlatList
        data={monthlyTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions in this month</Text>
            <Text style={styles.emptySubtext}>Tap + Add to create one</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonActive]}
                onPress={() => setFormData({ ...formData, type: 'expense', category: '' })}
              >
                <Text style={[styles.typeButtonText, formData.type === 'expense' && styles.typeButtonTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'income' && styles.typeButtonActive]}
                onPress={() => setFormData({ ...formData, type: 'income', category: '' })}
              >
                <Text style={[styles.typeButtonText, formData.type === 'income' && styles.typeButtonTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    formData.category === cat && styles.categoryChipActive
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</Text>
                  <Text style={styles.categoryText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Account *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountChip,
                    formData.accountId === account.id && styles.accountChipActive
                  ]}
                  onPress={() => setFormData({ ...formData, accountId: account.id })}
                >
                  <Text style={styles.accountChipText}>
                    {account.type === 'bank' ? '🏦' : account.type === 'cash' ? '💵' : account.type === 'credit_card' ? '💳' : '👛'} {account.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Description (Optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddTransaction}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: themeColors.primary,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.background,
  },
  addButton: {
    backgroundColor: themeColors.background,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: themeColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    padding: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
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
    fontWeight: '600',
    color: themeColors.text,
  },
  transactionAccount: {
    fontSize: 12,
    color: themeColors.muted,
    marginTop: 2,
  },
  transactionDescription: {
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: themeColors.muted,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: themeColors.muted,
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: themeColors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    color: themeColors.muted,
  },
  typeButtonTextActive: {
    color: themeColors.background,
    fontWeight: '600',
  },
  input: {
    backgroundColor: themeColors.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: themeColors.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: themeColors.text,
  },
  categoryScroll: {
    marginBottom: 15,
  },
  categoryChip: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: themeColors.card,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  categoryChipActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    color: themeColors.muted,
  },
  accountScroll: {
    marginBottom: 15,
  },
  accountChip: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: themeColors.card,
    marginRight: 10,
    minWidth: 100,
    borderWidth: 2,
    borderColor: themeColors.card,
  },
  accountChipActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  accountChipText: {
    fontSize: 13,
    color: themeColors.muted,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: themeColors.card,
  },
  cancelButtonText: {
    color: themeColors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: themeColors.primary,
  },
  saveButtonText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

