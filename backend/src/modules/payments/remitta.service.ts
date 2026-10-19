import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface RemittaCredentials {
  // Connect Gateway secretKey. For a school with its own gateway account,
  // store it in the business account's remitta_api_key column.
  secretKey?: string;
}

@Injectable()
export class RemittaService {
  private readonly gatewayBaseUrl: string;
  private readonly defaultSecretKey: string;

  constructor(private configService: ConfigService) {
    const isLive = this.configService.get('REMITTA_ENV') === 'live';

    this.gatewayBaseUrl =
      this.configService.get('REMITTA_GATEWAY_URL') ||
      (isLive
        ? 'https://api.systemspecsng.com/services/connect-gateway'
        : 'https://api-demo.systemspecsng.com/services/connect-gateway');

    this.defaultSecretKey = this.configService.get('REMITTA_SECRET_KEY');
  }

  private getSecretKey(override?: RemittaCredentials): string {
    const secretKey = override?.secretKey || this.defaultSecretKey;

    if (!secretKey) {
      throw new BadRequestException(
        'Remitta is not configured. Set REMITTA_SECRET_KEY or store the school\'s Connect Gateway key on its business account.',
      );
    }

    return secretKey;
  }

  /**
   * Remita Connect Gateway charge.
   * POST {gateway}/api/v1/payment-engine/payment/charge
   * Returns the hosted paymentLink the payer is redirected to.
   */
  async charge(data: {
    orderId: string;
    amount: number;
    payerName: string;
    payerEmail: string;
    payerPhone?: string;
    description?: string;
    returnUrl: string;
    credentials?: RemittaCredentials;
  }) {
    const secretKey = this.getSecretKey(data.credentials);

    const [firstName, ...rest] = (data.payerName || '').trim().split(/\s+/);
    const lastName = rest.join(' ') || firstName;

    try {
      const response = await axios.post(
        `${this.gatewayBaseUrl}/api/v1/payment-engine/payment/charge`,
        {
          firstName,
          lastName,
          email: data.payerEmail,
          phoneNumber: data.payerPhone,
          paymentIdentifier: data.orderId,
          currency: 'NGN',
          narration: data.description || 'School fees payment',
          returnUrl: data.returnUrl,
          amount: Math.round(data.amount),
        },
        {
          headers: {
            secretKey,
            'Content-Type': 'application/json',
          },
        },
      );

      const body = response.data;
      const paymentLink = body?.data?.paymentLink;

      if (!paymentLink) {
        throw new BadRequestException(
          `Remitta charge failed: ${body?.message || 'no payment link returned'}`,
        );
      }

      return { paymentLink, raw: body };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message =
        error?.response?.data?.message || error?.message || 'payment charge failed';
      throw new BadRequestException(`Remitta initialization failed: ${message}`);
    }
  }

  /**
   * Check payment status by paymentIdentifier.
   * GET {gateway}/api/v1/payment-engine/payment/merchant/verify/{ref}
   * Normalizes the response to {status, message} using legacy codes so the
   * caller's '00'/'01' success and '021' pending checks keep working.
   */
  async checkStatus(reference: string, credentials?: RemittaCredentials) {
    const secretKey = this.getSecretKey(credentials);

    try {
      const response = await axios.get(
        `${this.gatewayBaseUrl}/api/v1/payment-engine/payment/merchant/verify/${reference}`,
        {
          headers: {
            secretKey,
            'Content-Type': 'application/json',
          },
        },
      );

      const body = response.data;
      const data = body?.data ?? {};
      const rawStatus = String(
        data.statuscode ?? data.status ?? body?.status ?? '',
      );
      const norm = rawStatus.toLowerCase();

      let status = rawStatus;
      if (['00', '01', 'success', 'successful', 'completed'].includes(norm)) {
        status = '00';
      } else if (
        ['020', '021', '022', '069', '070', '071', '072', 'pending', 'processing', 'in_progress'].includes(norm)
      ) {
        status = '021';
      }

      return {
        status,
        message: data.responseMessage || data.message || body?.message,
        raw: body,
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Status check failed';
      throw new BadRequestException(`Remitta status check failed: ${message}`);
    }
  }
}
