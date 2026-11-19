import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { join } from 'path';
import { Student } from '../../entities/student.entity';
import { School } from '../../entities/school.entity';
import { Class } from '../../entities/class.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { SelfRegisterStudentDto } from './dto/self-register-student.dto';
import { AlumniPaymentDto } from './dto/alumni-payment.dto';

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

  async create(createStudentDto: CreateStudentDto, passport?: Express.Multer.File) {
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

    createStudentDto.admissionNumber = createStudentDto.admissionNumber?.trim();

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
      passportUrl: passport ? `/uploads/passports/${passport.filename}` : null,
    });

    return this.studentRepo.save(student);
  }

  async selfRegister(dto: SelfRegisterStudentDto, passport?: Express.Multer.File) {
    const school = await this.schoolRepo.findOne({
      where: { id: dto.schoolId },
    });

    if (!school || !school.isActive) {
      throw new NotFoundException('School not found');
    }

    let classEntity = null;
    if (dto.classId) {
      classEntity = await this.classRepo.findOne({
        where: { id: dto.classId, school: { id: school.id } },
      });
      if (!classEntity) {
        throw new NotFoundException('Class not found for this school');
      }
    }

    let admissionNumber = dto.admissionNumber?.trim();
    if (admissionNumber) {
      const existing = await this.studentRepo.findOne({
        where: { admissionNumber },
      });
      if (existing) {
        throw new BadRequestException(
          'This admission number is already registered. Use it on the payment page instead.',
        );
      }
    } else {
      admissionNumber = await this.generateAdmissionNumber(school.id);
    }

    const student = this.studentRepo.create({
      ...dto,
      admissionNumber,
      school,
      class: classEntity,
      passportUrl: passport ? `/uploads/passports/${passport.filename}` : null,
    });

    return this.studentRepo.save(student);
  }

  // Continues the school's own admission numbering by incrementing the
  // numeric suffix of the most recently registered student, e.g.
  // SCS/STU/230240 -> SCS/STU/230241. Falls back to a random REG- code
  // when the school has no numbered pattern to follow.
  private async generateAdmissionNumber(schoolId: number): Promise<string> {
    const lastStudent = await this.studentRepo
      .createQueryBuilder('student')
      .where('student.school_id = :schoolId', { schoolId })
      .andWhere('student.admission_number NOT LIKE :reg', { reg: 'REG-%' })
      .orderBy('student.id', 'DESC')
      .getOne();

    const match = lastStudent?.admissionNumber?.match(/^(.*?)(\d+)$/);
    if (match) {
      const [, prefix, digits] = match;
      let next = parseInt(digits, 10) + 1;
      let admissionNumber = `${prefix}${String(next).padStart(digits.length, '0')}`;
      while (await this.studentRepo.findOne({ where: { admissionNumber } })) {
        next++;
        admissionNumber = `${prefix}${String(next).padStart(digits.length, '0')}`;
      }
      return admissionNumber;
    }

    let admissionNumber = '';
    let exists = true;
    while (exists) {
      admissionNumber = `REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const found = await this.studentRepo.findOne({ where: { admissionNumber } });
      exists = !!found;
    }
    return admissionNumber;
  }

  async findClassesBySchool(schoolId: number) {
    return this.classRepo.find({
      where: { school: { id: schoolId } },
      order: { name: 'ASC' },
    });
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

  async findByAdmissionNumber(
    admissionNumber: string,
    schoolId: number,
    phone?: string,
  ) {
    const student = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('student.class', 'class')
      .leftJoinAndSelect('student.payments', 'payments')
      .where('TRIM(student.admissionNumber) = :admissionNumber', {
        admissionNumber: admissionNumber.trim(),
      })
      .andWhere('school.id = :schoolId', { schoolId })
      .getOne();

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Phone is optional: when provided it must match either the parent's or
    // the student's number on record; when omitted, admission number alone
    // identifies the student.
    if (phone) {
      const matches = [student.parentPhone, student.phone]
        .filter(Boolean)
        .some((registered) => this.phonesMatch(registered!, phone));
      if (!matches) {
        throw new NotFoundException('Student not found');
      }
    }

    return student;
  }

  // Public transcript/alumni payment flow: resolve a payer by their
  // registration number; when no record exists (former students who left
  // before digitisation), create an inactive alumni record so the payment
  // still links to a real student row the bursary can verify.
  async findOrCreateAlumni(dto: AlumniPaymentDto) {
    const school = await this.schoolRepo.findOne({
      where: { id: dto.schoolId },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const admissionNumber = dto.admissionNumber.trim();
    const existing = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('student.class', 'class')
      .where('TRIM(student.admissionNumber) = :admissionNumber', {
        admissionNumber,
      })
      .andWhere('school.id = :schoolId', { schoolId: dto.schoolId })
      .getOne();

    if (existing) return existing;

    const student = this.studentRepo.create({
      admissionNumber,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone?.trim() || null,
      isActive: false,
      school,
    });
    const saved = await this.studentRepo.save(student);
    saved.school = school;
    return saved;
  }

  // Compare by national significant digits so 0803..., 803..., and
  // +234803... forms of the same number all match.
  private phonesMatch(registered: string, provided?: string): boolean {
    const toNSN = (v?: string) => (v || '').replace(/\D/g, '').slice(-10);
    const providedNsn = toNSN(provided);
    return providedNsn.length === 10 && providedNsn === toNSN(registered);
  }

  async update(
    id: number,
    schoolId: number,
    updateStudentDto: UpdateStudentDto,
    passport?: Express.Multer.File,
  ) {
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

    if (passport) {
      if (student.passportUrl) {
        // Best-effort cleanup of the replaced photo
        fs.promises
          .unlink(join(process.cwd(), student.passportUrl))
          .catch(() => {});
      }
      student.passportUrl = `/uploads/passports/${passport.filename}`;
    }

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
          // Parse date of birth - handle both string dates and Excel serial numbers
          let dateOfBirth = row.dateOfBirth || row.DateOfBirth;
          if (dateOfBirth) {
            // If it's a number (Excel serial date), convert it
            if (typeof dateOfBirth === 'number') {
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + dateOfBirth * 86400000);
              dateOfBirth = date.toISOString().split('T')[0];
            } else if (typeof dateOfBirth === 'string') {
              // Ensure it's in YYYY-MM-DD format
              const date = new Date(dateOfBirth);
              if (!isNaN(date.getTime())) {
                dateOfBirth = date.toISOString().split('T')[0];
              }
            }
          }

          const cell = (v: any) => v?.toString().trim() || undefined;

          const studentData: CreateStudentDto = {
            schoolId,
            admissionNumber: cell(row.admissionNumber || row.AdmissionNumber)!,
            firstName: cell(row.firstName || row.FirstName)!,
            lastName: cell(row.lastName || row.LastName)!,
            otherNames: cell(row.otherNames || row.OtherNames),
            email: cell(row.email || row.Email),
            phone: cell(row.phone || row.Phone),
            parentName: cell(row.parentName || row.ParentName)!,
            parentPhone: cell(row.parentPhone || row.ParentPhone)!,
            parentEmail: cell(row.parentEmail || row.ParentEmail),
            address: cell(row.address || row.Address),
            dateOfBirth: dateOfBirth,
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
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    } catch (error) {
      throw new BadRequestException('Invalid Excel file format');
    }
  }
}
