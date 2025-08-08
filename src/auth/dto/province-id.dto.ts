import { IsNotEmpty, IsNumber } from 'class-validator';

export class ProvinceIdDto {
  @IsNotEmpty()
  @IsNumber()
  pr_id: number;
}
