import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEpaycoConfigDto {
  @ApiProperty({
    description: 'Token público de ePayco del vendedor',
    example: '0ac5d9ead0e4740419a0a53731ab4e49',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    description: 'Token privado de ePayco (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  privateKey?: string;

  @ApiProperty({
    description: 'Indica si está en modo de prueba',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isTestMode?: boolean;

  @ApiProperty({
    description: 'Indica si la configuración está activa',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
