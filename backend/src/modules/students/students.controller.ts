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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles('school_owner', 'school_staff')
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Post('bulk-upload/:schoolId')
  @Roles('school_owner', 'school_staff')
  @UseInterceptors(FileInterceptor('file'))
  bulkUpload(
    @Param('schoolId') schoolId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.bulkUpload(+schoolId, file);
  }

  @Get('school/:schoolId')
  @Roles('school_owner', 'school_staff')
  findAll(
    @Param('schoolId') schoolId: string,
    @Query('classId') classId?: string,
  ) {
    return this.studentsService.findAll(+schoolId, classId ? +classId : undefined);
  }

  @Get(':id/school/:schoolId')
  @Roles('school_owner', 'school_staff')
  findOne(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.studentsService.findOne(+id, +schoolId);
  }

  @Get('admission/:admissionNumber/school/:schoolId')
  findByAdmissionNumber(
    @Param('admissionNumber') admissionNumber: string,
    @Param('schoolId') schoolId: string,
  ) {
    return this.studentsService.findByAdmissionNumber(admissionNumber, +schoolId);
  }

  @Patch(':id/school/:schoolId')
  @Roles('school_owner', 'school_staff')
  update(
    @Param('id') id: string,
    @Param('schoolId') schoolId: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(+id, +schoolId, updateStudentDto);
  }

  @Delete(':id/school/:schoolId')
  @Roles('school_owner', 'school_staff')
  remove(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.studentsService.remove(+id, +schoolId);
  }
}
