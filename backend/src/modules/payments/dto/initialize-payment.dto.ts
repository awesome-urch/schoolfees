import { IsNumber, IsNotEmpty, IsString, IsEmail, IsIn, IsOptional } from 'class-validator';

export class InitializePaymentDto {
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

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  @IsIn(['paystack', 'remitta'])
  paymentMethod: string = 'paystack';
}
