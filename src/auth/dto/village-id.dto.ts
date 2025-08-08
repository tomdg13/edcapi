import { IsNotEmpty, IsNumber } from 'class-validator';

export class VillageIdDto {
  @IsNotEmpty()
  @IsNumber()
  pr_id: number;

  @IsNotEmpty()
  @IsNumber()
  dr_id: number;
}