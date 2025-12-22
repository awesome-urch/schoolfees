import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { Student } from './student.entity';
import { FeeType } from './fee-type.entity';
import { AcademicSession } from './academic-session.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'school_id' })
  schoolId: number;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ name: 'fee_type_id' })
  feeTypeId: number;

  @Column({ name: 'session_id', nullable: true })
  sessionId: number;

  @Column({ unique: true })
  reference: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'payment_method', default: 'paystack' })
  paymentMethod: string;

  @Column({ type: 'enum', enum: ['pending', 'successful', 'failed', 'refunded'], default: 'pending' })
  status: string;

  @Column({ name: 'paystack_reference', nullable: true })
  paystackReference: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @ManyToOne(() => School, school => school.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => Student, student => student.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => FeeType, feeType => feeType.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fee_type_id' })
  feeType: FeeType;

  @ManyToOne(() => AcademicSession, session => session.payments, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  session: AcademicSession;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
