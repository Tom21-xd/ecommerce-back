import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsInt as IsIntField,
  ValidateNested,
  IsArray as IsArrayField,
  IsObject,
  IsBoolean,
  Min
} from 'class-validator';

import { Type } from 'class-transformer';
import { ProductImageDto } from './product-image.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  sku: string;

  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
  @IsOptional()
  @IsInt()
  containerId?: number;

  @IsOptional()
  @IsInt()
  unidadId?: number;

  @IsOptional()
  @IsInt()
  marcaId?: number;

  @IsOptional()
  @IsArray()
  @IsIntField({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArrayField()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}
