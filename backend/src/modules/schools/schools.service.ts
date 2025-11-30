import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../../entities/school.entity';
import { SchoolOwner } from '../../entities/school-owner.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    @InjectRepository(SchoolOwner)
    private ownerRepo: Repository<SchoolOwner>,
  ) {}

  async create(ownerId: number, createSchoolDto: CreateSchoolDto) {
    const owner = await this.ownerRepo.findOne({ where: { id: ownerId } });
    
    if (!owner) {
      throw new NotFoundException('School owner not found');
    }

    if (!owner.isApproved) {
      throw new ForbiddenException('Your account is not approved yet');
    }

    const school = this.schoolRepo.create({
      ...createSchoolDto,
      owner,
    });

    return this.schoolRepo.save(school);
  }

  async findAll(ownerId?: number) {
    if (ownerId) {
      return this.schoolRepo.find({
        where: { owner: { id: ownerId } },
        relations: ['owner'],
      });
    }
    return this.schoolRepo.find({ relations: ['owner'] });
  }

  async findOne(id: number, ownerId?: number) {
    const where: any = { id };
    if (ownerId) {
      where.owner = { id: ownerId };
    }

    const school = await this.schoolRepo.findOne({
      where,
      relations: ['owner'],
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school;
  }

  async update(id: number, ownerId: number, updateSchoolDto: UpdateSchoolDto) {
    const school = await this.findOne(id, ownerId);
    
    Object.assign(school, updateSchoolDto);
    return this.schoolRepo.save(school);
  }

  async remove(id: number, ownerId: number) {
    const school = await this.findOne(id, ownerId);
    await this.schoolRepo.remove(school);
    return { message: 'School deleted successfully' };
  }

  async getStats(schoolId: number) {
    const school = await this.schoolRepo.findOne({
      where: { id: schoolId },
      relations: ['students', 'payments', 'staff'],
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return {
      totalStudents: school.students?.length || 0,
      totalStaff: school.staff?.length || 0,
      totalPayments: school.payments?.length || 0,
    };
  }
}
