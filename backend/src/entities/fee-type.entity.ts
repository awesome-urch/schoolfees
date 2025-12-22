import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { AcademicSession } from './academic-session.entity';
import { Class } from './class.entity';
import { Payment } from './payment.entity';

@Entity('fee_types')
export class FeeType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'school_id' })
  schoolId: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'session_id', nullable: true })
  sessionId: number;

  @Column({ name: 'class_id', nullable: true })
  classId: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => School, school => school.feeTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => AcademicSession, session => session.feeTypes, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  session: AcademicSession;

  @ManyToOne(() => Class, classEntity => classEntity.feeTypes, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @OneToMany(() => Payment, payment => payment.feeType)
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
