import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class ImageBase64Dto {
  @IsString() base64!: string;
  @IsOptional() @IsString() alt?: string;
  @IsOptional() @IsInt() position?: number;
}

export class CreateProductDto {
  @IsString() name!: string;
  @IsString() sku!: string;

  @Type(() => Number) @IsNumber() quantity!: number;
  @Type(() => Number) @IsNumber() price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional() @IsInt() containerId?: number;
  @IsOptional() @IsInt() unidadId?: number;
  @IsOptional() @IsInt() marcaId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageBase64Dto)
  images?: ImageBase64Dto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
