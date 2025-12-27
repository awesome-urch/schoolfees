import { IsNumber, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateManualPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  schoolId: number;

  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @IsNumber()
  @IsNotEmpty()
  feeTypeId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;
}
