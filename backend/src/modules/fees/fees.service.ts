import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeType } from '../../entities/fee-type.entity';
import { School } from '../../entities/school.entity';
import { AcademicSession } from '../../entities/academic-session.entity';
import { Class } from '../../entities/class.entity';
import { CreateFeeTypeDto } from './dto/create-fee-type.dto';
import { UpdateFeeTypeDto } from './dto/update-fee-type.dto';

@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(FeeType)
    private feeTypeRepo: Repository<FeeType>,
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    @InjectRepository(AcademicSession)
    private sessionRepo: Repository<AcademicSession>,
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
  ) {}

  async create(createFeeTypeDto: CreateFeeTypeDto) {
    const school = await this.schoolRepo.findOne({
      where: { id: createFeeTypeDto.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const session = await this.sessionRepo.findOne({
      where: { id: createFeeTypeDto.sessionId, school: { id: school.id } },
    });

    if (!session) {
      throw new NotFoundException('Academic session not found');
    }

    let classEntity = null;
    if (createFeeTypeDto.classId) {
      classEntity = await this.classRepo.findOne({
        where: { id: createFeeTypeDto.classId, school: { id: school.id } },
      });
      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }
    }

    const feeType = this.feeTypeRepo.create({
      ...createFeeTypeDto,
      school,
      session,
      class: classEntity,
    });

    return this.feeTypeRepo.save(feeType);
  }

  async findAll(schoolId: number, sessionId?: number, classId?: number) {
    const where: any = { school: { id: schoolId } };
    
    if (sessionId) {
      where.session = { id: sessionId };
    }
    
    if (classId) {
      where.class = { id: classId };
    }

    return this.feeTypeRepo.find({
      where,
      relations: ['school', 'session', 'class'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, schoolId: number) {
    const feeType = await this.feeTypeRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['school', 'session', 'class', 'payments'],
    });

    if (!feeType) {
      throw new NotFoundException('Fee type not found');
    }

    return feeType;
  }

  async update(id: number, schoolId: number, updateFeeTypeDto: UpdateFeeTypeDto) {
    const feeType = await this.findOne(id, schoolId);
    
    Object.assign(feeType, updateFeeTypeDto);
    return this.feeTypeRepo.save(feeType);
  }

  async remove(id: number, schoolId: number) {
    const feeType = await this.findOne(id, schoolId);
    await this.feeTypeRepo.remove(feeType);
    return { message: 'Fee type deleted successfully' };
  }
}
