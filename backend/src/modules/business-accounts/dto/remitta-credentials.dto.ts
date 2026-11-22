import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RemittaCredentialsDto {
  @IsString()
  @IsOptional()
  remittaMerchantId?: string;

  @IsString()
  @IsOptional()
  remittaApiKey?: string;

  @IsString()
  @IsOptional()
  remittaPublicKey?: string;

  @IsString()
  @IsNotEmpty()
  remittaServiceTypeId: string;
}
