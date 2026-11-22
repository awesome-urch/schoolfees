import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessAccount } from '../../entities/business-account.entity';
import { School } from '../../entities/school.entity';
import { PaystackService } from '../payments/paystack.service';
import { RemittaService } from '../payments/remitta.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { RemittaCredentialsDto } from './dto/remitta-credentials.dto';

@Injectable()
export class BusinessAccountsService {
  private readonly logger = new Logger(BusinessAccountsService.name);

  constructor(
    @InjectRepository(BusinessAccount)
    private accountRepo: Repository<BusinessAccount>,
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    private paystackService: PaystackService,
    private remittaService: RemittaService,
  ) {}

  async create(createAccountDto: CreateAccountDto) {
    const school = await this.schoolRepo.findOne({
      where: { id: createAccountDto.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    let resolvedAccountName = createAccountDto.accountName;
    try {
      // Verify account with Paystack
      const verification = await this.paystackService.resolveAccountNumber(
        createAccountDto.accountNumber,
        createAccountDto.bankCode,
      );

      if (!verification.status) {
        throw new Error(`Account verification failed: ${verification.message || 'Invalid account details'}`);
      }
      resolvedAccountName =
        verification.data?.account_name || resolvedAccountName;
    } catch (error: any) {
      throw new Error(`Failed to verify account with Paystack: ${error.message}. Note: Paystack may not support this bank (OPay, Kuda, etc.) for subaccount creation. Please use a traditional Nigerian bank account.`);
    }

    try {
      // Create Paystack Subaccount for this school
      // This ensures money goes directly to the school's bank account
      const subaccountResponse = await this.paystackService.createSubaccount({
        business_name: school.name,
        settlement_bank: createAccountDto.bankCode,
        account_number: createAccountDto.accountNumber,
        percentage_charge: 0, // Platform takes 0% (you can set this to take a commission)
      });

      if (!subaccountResponse.status) {
        throw new Error(`Failed to create Paystack subaccount: ${subaccountResponse.message || 'Unknown error'}`);
      }

      const subaccountCode = subaccountResponse.data.subaccount_code;

      // Best-effort: also register the account as a Remita sub-account so
      // Remita payments can settle to the school's bank account. A failure
      // here must not block account creation.
      let remittaSubaccountId: string | null = null;
      try {
        const sub = await this.remittaService.createSubAccount({
          bankCode: createAccountDto.bankCode,
          accountNumber: createAccountDto.accountNumber,
          accountName: resolvedAccountName,
          alias: `SCH-${school.id}-${createAccountDto.accountNumber.slice(-4)}`,
        });
        remittaSubaccountId = sub.subAccountId;
      } catch (error: any) {
        this.logger.warn(
          `Remitta sub-account creation failed for school ${school.id}: ${error.message}`,
        );
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
        subaccountCode,
        remittaSubaccountId,
      });

      return this.accountRepo.save(account);
    } catch (error: any) {
      throw new Error(`Failed to create Paystack subaccount: ${error.message}. This bank may not be supported by Paystack for subaccounts. Please use a traditional Nigerian bank account (e.g., Access Bank, GTBank, First Bank, etc.)`);
    }
  }

  async findAll(schoolId: number) {
    return this.accountRepo.find({
      where: { school: { id: schoolId } },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateRemittaCredentials(
    id: number,
    schoolId: number,
    dto: RemittaCredentialsDto,
  ) {
    const account = await this.accountRepo.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Empty merchantId/apiKey means "use the platform's Remita merchant
    // profile" — the school's serviceTypeId alone routes settlement to the
    // school's service type on that profile.
    account.remittaMerchantId = dto.remittaMerchantId || null;
    account.remittaApiKey = dto.remittaApiKey || null;
    account.remittaPublicKey = dto.remittaPublicKey || null;
    account.remittaServiceTypeId = dto.remittaServiceTypeId;

    return this.accountRepo.save(account);
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
