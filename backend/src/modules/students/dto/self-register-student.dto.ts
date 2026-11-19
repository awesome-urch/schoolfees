import { IsString, IsNotEmpty, IsEmail, IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SelfRegisterStudentDto {
  // @Type(() => Number) is required: multipart form fields arrive as strings
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  schoolId: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  classId?: number;

  @IsString()
  @IsOptional()
  admissionNumber?: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  otherNames?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  parentName: string;

  @IsString()
  @IsNotEmpty()
  parentPhone: string;

  @IsEmail()
  @IsOptional()
  parentEmail?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(['Male', 'Female', 'Other'])
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  waecNumber?: string;

  @IsString()
  @IsOptional()
  jambNumber?: string;
}
