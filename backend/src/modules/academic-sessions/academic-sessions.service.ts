import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicSession } from '../../entities/academic-session.entity';
import { School } from '../../entities/school.entity';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class AcademicSessionsService {
  constructor(
    @InjectRepository(AcademicSession)
    private sessionRepo: Repository<AcademicSession>,
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
  ) {}

  async create(createSessionDto: CreateSessionDto) {
    const school = await this.schoolRepo.findOne({
      where: { id: createSessionDto.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // If setting as current, unset other current sessions
    if (createSessionDto.isCurrent) {
      await this.sessionRepo.update(
        { school: { id: school.id }, isCurrent: true },
        { isCurrent: false },
      );
    }

    const session = this.sessionRepo.create({
      ...createSessionDto,
      school,
    });

    return this.sessionRepo.save(session);
  }

  async findAll(schoolId: number) {
    return this.sessionRepo.find({
      where: { school: { id: schoolId } },
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number, schoolId: number) {
    const session = await this.sessionRepo.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!session) {
      throw new NotFoundException('Academic session not found');
    }

    return session;
  }

  async setCurrent(id: number, schoolId: number) {
    const session = await this.findOne(id, schoolId);

    // Unset all current sessions
    await this.sessionRepo.update(
      { school: { id: schoolId }, isCurrent: true },
      { isCurrent: false },
    );

    session.isCurrent = true;
    return this.sessionRepo.save(session);
  }
}
