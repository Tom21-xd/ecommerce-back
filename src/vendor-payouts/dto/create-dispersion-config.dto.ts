import { IsInt, IsNumber, IsBoolean, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDispersionConfigDto {
  @ApiProperty({
    description: 'Frecuencia de dispersion en dias (ej: 7, 15, 30)',
    example: 7,
    default: 7
  })
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  dispersalFrequency?: number;

  @ApiProperty({
    description: 'Comision del admin en porcentaje (ej: 10.00 = 10%)',
    example: 10.00,
    default: 10.00
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  adminCommission?: number;

  @ApiProperty({
    description: 'Monto minimo para dispersar en COP',
    example: 50000,
    default: 50000
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumPayout?: number;

  @ApiProperty({
    description: 'Activar/desactivar dispersiones automaticas',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isAutoDispersalOn?: boolean;
}
