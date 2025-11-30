import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { FeeType } from './fee-type.entity';
import { Payment } from './payment.entity';

@Entity('academic_sessions')
export class AcademicSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'school_id' })
  schoolId: number;

  @Column()
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;

  @ManyToOne(() => School, school => school.academicSessions)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @OneToMany(() => FeeType, feeType => feeType.session)
  feeTypes: FeeType[];

  @OneToMany(() => Payment, payment => payment.session)
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
