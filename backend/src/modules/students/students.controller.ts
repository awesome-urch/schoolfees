import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { SelfRegisterStudentDto } from './dto/self-register-student.dto';
import { AlumniPaymentDto } from './dto/alumni-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const passportUploadOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const dir = join(process.cwd(), 'uploads', 'passports');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image\//)) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
};

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // Public endpoint for student payment page - no auth required.
  // ?phone= is optional; when provided it must match a number on record.
  @Get('admission/:admissionNumber/school/:schoolId')
  findByAdmissionNumber(
    @Param('admissionNumber') admissionNumber: string,
    @Param('schoolId') schoolId: string,
    @Query('phone') phone?: string,
  ) {
    return this.studentsService.findByAdmissionNumber(
      admissionNumber,
      +schoolId,
      phone,
    );
  }

  // Public endpoint - list a school's classes for the self-registration form
  @Get('classes/school/:schoolId')
  findClassesBySchool(@Param('schoolId') schoolId: string) {
    return this.studentsService.findClassesBySchool(+schoolId);
  }

  // Public endpoint - alumni/transcript payers: resolve by registration
  // number or create an inactive alumni record, no auth required
  @Post('alumni')
  alumniPayment(@Body() dto: AlumniPaymentDto) {
    return this.studentsService.findOrCreateAlumni(dto);
  }

  // Public endpoint - student/parent self-registration, no auth required
  @Post('self-register')
  @UseInterceptors(FileInterceptor('passport', passportUploadOptions))
  selfRegister(
    @Body() selfRegisterDto: SelfRegisterStudentDto,
    @UploadedFile() passport?: Express.Multer.File,
  ) {
    return this.studentsService.selfRegister(selfRegisterDto, passport);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('school_owner', 'school_staff')
  @UseInterceptors(FileInterceptor('passport', passportUploadOptions))
  create(
    @Body() createStudentDto: CreateStudentDto,
    @UploadedFile() passport?: Express.Multer.File,
  ) {
    return this.studentsService.create(createStudentDto, passport);
  }

  @Post('bulk-upload/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('school_owner', 'school_staff')
  @UseInterceptors(FileInterceptor('file'))
  bulkUpload(
    @Param('schoolId') schoolId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.bulkUpload(+schoolId, file);
  }

  @Get('school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('school_owner', 'school_staff')
  findAll(
    @Param('schoolId') schoolId: string,
    @Query('classId') classId?: string,
  ) {
    return this.studentsService.findAll(+schoolId, classId ? +classId : undefined);
  }

  @Get(':id/school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('school_owner', 'school_staff')
  findOne(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.studentsService.findOne(+id, +schoolId);
  }

  @Patch(':id/school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('school_owner', 'school_staff')
  @UseInterceptors(FileInterceptor('passport', passportUploadOptions))
  update(
    @Param('id') id: string,
    @Param('schoolId') schoolId: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @UploadedFile() passport?: Express.Multer.File,
  ) {
    return this.studentsService.update(+id, +schoolId, updateStudentDto, passport);
  }

  @Delete(':id/school/:schoolId')
  @Roles('school_owner', 'school_staff')
  remove(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.studentsService.remove(+id, +schoolId);
  }
}
