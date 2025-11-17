import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  account: string;
  bankName: string;
  description: string;
  date: Date;
  isManual: boolean;
  smsId?: string;
}

export interface Bill {
  id: string;
  accountNumber: string;
  category: string;
  amount: number;
  billDate: number;
  reminderDate: number;
  name: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  bills: Bill[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBill: (bill: Omit<Bill, 'id'>) => Promise<void>;
  updateBill: (id: string, bill: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const loadTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setBills([]);
      return;
    }

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
        setBills(JSON.parse(storedBills));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const saveTransactions = async (newTransactions: Transaction[]) => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(
        `transactions_${user.uid}`,
        JSON.stringify(newTransactions)
      );
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  const saveBills = async (newBills: Bill[]) => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(
        `bills_${user.uid}`,
        JSON.stringify(newBills)
      );
    } catch (error) {
      console.error('Error saving bills:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    const newTransactions = [...transactions, newTransaction];
    setTransactions(newTransactions);
    await saveTransactions(newTransactions);
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

  const addBill = async (bill: Omit<Bill, 'id'>) => {
    const newBill: Bill = {
      ...bill,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
      if (!acc[t.account]) {
        acc[t.account] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        acc[t.account].income += t.amount;
      } else {
        acc[t.account].expense += t.amount;
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
