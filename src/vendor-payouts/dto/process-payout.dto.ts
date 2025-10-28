import { IsInt, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessPayoutDto {
  @ApiProperty({
    description: 'ID del vendedor para procesar el payout',
    example: 1
  })
  @IsInt()
  vendorId: number;
}

export class ProcessMultiplePayoutsDto {
  @ApiProperty({
    description: 'Array de IDs de vendedores para procesar payouts',
    example: [1, 2, 3],
    required: false
  })
  @IsArray()
  @IsOptional()
  vendorIds?: number[];
}
