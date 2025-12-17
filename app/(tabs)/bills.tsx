import React, { useState, useEffect } from 'react';
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
import { useAccounts } from '../../contexts/AccountContext';
import { Bill, useTransactions } from '../../contexts/TransactionContext';

export default function BillsScreen() {
  const { bills, addBill, updateBill, deleteBill, markBillAsPaid, undoBillPayment, getPendingBills, getOverdueBills } = useTransactions();
  const { accounts } = useAccounts();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'overdue'>('all');
  
  // Dev-only simulated date for testing month changes
  const [simDate, setSimDate] = useState<Date | null>(null);
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

  const today = new Date();
  const displayDate = simDate || today;
  const currentMonth = displayDate.getMonth();
  const currentYear = displayDate.getFullYear();

  const shiftSimMonth = (offset: number) => {
    setSimDate(prev => {
      const base = prev || new Date();
      return new Date(base.getFullYear(), base.getMonth() + offset, 1);
    });
  };

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
    setFormData({
      name: bill.name,
      category: bill.category,
      amount: bill.amount.toString(),
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

    const billData = {
      name: formData.name,
      category: formData.category || 'Other',
      amount,
      dueDate,
      reminderDate,
      frequency: formData.frequency,
      isEMI: formData.isEMI,
      emiTenure: formData.isEMI ? parseInt(formData.emiTenure) || 1 : undefined,
      emiPaid: formData.isEMI ? (editingBill?.emiPaid || 0) : undefined,
      status: 'pending' as const,
    };

    if (editingBill) {
      await updateBill(editingBill.id, { ...billData, createdAt: editingBill.createdAt });
    } else {
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
        return getPendingBills(currentYear, currentMonth);
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
    const hasPaidThisMonth = item.payments?.some(p => p.year === currentYear && p.month === currentMonth);
    const isPaid = item.frequency === 'one-time' ? item.status === 'paid' : !!hasPaidThisMonth;
    
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
            <Text style={styles.billAmountText}>₹{item.amount.toLocaleString()}</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bills & EMI</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {__DEV__ && (
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8}}>
          <TouchableOpacity onPress={() => shiftSimMonth(-1)} style={{paddingHorizontal:12, paddingVertical:6, backgroundColor:'#eee', borderRadius:8}}>
            <Text>◀ Prev</Text>
          </TouchableOpacity>
          <Text style={{marginHorizontal:12}}>Sim: {currentMonth + 1}/{currentYear}</Text>
          <TouchableOpacity onPress={() => shiftSimMonth(1)} style={{paddingHorizontal:12, paddingVertical:6, backgroundColor:'#eee', borderRadius:8}}>
            <Text>Next ▶</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSimDate(null)} style={{marginLeft:12, paddingHorizontal:8}}>
            <Text>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

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
            Pending ({getPendingBills(currentYear, currentMonth).length})
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBill ? 'Edit Bill' : 'Add Bill'}
            </Text>

            <ScrollView>
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
        </View>
      </Modal>

      {/* Account selector modal for choosing which account to debit */}
      <Modal visible={accountModalVisible} animationType="slide" transparent={true} onRequestClose={() => setAccountModalVisible(false)}>
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.4)'}}>
          <View style={{width:'90%', backgroundColor:'#fff', borderRadius:12, padding:16}}>
            <Text style={{fontSize:18, fontWeight:'600', marginBottom:12}}>Select account to debit</Text>
            <ScrollView style={{maxHeight:240}}>
              {accounts.map(acc => (
                <TouchableOpacity key={acc.id} onPress={() => setChosenAccountId(acc.id)} style={{padding:12, borderRadius:8, backgroundColor: chosenAccountId === acc.id ? '#E3F2FD' : 'transparent', marginBottom:8}}>
                  <Text style={{fontSize:16}}>{acc.name} ({acc.type}) - ₹{acc.balance.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{flexDirection:'row', justifyContent:'flex-end', marginTop:12}}>
              <TouchableOpacity onPress={() => setAccountModalVisible(false)} style={{padding:10, marginRight:12}}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmMarkAsPaid} style={{padding:10, backgroundColor:'#2196F3', borderRadius:8}}>
                <Text style={{color:'#fff'}}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Undo banner */}
      {undoVisible && undoInfo && (
        <View style={{position:'absolute', left:16, right:16, bottom:24, backgroundColor:'#fff', padding:12, borderRadius:8, elevation:4, flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
          <Text>Marked paid — <Text style={{fontWeight:'600'}}>₹{undoInfo.amount.toLocaleString()}</Text> from account</Text>
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
              <Text style={{color:'#2196F3', fontWeight:'600'}}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setUndoVisible(false); setUndoInfo(null); if (undoTimeoutRef.current) { clearTimeout(undoTimeoutRef.current as unknown as number); undoTimeoutRef.current = null; }}} style={{paddingHorizontal:12, paddingVertical:6}}>
              <Text style={{color:'#666'}}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2196F3',
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    padding: 15,
  },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overdueBillCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  paidBillCard: {
    opacity: 0.6,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  billIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billIconText: {
    fontSize: 24,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  billCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emiInfo: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 2,
  },
  billAmount: {
    alignItems: 'flex-end',
  },
  billAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
  },
  billFrequency: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  billDates: {
    flex: 1,
  },
  billDate: {
    fontSize: 12,
    color: '#666',
  },
  billReminder: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  payButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  paidBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  paidBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
  },
  frequencySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  frequencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
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
    color: '#333',
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
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
