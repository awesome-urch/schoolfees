import { IsString, IsNotEmpty, IsNumber, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsNumber()
  @IsNotEmpty()
  schoolId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean = false;
}
