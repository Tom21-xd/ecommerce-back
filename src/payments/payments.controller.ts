import { Controller, Get, Post, Patch, Param, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payments')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('order/:pedidoId')
  @ApiOperation({ summary: 'List payments of an order' })
  async list(@Param('pedidoId') pedidoId: string, @Res() res: Response) {
    const result = await this.service.listByOrder(Number(pedidoId));
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Post('order/:pedidoId')
  @ApiOperation({ summary: 'Attach payment evidence to order' })
  async add(@Param('pedidoId') pedidoId: string, @Body() body: { amount: number; method?: PaymentMethod; provider?: string; providerRef?: string; evidenceUrl?: string }, @Res() res: Response) {
    const result = await this.service.addEvidence(Number(pedidoId), body);
    return res.status(HttpStatus.CREATED).json({ status: 201, message: 'created', result });
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard) @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set payment status (admin)' })
  async setStatus(@Param('id') id: string, @Body() body: { status: PaymentStatus }, @Res() res: Response) {
    const result = await this.service.setStatus(Number(id), body.status);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'updated', result });
  }
}