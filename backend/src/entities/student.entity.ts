import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { Class } from './class.entity';
import { Payment } from './payment.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'school_id' })
  schoolId: number;

  @Column({ name: 'class_id', nullable: true })
  classId: number;

  @Column({ name: 'admission_number', unique: true })
  admissionNumber: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'other_names', nullable: true })
  otherNames: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'parent_name', nullable: true })
  parentName: string;

  @Column({ name: 'parent_email', nullable: true })
  parentEmail: string;

  @Column({ name: 'parent_phone', nullable: true })
  parentPhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: ['Male', 'Female', 'Other'], nullable: true })
  gender: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => School, school => school.students)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => Class, classEntity => classEntity.students)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @OneToMany(() => Payment, payment => payment.student)
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
