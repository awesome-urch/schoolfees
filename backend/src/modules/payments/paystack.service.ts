import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get('PAYSTACK_SECRET_KEY');
  }

  async initializePayment(data: {
    email: string;
    amount: number;
    reference: string;
    metadata?: any;
    subaccountCode?: string;
  }) {
    try {
      // Calculate Paystack transaction fee (1.5% + ₦100, capped at ₦2,000)
      const percentageFee = data.amount * 0.015; // 1.5%
      const flatFee = 100; // ₦100
      let transactionFee = percentageFee + flatFee;
      
      // Cap at ₦2,000
      if (transactionFee > 2000) {
        transactionFee = 2000;
      }

      // Student pays total = fee amount + transaction fee
      const totalAmount = data.amount + transactionFee;

      const payload: any = {
        email: data.email,
        amount: Math.round(totalAmount * 100), // Convert to kobo
        reference: data.reference,
        metadata: data.metadata,
        callback_url: this.configService.get('FRONTEND_URL') + '/payment/verify',
        bearer: 'account', // School (merchant) doesn't pay extra fees
      };

      // CRITICAL: If subaccount is provided, money goes to school's account
      // Without this, money goes to platform's account!
      if (data.subaccountCode) {
        payload.subaccount = data.subaccountCode;
      }

      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Payment initialization failed');
    }
  }

  async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Payment verification failed');
    }
  }

  async listBanks() {
    try {
      const response = await axios.get(`${this.baseUrl}/bank`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch banks');
    }
  }

  async resolveAccountNumber(accountNumber: string, bankCode: string) {
    try {
      console.log('Resolving account:', { accountNumber, bankCode });
      
      const response = await axios.get(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      console.log('Account resolution response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Account resolution error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resolve account number';
      throw new Error(`Failed to resolve account number: ${errorMessage}`);
    }
  }

  async createTransferRecipient(data: {
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        data,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to create transfer recipient');
    }
  }

  // Create Paystack Subaccount for automatic settlement routing
  async createSubaccount(data: {
    business_name: string;
    settlement_bank: string;
    account_number: string;
    percentage_charge: number;
  }) {
    try {
      console.log('Creating Paystack subaccount:', data);
      
      const response = await axios.post(
        `${this.baseUrl}/subaccount`,
        {
          business_name: data.business_name,
          settlement_bank: data.settlement_bank,
          account_number: data.account_number,
          percentage_charge: data.percentage_charge,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Subaccount creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Subaccount creation error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create subaccount';
      throw new Error(`Failed to create Paystack subaccount: ${errorMessage}`);
    }
  }

  // Update subaccount
  async updateSubaccount(subaccountCode: string, data: any) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/subaccount/${subaccountCode}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to update subaccount');
    }
  }
}
