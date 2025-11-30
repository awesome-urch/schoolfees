import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { SchoolOwner } from '../../entities/school-owner.entity';
import { SchoolStaff } from '../../entities/school-staff.entity';
import { SuperAdmin } from '../../entities/super-admin.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SchoolOwner)
    private schoolOwnerRepo: Repository<SchoolOwner>,
    @InjectRepository(SchoolStaff)
    private schoolStaffRepo: Repository<SchoolStaff>,
    @InjectRepository(SuperAdmin)
    private superAdminRepo: Repository<SuperAdmin>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, phone } = registerDto;

    // Check if email already exists
    const existing = await this.schoolOwnerRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create school owner
    const schoolOwner = this.schoolOwnerRepo.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      isApproved: false,
      isActive: true,
    });

    await this.schoolOwnerRepo.save(schoolOwner);

    return {
      message: 'Registration successful. Please wait for admin approval.',
      userId: schoolOwner.id,
    };
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
    if (refreshToken) {
      await this.refreshTokenRepo.delete({ token: refreshToken });
    }
    return { message: 'Logout successful' };
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
