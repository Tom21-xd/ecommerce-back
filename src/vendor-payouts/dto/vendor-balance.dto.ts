import { ApiProperty } from '@nestjs/swagger';

export class VendorBalanceDto {
  @ApiProperty({ description: 'ID del vendedor' })
  vendorId: number;

  @ApiProperty({ description: 'Nombre del vendedor' })
  vendorName: string;

  @ApiProperty({ description: 'Email del vendedor' })
  vendorEmail: string;

  @ApiProperty({ description: 'Total de ventas confirmadas (monto bruto)' })
  totalSales: number;

  @ApiProperty({ description: 'Comision del admin' })
  adminCommission: number;

  @ApiProperty({ description: 'Monto neto disponible para dispersar' })
  availableBalance: number;

  @ApiProperty({ description: 'Total ya dispersado al vendedor' })
  totalDispersed: number;

  @ApiProperty({ description: 'Cuenta bancaria activa' })
  activeBankAccount: any | null;

  @ApiProperty({ description: 'Tiene cuenta bancaria verificada' })
  hasBankAccountVerified: boolean;
}
