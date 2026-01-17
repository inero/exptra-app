import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import { useTheme } from 'react-native-paper';
import MonthSelector from '../../components/MonthSelector';
import { colors as themeColors } from '../../constants/theme';
import { useAccounts } from '../../contexts/AccountContext';
import { Bill, useTransactions } from '../../contexts/TransactionContext';

export default function BillsScreen() {
  const { bills, addBill, updateBill, deleteBill, markBillAsPaid, undoBillPayment, getPendingBills, getOverdueBills, getBillAmountForMonth, updateBillAmountForMonth } = useTransactions();
  const { accounts } = useAccounts();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'overdue'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    dueDate: '1',
    reminderDate: '3',
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'one-time',
    isEMI: false,
    emiTenure: '',
  });

  // Account selection modal state for marking bill as paid
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [billToPay, setBillToPay] = useState<Bill | null>(null);
  const [chosenAccountId, setChosenAccountId] = useState<string>('');

  // Undo state for recently marked payments
  const [undoInfo, setUndoInfo] = useState<any>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const undoTimeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current as unknown as number);
        undoTimeoutRef.current = null;
      }
    };
  }, []);

  const theme = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      amount: '',
      dueDate: '1',
      reminderDate: '3',
      frequency: 'monthly',
      isEMI: false,
      emiTenure: '',
    });
    setEditingBill(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    const monthAmount = getBillAmountForMonth(bill, selectedYear, selectedMonth);
    setFormData({
      name: bill.name,
      category: bill.category,
      amount: monthAmount.toString(),
      dueDate: bill.dueDate.toString(),
      reminderDate: bill.reminderDate.toString(),
      frequency: bill.frequency,
      isEMI: bill.isEMI,
      emiTenure: bill.emiTenure?.toString() || '360',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    const dueDate = parseInt(formData.dueDate);
    const reminderDate = parseInt(formData.reminderDate);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (isNaN(dueDate) || dueDate < 1 || dueDate > 31) {
      Alert.alert('Error', 'Please enter a valid due date (1-31)');
      return;
    }

    if (editingBill) {
      const otherFieldsUnchanged = 
        editingBill.name === formData.name &&
        editingBill.category === formData.category &&
        editingBill.dueDate === dueDate &&
        editingBill.reminderDate === reminderDate &&
        editingBill.frequency === formData.frequency &&
        editingBill.isEMI === formData.isEMI;

      // If only amount changed (all other fields unchanged), it's a month-specific edit
      if (otherFieldsUnchanged) {
        // Update only the month-specific amount
        await updateBillAmountForMonth(editingBill.id, selectedYear, selectedMonth, amount);
      } else {
        // Update the entire bill definition
        const billData = {
          name: formData.name,
          category: formData.category || 'Other',
          amount,
          dueDate,
          reminderDate,
          frequency: formData.frequency,
          isEMI: formData.isEMI,
          emiTenure: formData.isEMI ? parseInt(formData.emiTenure) || 1 : undefined,
          emiPaid: formData.isEMI ? (editingBill.emiPaid || 0) : undefined,
          status: 'pending' as const,
        };
        await updateBill(editingBill.id, { ...billData, createdAt: editingBill.createdAt });
      }
    } else {
      const billData = {
        name: formData.name,
        category: formData.category || 'Other',
        amount,
        dueDate,
        reminderDate,
        frequency: formData.frequency,
        isEMI: formData.isEMI,
        emiTenure: formData.isEMI ? parseInt(formData.emiTenure) || 1 : undefined,
        status: 'pending' as const,
      };
      await addBill(billData);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleMarkAsPaid = (bill: Bill) => {
    // Open account chooser modal so user can select source account for payment
    setBillToPay(bill);
    // Prefill chosen account with bill mapping or default account
    const defaultAccountId = bill.accountId || accounts.find(a => a.isDefault)?.id || accounts[0]?.id || '';
    setChosenAccountId(defaultAccountId);
    setAccountModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Bill',
      'Are you sure you want to delete this bill?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteBill(id),
        },
      ]
    );
  };

  const confirmMarkAsPaid = async () => {
    if (!billToPay) return;
    setAccountModalVisible(false);
    try {
      const res = await markBillAsPaid(billToPay.id, chosenAccountId || undefined);
      if (res) {
        // Show undo banner
        setUndoInfo(res);
        setUndoVisible(true);
        // Clear any existing timeout
        if (undoTimeoutRef.current) {
          clearTimeout(undoTimeoutRef.current as unknown as number);
        }
        // Auto-hide after 8 seconds
        undoTimeoutRef.current = setTimeout(() => {
          setUndoVisible(false);
          setUndoInfo(null);
          undoTimeoutRef.current = null;
        }, 8000) as unknown as number;
      }
    } catch (e) {
      console.error('Error marking bill paid:', e);
    } finally {
      setBillToPay(null);
      setChosenAccountId('');
    }
  };

  const getFilteredBills = (): Bill[] => {
    switch (selectedTab) {
      case 'pending':
        return getPendingBills(selectedYear, selectedMonth);
      case 'overdue':
        return getOverdueBills();
      default:
        return bills;
    }
  };

  const getBillIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      Electricity: '⚡',
      Water: '💧',
      Internet: '🌐',
      Phone: '📱',
      Rent: '🏠',
      Insurance: '🛡️',
      EMI: '💳',
      Subscription: '📺',
      Other: '📄',
    };
    return icons[category] || '📄';
  };

  const renderBill = ({ item }: { item: Bill }) => {
    const isOverdue = item.status === 'overdue';
    const hasPaidThisMonth = item.payments?.some(p => p.year === selectedYear && p.month === selectedMonth);
    const isPaid = item.frequency === 'one-time' ? item.status === 'paid' : !!hasPaidThisMonth;
    const monthlyAmount = getBillAmountForMonth(item, selectedYear, selectedMonth);
    
    return (
      <TouchableOpacity
        style={[
          styles.billCard,
          isOverdue && styles.overdueBillCard,
          isPaid && styles.paidBillCard,
        ]}
        onLongPress={() => openEditModal(item)}
      >
        <View style={styles.billHeader}>
          <View style={styles.billIcon}>
            <Text style={styles.billIconText}>{getBillIcon(item.category)}</Text>
          </View>
          <View style={styles.billInfo}>
            <Text style={styles.billName}>{item.name}</Text>
            <Text style={styles.billCategory}>{item.category}</Text>
            {item.isEMI && (
              <Text style={styles.emiInfo}>
                EMI: {item.emiPaid || 0}/{item.emiTenure} paid
              </Text>
            )}
          </View>
          <View style={styles.billAmount}>
            <Text style={styles.billAmountText}>₹{monthlyAmount.toLocaleString()}</Text>
            <Text style={styles.billFrequency}>{item.frequency}</Text>
          </View>
        </View>
        
        <View style={styles.billFooter}>
          <View style={styles.billDates}>
            <Text style={styles.billDate}>Due: {item.dueDate} of month</Text>
            <Text style={styles.billReminder}>
              Reminder: {item.reminderDate} days before
            </Text>
          </View>
          
          {!isPaid && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handleMarkAsPaid(item)}
            >
              <Text style={styles.payButtonText}>Mark Paid</Text>
            </TouchableOpacity>
          )}
          {isPaid && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>✓ Paid</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredBills = getFilteredBills();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }] }>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bills & EMI</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
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
      />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All ({bills.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
            Pending ({getPendingBills(selectedYear, selectedMonth).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overdue' && styles.activeTab]}
          onPress={() => setSelectedTab('overdue')}
        >
          <Text style={[styles.tabText, selectedTab === 'overdue' && styles.activeTabText]}>
            Overdue ({getOverdueBills().length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBills}
        renderItem={renderBill}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No bill(s)</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>Add Your Bill</Text>
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
              {editingBill ? 'Edit Bill' : 'Add Bill'}
            </Text>

            <ScrollView 
              keyboardDismissMode="on-drag"
              scrollEnabled={true}
              nestedScrollEnabled={true}
            >
              <Text style={styles.label}>Bill Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Electricity Bill"
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categorySelector}>
                {['Electricity', 'Water', 'Internet', 'Phone', 'Rent', 'Insurance', 'Subscription', 'Other'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      formData.category === cat && styles.categoryButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text style={styles.categoryButtonText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="Enter amount"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Due Date (Day of Month) *</Text>
              <TextInput
                style={styles.input}
                value={formData.dueDate}
                onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                placeholder="1-31"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Reminder (Days Before)</Text>
              <TextInput
                style={styles.input}
                value={formData.reminderDate}
                onChangeText={(text) => setFormData({ ...formData, reminderDate: text })}
                placeholder="Number of days"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Frequency</Text>
              <View style={styles.frequencySelector}>
                {(['monthly', 'quarterly', 'yearly', 'one-time'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      formData.frequency === freq && styles.frequencyButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, frequency: freq })}
                  >
                    <Text style={styles.frequencyButtonText}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1).replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.emiToggle}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isEMI: !formData.isEMI })}
                >
                  <Text style={styles.checkboxText}>
                    {formData.isEMI ? '☑' : '☐'} This is an EMI
                  </Text>
                </TouchableOpacity>
              </View>

              {formData.isEMI && (
                <>
                  <Text style={styles.label}>EMI Tenure (Months)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.emiTenure}
                    onChangeText={(text) => setFormData({ ...formData, emiTenure: text })}
                    placeholder="Number of months"
                    keyboardType="numeric"
                  />
                </>
              )}
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
                  {editingBill ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Account selector modal for choosing which account to debit */}
      <Modal visible={accountModalVisible} animationType="slide" transparent={true} onRequestClose={() => setAccountModalVisible(false)}>
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.4)'}}>
          <View style={{width:'90%', backgroundColor: themeColors.surface, borderRadius:12, padding:16}}>
            <Text style={{fontSize:18, fontWeight:'600', marginBottom:12, color: themeColors.text}}>Select account to debit</Text>
            <ScrollView style={{maxHeight:240}}>
              {accounts.map(acc => (
                <TouchableOpacity key={acc.id} onPress={() => setChosenAccountId(acc.id)} style={{padding:12, borderRadius:8, backgroundColor: chosenAccountId === acc.id ? themeColors.primary : 'transparent', marginBottom:8}}>
                  <Text style={{fontSize:16, color: chosenAccountId === acc.id ? themeColors.background : themeColors.text}}>{acc.name} ({acc.type}) - ₹{acc.balance.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{flexDirection:'row', justifyContent:'flex-end', marginTop:12}}>
              <TouchableOpacity onPress={() => setAccountModalVisible(false)} style={{padding:10, marginRight:12}}>
                <Text style={{color: themeColors.text}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmMarkAsPaid} style={{padding:10, backgroundColor:themeColors.primary, borderRadius:8}}>
                <Text style={{color:themeColors.background}}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Undo banner */}
      {undoVisible && undoInfo && (
        <View style={{position:'absolute', left:16, right:16, bottom:24, backgroundColor:themeColors.surface, padding:12, borderRadius:8, elevation:4, flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
          <Text style={{color: themeColors.text}}>Marked paid — <Text style={{fontWeight:'600', color: themeColors.text}}>₹{undoInfo.amount.toLocaleString()}</Text> from account</Text>
          <View style={{flexDirection:'row'}}>
            <TouchableOpacity onPress={async () => {
              try {
                setUndoVisible(false);
                await undoBillPayment(undoInfo.transactionId, undoInfo.billId, undoInfo.year, undoInfo.month, undoInfo.accountId, undoInfo.amount);
              } catch (e) {
                console.error('Undo failed', e);
              } finally {
                setUndoInfo(null);
                if (undoTimeoutRef.current) { clearTimeout(undoTimeoutRef.current as unknown as number); undoTimeoutRef.current = null; }
              }
            }} style={{paddingHorizontal:12, paddingVertical:6}}>
              <Text style={{color:themeColors.primary, fontWeight:'600'}}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setUndoVisible(false); setUndoInfo(null); if (undoTimeoutRef.current) { clearTimeout(undoTimeoutRef.current as unknown as number); undoTimeoutRef.current = null; }}} style={{paddingHorizontal:12, paddingVertical:6}}>
              <Text style={{color:themeColors.muted}}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
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
    paddingTop: 60,
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
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: themeColors.surface,
    padding: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: themeColors.card,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: themeColors.primary,
  },
  tabText: {
    fontSize: 14,
    color: themeColors.muted,
    fontWeight: '600',
  },
  activeTabText: {
    color: themeColors.background,
  },
  listContent: {
    padding: 15,
  },
  billCard: {
    backgroundColor: themeColors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)'
  },
  overdueBillCard: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.danger,
  },
  paidBillCard: {
    opacity: 0.7,
    backgroundColor: themeColors.surface
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  billIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billIconText: {
    fontSize: 20,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text,
  },
  billCategory: {
    fontSize: 12,
    color: themeColors.muted,
    marginTop: 2,
  },
  emiInfo: {
    fontSize: 11,
    color: themeColors.primary,
    marginTop: 2,
  },
  billAmount: {
    alignItems: 'flex-end',
  },
  billAmountText: {
    fontSize: 18,
    fontWeight: '800',
    color: themeColors.danger,
  },
  billFrequency: {
    fontSize: 11,
    color: themeColors.muted,
    marginTop: 2,
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: 12,
  },
  billDates: {
    flex: 1,
  },
  billDate: {
    fontSize: 12,
    color: themeColors.muted,
  },
  billReminder: {
    fontSize: 11,
    color: themeColors.muted,
    marginTop: 2,
  },
  payButton: {
    backgroundColor: themeColors.accent,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  payButtonText: {
    color: themeColors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  paidBadge: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paidBadgeText: {
    color: themeColors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: themeColors.muted,
    marginBottom: 20,
    fontWeight: '700',
  },
  emptyButton: {
    backgroundColor: themeColors.accent,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '700',
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
    maxHeight: '85%',
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
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: themeColors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  categoryButtonActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    color: themeColors.muted,
  },
  frequencySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: themeColors.card,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyButtonActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  frequencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.muted,
  },
  emiToggle: {
    marginVertical: 15,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 16,
    color: themeColors.text,
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
