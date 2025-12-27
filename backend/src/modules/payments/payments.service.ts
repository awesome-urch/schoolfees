import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { Student } from '../../entities/student.entity';
import { FeeType } from '../../entities/fee-type.entity';
import { School } from '../../entities/school.entity';
import { AcademicSession } from '../../entities/academic-session.entity';
import { BusinessAccount } from '../../entities/business-account.entity';
import { PaystackService } from './paystack.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
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
  ) {}

  async initializePayment(initializePaymentDto: InitializePaymentDto) {
    const { schoolId, studentId, feeTypeId, amount, email } = initializePaymentDto;

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

    // CRITICAL: Get school's primary business account for subaccount routing
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
      paymentMethod: 'paystack',
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
