import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Patch, Delete, Param, UseInterceptors, UploadedFiles, BadRequestException, Headers } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import * as fs from 'fs';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const schoolUploadOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const dir = join(process.cwd(), 'uploads', 'schools');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'logo' && !file.mimetype.match(/^image\//)) {
      return cb(new BadRequestException('Logo must be an image'), false);
    }
    if (file.fieldname === 'approvalLetter' && !file.mimetype.match(/^(image\/|application\/pdf)/)) {
      return cb(new BadRequestException('Approval letter must be an image or PDF'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileFieldsInterceptor(
    [
      { name: 'logo', maxCount: 1 },
      { name: 'approvalLetter', maxCount: 1 },
    ],
    schoolUploadOptions,
  ))
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFiles() files?: { logo?: Express.Multer.File[]; approvalLetter?: Express.Multer.File[] },
    @Headers('x-sync-source') syncSource?: string,
  ) {
    return this.authService.register(registerDto, files, syncSource === 'school-portal');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.token, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: any, @Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user, dto.currentPassword, dto.newPassword);
  }

  @Get('school-owners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  getSchoolOwners() {
    return this.authService.getAllSchoolOwners();
  }

  @Patch('school-owners/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  approveSchoolOwner(@Param('id') id: string) {
    return this.authService.approveSchoolOwner(+id);
  }

  @Patch('school-owners/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  rejectSchoolOwner(@Param('id') id: string) {
    return this.authService.rejectSchoolOwner(+id);
  }

  @Patch('school-owners/:id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  resetSchoolOwnerPassword(@Param('id') id: string, @Body('password') password: string) {
    return this.authService.resetSchoolOwnerPassword(+id, password);
  }

  @Delete('school-owners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  deleteSchoolOwner(@Param('id') id: string) {
    return this.authService.deleteSchoolOwner(+id);
  }
}
