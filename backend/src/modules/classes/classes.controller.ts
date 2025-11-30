import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles('school_owner', 'school_staff')
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get('school/:schoolId')
  @Roles('school_owner', 'school_staff')
  findAll(@Param('schoolId') schoolId: string) {
    return this.classesService.findAll(+schoolId);
  }

  @Get(':id/school/:schoolId')
  @Roles('school_owner', 'school_staff')
  findOne(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.classesService.findOne(+id, +schoolId);
  }
}
