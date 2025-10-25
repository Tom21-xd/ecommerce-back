import { ApiProperty } from '@nestjs/swagger';

export class EpaycoButtonDataDto {
  @ApiProperty({ description: 'Clave pública de ePayco del vendedor' })
  publicKey: string;

  @ApiProperty({ description: 'Monto total a pagar' })
  amount: number;

  @ApiProperty({ description: 'Valor del impuesto', required: false })
  tax?: number;

  @ApiProperty({
    description: 'Valor del impuesto al consumo',
    required: false,
  })
  taxIco?: number;

  @ApiProperty({ description: 'Base gravable', required: false })
  taxBase?: number;

  @ApiProperty({ description: 'Nombre del producto/servicio' })
  name: string;

  @ApiProperty({ description: 'Descripción del pago' })
  description: string;

  @ApiProperty({ description: 'Moneda (COP, USD, etc)' })
  currency: string;

  @ApiProperty({ description: 'País (CO, US, etc)' })
  country: string;

  @ApiProperty({ description: 'Indica si es prueba o producción' })
  test: boolean;

  @ApiProperty({ description: 'URL de respuesta (opcional)', required: false })
  responseUrl?: string;

  @ApiProperty({
    description: 'URL de confirmación (webhook)',
    required: false,
  })
  confirmationUrl?: string;

  @ApiProperty({ description: 'Referencia externa', required: false })
  externalRef?: string;
}
