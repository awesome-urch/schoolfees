import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { School } from './school.entity';

@Entity('business_accounts')
export class BusinessAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'school_id' })
  schoolId: number;

  @Column({ name: 'bank_name' })
  bankName: string;

  @Column({ name: 'account_number' })
  accountNumber: string;

  @Column({ name: 'account_name' })
  accountName: string;

  @Column({ name: 'bank_code', nullable: true })
  bankCode: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'subaccount_code', nullable: true })
  subaccountCode: string;

  @Column({ name: 'recipient_code', nullable: true })
  recipientCode: string;

  // Remitta merchant credentials for this school (used to route Remitta
  // payments directly to the school's own Remitta merchant profile).
  @Column({ name: 'remitta_merchant_id', nullable: true })
  remittaMerchantId: string;

  @Column({ name: 'remitta_api_key', nullable: true })
  remittaApiKey: string;

  @Column({ name: 'remitta_service_type_id', nullable: true })
  remittaServiceTypeId: string;

  @ManyToOne(() => School, school => school.businessAccounts)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
