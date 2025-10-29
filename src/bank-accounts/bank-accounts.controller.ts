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
  async create(@Request() req, @Body() createBankAccountDto: CreateBankAccountDto, @Res() res: Response) {
    const result = await this.bankAccountsService.create(req.user.id, createBankAccountDto);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
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
  async findMyActive(@Request() req, @Res() res: Response) {
    const result = await this.bankAccountsService.findActiveByVendor(req.user.id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Get('vendor/:vendorId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Obtener cuentas de un vendedor específico' })
  async findByVendor(@Param('vendorId', ParseIntPipe) vendorId: number, @Res() res: Response) {
    const result = await this.bankAccountsService.findAllByVendor(vendorId);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Get('all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Listar todas las cuentas bancarias' })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  async findAll(
    @Query('isVerified') isVerified?: string,
    @Query('isActive') isActive?: string,
    @Query('vendorId') vendorId?: string,
    @Res() res?: Response,
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

    const result = await this.bankAccountsService.findAll(filters);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Get(':id')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  @ApiOperation({ summary: 'Obtener una cuenta bancaria por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const result = await this.bankAccountsService.findOne(id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Patch(':id')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar cuenta bancaria' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
    @Res() res: Response,
  ) {
    const result = await this.bankAccountsService.update(
      id,
      req.user.id,
      req.user.role,
      updateBankAccountDto,
    );
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Delete(':id')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar cuenta bancaria' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req, @Res() res: Response) {
    const result = await this.bankAccountsService.remove(id, req.user.id, req.user.role);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Patch(':id/verify')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Verificar cuenta bancaria' })
  async verify(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const result = await this.bankAccountsService.toggleVerification(id, true);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Patch(':id/unverify')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Desverificar cuenta bancaria' })
  async unverify(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const result = await this.bankAccountsService.toggleVerification(id, false);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }
}
