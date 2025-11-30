import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../../entities/school.entity';
import { Student } from '../../entities/student.entity';
import { Payment } from '../../entities/payment.entity';
import { SchoolStaff } from '../../entities/school-staff.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(SchoolStaff)
    private staffRepo: Repository<SchoolStaff>,
  ) {}

  async getSchoolDashboard(schoolId: number) {
    const students = await this.studentRepo.count({
      where: { school: { id: schoolId }, isActive: true },
    });

    const staff = await this.staffRepo.count({
      where: { school: { id: schoolId }, isActive: true },
    });

    const payments = await this.paymentRepo.find({
      where: { school: { id: schoolId } },
    });

    const totalRevenue = payments
      .filter((p) => p.status === 'successful')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingPayments = payments.filter((p) => p.status === 'pending').length;

    const recentPayments = await this.paymentRepo.find({
      where: { school: { id: schoolId } },
      relations: ['student', 'feeType'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await this.getMonthlyRevenue(schoolId);

    return {
      stats: {
        totalStudents: students,
        totalStaff: staff,
        totalRevenue,
        pendingPayments,
        successfulPayments: payments.filter((p) => p.status === 'successful').length,
      },
      recentPayments,
      monthlyRevenue,
    };
  }

  async getSuperAdminDashboard() {
    const totalSchools = await this.schoolRepo.count();
    const activeSchools = await this.schoolRepo.count({ where: { isActive: true } });
    const totalStudents = await this.studentRepo.count();
    const totalPayments = await this.paymentRepo.count();

    const payments = await this.paymentRepo.find();
    const totalRevenue = payments
      .filter((p) => p.status === 'successful')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const recentSchools = await this.schoolRepo.find({
      relations: ['owner'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      stats: {
        totalSchools,
        activeSchools,
        totalStudents,
        totalPayments,
        totalRevenue,
      },
      recentSchools,
    };
  }

  private async getMonthlyRevenue(schoolId: number) {
    const payments = await this.paymentRepo.find({
      where: { school: { id: schoolId }, status: 'successful' },
    });

    const monthlyData = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = 0;
    }

    payments.forEach((payment) => {
      const date = new Date(payment.paidAt || payment.createdAt);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += Number(payment.amount);
      }
    });

    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }
}
