import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessAccount } from '../../entities/business-account.entity';
import { School } from '../../entities/school.entity';
import { PaystackService } from '../payments/paystack.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class BusinessAccountsService {
  constructor(
    @InjectRepository(BusinessAccount)
    private accountRepo: Repository<BusinessAccount>,
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    private paystackService: PaystackService,
  ) {}

  async create(createAccountDto: CreateAccountDto) {
    const school = await this.schoolRepo.findOne({
      where: { id: createAccountDto.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Verify account with Paystack
    const verification = await this.paystackService.resolveAccountNumber(
      createAccountDto.accountNumber,
      createAccountDto.bankCode,
    );

    if (!verification.status) {
      throw new Error('Account verification failed');
    }

    // If setting as primary, unset other primary accounts
    if (createAccountDto.isPrimary) {
      await this.accountRepo.update(
        { school: { id: school.id }, isPrimary: true },
        { isPrimary: false },
      );
    }

    const account = this.accountRepo.create({
      ...createAccountDto,
      school,
      isVerified: true,
    });

    return this.accountRepo.save(account);
  }

  async findAll(schoolId: number) {
    return this.accountRepo.find({
      where: { school: { id: schoolId } },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
  }

  async setPrimary(id: number, schoolId: number) {
    const account = await this.accountRepo.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Unset all primary accounts
    await this.accountRepo.update(
      { school: { id: schoolId }, isPrimary: true },
      { isPrimary: false },
    );

    account.isPrimary = true;
    return this.accountRepo.save(account);
  }

  async getBanks() {
    return this.paystackService.listBanks();
  }
}
