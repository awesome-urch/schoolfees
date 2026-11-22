import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SchoolOwner } from '../../entities/school-owner.entity';
import { School } from '../../entities/school.entity';
import { SchoolStaff } from '../../entities/school-staff.entity';
import { SuperAdmin } from '../../entities/super-admin.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { AcademicSession } from '../../entities/academic-session.entity';
import { BusinessAccount } from '../../entities/business-account.entity';
import { Settlement } from '../../entities/settlement.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SchoolOwner)
    private schoolOwnerRepo: Repository<SchoolOwner>,
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    @InjectRepository(SchoolStaff)
    private schoolStaffRepo: Repository<SchoolStaff>,
    @InjectRepository(SuperAdmin)
    private superAdminRepo: Repository<SuperAdmin>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(
    registerDto: RegisterDto,
    files?: { logo?: Express.Multer.File[]; approvalLetter?: Express.Multer.File[] },
    skipPortalSync = false,
  ) {
    const { email, password, fullName, phone, schoolName,schoolCode, institutionType, website} = registerDto;

    // Check if email already exists
    const existing = await this.schoolOwnerRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-generate a unique school code when none is provided
    let code = schoolCode;
    if (!code) {
      do {
        code = 'SCH-' + Math.floor(1000 + Math.random() * 9000);
      } while (await this.schoolOwnerRepo.findOne({ where: { code } }));
    }

    // Create school owner
    const schoolOwner = this.schoolOwnerRepo.create({
      name: schoolName,
      code,
      email,
      password: hashedPassword,
      fullName,
      phone,
      isApproved: false,
      isActive: true,
    });

    await this.schoolOwnerRepo.save(schoolOwner);

    const school = this.schoolRepo.create({
      ownerId: schoolOwner.id,
      name: schoolName,
      phone,
      email,
      isActive: true,
      institutionType: institutionType || undefined,
      website: website || null,
      logoUrl: files?.logo?.[0] ? `/uploads/schools/${files.logo[0].filename}` : null,
      approvalLetterUrl: files?.approvalLetter?.[0] ? `/uploads/schools/${files.approvalLetter[0].filename}` : null,
    });

    await this.schoolRepo.save(school);

    await this.mailService.sendRegistrationPending(schoolOwner);

    if (!skipPortalSync) {
      this.syncToSchoolPortal(registerDto, code, schoolOwner.id).catch((err) => {
        console.error('School Portal sync failed:', err?.message || err);
      });
    }

    return {
      message: 'Registration successful. Please wait for admin approval.',
      userId: schoolOwner.id,
      schoolId: school.id,
    };
  }

  private async syncToSchoolPortal(
    registerDto: RegisterDto,
    schoolCode: string,
    feePortalId: number,
  ) {
    const baseUrl =
      this.configService.get<string>('SCHOOLPORTAL_API_URL') ||
      'http://localhost:5001/api';

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: registerDto.schoolName,
        schoolCode,
        email: registerDto.email,
        password: registerDto.password,
        fullName: registerDto.fullName,
        schoolPhone: registerDto.phone,
        institutionType: registerDto.institutionType,
        feePortalId: String(feePortalId),
      }),
    });

    if (!response.ok) {
      const body: any = await response.json().catch(() => ({}));
      throw new Error(
        typeof body?.message === 'string'
          ? body.message
          : `Portal sync failed with status ${response.status}`,
      );
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password, userType } = loginDto;

    let user: any;
    let type = userType || 'school_owner';

    // Find user based on type
    if (type === 'super_admin') {
      user = await this.superAdminRepo.findOne({ where: { email } });
    } else if (type === 'school_staff') {
      user = await this.schoolStaffRepo.findOne({ where: { email } });
    } else {
      user = await this.schoolOwnerRepo.findOne({ where: { email } });
      type = 'school_owner';
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if school owner is approved
    if (type === 'school_owner' && !user.isApproved) {
      throw new ForbiddenException('Account pending approval');
    }

    // Check if active
    if (user.isActive === false) {
      throw new ForbiddenException('Account is inactive');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, type);

    return {
      message: 'Login successful',
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: type,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Check if refresh token exists in database
      const tokenRecord = await this.refreshTokenRepo.findOne({
        where: {
          token: refreshToken,
          userId: payload.userId,
          userType: payload.userType,
        },
      });

      if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Generate new access token
      const accessToken = this.jwtService.sign({
        userId: payload.userId,
        email: payload.email,
        userType: payload.userType,
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string) {
    await this.refreshTokenRepo.delete({ token: refreshToken });
    return { message: 'Logged out successfully' };
  }

  async getAllSchoolOwners() {
    return this.schoolOwnerRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async approveSchoolOwner(id: number) {
    const owner = await this.schoolOwnerRepo.findOne({ where: { id } });
    if (!owner) {
      throw new BadRequestException('School owner not found');
    }

    owner.isApproved = true;
    owner.isActive = true;
    await this.schoolOwnerRepo.save(owner);

    const school = await this.schoolRepo.findOne({ where: { ownerId: owner.id } });
    await this.mailService.sendApproved(owner, school?.id ?? null);

    return { message: 'School owner approved successfully', owner };
  }

  async rejectSchoolOwner(id: number) {
    const owner = await this.schoolOwnerRepo.findOne({ where: { id } });
    if (!owner) {
      throw new BadRequestException('School owner not found');
    }

    owner.isApproved = false;
    owner.isActive = false;
    await this.schoolOwnerRepo.save(owner);

    return { message: 'School owner rejected successfully', owner };
  }

  async deleteSchoolOwner(id: number) {
    const owner = await this.schoolOwnerRepo.findOne({ where: { id } });
    if (!owner) {
      throw new BadRequestException('School owner not found');
    }

    const schools = await this.schoolRepo.find({ where: { ownerId: id } });
    const schoolIds = schools.map((s) => s.id);

    await this.schoolOwnerRepo.manager.transaction(async (manager) => {
      if (schoolIds.length > 0) {
        // Relations without ON DELETE CASCADE must be removed first
        await manager.delete(Settlement, { schoolId: In(schoolIds) });
        await manager.delete(BusinessAccount, { schoolId: In(schoolIds) });
        await manager.delete(AcademicSession, { schoolId: In(schoolIds) });

        const staff = await manager.find(SchoolStaff, {
          where: { schoolId: In(schoolIds) },
          select: ['id'],
        });
        await manager.delete(SchoolStaff, { schoolId: In(schoolIds) });
        if (staff.length > 0) {
          await manager.delete(RefreshToken, {
            userId: In(staff.map((s) => s.id)),
            userType: 'school_staff',
          });
        }

        // classes, fee_types, payments and students cascade via DB foreign keys
        await manager.delete(School, schoolIds);
      }

      await manager.delete(RefreshToken, { userId: id, userType: 'school_owner' });
      await manager.delete(SchoolOwner, id);
    });

    return { message: 'School owner deleted successfully' };
  }

  async resetSchoolOwnerPassword(id: number, newPassword: string) {
    const owner = await this.schoolOwnerRepo.findOne({ where: { id } });
    if (!owner) {
      throw new BadRequestException('School owner not found');
    }

    const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!newPassword || newPassword.length < 8 || !passwordRule.test(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters and contain uppercase, lowercase, number and special character',
      );
    }

    owner.password = await bcrypt.hash(newPassword, 10);
    await this.schoolOwnerRepo.save(owner);

    // Invalidate existing sessions so the old credentials stop working
    await this.refreshTokenRepo.delete({ userId: id, userType: 'school_owner' });

    return { message: 'Password reset successfully' };
  }

  async forgotPassword(email: string) {
    // Always respond the same way so this can't be used to check which
    // emails have accounts.
    const generic = {
      message: 'If that email has an account, a reset link is on its way.',
    };

    const e = email.trim().toLowerCase();
    const [owner, staff] = await Promise.all([
      this.schoolOwnerRepo.findOne({ where: { email: e } }),
      this.schoolStaffRepo.findOne({ where: { email: e } }),
    ]);

    const user = owner || staff;
    const userType = owner ? 'school_owner' : 'school_staff';
    if (!user) return generic;

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await (owner ? this.schoolOwnerRepo : this.schoolStaffRepo).save(user);

    const base =
      this.configService.get('FRONTEND_URL') || 'https://schoolfees.com.ng';
    const resetUrl = `${base}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}&type=${userType}`;

    await this.mailService.sendPasswordReset(
      user.email,
      user.fullName || user.name || 'there',
      resetUrl,
    );

    return generic;
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const e = email.trim().toLowerCase();
    const [owner, staff] = await Promise.all([
      this.schoolOwnerRepo.findOne({ where: { email: e } }),
      this.schoolStaffRepo.findOne({ where: { email: e } }),
    ]);

    const user = owner || staff;
    const userType = owner ? 'school_owner' : 'school_staff';
    const valid =
      user &&
      user.resetToken &&
      user.resetToken === token &&
      user.resetTokenExpires &&
      new Date() < new Date(user.resetTokenExpires);

    if (!valid) {
      throw new BadRequestException(
        'Reset link is invalid or has expired. Request a new one.',
      );
    }

    const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!newPassword || newPassword.length < 8 || !passwordRule.test(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters and contain uppercase, lowercase, number and special character',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null as any;
    user.resetTokenExpires = null as any;
    await (owner ? this.schoolOwnerRepo : this.schoolStaffRepo).save(user);

    // Kill existing sessions so old credentials stop working
    await this.refreshTokenRepo.delete({ userId: user.id, userType });

    return { message: 'Password updated. You can now log in.' };
  }

  async changePassword(user: { userId: number; userType: string }, currentPassword: string, newPassword: string) {
    const repo: Repository<any> =
      user.userType === 'super_admin'
        ? this.superAdminRepo
        : user.userType === 'school_staff'
          ? this.schoolStaffRepo
          : this.schoolOwnerRepo;

    const record = await repo.findOne({ where: { id: user.userId } });
    if (!record || !(await bcrypt.compare(currentPassword, record.password))) {
      throw new BadRequestException('Current password is incorrect');
    }

    record.password = await bcrypt.hash(newPassword, 10);
    await repo.save(record);

    // Invalidate existing sessions so a stolen token can't stay alive
    await this.refreshTokenRepo.delete({ userId: user.userId, userType: user.userType });

    return { message: 'Password updated successfully' };
  }

  private async generateTokens(userId: number, email: string, userType: string) {
    const payload = { userId, email, userType };

    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepo.save({
      userId,
      userType,
      token: refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  // Clean expired tokens (can be called by a cron job)
  async cleanExpiredTokens() {
    await this.refreshTokenRepo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
