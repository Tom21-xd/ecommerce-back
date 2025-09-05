import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterUsersDto {
  @IsString()
  @Length(5, 20)
  username: string;

  @IsString()
  @Length(6, 12)
  password: string;

  @IsString()
  @Length(5, 30)
  @IsEmail()
  email: string;
}
