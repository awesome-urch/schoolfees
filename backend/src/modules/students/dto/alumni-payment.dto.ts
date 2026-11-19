import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AlumniPaymentDto {
  @IsInt()
  schoolId: number;

  // Registration / matric number the payer graduated with
  @IsString()
  @IsNotEmpty()
  admissionNumber: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
