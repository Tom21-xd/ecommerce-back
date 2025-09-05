import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(5)
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 32)
  password: string;
}
