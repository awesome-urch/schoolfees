import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AcademicSessionsService } from './academic-sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('academic-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicSessionsController {
  constructor(private readonly sessionsService: AcademicSessionsService) {}

  @Post()
  @Roles('school_owner', 'school_staff')
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(createSessionDto);
  }

  @Get('school/:schoolId')
  @Roles('school_owner', 'school_staff')
  findAll(@Param('schoolId') schoolId: string) {
    return this.sessionsService.findAll(+schoolId);
  }

  @Get(':id/school/:schoolId')
  @Roles('school_owner', 'school_staff')
  findOne(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.sessionsService.findOne(+id, +schoolId);
  }

  @Patch(':id/school/:schoolId/set-current')
  @Roles('school_owner', 'school_staff')
  setCurrent(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.sessionsService.setCurrent(+id, +schoolId);
  }
}
