import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { Role } from './role.entity';

@Entity('school_staff')
export class SchoolStaff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'school_id' })
  schoolId: number;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'reset_token', nullable: true })
  resetToken: string;

  @Column({ name: 'reset_token_expires', type: 'datetime', nullable: true })
  resetTokenExpires: Date;

  @ManyToOne(() => School, school => school.staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => Role, role => role.staff)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
