import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { Student } from '../../entities/student.entity';
import { FeeType } from '../../entities/fee-type.entity';
import { School } from '../../entities/school.entity';
import { AcademicSession } from '../../entities/academic-session.entity';
import { PaystackService } from './paystack.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';

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

    // Initialize Paystack payment
    const paystackResponse = await this.paystackService.initializePayment({
      email,
      amount,
      reference,
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
      successfulPayments: successfulPayments.length,
      pendingPayments: payments.filter((p) => p.status === 'pending').length,
      failedPayments: payments.filter((p) => p.status === 'failed').length,
      totalAmount,
      successfulAmount,
    };
  }
}
