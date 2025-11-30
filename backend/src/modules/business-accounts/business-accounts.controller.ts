import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { BusinessAccountsService } from './business-accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('business-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessAccountsController {
  constructor(private readonly accountsService: BusinessAccountsService) {}

  @Post()
  @Roles('school_owner')
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Get('school/:schoolId')
  @Roles('school_owner', 'school_staff')
  findAll(@Param('schoolId') schoolId: string) {
    return this.accountsService.findAll(+schoolId);
  }

  @Patch(':id/school/:schoolId/set-primary')
  @Roles('school_owner')
  setPrimary(@Param('id') id: string, @Param('schoolId') schoolId: string) {
    return this.accountsService.setPrimary(+id, +schoolId);
  }

  @Get('banks')
  @Roles('school_owner', 'school_staff')
  getBanks() {
    return this.accountsService.getBanks();
  }
}
