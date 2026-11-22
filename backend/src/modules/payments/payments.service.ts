import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { Student } from '../../entities/student.entity';
import { FeeType } from '../../entities/fee-type.entity';
import { School } from '../../entities/school.entity';
import { AcademicSession } from '../../entities/academic-session.entity';
import { BusinessAccount } from '../../entities/business-account.entity';
import { PaystackService } from './paystack.service';
import { RemittaService } from './remitta.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { InitializeApplicationPaymentDto } from './dto/initialize-application-payment.dto';
import { CreateManualPaymentDto } from './dto/create-manual-payment.dto';
import { BulkDeletePaymentsDto } from './dto/bulk-delete-payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(FeeType)
    private feeTypeRepo: Repository<FeeType>,
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    @InjectRepository(AcademicSession)
    private sessionRepo: Repository<AcademicSession>,
    @InjectRepository(BusinessAccount)
    private businessAccountRepo: Repository<BusinessAccount>,
    private paystackService: PaystackService,
    private remittaService: RemittaService,
    private configService: ConfigService,
  ) {}

  async initializePayment(initializePaymentDto: InitializePaymentDto) {
    const { schoolId, studentId, feeTypeId, feeTypeIds, amount, email } = initializePaymentDto;
    const paymentMethod = initializePaymentDto.paymentMethod || 'paystack';

    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Payers may not have an email (e.g. rural parents); fall back to the
    // parent's then student's email, else a placeholder — gateways require one.
    const payerEmail =
      email?.trim() ||
      student.parentEmail ||
      student.email ||
      `payer-${student.admissionNumber || student.id}@schoolfees.com.ng`;

    const ids = feeTypeIds?.length ? feeTypeIds : feeTypeId ? [feeTypeId] : [];
    if (ids.length === 0) {
      throw new BadRequestException('At least one fee item must be selected');
    }

    const feeTypes = await this.feeTypeRepo.find({
      where: { id: In(ids), school: { id: schoolId } },
      relations: ['session'],
    });

    if (feeTypes.length !== ids.length) {
      throw new NotFoundException('Fee type not found');
    }

    // Multi-item payments charge the sum of the selected fees (amounts read
    // from the DB, never the client); single-item keeps the submitted amount.
    const totalFeeAmount =
      feeTypes.length === 1 ? amount : feeTypes.reduce((sum, f) => sum + Number(f.amount), 0);

    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });

    // Get school's primary business account for settlement routing
    const primaryAccount = await this.businessAccountRepo.findOne({
      where: { school: { id: schoolId }, isPrimary: true },
    });

    if (!primaryAccount) {
      throw new NotFoundException(
        'No business account configured for this school. Please contact your school administrator.',
      );
    }

    // Generate unique reference shared by every item in this transaction
    const reference = `PAY-${Date.now()}-${studentId}`;

    // One payment record per selected fee item — keeps per-fee reporting
    // accurate while a single gateway transaction covers all of them.
    const payments = feeTypes.map((ft) =>
      this.paymentRepo.create({
        school,
        student,
        feeType: ft,
        session: ft.session,
        reference,
        amount: feeTypes.length === 1 ? amount : Number(ft.amount),
        paymentMethod,
        status: 'pending',
      }),
    );

    await this.paymentRepo.save(payments);
    const payment = payments[0];

    // Transaction fee removed — payers are charged exactly the fee amount.
    const transactionFee = 0;
    const totalAmount = totalFeeAmount;

    if (paymentMethod === 'remitta') {
      // The account's remitta_api_key/remitta_public_key hold the school's
      // Payment Gateway key pair; falls back to the platform's
      // REMITTA_SECRET_KEY/REMITTA_PUBLIC_KEY when unset.
      const remittaCredentials = {
        secretKey: primaryAccount.remittaApiKey,
        publicKey: primaryAccount.remittaPublicKey,
      };

      const payerName = `${student.firstName} ${student.lastName}`;
      const feeNames = feeTypes.map((f) => f.name).join(', ');
      const description = `${feeNames} payment for ${payerName}`;
      const verifyUrl = `${this.configService.get('FRONTEND_URL')}/payment/verify?reference=${reference}`;

      const base = {
        paymentId: payment.id,
        paymentIds: payments.map((p) => p.id),
        reference,
        feeAmount: totalFeeAmount,
        transactionFee: Math.round(transactionFee),
        totalAmount: Math.round(totalAmount),
        verifyUrl,
      };

      if (this.remittaService.mode === 'inline') {
        // Classic Payment Gateway: checkout happens in the browser via the
        // inline widget; the frontend verifies by reference on success.
        const remita = this.remittaService.buildInlineConfig({
          transactionId: reference,
          amount: Math.round(totalAmount),
          payerName,
          payerEmail,
          payerPhone: student.phone,
          customerId: student.admissionNumber || String(student.id),
          description,
          credentials: remittaCredentials,
        });

        for (const p of payments) {
          p.remittaRrr = reference;
        }
        await this.paymentRepo.save(payments);
        return { ...base, remita };
      }

      // Connect Gateway: server-side charge returns a hosted payment link.
      // If the school has a registered Remita sub-account, split settlement
      // sends the fee amount to the school and keeps the transaction fee.
      const charge = await this.remittaService.charge({
        orderId: reference,
        amount: totalAmount,
        payerName,
        payerEmail,
        payerPhone: student.phone,
        description,
        returnUrl: verifyUrl,
        credentials: remittaCredentials,
        splitSubAccountId: primaryAccount.remittaSubaccountId || undefined,
        splitShare: totalFeeAmount,
      });

      for (const p of payments) {
        p.remittaRrr = reference;
      }
      await this.paymentRepo.save(payments);

      return { ...base, authorizationUrl: charge.paymentLink, accessCode: reference };
    }

    if (!primaryAccount.subaccountCode) {
      throw new BadRequestException(
        'School business account not properly configured for Paystack. Please contact your school administrator.',
      );
    }

    // Initialize Paystack payment with subaccount
    // This ensures money goes to SCHOOL'S account, not platform's account
    const paystackResponse = await this.paystackService.initializePayment({
      email: payerEmail,
      amount: totalFeeAmount,
      reference,
      subaccountCode: primaryAccount.subaccountCode, // CRITICAL LINE!
      metadata: {
        studentId,
        feeTypeId: ids[0],
        feeTypeIds: ids,
        schoolId,
        paymentId: payment.id,
      },
    });

    return {
      paymentId: payment.id,
      paymentIds: payments.map((p) => p.id),
      reference,
      feeAmount: totalFeeAmount,
      transactionFee: Math.round(transactionFee),
      totalAmount: Math.round(totalAmount),
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
    };
  }

  async verifyPayment(reference: string) {
    // A multi-item payment stores one row per fee under the same reference —
    // all rows succeed or fail together.
    const payments = await this.paymentRepo.find({
      where: { reference },
      relations: ['student', 'feeType', 'school'],
    });

    if (payments.length === 0) {
      throw new NotFoundException('Payment not found');
    }

    const payment = payments[0];

    if (payments.every((p) => p.status === 'successful')) {
      return { message: 'Payment already verified', payment, payments };
    }

    if (payment.paymentMethod === 'remitta') {
      if (!payment.remittaRrr) {
        throw new BadRequestException('No Remitta RRR recorded for this payment');
      }

      const primaryAccount = await this.businessAccountRepo.findOne({
        where: { school: { id: payment.school.id }, isPrimary: true },
      });

      const credentials = primaryAccount
        ? {
            secretKey: primaryAccount.remittaApiKey,
            publicKey: primaryAccount.remittaPublicKey,
          }
        : undefined;

      const statusResponse = await this.remittaService.checkStatus(
        payment.remittaRrr,
        credentials,
      );

      // Remita status "00"/"01" = successful; "021" = RRR generated but not
      // yet paid (payer may still complete it e.g. at a bank branch), so it
      // must stay pending rather than being permanently marked failed.
      if (statusResponse.status === '00' || statusResponse.status === '01') {
        for (const p of payments) {
          p.status = 'successful';
          p.paidAt = new Date();
        }
        await this.paymentRepo.save(payments);

        return { message: 'Payment verified successfully', payment, payments };
      } else if (statusResponse.status === '021') {
        return { message: 'Payment is still pending', payment, payments };
      } else {
        for (const p of payments) {
          p.status = 'failed';
        }
        await this.paymentRepo.save(payments);
        throw new BadRequestException(
          `Payment verification failed: ${statusResponse.message || 'payment not successful'}`,
        );
      }
    }

    // Verify with Paystack
    const paystackResponse = await this.paystackService.verifyPayment(reference);

    if (paystackResponse.data.status === 'success') {
      for (const p of payments) {
        p.status = 'successful';
        p.paystackReference = paystackResponse.data.reference;
        p.paidAt = new Date();
      }
      await this.paymentRepo.save(payments);

      return { message: 'Payment verified successfully', payment, payments };
    } else {
      for (const p of payments) {
        p.status = 'failed';
      }
      await this.paymentRepo.save(payments);
      throw new BadRequestException('Payment verification failed');
    }
  }

  /**
   * Remita payment notification webhook. Remita POSTs a JSON array of
   * payment objects (rrr, orderRef, orderId, type: 'PY', ...) and expects
   * a plain 'Ok' response; anything else triggers retries.
   */
  async handleRemitaWebhook(data: any) {
    const items: any[] = Array.isArray(data) ? data : [data];

    const refs = items
      .map(
        (item) =>
          item?.transactionId ||
          item?.orderRef ||
          item?.orderId ||
          item?.paymentIdentifier ||
          item?.rrr ||
          item?.RRR,
      )
      .filter(Boolean);

    for (const ref of refs) {
      try {
        await this.verifyPayment(ref);
      } catch (error: any) {
        console.error(`Remita webhook verification failed for ${ref}:`, error.message);
      }
    }

    return 'Ok';
  }

  async initializeApplicationPayment(dto: InitializeApplicationPaymentDto) {
    const { schoolId, amount, email, callbackUrl, metadata } = dto;

    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const primaryAccount = await this.businessAccountRepo.findOne({
      where: { school: { id: schoolId }, isPrimary: true },
    });

    if (!primaryAccount) {
      throw new NotFoundException(
        'No business account configured for this school. Please contact your school administrator.',
      );
    }

    if (!primaryAccount.subaccountCode) {
      throw new BadRequestException(
        'School business account not properly configured. Please contact your school administrator.',
      );
    }

    const reference = `APP-${Date.now()}-${schoolId}`;

    const percentageFee = amount * 0.015;
    const flatFee = 100;
    let transactionFee = percentageFee + flatFee;
    if (transactionFee > 2000) {
      transactionFee = 2000;
    }
    const totalAmount = amount + transactionFee;

    const paystackResponse = await this.paystackService.initializePayment({
      email,
      amount,
      reference,
      subaccountCode: primaryAccount.subaccountCode,
      callbackUrl,
      metadata: {
        schoolId,
        paymentType: 'application',
        ...metadata,
      },
    });

    return {
      reference,
      feeAmount: amount,
      transactionFee: Math.round(transactionFee),
      totalAmount: Math.round(totalAmount),
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
    };
  }

  async verifyApplicationPayment(reference: string) {
    const paystackResponse = await this.paystackService.verifyPayment(reference);

    if (paystackResponse.data.status !== 'success') {
      throw new BadRequestException('Payment verification failed');
    }

    return {
      message: 'Application payment verified successfully',
      status: 'success',
      data: paystackResponse.data,
    };
  }

  async findAll(schoolId: number, status?: string) {
    const where: any = { school: { id: schoolId } };
    if (status) {
      where.status = status;
    }

    return this.paymentRepo.find({
      where,
      relations: ['student', 'feeType', 'session'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, schoolId: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['student', 'feeType', 'session', 'school'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getStudentPayments(studentId: number, schoolId: number) {
    return this.paymentRepo.find({
      where: {
        student: { id: studentId },
        school: { id: schoolId },
      },
      relations: ['feeType', 'session'],
      order: { createdAt: 'DESC' },
    });
  }

  async createManualPayment(dto: CreateManualPaymentDto) {
    const { schoolId, studentId, feeTypeId, amount, paymentDate, reference } = dto;

    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    const student = await this.studentRepo.findOne({ where: { id: studentId, school: { id: schoolId } } });
    if (!student) throw new NotFoundException('Student not found');

    const feeType = await this.feeTypeRepo.findOne({ where: { id: feeTypeId, school: { id: schoolId } }, relations: ['session'] });
    if (!feeType) throw new NotFoundException('Fee type not found');

    // optional: validate amount matches feeType.amount

    const payment = this.paymentRepo.create({
      school,
      student,
      feeType,
      session: feeType.session,
      amount,
      reference: reference || `MAN-${Date.now()}-${studentId}`,
      status: 'successful',
      paymentMethod: 'manual',
      paidAt: paymentDate ? new Date(paymentDate) : new Date(),
    });

    await this.paymentRepo.save(payment);
    return { message: 'Manual payment recorded', payment };
  }

  /**
   * Bulk-delete payments for a school. Only pending/failed records are
   * removed — successful/refunded payments are financial records and are
   * skipped, so the caller knows how many were actually deleted.
   */
  async bulkDelete(dto: BulkDeletePaymentsDto) {
    const deletable = await this.paymentRepo.find({
      where: {
        id: In(dto.paymentIds),
        schoolId: dto.schoolId,
        status: In(['pending', 'failed']),
      },
      select: ['id'],
    });

    const ids = deletable.map((p) => p.id);
    if (ids.length > 0) {
      await this.paymentRepo.delete(ids);
    }

    return {
      message: `${ids.length} payment(s) deleted`,
      deleted: ids.length,
      skipped: dto.paymentIds.length - ids.length,
    };
  }

  async getPaymentStats(schoolId: number) {
    const payments = await this.paymentRepo.find({
      where: { school: { id: schoolId } },
    });

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const successfulPayments = payments.filter((p) => p.status === 'successful');
    const successfulAmount = successfulPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    return {
      totalPayments: payments.length,
      successfulCount: successfulPayments.length,
      pendingCount: payments.filter((p) => p.status === 'pending').length,
      failedCount: payments.filter((p) => p.status === 'failed').length,
      totalRevenue: successfulAmount, // Total revenue from successful payments
      totalAmount, // Total amount from all payments
    };
  }
}
