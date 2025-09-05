import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

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
}
