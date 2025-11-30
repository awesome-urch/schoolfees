import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  initializePayment(@Body() initializePaymentDto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(initializePaymentDto);
  }

  @Get('verify/:reference')
  verifyPayment(@Param('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference);
  }

  @Get('school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('school_owner', 'school_staff')
  findAll(
    @Param('schoolId') schoolId: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll(+schoolId, status);
  }

  @Get('school/:schoolId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('school_owner', 'school_staff')
  getStats(@Param('schoolId') schoolId: string) {
    return this.paymentsService.getPaymentStats(+schoolId);
  }

  @Get(':id/school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('school_owner', 'school_staff')
  findOne(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.paymentsService.findOne(+id, +schoolId);
  }

  @Get('student/:studentId/school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('school_owner', 'school_staff')
  getStudentPayments(
    @Param('studentId') studentId: string,
    @Param('schoolId') schoolId: string,
  ) {
    return this.paymentsService.getStudentPayments(+studentId, +schoolId);
  }
}
