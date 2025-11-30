import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('super_admin', 'school_owner')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Roles('super_admin', 'school_owner', 'school_staff')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'school_owner', 'school_staff')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }
}
