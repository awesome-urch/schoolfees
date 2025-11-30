import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  async onModuleInit() {
    // Create default roles if they don't exist
    await this.createDefaultRoles();
  }

  private async createDefaultRoles() {
    const defaultRoles = [
      {
        name: 'School Admin',
        description: 'Full access to school management',
        permissions: ['manage_students', 'manage_fees', 'manage_payments', 'manage_staff', 'view_reports'],
      },
      {
        name: 'Accountant',
        description: 'Manage fees and payments',
        permissions: ['manage_fees', 'manage_payments', 'view_reports'],
      },
      {
        name: 'Teacher',
        description: 'View students and basic information',
        permissions: ['view_students', 'view_fees'],
      },
    ];

    for (const roleData of defaultRoles) {
      const existing = await this.roleRepo.findOne({ where: { name: roleData.name } });
      if (!existing) {
        const role = this.roleRepo.create(roleData);
        await this.roleRepo.save(role);
      }
    }
  }

  async create(createRoleDto: CreateRoleDto) {
    const role = this.roleRepo.create(createRoleDto);
    return this.roleRepo.save(role);
  }

  async findAll() {
    return this.roleRepo.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }
}
