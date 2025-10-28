import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AccountType {
  AHORROS = 'AHORROS',
  CORRIENTE = 'CORRIENTE',
}

export enum DocumentType {
  CC = 'CC',
  CE = 'CE',
  NIT = 'NIT',
  PP = 'PP',
}

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Nombre del banco', example: 'Bancolombia' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({
    description: 'Tipo de cuenta',
    enum: AccountType,
    example: AccountType.AHORROS
  })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ description: 'Número de cuenta bancaria', example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Nombre del titular de la cuenta', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  holderName: string;

  @ApiProperty({ description: 'Documento del titular', example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  holderDocument: string;

  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: DocumentType.CC,
    default: DocumentType.CC
  })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @ApiProperty({
    description: 'Si esta cuenta debe ser la activa (solo una por vendedor)',
    default: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
