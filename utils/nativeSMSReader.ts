import { Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';

export interface SMSMessage {
  _id: string;
  thread_id: string;
  address: string;
  person: string | null;
  date: number;
  date_sent: number;
  protocol: number;
  read: number;
  status: number;
  type: number;
  body: string;
  service_center: string | null;
  locked: number;
  error_code: number;
  sub_id: number;
  seen: number;
  deletable: number;
  sim_slot: number;
  hidden: number;
  app_id: number;
  msg_id: number;
  reserved: number;
  pri: number;
  teleservice_id: number;
  svc_cmd: number;
  roam_pending: number;
  spam_report: number;
  secret_mode: number;
  safe_message: number;
  favorite: number;
}

class NativeSMSReader {
  async requestReadPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message: 'Exptra-AI needs access to read SMS messages for automatic transaction tracking.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error requesting SMS permission:', err);
      return false;
    }
  }

  async checkReadPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );
    } catch (err) {
      console.warn('Error checking SMS permission:', err);
      return false;
    }
  }

  /**
   * Read SMS messages from the device inbox
   * @param filter Optional filter to limit results
   * @param minDate Optional minimum date (timestamp) to filter messages
   * @param maxDate Optional maximum date (timestamp) to filter messages
   * @returns Array of SMS messages
   */
  async list(
    filter?: Partial<SMSMessage>,
    minDate?: number,
    maxDate?: number
  ): Promise<SMSMessage[]> {
    if (Platform.OS !== 'android') {
      console.warn('SMS reading is only supported on Android');
      return [];
    }

    const hasPermission = await this.checkReadPermission();
    if (!hasPermission) {
      const granted = await this.requestReadPermission();
      if (!granted) {
        console.warn('SMS permission not granted');
        return [];
      }
    }

    // In a production app, you would use a native module here
    // For development without a native module, this returns sample data
    // You'll need to implement a native Android module or use react-native-get-sms-android
    
    console.log('SMS Reader: Would read SMS with filter:', filter, 'minDate:', minDate, 'maxDate:', maxDate);
    
    // Return empty array for now - will be populated by native module
    return [];
  }

  /**
   * Get sample banking SMS for testing
   * This simulates SMS messages for development/testing purposes
   */
  async getSampleBankingSMS(): Promise<SMSMessage[]> {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

    return [
      {
        _id: 'sample_1',
        thread_id: '1',
        address: 'SBI',
        person: null,
        date: oneDayAgo,
        date_sent: oneDayAgo,
        protocol: 0,
        read: 1,
        status: -1,
        type: 1,
        body: 'SBI: Rs.1,500.00 debited from A/c **1234 on 15-Nov-25. Info: Payment to AMAZON. Avl Bal: Rs.25,000.00',
        service_center: null,
        locked: 0,
        error_code: 0,
        sub_id: -1,
        seen: 1,
        deletable: 0,
        sim_slot: 0,
        hidden: 0,
        app_id: 0,
        msg_id: 0,
        reserved: 0,
        pri: 0,
        teleservice_id: 0,
        svc_cmd: 0,
        roam_pending: 0,
        spam_report: 0,
        secret_mode: 0,
        safe_message: 0,
        favorite: 0,
      },
      {
        _id: 'sample_2',
        thread_id: '2',
        address: 'HDFCBK',
        person: null,
        date: twoDaysAgo,
        date_sent: twoDaysAgo,
        protocol: 0,
        read: 1,
        status: -1,
        type: 1,
        body: 'HDFC Bank: Rs.50,000.00 credited to A/c XX9876 on 14-Nov-25. Info: Salary credited. Avl Bal: Rs.75,000.00',
        service_center: null,
        locked: 0,
        error_code: 0,
        sub_id: -1,
        seen: 1,
        deletable: 0,
        sim_slot: 0,
        hidden: 0,
        app_id: 0,
        msg_id: 0,
        reserved: 0,
        pri: 0,
        teleservice_id: 0,
        svc_cmd: 0,
        roam_pending: 0,
        spam_report: 0,
        secret_mode: 0,
        safe_message: 0,
        favorite: 0,
      },
      {
        _id: 'sample_3',
        thread_id: '3',
        address: 'ICICIBC',
        person: null,
        date: now,
        date_sent: now,
        protocol: 0,
        read: 1,
        status: -1,
        type: 1,
        body: 'ICICI: Your A/c XX5678 debited with Rs.2,500.00 on 17-Nov-25 at ZOMATO FOOD DELIVERY. Avl Bal: Rs.22,500.00',
        service_center: null,
        locked: 0,
        error_code: 0,
        sub_id: -1,
        seen: 1,
        deletable: 0,
        sim_slot: 0,
        hidden: 0,
        app_id: 0,
        msg_id: 0,
        reserved: 0,
        pri: 0,
        teleservice_id: 0,
        svc_cmd: 0,
        roam_pending: 0,
        spam_report: 0,
        secret_mode: 0,
        safe_message: 0,
        favorite: 0,
      },
    ];
  }

  /**
   * Delete an SMS message
   * @param id Message ID to delete
   */
  async delete(id: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    // Requires WRITE_SMS permission and native implementation
    console.warn('Delete SMS not implemented');
    return false;
  }
}

export default new NativeSMSReader();
