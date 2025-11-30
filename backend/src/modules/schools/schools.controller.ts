import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @Roles('school_owner')
  create(@CurrentUser() user: any, @Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(user.userId, createSchoolDto);
  }

  @Get()
  @Roles('super_admin', 'school_owner')
  findAll(@CurrentUser() user: any) {
    const ownerId = user.userType === 'school_owner' ? user.userId : undefined;
    return this.schoolsService.findAll(ownerId);
  }

  @Get(':id')
  @Roles('super_admin', 'school_owner', 'school_staff')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const ownerId = user.userType === 'school_owner' ? user.userId : undefined;
    return this.schoolsService.findOne(+id, ownerId);
  }

  @Get(':id/stats')
  @Roles('super_admin', 'school_owner', 'school_staff')
  getStats(@Param('id') id: string) {
    return this.schoolsService.getStats(+id);
  }

  @Patch(':id')
  @Roles('school_owner')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
  ) {
    return this.schoolsService.update(+id, user.userId, updateSchoolDto);
  }

  @Delete(':id')
  @Roles('school_owner')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.schoolsService.remove(+id, user.userId);
  }
}
