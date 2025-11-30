import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateFeeTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
