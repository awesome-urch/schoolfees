import { IsNumber, IsNotEmpty, IsString, IsEmail } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  paymentMethod: string = 'paystack';
}
