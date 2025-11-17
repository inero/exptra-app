import { Transaction } from '../contexts/TransactionContext';

interface SMSPattern {
  bank: string;
  pattern: RegExp;
  extractData: (message: string) => {
    amount: number;
    type: 'income' | 'expense';
    account: string;
    description: string;
  } | null;
}

const smsPatterns: SMSPattern[] = [
  {
    bank: 'SBI',
    pattern: /SBI|State Bank/i,
    extractData: (msg: string) => {
      const debitMatch = msg.match(/(?:debited|withdrawn|spent).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const creditMatch = msg.match(/(?:credited|received|deposited).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const accountMatch = msg.match(/A\/c\s*(?:no\.?)?\s*[xX]*(\d{4})/i);
      
      if (debitMatch) {
        return {
          amount: parseFloat(debitMatch[1].replace(/,/g, '')),
          type: 'expense',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      if (creditMatch) {
        return {
          amount: parseFloat(creditMatch[1].replace(/,/g, '')),
          type: 'income',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      return null;
    },
  },
  {
    bank: 'HDFC',
    pattern: /HDFC/i,
    extractData: (msg: string) => {
      const debitMatch = msg.match(/(?:debited|withdrawn|spent).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const creditMatch = msg.match(/(?:credited|received|deposited).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const accountMatch = msg.match(/(?:card|A\/c).*?[xX]*(\d{4})/i);
      
      if (debitMatch) {
        return {
          amount: parseFloat(debitMatch[1].replace(/,/g, '')),
          type: 'expense',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      if (creditMatch) {
        return {
          amount: parseFloat(creditMatch[1].replace(/,/g, '')),
          type: 'income',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      return null;
    },
  },
  {
    bank: 'ICICI',
    pattern: /ICICI/i,
    extractData: (msg: string) => {
      const debitMatch = msg.match(/(?:debited|withdrawn|spent).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const creditMatch = msg.match(/(?:credited|received|deposited).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const accountMatch = msg.match(/(?:card|A\/c).*?[xX]*(\d{4})/i);
      
      if (debitMatch) {
        return {
          amount: parseFloat(debitMatch[1].replace(/,/g, '')),
          type: 'expense',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      if (creditMatch) {
        return {
          amount: parseFloat(creditMatch[1].replace(/,/g, '')),
          type: 'income',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      return null;
    },
  },
  {
    bank: 'Axis Bank',
    pattern: /Axis|AXIS/i,
    extractData: (msg: string) => {
      const debitMatch = msg.match(/(?:debited|withdrawn|spent).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const creditMatch = msg.match(/(?:credited|received|deposited).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const accountMatch = msg.match(/(?:card|A\/c).*?[xX]*(\d{4})/i);
      
      if (debitMatch) {
        return {
          amount: parseFloat(debitMatch[1].replace(/,/g, '')),
          type: 'expense',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      if (creditMatch) {
        return {
          amount: parseFloat(creditMatch[1].replace(/,/g, '')),
          type: 'income',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      return null;
    },
  },
  {
    bank: 'Kotak',
    pattern: /Kotak|KOTAK/i,
    extractData: (msg: string) => {
      const debitMatch = msg.match(/(?:debited|withdrawn|spent).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const creditMatch = msg.match(/(?:credited|received|deposited).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
      const accountMatch = msg.match(/(?:card|A\/c).*?[xX]*(\d{4})/i);
      
      if (debitMatch) {
        return {
          amount: parseFloat(debitMatch[1].replace(/,/g, '')),
          type: 'expense',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      if (creditMatch) {
        return {
          amount: parseFloat(creditMatch[1].replace(/,/g, '')),
          type: 'income',
          account: accountMatch ? accountMatch[1] : 'Unknown',
          description: msg.substring(0, 100),
        };
      }
      
      return null;
    },
  },
];

export const parseBankingSMS = (message: string, date: Date): Omit<Transaction, 'id'> | null => {
  for (const pattern of smsPatterns) {
    if (pattern.pattern.test(message)) {
      const data = pattern.extractData(message);
      if (data) {
        return {
          ...data,
          bankName: pattern.bank,
          category: 'Uncategorized',
          date,
          isManual: false,
        };
      }
    }
  }
  
  return null;
};

export const detectCategory = (description: string): string => {
  const categoryKeywords: { [key: string]: string[] } = {
    'Food & Dining': ['restaurant', 'cafe', 'zomato', 'swiggy', 'food', 'dining', 'dominos', 'pizza', 'burger'],
    'Shopping': ['amazon', 'flipkart', 'shopping', 'mall', 'store', 'purchase', 'myntra', 'ajio'],
    'Transportation': ['uber', 'ola', 'metro', 'petrol', 'fuel', 'parking', 'toll', 'rapido'],
    'Entertainment': ['movie', 'netflix', 'prime', 'spotify', 'hotstar', 'cinema', 'ticket', 'gaming'],
    'Utilities': ['electricity', 'water', 'gas', 'internet', 'broadband', 'mobile', 'recharge', 'bill'],
    'Healthcare': ['hospital', 'doctor', 'medicine', 'pharmacy', 'clinic', 'medical', 'health'],
    'Education': ['school', 'college', 'course', 'book', 'tuition', 'fee', 'education'],
    'Salary': ['salary', 'wage', 'payroll', 'income', 'credited by employer'],
    'Investment': ['mutual fund', 'stock', 'dividend', 'interest', 'investment', 'returns'],
    'EMI': ['emi', 'loan', 'installment', 'repayment'],
  };

  const lowerDesc = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category;
    }
  }
  
  return 'Uncategorized';
};
