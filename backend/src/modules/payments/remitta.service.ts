import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash } from 'crypto';

interface RemittaCredentials {
  // Payment Gateway key pair (pk_.../sk_...). For a school with its own
  // gateway account, store them in the business account's remitta_api_key
  // (secret) and remitta_public_key columns.
  secretKey?: string;
  publicKey?: string;
}

export type RemittaMode = 'connect' | 'inline';

@Injectable()
export class RemittaService {
  /**
   * REMITTA_MODE selects the integration:
   *  - 'connect' (default): RemitaConnect Connect Gateway. Server-side charge
   *    returns a hosted paymentLink; auth is the secretKey header.
   *  - 'inline': classic Remita Payment Gateway inline widget; browser opens
   *    the widget with the public key, server verifies with publicKey+TXN_HASH.
   */
  readonly mode: RemittaMode;
  private readonly gatewayBaseUrl: string;
  private readonly inlineBaseUrl: string;
  private readonly checkoutBaseUrl: string;
  private readonly defaultSecretKey: string;
  private readonly defaultPublicKey: string;

  constructor(private configService: ConfigService) {
    const isLive = this.configService.get('REMITTA_ENV') === 'live';
    this.mode =
      this.configService.get('REMITTA_MODE') === 'inline' ? 'inline' : 'connect';

    // Connect Gateway base (REMITTA_GATEWAY_URL). Production and demo use
    // different path prefixes.
    this.gatewayBaseUrl =
      this.configService.get('REMITTA_GATEWAY_URL') ||
      (isLive
        ? 'https://api-gateway.remita.net'
        : 'https://api-demo.systemspecsng.com/services/connect-gateway');

    // Classic Payment Gateway base (REMITTA_INLINE_URL). Hosts the inline
    // checkout bundle and the transaction query API.
    this.inlineBaseUrl =
      this.configService.get('REMITTA_INLINE_URL') ||
      (isLive
        ? 'https://login.remita.net/payment/v1'
        : 'https://demo.remita.net/payment/v1');

    // Checkout service hosts the sub-account API (separate from the
    // connect-gateway used for charges).
    this.checkoutBaseUrl =
      this.configService.get('REMITTA_CHECKOUT_URL') ||
      (isLive
        ? 'https://api-checkout.systemspecsng.com'
        : 'https://api-checkout-demo.systemspecsng.com');

    this.defaultSecretKey = this.configService.get('REMITTA_SECRET_KEY');
    this.defaultPublicKey = this.configService.get('REMITTA_PUBLIC_KEY');
  }

  private getCredentials(override?: RemittaCredentials): {
    secretKey: string;
    publicKey: string;
  } {
    const secretKey = override?.secretKey || this.defaultSecretKey;
    const publicKey = override?.publicKey || this.defaultPublicKey;

    if (!secretKey || !publicKey) {
      throw new BadRequestException(
        'Remitta is not configured. Set REMITTA_SECRET_KEY and REMITTA_PUBLIC_KEY or store the school\'s Connect Gateway keys on its business account.',
      );
    }

    return { secretKey, publicKey };
  }

  /**
   * Connect Gateway charge (REMITTA_MODE=connect).
   * POST {gateway}/api/v1/payment-engine/payment/charge
   * Amount is in naira. Returns the hosted paymentLink to redirect to.
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
    const { secretKey } = this.getCredentials(data.credentials);

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
        { headers: { secretKey, 'Content-Type': 'application/json' } },
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
      const body = error?.response?.data;
      const message =
        body?.message || body?.detail || error?.message || 'payment charge failed';
      throw new BadRequestException(`Remitta initialization failed: ${message}`);
    }
  }

  /**
   * Build the config for the Remita inline checkout widget
   * ({gateway}/remita-pay-inline.bundle.js -> RmPaymentEngine.init(...)).
   * The Payment Gateway has no server-side initialize call: the browser
   * opens the widget with the public key and we verify by transactionId
   * afterwards. Amount is in naira.
   */
  buildInlineConfig(data: {
    transactionId: string;
    amount: number;
    payerName: string;
    payerEmail: string;
    payerPhone?: string;
    description?: string;
    customerId?: string;
    credentials?: RemittaCredentials;
  }) {
    const { publicKey } = this.getCredentials(data.credentials);

    const [firstName, ...rest] = (data.payerName || '').trim().split(/\s+/);
    const lastName = rest.join(' ') || firstName;

    return {
      scriptUrl: `${this.inlineBaseUrl}/remita-pay-inline.bundle.js`,
      key: publicKey,
      transactionId: data.transactionId,
      customerId: data.customerId || data.payerEmail,
      firstName,
      lastName,
      email: data.payerEmail,
      phoneNumber: data.payerPhone || '',
      amount: Math.round(data.amount * 100) / 100,
      currency: 'NGN',
      narration: data.description || 'School fees payment',
    };
  }

