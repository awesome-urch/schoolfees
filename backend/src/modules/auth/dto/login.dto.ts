import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(['super_admin', 'school_owner', 'school_staff'])
  @IsOptional()
  userType?: string = 'school_owner';
}
