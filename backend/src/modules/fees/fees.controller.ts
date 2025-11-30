import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeTypeDto } from './dto/create-fee-type.dto';
import { UpdateFeeTypeDto } from './dto/update-fee-type.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post()
  @Roles('school_owner', 'school_staff')
  create(@Body() createFeeTypeDto: CreateFeeTypeDto) {
    return this.feesService.create(createFeeTypeDto);
  }

  @Get('school/:schoolId')
  findAll(
    @Param('schoolId') schoolId: string,
    @Query('sessionId') sessionId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.feesService.findAll(
      +schoolId,
      sessionId ? +sessionId : undefined,
      classId ? +classId : undefined,
    );
  }

  @Get(':id/school/:schoolId')
  @Roles('school_owner', 'school_staff')
  findOne(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.feesService.findOne(+id, +schoolId);
  }

  @Patch(':id/school/:schoolId')
  @Roles('school_owner', 'school_staff')
  update(
    @Param('id') id: string,
    @Param('schoolId') schoolId: string,
    @Body() updateFeeTypeDto: UpdateFeeTypeDto,
  ) {
    return this.feesService.update(+id, +schoolId, updateFeeTypeDto);
  }

  @Delete(':id/school/:schoolId')
  @Roles('school_owner', 'school_staff')
  remove(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.feesService.remove(+id, +schoolId);
  }
}
