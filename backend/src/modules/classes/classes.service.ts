import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../entities/class.entity';
import { School } from '../../entities/school.entity';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
  ) {}

  async create(createClassDto: CreateClassDto) {
    const school = await this.schoolRepo.findOne({
      where: { id: createClassDto.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const classEntity = this.classRepo.create({
      ...createClassDto,
      school,
    });

    return this.classRepo.save(classEntity);
  }

  async findAll(schoolId: number) {
    return this.classRepo.find({
      where: { school: { id: schoolId } },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number, schoolId: number) {
    const classEntity = await this.classRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['students'],
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return classEntity;
  }

  async update(id: number, schoolId: number, updateClassDto: Partial<CreateClassDto>) {
    const classEntity = await this.classRepo.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    // Update only the fields that are provided
    Object.assign(classEntity, updateClassDto);

    return this.classRepo.save(classEntity);
  }

  async remove(id: number, schoolId: number) {
    const classEntity = await this.classRepo.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    await this.classRepo.remove(classEntity);

    return { 
      message: 'Class deleted successfully',
      id,
    };
  }
}
