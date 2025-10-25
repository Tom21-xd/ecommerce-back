import { ApiProperty } from '@nestjs/swagger';
import {
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePaymentEpaycoDto {
  @ApiProperty({
    description: 'ID del pedido',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  pedidoId: number;

  @ApiProperty({
    description: 'ID del vendedor que recibe el pago',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  sellerId: number;

  @ApiProperty({
    description: 'Monto total del pago',
    example: 15895.38,
  })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Valor del impuesto (IVA)',
    example: 2341.18,
    required: false,
  })
  @IsOptional()
  tax?: number;

  @ApiProperty({
    description: 'Valor del impuesto al consumo',
    example: 1232.2,
    required: false,
  })
  @IsOptional()
  taxIco?: number;

  @ApiProperty({
    description: 'Base gravable',
    example: 12322,
    required: false,
  })
  @IsOptional()
  taxBase?: number;

  @ApiProperty({
    description: 'Descripción del producto/servicio',
    example: 'Compra de productos ecológicos',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Referencia de pago externa (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  externalRef?: string;
}
