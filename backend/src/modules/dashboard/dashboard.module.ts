import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '../../entities/school.entity';
import { Student } from '../../entities/student.entity';
import { Payment } from '../../entities/payment.entity';
import { SchoolStaff } from '../../entities/school-staff.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([School, Student, Payment, SchoolStaff])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
