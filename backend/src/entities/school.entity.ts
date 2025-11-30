import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SchoolOwner } from './school-owner.entity';
import { SchoolStaff } from './school-staff.entity';
import { Student } from './student.entity';
import { Class } from './class.entity';
import { FeeType } from './fee-type.entity';
import { Payment } from './payment.entity';
import { AcademicSession } from './academic-session.entity';
import { BusinessAccount } from './business-account.entity';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => SchoolOwner, owner => owner.schools)
  @JoinColumn({ name: 'owner_id' })
  owner: SchoolOwner;

  @OneToMany(() => SchoolStaff, staff => staff.school)
  staff: SchoolStaff[];

  @OneToMany(() => Student, student => student.school)
  students: Student[];

  @OneToMany(() => Class, classEntity => classEntity.school)
  classes: Class[];

  @OneToMany(() => FeeType, feeType => feeType.school)
  feeTypes: FeeType[];

  @OneToMany(() => Payment, payment => payment.school)
  payments: Payment[];

  @OneToMany(() => AcademicSession, session => session.school)
  academicSessions: AcademicSession[];

  @OneToMany(() => BusinessAccount, account => account.school)
  businessAccounts: BusinessAccount[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
