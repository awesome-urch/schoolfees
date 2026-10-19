import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const { schoolId, studentId, feeTypeId, amount, email } = initializePaymentDto;
    const paymentMethod = initializePaymentDto.paymentMethod || 'paystack';

    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const feeType = await this.feeTypeRepo.findOne({
      where: { id: feeTypeId, school: { id: schoolId } },
      relations: ['session'],
    });

    if (!feeType) {
      throw new NotFoundException('Fee type not found');
    }

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

    // Generate unique reference
    const reference = `PAY-${Date.now()}-${studentId}`;

    // Create payment record
    const payment = this.paymentRepo.create({
      school,
      student,
      feeType,
      session: feeType.session,
      reference,
      amount,
      paymentMethod,
      status: 'pending',
    });

    await this.paymentRepo.save(payment);

    // Calculate transaction fee (1.5% + ₦100, capped at ₦2,000)
    const percentageFee = amount * 0.015;
    const flatFee = 100;
    let transactionFee = percentageFee + flatFee;
    if (transactionFee > 2000) {
      transactionFee = 2000;
    }
    const totalAmount = amount + transactionFee;

    if (paymentMethod === 'remitta') {
      // The account's remitta_api_key holds the school's Connect Gateway
      // secretKey; falls back to the platform REMITTA_SECRET_KEY when unset.
      const remittaCredentials = {
        secretKey: primaryAccount.remittaApiKey,
      };

      const responseUrl = `${this.configService.get('FRONTEND_URL')}/payment/verify?reference=${reference}`;

      const charge = await this.remittaService.charge({
        orderId: reference,
        amount: totalAmount,
        payerName: `${student.firstName} ${student.lastName}`,
        payerEmail: email,
        payerPhone: student.phone,
        description: `${feeType.name} payment for ${student.firstName} ${student.lastName}`,
        returnUrl: responseUrl,
        credentials: remittaCredentials,
      });

      payment.remittaRrr = reference;
      await this.paymentRepo.save(payment);

      return {
        paymentId: payment.id,
        reference,
        feeAmount: amount,
        transactionFee: Math.round(transactionFee),
        totalAmount: Math.round(totalAmount),
        authorizationUrl: charge.paymentLink,
        accessCode: reference,
      };
    }

    if (!primaryAccount.subaccountCode) {
      throw new BadRequestException(
        'School business account not properly configured for Paystack. Please contact your school administrator.',
      );
    }

    // Initialize Paystack payment with subaccount
    // This ensures money goes to SCHOOL'S account, not platform's account
    const paystackResponse = await this.paystackService.initializePayment({
      email,
      amount,
      reference,
      subaccountCode: primaryAccount.subaccountCode, // CRITICAL LINE!
      metadata: {
        studentId,
        feeTypeId,
        schoolId,
        paymentId: payment.id,
      },
    });

    return {
      paymentId: payment.id,
      reference,
      feeAmount: amount,
      transactionFee: Math.round(transactionFee),
      totalAmount: Math.round(totalAmount),
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
    };
  }

  async verifyPayment(reference: string) {
    const payment = await this.paymentRepo.findOne({
      where: { reference },
      relations: ['student', 'feeType', 'school'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'successful') {
      return { message: 'Payment already verified', payment };
    }

    if (payment.paymentMethod === 'remitta') {
      if (!payment.remittaRrr) {
        throw new BadRequestException('No Remitta RRR recorded for this payment');
      }

      const primaryAccount = await this.businessAccountRepo.findOne({
        where: { school: { id: payment.school.id }, isPrimary: true },
      });

      const credentials = primaryAccount
        ? { secretKey: primaryAccount.remittaApiKey }
        : undefined;

      const statusResponse = await this.remittaService.checkStatus(
        payment.remittaRrr,
        credentials,
      );

      // Remita status "00"/"01" = successful; "021" = RRR generated but not
      // yet paid (payer may still complete it e.g. at a bank branch), so it
      // must stay pending rather than being permanently marked failed.
      if (statusResponse.status === '00' || statusResponse.status === '01') {
        payment.status = 'successful';
        payment.paidAt = new Date();
        await this.paymentRepo.save(payment);

        return { message: 'Payment verified successfully', payment };
      } else if (statusResponse.status === '021') {
        return { message: 'Payment is still pending', payment };
      } else {
        payment.status = 'failed';
        await this.paymentRepo.save(payment);
        throw new BadRequestException(
          `Payment verification failed: ${statusResponse.message || 'payment not successful'}`,
        );
      }
    }

    // Verify with Paystack
    const paystackResponse = await this.paystackService.verifyPayment(reference);

    if (paystackResponse.data.status === 'success') {
      payment.status = 'successful';
      payment.paystackReference = paystackResponse.data.reference;
      payment.paidAt = new Date();
      await this.paymentRepo.save(payment);

      return { message: 'Payment verified successfully', payment };
    } else {
      payment.status = 'failed';
      await this.paymentRepo.save(payment);
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
