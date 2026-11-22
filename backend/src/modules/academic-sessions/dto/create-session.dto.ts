import { IsString, IsNotEmpty, IsNumber, IsDateString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { SessionTerm } from '../../../entities/academic-session.entity';

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

  @IsEnum(SessionTerm)
  @IsOptional()
  term?: SessionTerm;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean = false;
}
