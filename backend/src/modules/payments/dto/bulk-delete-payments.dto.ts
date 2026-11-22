import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';

export class BulkDeletePaymentsDto {
  @IsNumber()
  schoolId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  paymentIds: number[];
}