  /**
   * Check payment status by reference. Mode-aware:
   *  - connect: GET {gateway}/api/v1/payment-engine/payment/merchant/verify/{ref}
   *    (secretKey header)
   *  - inline:  GET {inline}/payment/query/{ref}
   *    (publicKey header + TXN_HASH = sha512(ref + secretKey))
   * Normalizes the response to {status, message} using legacy codes so the
   * caller's '00'/'01' success and '021' pending checks keep working.
   */
  async checkStatus(reference: string, credentials?: RemittaCredentials) {
    const { secretKey, publicKey } = this.getCredentials(credentials);
    const ref = encodeURIComponent(reference);

    try {
      const response =
        this.mode === 'inline'
          ? await axios.get(`${this.inlineBaseUrl}/payment/query/${ref}`, {
              headers: {
                publicKey,
                TXN_HASH: createHash('sha512')
                  .update(`${reference}${secretKey}`)
                  .digest('hex'),
                'Content-Type': 'application/json',
              },
            })
          : await axios.get(
              `${this.gatewayBaseUrl}/api/v1/payment-engine/payment/merchant/verify/${ref}`,
              { headers: { secretKey, 'Content-Type': 'application/json' } },
            );

      const body = response.data || {};
      const data = Array.isArray(body.responseData)
        ? body.responseData[0] || {}
        : body.responseData || body.data || {};

      if (body.responseCode === '34') {
        throw new BadRequestException(
          'Remitta status check failed: invalid API credentials (hash error)',
        );
      }

      // paymentState reflects the actual transaction state ("PENDING",
      // "SUCCESSFUL", "FAILED"); responseCode/status is the API call status.
      const rawStatus = String(
        data.paymentState ??
          data.statuscode ??
          data.status ??
          body.responseCode ??
          body.status ??
          '',
      );
      const norm = rawStatus.toLowerCase();

      let status = rawStatus;
      if (['00', '01', 'success', 'successful', 'completed'].includes(norm)) {
        status = '00';
      } else if (
        ['020', '021', '022', '069', '070', '071', '072', 'pending', 'processing', 'in_progress', 'initiated'].includes(norm) ||
        (!rawStatus && body.responseCode !== '00')
      ) {
        status = '021';
      }

      return {
        status,
        amount: data.amount != null ? Number(data.amount) : undefined,
        paymentReference: data.paymentReference,
        message:
          data.responseMessage || data.message || body.responseMsg || body.message,
        raw: body,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const body = error?.response?.data;
      const message =
        body?.responseMsg ||
        body?.message ||
        body?.detail ||
        error?.message ||
        'Status check failed';
      throw new BadRequestException(`Remitta status check failed: ${message}`);
    }
  }

  /**
   * Register a bank account as a settlement sub-account under the platform's
   * Remita merchant profile.
   * POST {checkout}/api/v1/payment/subaccount/client
   * Returns the subAccountId to store for split settlement.
   */
  async createSubAccount(data: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    alias: string;
    credentials?: RemittaCredentials;
  }) {
    const { secretKey } = this.getCredentials(data.credentials);

    try {
      const response = await axios.post(
        `${this.checkoutBaseUrl}/api/v1/payment/subaccount/client`,
        {
          bankCode: data.bankCode,
          accountNumber: data.accountNumber,
          countryCode: 'NG',
          alias: data.alias,
          accountName: data.accountName,
        },
        {
          headers: {
            secretKey,
            'Content-Type': 'application/json',
          },
        },
      );

      const body = response.data;
      const subAccountId = body?.data?.subAccountId;

      if (body?.status !== '00' || !subAccountId) {
        throw new BadRequestException(
          `Remitta sub-account creation failed: ${body?.message || 'no subAccountId returned'}`,
        );
      }

      return { subAccountId, raw: body };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'sub-account creation failed';
      throw new BadRequestException(
        `Remitta sub-account creation failed: ${message}`,
      );
    }
  }
}
