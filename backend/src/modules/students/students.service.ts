import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Student } from '../../entities/student.entity';
import { School } from '../../entities/school.entity';
import { Class } from '../../entities/class.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const school = await this.schoolRepo.findOne({
      where: { id: createStudentDto.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    let classEntity = null;
    if (createStudentDto.classId) {
      classEntity = await this.classRepo.findOne({
        where: { id: createStudentDto.classId, school: { id: school.id } },
      });
      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }
    }

    // Check if admission number exists
    const existing = await this.studentRepo.findOne({
      where: {
        admissionNumber: createStudentDto.admissionNumber,
        school: { id: school.id },
      },
    });

    if (existing) {
      throw new BadRequestException('Admission number already exists');
    }

    const student = this.studentRepo.create({
      ...createStudentDto,
      school,
      class: classEntity,
    });

    return this.studentRepo.save(student);
  }

  async findAll(schoolId: number, classId?: number) {
    const where: any = { school: { id: schoolId } };
    if (classId) {
      where.class = { id: classId };
    }

    return this.studentRepo.find({
      where,
      relations: ['school', 'class'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, schoolId: number) {
    const student = await this.studentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['school', 'class', 'payments'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async findByAdmissionNumber(admissionNumber: string, schoolId: number) {
    const student = await this.studentRepo.findOne({
      where: { admissionNumber, school: { id: schoolId } },
      relations: ['school', 'class'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async update(id: number, schoolId: number, updateStudentDto: UpdateStudentDto) {
    const student = await this.findOne(id, schoolId);

    if (updateStudentDto.classId) {
      const classEntity = await this.classRepo.findOne({
        where: { id: updateStudentDto.classId, school: { id: schoolId } },
      });
      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }
      student.class = classEntity;
    }

    Object.assign(student, updateStudentDto);
    return this.studentRepo.save(student);
  }

  async remove(id: number, schoolId: number) {
    const student = await this.findOne(id, schoolId);
    await this.studentRepo.remove(student);
    return { message: 'Student deleted successfully' };
  }

  async bulkUpload(schoolId: number, file: Express.Multer.File) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (const row of data) {
        try {
          const studentData: CreateStudentDto = {
            schoolId,
            admissionNumber: row.admissionNumber || row.AdmissionNumber,
            firstName: row.firstName || row.FirstName,
            lastName: row.lastName || row.LastName,
            middleName: row.middleName || row.MiddleName,
            email: row.email || row.Email,
            phone: row.phone || row.Phone,
            parentName: row.parentName || row.ParentName,
            parentPhone: row.parentPhone || row.ParentPhone,
            parentEmail: row.parentEmail || row.ParentEmail,
            address: row.address || row.Address,
            dateOfBirth: row.dateOfBirth || row.DateOfBirth,
            gender: (row.gender || row.Gender)?.toLowerCase(),
          };

          // Find class by name if provided
          if (row.className || row.ClassName) {
            const classEntity = await this.classRepo.findOne({
              where: {
                name: row.className || row.ClassName,
                school: { id: schoolId },
              },
            });
            if (classEntity) {
              studentData.classId = classEntity.id;
            }
          }

          await this.create(studentData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: row.admissionNumber || row.AdmissionNumber,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new BadRequestException('Invalid Excel file format');
    }
  }
}
