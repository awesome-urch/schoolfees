import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { StudentsModule } from './modules/students/students.module';
import { FeesModule } from './modules/fees/fees.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AcademicSessionsModule } from './modules/academic-sessions/academic-sessions.module';
import { BusinessAccountsModule } from './modules/business-accounts/business-accounts.module';
import { RolesModule } from './modules/roles/roles.module';
import { ClassesModule } from './modules/classes/classes.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRoot(typeOrmConfig),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL) || 60,
      limit: parseInt(process.env.THROTTLE_LIMIT) || 10,
    }]),

    // Feature modules
    AuthModule,
    SchoolsModule,
    StudentsModule,
    FeesModule,
    PaymentsModule,
    DashboardModule,
    AcademicSessionsModule,
    BusinessAccountsModule,
    RolesModule,
    ClassesModule,
  ],
})
export class AppModule {}
