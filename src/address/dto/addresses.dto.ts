import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpsertAddressDto {
  @IsString() fullName: string;
  @IsString() phone: string;
  @IsString() line1: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() city: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zip?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
