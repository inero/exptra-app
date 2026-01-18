import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HamburgerMenu from '../../components/HamburgerMenu';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { colors as themeColors } from '../../constants/theme';
import { Account, useAccounts } from '../../contexts/AccountContext';
import { useTransactions } from '../../contexts/TransactionContext';

export default function AccountsScreen() {
  const { accounts, addAccount, updateAccount, deleteAccount, getTotalBalance } = useAccounts();
  const { getAccountWiseData } = useTransactions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as 'bank' | 'cash' | 'credit_card' | 'wallet',
    accountNumber: '',
    bankName: '',
    balance: '',
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bank',
      accountNumber: '',
      bankName: '',
      balance: '',
    });
    setEditingAccount(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
      balance: account.balance >= 0 ? account.balance.toString() : "0",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Account name is required');
      return;
    }

    const balance = parseFloat(formData.balance) || 0;

    if (editingAccount) {
      await updateAccount(editingAccount.id, {
        name: formData.name,
        type: formData.type,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        balance,
      });
    } else {
      await addAccount({
        name: formData.name,
        type: formData.type,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        balance,
        isDefault: accounts.length === 0,
      });
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAccount(id),
        },
      ]
    );
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return '🏦';
      case 'cash': return '💵';
      case 'credit_card': return '💳';
      case 'wallet': return '👛';
      default: return '💰';
    }
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const accountData = getAccountWiseData(currentYear, currentMonth);
    const data = accountData[item.name] || { income: 0, expense: 0 };

    return (
      <View style={styles.accountCard}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          onLongPress={() => openEditModal(item)}
        >
          <View style={styles.accountHeader}>
            <View style={styles.accountIcon}>
              <Text style={styles.accountIconText}>{getAccountIcon(item.type)}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{item.name}</Text>
              {item.accountNumber && (
                <Text style={styles.accountNumber}>
                  {item.type === 'bank' ? 'A/C: ' : ''}
                  {item.accountNumber}
                </Text>
              )}
              {item.bankName && (
                <Text style={styles.bankName}>{item.bankName}</Text>
              )}
            </View>
            <Text style={styles.accountBalance}>₹{item.balance >= 0 ? item.balance.toLocaleString() : "0"}</Text>
          </View>
          
          <View style={styles.accountStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, styles.incomeText]}>
                +₹{data.income.toLocaleString()}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Expense</Text>
              <Text style={[styles.statValue, styles.expenseText]}>
                -₹{data.expense.toLocaleString()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.accountActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
          {!item.isDefault && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.hamburgerButton}>
            <IconSymbol name="line.3.horizontal" size={24} color={themeColors.background} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Accounts</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <HamburgerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        currentRoute="accounts"
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalValue}>₹{getTotalBalance().toLocaleString()}</Text>
      </View>

      <FlatList
        data={accounts}
        renderItem={renderAccount}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No account(s)</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>Add Your Account</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingAccount ? 'Edit Account' : 'Add Account'}
            </Text>

            <ScrollView 
              keyboardDismissMode="on-drag"
              scrollEnabled={true}
              nestedScrollEnabled={true}
            >
              <Text style={styles.label}>Account Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., SBI Savings"
              />

              <Text style={styles.label}>Account Type</Text>
              <View style={styles.typeSelector}>
                {(['bank', 'cash', 'credit_card', 'wallet'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      formData.type === type && styles.typeButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, type })}
                  >
                    <Text style={styles.typeButtonText}>
                      {type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {formData.type === 'bank' && (
                <>
                  <Text style={styles.label}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.bankName}
                    onChangeText={(text) => setFormData({ ...formData, bankName: text })}
                    placeholder="e.g., State Bank of India"
                  />

                  <Text style={styles.label}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.accountNumber}
                    onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
                    placeholder="Last 4 digits"
                    keyboardType="numeric"
                  />
                </>
              )}

              <Text style={styles.label}>Current Balance</Text>
              <TextInput
                style={styles.input}
                value={formData.balance}
                onChangeText={(text) => setFormData({ ...formData, balance: text })}
                placeholder="0"
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {editingAccount ? 'Update' : 'Add'}
                </Text>
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
    flexDirection: 'column',
    padding: 20,
    backgroundColor: themeColors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  hamburgerButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.background,
    flex: 1,
  },
  addButton: {
    backgroundColor: themeColors.background,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: themeColors.primary,
    fontWeight: '600',
  },
  totalCard: {
    backgroundColor: themeColors.surface,
    margin: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },
  totalLabel: {
    fontSize: 16,
    color: themeColors.muted,
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: themeColors.primary,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  accountCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  accountIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 24,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text,
  },
  accountNumber: {
    fontSize: 12,
    color: themeColors.muted,
    marginTop: 2,
  },
  bankName: {
    fontSize: 11,
    color: themeColors.muted,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.primary,
  },
  accountStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: 12,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: themeColors.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text,
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: themeColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: themeColors.background,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: themeColors.danger,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: themeColors.background,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: themeColors.muted,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: themeColors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: themeColors.card,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: themeColors.card,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.muted,
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
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: themeColors.primary,
  },
  saveButtonText: {
    color: themeColors.background,
    fontWeight: '600',
  },
});
