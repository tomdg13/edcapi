import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  UserName: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
