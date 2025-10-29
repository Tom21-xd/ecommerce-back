import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { Role, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePaymentEpaycoDto } from './dto/create-payment-epayco.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('order/:pedidoId')
  @ApiOperation({ summary: 'List payments of an order' })
  async list(@Param('pedidoId') pedidoId: string, @Res() res: Response) {
    const result = await this.service.listByOrder(Number(pedidoId));
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Post('order/:pedidoId')
  @ApiOperation({ summary: 'Attach payment evidence to order' })
  async add(
    @Param('pedidoId') pedidoId: string,
    @Body()
    body: {
      amount: number;
      method?: PaymentMethod;
      provider?: string;
      providerRef?: string;
      evidenceUrl?: string;
    },
    @Res() res: Response,
  ) {
    const result = await this.service.addEvidence(Number(pedidoId), body);
    return res
      .status(HttpStatus.CREATED)
      .json({ status: 201, message: 'created', result });
  }

  @Post('epayco/generate-button')
  @ApiOperation({
    summary: 'Generar datos del botón de pago ePayco por vendedor',
    description:
      'Genera los datos necesarios para renderizar el botón de pago de ePayco con la configuración del vendedor especificado',
  })
  async generateEpaycoButton(
    @Body() dto: CreatePaymentEpaycoDto,
    @Res() res: Response,
  ) {
    const result = await this.service.generateEpaycoButtonData(dto);
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Public()
  @Post('webhook/epayco')
  @ApiOperation({
    summary: 'Webhook de confirmación de ePayco',
    description: 'Endpoint para recibir confirmaciones de pago desde ePayco',
  })
  async epaycoWebhook(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.service.processEpaycoWebhook(body);
      return res
        .status(HttpStatus.OK)
        .json({ status: 200, message: 'ok', result });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: 400,
        message: error.message,
      });
    }
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set payment status (admin)' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: { status: PaymentStatus },
    @Res() res: Response,
  ) {
    const result = await this.service.setStatus(Number(id), body.status);
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'updated', result });
  }
}
