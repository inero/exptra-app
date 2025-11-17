import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { parseBankingSMS, detectCategory } from './smsParser';
import { Transaction } from '../contexts/TransactionContext';
import NativeSMSReader, { SMSMessage as NativeSMSMessage } from './nativeSMSReader';

interface SMSMessage {
  id: string;
  address: string;
  body: string;
  date: number;
}

const PROCESSED_SMS_KEY = 'processed_sms_ids';
const LAST_SMS_READ_TIME = 'last_sms_read_time';

export class SMSService {
  private static instance: SMSService;
  
  private constructor() {}
  
  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  async requestSMSPermission(): Promise<boolean> {
    return await NativeSMSReader.requestReadPermission();
  }

  async checkSMSPermission(): Promise<boolean> {
    return await NativeSMSReader.checkReadPermission();
  }

  async getProcessedSMSIds(): Promise<Set<string>> {
    try {
      const processedIds = await AsyncStorage.getItem(PROCESSED_SMS_KEY);
      if (processedIds) {
        return new Set(JSON.parse(processedIds));
      }
      return new Set();
    } catch (error) {
      console.error('Error getting processed SMS IDs:', error);
      return new Set();
    }
  }

  async saveProcessedSMSId(id: string): Promise<void> {
    try {
      const processedIds = await this.getProcessedSMSIds();
      processedIds.add(id);
      await AsyncStorage.setItem(
        PROCESSED_SMS_KEY,
        JSON.stringify(Array.from(processedIds))
      );
    } catch (error) {
      console.error('Error saving processed SMS ID:', error);
    }
  }

  async getLastSMSReadTime(): Promise<number> {
    try {
      const lastTime = await AsyncStorage.getItem(LAST_SMS_READ_TIME);
      return lastTime ? parseInt(lastTime) : 0;
    } catch (error) {
      console.error('Error getting last SMS read time:', error);
      return 0;
    }
  }

  async updateLastSMSReadTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SMS_READ_TIME, Date.now().toString());
    } catch (error) {
      console.error('Error updating last SMS read time:', error);
    }
  }

  async readAllSMS(): Promise<SMSMessage[]> {
    if (Platform.OS !== 'android') {
      console.log('SMS reading is only available on Android');
      return [];
    }

    const hasPermission = await this.checkSMSPermission();
    if (!hasPermission) {
      const granted = await this.requestSMSPermission();
      if (!granted) {
        return [];
      }
    }

    try {
      // Read SMS from last 6 months for initial load
      const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
      
      // Try to read actual SMS, fallback to sample data for testing
      let nativeMessages = await NativeSMSReader.list({}, sixMonthsAgo);
      
      // If no real SMS (development mode), use sample data
      if (nativeMessages.length === 0) {
        console.log('Using sample SMS data for testing');
        nativeMessages = await NativeSMSReader.getSampleBankingSMS();
      }
      
      // Convert to our SMS format
      const messages: SMSMessage[] = nativeMessages.map(msg => ({
        id: msg._id,
        address: msg.address,
        body: msg.body,
        date: msg.date,
      }));
      
      return messages;
    } catch (error) {
      console.error('Error reading SMS:', error);
      return [];
    }
  }

  async readNewSMS(): Promise<SMSMessage[]> {
    const lastReadTime = await this.getLastSMSReadTime();
    const allMessages = await this.readAllSMS();
    
    // Filter messages after last read time
    const newMessages = allMessages.filter(msg => msg.date > lastReadTime);
    
    if (newMessages.length > 0) {
      await this.updateLastSMSReadTime();
    }
    
    return newMessages;
  }

  parseTransactionsFromSMS(messages: SMSMessage[]): Omit<Transaction, 'id'>[] {
    const transactions: Omit<Transaction, 'id'>[] = [];
    
    for (const message of messages) {
      const parsedTransaction = parseBankingSMS(
        message.body,
        new Date(message.date)
      );
      
      if (parsedTransaction) {
        // Auto-detect category
        const category = detectCategory(parsedTransaction.description);
        transactions.push({
          ...parsedTransaction,
          category: category !== 'Uncategorized' ? category : parsedTransaction.category,
          smsId: message.id,
        });
      }
    }
    
    return transactions;
  }

  async processInitialSMS(
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>
  ): Promise<number> {
    try {
      const hasPermission = await this.checkSMSPermission();
      if (!hasPermission) {
        console.log('No SMS permission for initial processing');
        return 0;
      }

      const processedIds = await this.getProcessedSMSIds();
      const allMessages = await this.readAllSMS();
      
      // Filter out already processed messages
      const newMessages = allMessages.filter(msg => !processedIds.has(msg.id));
      
      const transactions = this.parseTransactionsFromSMS(newMessages);
      
      let processedCount = 0;
      for (const transaction of transactions) {
        try {
          await addTransaction(transaction);
          if (transaction.smsId) {
            await this.saveProcessedSMSId(transaction.smsId);
          }
          processedCount++;
        } catch (error) {
          console.error('Error adding transaction:', error);
        }
      }
      
      await this.updateLastSMSReadTime();
      
      return processedCount;
    } catch (error) {
      console.error('Error processing initial SMS:', error);
      return 0;
    }
  }

  async processNewSMS(
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>
  ): Promise<number> {
    try {
      const hasPermission = await this.checkSMSPermission();
      if (!hasPermission) {
        return 0;
      }

      const processedIds = await this.getProcessedSMSIds();
      const newMessages = await this.readNewSMS();
      
      // Filter out already processed messages
      const unprocessedMessages = newMessages.filter(
        msg => !processedIds.has(msg.id)
      );
      
      const transactions = this.parseTransactionsFromSMS(unprocessedMessages);
      
      let processedCount = 0;
      for (const transaction of transactions) {
        try {
          await addTransaction(transaction);
          if (transaction.smsId) {
            await this.saveProcessedSMSId(transaction.smsId);
          }
          processedCount++;
        } catch (error) {
          console.error('Error adding transaction:', error);
        }
      }
      
      return processedCount;
    } catch (error) {
      console.error('Error processing new SMS:', error);
      return 0;
    }
  }

  async clearProcessedSMS(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROCESSED_SMS_KEY);
      await AsyncStorage.removeItem(LAST_SMS_READ_TIME);
      console.log('Cleared processed SMS data');
    } catch (error) {
      console.error('Error clearing processed SMS:', error);
    }
  }
}

export default SMSService.getInstance();
