import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EpaycoConfigService } from '../epayco-config/epayco-config.service';
import { CreatePaymentEpaycoDto } from './dto/create-payment-epayco.dto';
import { EpaycoButtonDataDto } from './dto/epayco-response.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private epaycoConfigService: EpaycoConfigService,
  ) {}

  listByOrder(pedidoId: number) {
    return this.prisma.payment.findMany({ where: { pedidoId } });
  }

  async addEvidence(
    pedidoId: number,
    body: {
      amount: number;
      method?: PaymentMethod;
      provider?: string;
      providerRef?: string;
      evidenceUrl?: string;
    },
  ) {
    return this.prisma.payment.create({
      data: {
        pedidoId,
        amount: body.amount,
        method: body.method ?? 'TRANSFER',
        status: PaymentStatus.PENDING,
        provider: body.provider,
        providerRef: body.providerRef,
        evidenceUrl: body.evidenceUrl,
      },
    });
  }

  async setStatus(id: number, status: PaymentStatus) {
    const pay = await this.prisma.payment.findUnique({ where: { id } });
    if (!pay) throw new NotFoundException('Payment not found');
    return this.prisma.payment.update({ where: { id }, data: { status } });
  }

  async generateEpaycoButtonData(
    dto: CreatePaymentEpaycoDto,
  ): Promise<EpaycoButtonDataDto> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: dto.pedidoId },
      include: {
        pedido_producto: {
          include: {
            producto: {
              include: {
                container: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        username: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const seller = await this.prisma.user.findUnique({
      where: { id: dto.sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    const hasDifferentSeller = pedido.pedido_producto.some(
      (detalle) => detalle.producto?.container?.userId !== dto.sellerId,
    );
    if (hasDifferentSeller) {
      throw new BadRequestException(
        'El pedido contiene productos de otro vendedor',
      );
    }

    let epaycoConfig;
    try {
      epaycoConfig = await this.epaycoConfigService.findByUserId(dto.sellerId);
    } catch (error) {
      throw new BadRequestException(
        'El vendedor no tiene configurada una cuenta de ePayco',
      );
    }

    if (!epaycoConfig.isActive) {
      throw new BadRequestException(
        'La configuraci��n de ePayco del vendedor est�� desactivada',
      );
    }

    const amount = dto.amount ?? Number(pedido.precio_total);

    const payment = await this.prisma.payment.create({
      data: {
        pedidoId: dto.pedidoId,
        amount,
        method: PaymentMethod.GATEWAY,
        status: PaymentStatus.PENDING,
        provider: 'EPAYCO',
        containerId: dto.sellerId,
        currency: 'COP',
      },
    });

    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';
    const externalRef = dto.externalRef || `PAYMENT-${payment.id}`;

    const buttonData: EpaycoButtonDataDto = {
      publicKey: epaycoConfig.publicKey,
      amount,
      tax: dto.tax || 0,
      taxIco: dto.taxIco || 0,
      taxBase: dto.taxBase || amount,
      name: `Pedido #${dto.pedidoId}`,
      description: dto.description,
      currency: 'COP',
      country: 'CO',
      test: epaycoConfig.isTestMode,
      externalRef,
      confirmationUrl: `${apiUrl}/payments/webhook/epayco`,
      responseUrl: `${frontendUrl}/orders/${dto.pedidoId}`,
    };

    return buttonData;
  }

  async processEpaycoWebhook(response: any) {
    const externalRef =
      response?.x_extra1 || response?.x_ref_payco || response?.x_id_invoice;
    const paymentId = this.extractPaymentId(externalRef);
    if (!paymentId) {
      throw new BadRequestException(
        'No se pudo determinar el pago desde la confirmaci��n de ePayco',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    const status = this.mapEpaycoStatus(String(response?.x_cod_response));

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        providerRef: response?.x_transaction_id || response?.x_ref_payco,
        epaycoResponse: JSON.stringify(response),
      },
    });

    if (status === PaymentStatus.CONFIRMED) {
      await this.prisma.pedido.update({
        where: { id: payment.pedidoId },
        data: { status: OrderStatus.PAID },
      });
    }

    return { success: true, payment: updatedPayment };
  }

  private mapEpaycoStatus(codResponse: string): PaymentStatus {
    switch (codResponse) {
      case '1':
        return PaymentStatus.CONFIRMED;
      case '2':
      case '4':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  private extractPaymentId(ref?: string): number | null {
    if (!ref) return null;
    const raw = String(ref);
    const candidate = raw.includes('-') ? raw.split('-').pop() : raw;
    const value = Number(candidate);
    return Number.isNaN(value) ? null : value;
  }
}
