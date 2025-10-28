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
  getConfig() {
    return this.vendorPayoutsService.getOrCreateDispersionConfig();
  }

  @Patch('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Actualizar configuracion de dispersion' })
  updateConfig(@Body() dto: CreateDispersionConfigDto) {
    return this.vendorPayoutsService.updateDispersionConfig(dto);
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
  getAllBalances() {
    return this.vendorPayoutsService.getAllVendorBalances();
  }

  @Get('balance/:vendorId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Obtener balance de un vendedor especifico' })
  getVendorBalance(@Param('vendorId', ParseIntPipe) vendorId: number) {
    return this.vendorPayoutsService.calculateVendorBalance(vendorId);
  }

  // ============================================
  // ENDPOINTS DE PAYOUTS (ADMIN)
  // ============================================

  @Post('create')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Admin: Crear payout para un vendedor especifico',
  })
  createPayout(@Body() dto: ProcessPayoutDto) {
    return this.vendorPayoutsService.createPayout(dto.vendorId);
  }

  @Post('create-multiple')
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Admin: Crear payouts para multiples vendedores (o todos los elegibles)',
  })
  createMultiplePayouts(@Body() dto: ProcessMultiplePayoutsDto) {
    return this.vendorPayoutsService.createMultiplePayouts(dto.vendorIds);
  }

  @Post('execute/:payoutId')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Admin: Ejecutar transferencia real para un payout',
  })
  executePayoutTransfer(@Param('payoutId', ParseIntPipe) payoutId: number) {
    return this.vendorPayoutsService.executePayoutTransfer(payoutId);
  }

  @Delete(':payoutId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Cancelar un payout pendiente' })
  cancelPayout(@Param('payoutId', ParseIntPipe) payoutId: number) {
    return this.vendorPayoutsService.cancelPayout(payoutId);
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
  getAllPayouts(
    @Query('status') status?: PayoutStatus,
    @Query('vendorId') vendorId?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (vendorId) filters.vendorId = parseInt(vendorId);
    return this.vendorPayoutsService.getAllPayouts(filters);
  }

  @Get('vendor/:vendorId/payouts')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Ver payouts de un vendedor especifico' })
  getVendorPayouts(@Param('vendorId', ParseIntPipe) vendorId: number) {
    return this.vendorPayoutsService.getVendorPayouts(vendorId);
  }
}
