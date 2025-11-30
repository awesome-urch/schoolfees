import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('school/:schoolId')
  @Roles('school_owner', 'school_staff')
  getSchoolDashboard(@Param('schoolId') schoolId: string) {
    return this.dashboardService.getSchoolDashboard(+schoolId);
  }

  @Get('super-admin')
  @Roles('super_admin')
  getSuperAdminDashboard() {
    return this.dashboardService.getSuperAdminDashboard();
  }
}
