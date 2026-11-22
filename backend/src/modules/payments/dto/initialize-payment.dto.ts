import { IsNumber, IsNotEmpty, IsString, IsEmail, IsIn, IsOptional, IsArray, ArrayMinSize, ValidateIf } from 'class-validator';

export class InitializePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  schoolId: number;

  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @IsOptional()
  @IsNumber()
  feeTypeId: number;

  // Multiple fee items paid together in one transaction; each item gets
  // its own payment record but they all share a single reference.
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  feeTypeIds: number[];

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  // Empty string from the hidden field shouldn't trip @IsEmail.
  @ValidateIf((o) => !!o.email)
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsIn(['paystack', 'remitta'])
  paymentMethod: string = 'paystack';
}
