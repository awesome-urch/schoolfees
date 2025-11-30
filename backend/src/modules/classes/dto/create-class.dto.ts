import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsNumber()
  @IsNotEmpty()
  schoolId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
