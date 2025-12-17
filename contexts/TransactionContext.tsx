import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { useAccounts } from './AccountContext';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  accountId: string; // Changed from account to accountId
  accountName: string; // For display purposes
  bankName: string;
  description: string;
  date: Date;
  isManual: boolean;
  smsId?: string;
  billId?: string; // Link to bill if this transaction is a bill payment
}

export interface PaymentRecord {
  paidAt: Date;
  amount: number;
  year: number;
  month: number;
  transactionId?: string;
}

export interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: number; // Day of month (1-31)
  reminderDate: number; // Days before due date
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  accountId?: string;
  isEMI: boolean;
  emiTenure?: number; // Total number of installments for EMI
  emiPaid?: number; // Number of installments paid
  status: 'pending' | 'paid' | 'overdue';
  lastPaidDate?: Date;
  payments?: PaymentRecord[];
  createdAt: Date;
}

interface TransactionContextType {
  transactions: Transaction[];
  bills: Bill[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => Promise<void>;
  updateBill: (id: string, bill: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  markBillAsPaid: (id: string, accountId?: string) => Promise<{ transactionId: string; billId: string; year: number; month: number; accountId?: string; amount: number } | null>;
  undoBillPayment: (transactionId: string, billId: string, year: number, month: number, accountId?: string, amount?: number) => Promise<void>;
  getPendingBills: (year: number, month: number) => Bill[];
  getOverdueBills: () => Bill[];
  loadTransactions: () => Promise<void>;
  getMonthlyTransactions: (year: number, month: number) => Transaction[];
  getTotalIncome: (year: number, month: number) => number;
  getTotalExpense: (year: number, month: number) => number;
  getCategoryWiseExpense: (year: number, month: number) => { [category: string]: number };
  getAccountWiseData: (year: number, month: number) => { [account: string]: { income: number; expense: number } };
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { accounts, getAccountById, updateAccountBalance } = useAccounts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const loadTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setBills([]);
      return;
    }

    try {
      // Load from Firestore first
      const transDocRef = doc(db, 'users', user.uid, 'data', 'transactions');
      const billsDocRef = doc(db, 'users', user.uid, 'data', 'bills');
      
      const [transSnap, billsSnap] = await Promise.all([
        getDoc(transDocRef),
        getDoc(billsDocRef)
      ]);

      if (transSnap.exists()) {
        const data = transSnap.data();
        const transactionsWithDates = data.transactions.map((t: any) => ({
          ...t,
          date: t.date?.toDate ? t.date.toDate() : new Date(t.date)
        }));
        setTransactions(transactionsWithDates);
        await AsyncStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactionsWithDates));
      } else {
        // Fallback to AsyncStorage
        const storedTransactions = await AsyncStorage.getItem(`transactions_${user.uid}`);
        if (storedTransactions) {
          const parsed = JSON.parse(storedTransactions);
          const transactionsWithDates = parsed.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          }));
          setTransactions(transactionsWithDates);
        }
      }

      if (billsSnap.exists()) {
        const data = billsSnap.data();
        const billsWithDates = data.bills.map((b: any) => ({
          ...b,
          createdAt: b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt),
          lastPaidDate: b.lastPaidDate?.toDate ? b.lastPaidDate.toDate() : (b.lastPaidDate ? new Date(b.lastPaidDate) : undefined),
          payments: b.payments ? b.payments.map((p: any) => ({
            ...p,
            paidAt: p.paidAt?.toDate ? p.paidAt.toDate() : new Date(p.paidAt)
          })) : undefined,
        }));
        setBills(billsWithDates);
        await AsyncStorage.setItem(`bills_${user.uid}`, JSON.stringify(billsWithDates));
      } else {
        // Fallback to AsyncStorage
        const storedBills = await AsyncStorage.getItem(`bills_${user.uid}`);
        if (storedBills) {
          const parsed = JSON.parse(storedBills);
          const billsWithDates = parsed.map((b: any) => ({
            ...b,
            createdAt: new Date(b.createdAt),
            lastPaidDate: b.lastPaidDate ? new Date(b.lastPaidDate) : undefined
          }));
          setBills(billsWithDates);
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Fallback to AsyncStorage
      try {
        const storedTransactions = await AsyncStorage.getItem(`transactions_${user.uid}`);
        const storedBills = await AsyncStorage.getItem(`bills_${user.uid}`);
        
        if (storedTransactions) {
          const parsed = JSON.parse(storedTransactions);
          const transactionsWithDates = parsed.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          }));
          setTransactions(transactionsWithDates);
        }
        
        if (storedBills) {
          const parsed = JSON.parse(storedBills);
          const billsWithDates = parsed.map((b: any) => ({
            ...b,
            createdAt: new Date(b.createdAt),
            lastPaidDate: b.lastPaidDate ? new Date(b.lastPaidDate) : undefined
          }));
          setBills(billsWithDates);
        }
      } catch (e) {
        console.error('Error loading from AsyncStorage:', e);
      }
    }
  };

  const saveTransactions = async (newTransactions: Transaction[]) => {
    if (!user) return;
    try {
      // Remove undefined fields before saving to Firestore
      const sanitizedTransactions = newTransactions.map(trans => {
        const sanitized: any = {
          id: trans.id,
          type: trans.type,
          amount: trans.amount,
          category: trans.category,
          accountId: trans.accountId,
          accountName: trans.accountName,
          bankName: trans.bankName,
          description: trans.description,
          date: trans.date,
          isManual: trans.isManual,
        };
        
        // Only add optional fields if they have values
        if (trans.smsId) sanitized.smsId = trans.smsId;
        if (trans.billId) sanitized.billId = trans.billId;
        
        return sanitized;
      });
      
      const docRef = doc(db, 'users', user.uid, 'data', 'transactions');
      await setDoc(docRef, { transactions: sanitizedTransactions }, { merge: true });
      
      await AsyncStorage.setItem(
        `transactions_${user.uid}`,
        JSON.stringify(newTransactions)
      );
    } catch (error) {
      console.error('Error saving transactions:', error);
      try {
        await AsyncStorage.setItem(
          `transactions_${user.uid}`,
          JSON.stringify(newTransactions)
        );
      } catch (e) {
        console.error('Error saving to AsyncStorage:', e);
      }
    }
  };

  const saveBills = async (newBills: Bill[]) => {
    if (!user) return;
    try {
      // Remove undefined fields before saving to Firestore
      const sanitizedBills = newBills.map(bill => {
        const sanitized: any = {
          id: bill.id,
          name: bill.name,
          category: bill.category,
          amount: bill.amount,
          dueDate: bill.dueDate,
          reminderDate: bill.reminderDate,
          frequency: bill.frequency,
          isEMI: bill.isEMI,
          status: bill.status,
          createdAt: bill.createdAt,
        };
        
        // Only add optional fields if they have values
        if (bill.accountId) sanitized.accountId = bill.accountId;
        if (bill.emiTenure !== undefined) sanitized.emiTenure = bill.emiTenure;
        if (bill.emiPaid !== undefined) sanitized.emiPaid = bill.emiPaid;
        if (bill.lastPaidDate) sanitized.lastPaidDate = bill.lastPaidDate;
        if (bill.payments) sanitized.payments = bill.payments.map(p => {
          const sp: any = {
            paidAt: p.paidAt,
            amount: p.amount,
            year: p.year,
            month: p.month,
          };
          if (p.transactionId !== undefined) sp.transactionId = p.transactionId;
          return sp;
        });
        
        return sanitized;
      });
      
      const docRef = doc(db, 'users', user.uid, 'data', 'bills');
      await setDoc(docRef, { bills: sanitizedBills }, { merge: true });
      
      await AsyncStorage.setItem(
        `bills_${user.uid}`,
        JSON.stringify(newBills)
      );
    } catch (error) {
      console.error('Error saving bills:', error);
      try {
        await AsyncStorage.setItem(
          `bills_${user.uid}`,
          JSON.stringify(newBills)
        );
      } catch (e) {
        console.error('Error saving to AsyncStorage:', e);
      }
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    const newTransactions = [...transactions, newTransaction];
    setTransactions(newTransactions);
    await saveTransactions(newTransactions);
    return newTransaction;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const newTransactions = transactions.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    setTransactions(newTransactions);
    await saveTransactions(newTransactions);
  };

  const deleteTransaction = async (id: string) => {
    const newTransactions = transactions.filter(t => t.id !== id);
    setTransactions(newTransactions);
    await saveTransactions(newTransactions);
  };

  const addBill = async (bill: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...bill,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    const newBills = [...bills, newBill];
    setBills(newBills);
    await saveBills(newBills);
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    const newBills = bills.map(b => (b.id === id ? { ...b, ...updates } : b));
    setBills(newBills);
    await saveBills(newBills);
  };

  const deleteBill = async (id: string) => {
    const newBills = bills.filter(b => b.id !== id);
    setBills(newBills);
    await saveBills(newBills);
  };

  const markBillAsPaid = async (id: string, accountId?: string): Promise<{ transactionId: string; billId: string; year: number; month: number; accountId?: string; amount: number } | null> => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return null;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Prevent double-payment for the same month
    const hasPaidThisMonth = bill.payments?.some(p => p.year === year && p.month === month);
    if (hasPaidThisMonth) return null;

    // Determine which account to use
    const targetAccountId = accountId || bill.accountId || accounts.find(a => a.isDefault)?.id || accounts[0]?.id || '';
    const account = targetAccountId ? getAccountById(targetAccountId) : undefined;

    try {
      // First create transaction so we can link it to the bill payment
      const newTransPayload: Omit<Transaction, 'id'> = {
        type: 'expense',
        amount: bill.amount,
        category: bill.category,
        accountId: targetAccountId,
        accountName: account?.name || '',
        bankName: account?.bankName || '',
        description: `Bill payment: ${bill.name}`,
        date: now,
        isManual: false,
        billId: bill.id,
      };

      const createdTrans = await addTransaction(newTransPayload);

      if (targetAccountId) {
        await updateAccountBalance(targetAccountId, bill.amount, 'subtract');
      }

      // Now update bill with payment record including transactionId
      const payment: PaymentRecord = {
        paidAt: now,
        amount: bill.amount,
        year,
        month,
        transactionId: createdTrans.id,
      } as PaymentRecord;

      const updates: Partial<Bill> = {
        lastPaidDate: now,
        payments: [...(bill.payments || []), payment],
      };

      if (bill.isEMI) {
        updates.emiPaid = (bill.emiPaid || 0) + 1;
      }

      if (bill.frequency === 'one-time') {
        updates.status = 'paid';
      } else {
        updates.status = 'pending';
      }

      await updateBill(id, updates);

      return { transactionId: createdTrans.id, billId: id, year, month, accountId: targetAccountId || undefined, amount: bill.amount };
    } catch (e) {
      console.error('Error creating transaction for bill payment:', e);
      return null;
    }
  };

  const undoBillPayment = async (transactionId: string, billId: string, year: number, month: number, accountId?: string, amount?: number) => {
    try {
      // Remove the transaction
      await deleteTransaction(transactionId);

      // Restore account balance if applicable
      if (accountId && amount) {
        await updateAccountBalance(accountId, amount, 'add');
      }

      // Remove payment record from the bill
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;
      const newPayments = (bill.payments || []).filter(p => {
        // Prefer matching by transactionId when present, otherwise match by year/month/amount
        if ((p as any).transactionId) return (p as any).transactionId !== transactionId;
        return !(p.year === year && p.month === month && p.amount === amount);
      });

      const updates: Partial<Bill> = {
        payments: newPayments,
        lastPaidDate: newPayments.length ? newPayments[newPayments.length - 1].paidAt : undefined,
      };
      if (bill.isEMI) {
        updates.emiPaid = Math.max(0, (bill.emiPaid || 0) - 1);
      }
      if (bill.frequency === 'one-time') {
        updates.status = 'pending';
      }

      await updateBill(billId, updates);
    } catch (e) {
      console.error('Error undoing bill payment:', e);
    }
  };

  const getPendingBills = (year: number, month: number): Bill[] => {
    const today = new Date();
    const currentDay = today.getDate();
    
    return bills.filter(b => {
      const hasPaidThisMonth = b.payments?.some(p => p.year === year && p.month === month);

      if (b.frequency === 'one-time') {
        return b.status === 'pending' && !hasPaidThisMonth;
      }

      if (hasPaidThisMonth) return false;

      // Check if bill is due this month
      const isDueThisMonth = b.dueDate >= 1 && b.dueDate <= 31;
      
      if (b.frequency === 'monthly') {
        return isDueThisMonth;
      } else if (b.frequency === 'quarterly') {
        return month % 3 === 0 && isDueThisMonth;
      } else if (b.frequency === 'yearly') {
        return month === 0 && isDueThisMonth; // January
      }
      
      return false;
    });
  };

  const getOverdueBills = (): Bill[] => {
    const today = new Date();
    const currentDay = today.getDate();
    const year = today.getFullYear();
    const month = today.getMonth();

    return bills.filter(b => {
      const hasPaidThisMonth = b.payments?.some(p => p.year === year && p.month === month);
      if (hasPaidThisMonth) return false;

      // Only consider recurring or pending one-time bills
      if (b.frequency === 'one-time' && b.status !== 'pending') return false;

      // Check if due date has passed this month
      return b.dueDate < currentDay;
    }).map(b => ({ ...b, status: 'overdue' as const }));
  };

  const getMonthlyTransactions = (year: number, month: number): Transaction[] => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === year && tDate.getMonth() === month;
    });
  };

  const getTotalIncome = (year: number, month: number): number => {
    return getMonthlyTransactions(year, month)
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = (year: number, month: number): number => {
    return getMonthlyTransactions(year, month)
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCategoryWiseExpense = (year: number, month: number): { [category: string]: number } => {
    const expenses = getMonthlyTransactions(year, month).filter(t => t.type === 'expense');
    return expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as { [category: string]: number });
  };

  const getAccountWiseData = (year: number, month: number): { [account: string]: { income: number; expense: number } } => {
    const monthlyTrans = getMonthlyTransactions(year, month);
    return monthlyTrans.reduce((acc, t) => {
      const accountKey = t.accountName || t.accountId;
      if (!acc[accountKey]) {
        acc[accountKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        acc[accountKey].income += t.amount;
      } else {
        acc[accountKey].expense += t.amount;
      }
      return acc;
    }, {} as { [account: string]: { income: number; expense: number } });
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        bills,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBill,
        updateBill,
        deleteBill,
        markBillAsPaid,
        undoBillPayment,
        getPendingBills,
        getOverdueBills,
        loadTransactions,
        getMonthlyTransactions,
        getTotalIncome,
        getTotalExpense,
        getCategoryWiseExpense,
        getAccountWiseData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
