import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../entities/payment.entity';
import { Student } from '../../entities/student.entity';
import { FeeType } from '../../entities/fee-type.entity';
import { School } from '../../entities/school.entity';
import { AcademicSession } from '../../entities/academic-session.entity';
import { BusinessAccount } from '../../entities/business-account.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Student, FeeType, School, AcademicSession, BusinessAccount])],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackService],
  exports: [PaymentsService, PaystackService],
})
export class PaymentsModule {}
