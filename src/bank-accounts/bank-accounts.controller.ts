import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Bank Accounts')
@ApiBearerAuth()
@Controller('bank-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post()
  @Roles('SELLER', 'BUYER', 'ADMIN')
  @ApiOperation({ summary: 'Crear cuenta bancaria (solo vendedores)' })
  create(@Request() req, @Body() createBankAccountDto: CreateBankAccountDto) {
    return this.bankAccountsService.create(req.user.id, createBankAccountDto);
  }

  @Get('my-accounts')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  @ApiOperation({ summary: 'Obtener mis cuentas bancarias' })
  async findMyAccounts(@Request() req, @Res() res: Response) {
    const result = await this.bankAccountsService.findAllByVendor(req.user.id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Get('my-active')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  @ApiOperation({ summary: 'Obtener mi cuenta bancaria activa' })
  findMyActive(@Request() req) {
    return this.bankAccountsService.findActiveByVendor(req.user.id);
  }

  @Get('vendor/:vendorId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Obtener cuentas de un vendedor específico' })
  findByVendor(@Param('vendorId', ParseIntPipe) vendorId: number) {
    return this.bankAccountsService.findAllByVendor(vendorId);
  }

  @Get('all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Listar todas las cuentas bancarias' })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  findAll(
    @Query('isVerified') isVerified?: string,
    @Query('isActive') isActive?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    const filters: any = {};

    if (isVerified !== undefined) {
      filters.isVerified = isVerified === 'true';
    }
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (vendorId) {
      filters.vendorId = parseInt(vendorId);
    }

    return this.bankAccountsService.findAll(filters);
  }

  @Get(':id')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  @ApiOperation({ summary: 'Obtener una cuenta bancaria por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bankAccountsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar cuenta bancaria' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ) {
    return this.bankAccountsService.update(
      id,
      req.user.id,
      req.user.role,
      updateBankAccountDto,
    );
  }

  @Delete(':id')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar cuenta bancaria' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.bankAccountsService.remove(id, req.user.id, req.user.role);
  }

  @Patch(':id/verify')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Verificar cuenta bancaria' })
  verify(@Param('id', ParseIntPipe) id: number) {
    return this.bankAccountsService.toggleVerification(id, true);
  }

  @Patch(':id/unverify')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Desverificar cuenta bancaria' })
  unverify(@Param('id', ParseIntPipe) id: number) {
    return this.bankAccountsService.toggleVerification(id, false);
  }
}
