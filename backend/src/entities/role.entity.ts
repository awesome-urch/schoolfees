import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { SchoolStaff } from './school-staff.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  permissions: string[];

  @OneToMany(() => SchoolStaff, staff => staff.role)
  staff: SchoolStaff[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
