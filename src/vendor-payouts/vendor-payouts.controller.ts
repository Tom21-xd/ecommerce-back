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
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { VendorPayoutsService } from './vendor-payouts.service';
import { CreateDispersionConfigDto } from './dto/create-dispersion-config.dto';
import {
  ProcessPayoutDto,
  ProcessMultiplePayoutsDto,
} from './dto/process-payout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PayoutStatus } from '@prisma/client';

@ApiTags('Vendor Payouts')
@ApiBearerAuth()
@Controller('vendor-payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorPayoutsController {
  constructor(private readonly vendorPayoutsService: VendorPayoutsService) {}

  // ============================================
  // ENDPOINTS DE CONFIGURACION (ADMIN)
  // ============================================

  @Get('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Obtener configuracion de dispersion' })
  async getConfig(@Res() res: Response) {
    const result = await this.vendorPayoutsService.getOrCreateDispersionConfig();
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Patch('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Actualizar configuracion de dispersion' })
  async updateConfig(@Body() dto: CreateDispersionConfigDto, @Res() res: Response) {
    const result = await this.vendorPayoutsService.updateDispersionConfig(dto);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  // ============================================
  // ENDPOINTS DE BALANCE (VENDEDORES Y ADMIN)
  // ============================================

  @Get('my-balance')
  @Roles('SELLER', 'BUYER')
  @ApiOperation({ summary: 'Vendedor: Obtener mi balance disponible' })
  async getMyBalance(@Request() req, @Res() res: Response) {
    const result = await this.vendorPayoutsService.calculateVendorBalance(req.user.id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Get('balances')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Obtener balances de todos los vendedores' })
  async getAllBalances(@Res() res: Response) {
    const result = await this.vendorPayoutsService.getAllVendorBalances();
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Get('balance/:vendorId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Obtener balance de un vendedor especifico' })
  async getVendorBalance(@Param('vendorId', ParseIntPipe) vendorId: number, @Res() res: Response) {
    const result = await this.vendorPayoutsService.calculateVendorBalance(vendorId);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  // ============================================
  // ENDPOINTS DE PAYOUTS (ADMIN)
  // ============================================

  @Post('create')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Admin: Crear payout para un vendedor especifico',
  })
  async createPayout(@Body() dto: ProcessPayoutDto, @Res() res: Response) {
    const result = await this.vendorPayoutsService.createPayout(dto.vendorId);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Post('create-multiple')
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Admin: Crear payouts para multiples vendedores (o todos los elegibles)',
  })
  async createMultiplePayouts(@Body() dto: ProcessMultiplePayoutsDto, @Res() res: Response) {
    const result = await this.vendorPayoutsService.createMultiplePayouts(dto.vendorIds);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Post('execute/:payoutId')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Admin: Ejecutar transferencia real para un payout',
  })
  async executePayoutTransfer(@Param('payoutId', ParseIntPipe) payoutId: number, @Res() res: Response) {
    const result = await this.vendorPayoutsService.executePayoutTransfer(payoutId);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Delete(':payoutId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Cancelar un payout pendiente' })
  async cancelPayout(@Param('payoutId', ParseIntPipe) payoutId: number, @Res() res: Response) {
    const result = await this.vendorPayoutsService.cancelPayout(payoutId);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  // ============================================
  // ENDPOINTS DE CONSULTA
  // ============================================

  @Get('my-payouts')
  @Roles('SELLER', 'BUYER')
  @ApiOperation({ summary: 'Vendedor: Ver historial de mis payouts' })
  async getMyPayouts(@Request() req, @Res() res: Response) {
    const result = await this.vendorPayoutsService.getVendorPayouts(req.user.id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Get('all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Ver todos los payouts' })
  @ApiQuery({ name: 'status', required: false, enum: PayoutStatus })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  async getAllPayouts(
    @Query('status') status?: PayoutStatus,
    @Query('vendorId') vendorId?: string,
    @Res() res?: Response,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (vendorId) filters.vendorId = parseInt(vendorId);
    const result = await this.vendorPayoutsService.getAllPayouts(filters);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Get('vendor/:vendorId/payouts')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Ver payouts de un vendedor especifico' })
  async getVendorPayouts(@Param('vendorId', ParseIntPipe) vendorId: number, @Res() res: Response) {
    const result = await this.vendorPayoutsService.getVendorPayouts(vendorId);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }
}
