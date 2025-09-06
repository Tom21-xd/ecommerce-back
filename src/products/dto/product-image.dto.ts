import { IsInt, IsOptional, IsString } from 'class-validator';

export class ProductImageDto {
  @IsString()
  base64: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
