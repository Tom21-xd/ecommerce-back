import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentEpaycoDto } from './dto/create-payment-epayco.dto';
import { EpaycoButtonDataDto } from './dto/epayco-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
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

  /**
   * Genera datos para el botón de ePayco usando credenciales centralizadas del admin
   * El admin actúa como intermediario y luego dispersa a los vendedores
   */
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

    // Verificar que todos los productos pertenezcan al mismo vendedor
    const hasDifferentSeller = pedido.pedido_producto.some(
      (detalle) => detalle.producto?.container?.userId !== dto.sellerId,
    );
    if (hasDifferentSeller) {
      throw new BadRequestException(
        'El pedido contiene productos de otro vendedor',
      );
    }

    // Usar credenciales centralizadas del admin desde .env
    const publicKey = this.configService.get<string>('EPAYCO_PUBLIC_KEY');
    const isTestMode = this.configService.get<string>('EPAYCO_TEST_MODE') === 'true';

    if (!publicKey) {
      throw new BadRequestException(
        'No hay configuracion de ePayco del administrador. Configure EPAYCO_PUBLIC_KEY en .env',
      );
    }

    const amount = dto.amount ?? Number(pedido.precio_total);

    // Crear el registro de pago pendiente
    const payment = await this.prisma.payment.create({
      data: {
        pedidoId: dto.pedidoId,
        amount,
        method: PaymentMethod.GATEWAY,
        status: PaymentStatus.PENDING,
        provider: 'EPAYCO',
        containerId: dto.sellerId, // Guardamos el vendedor para la dispersión posterior
        currency: 'COP',
      },
    });

    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';
    const externalRef = dto.externalRef || `PAYMENT-${payment.id}`;

    // Datos del botón de pago con credenciales del admin
    const buttonData: EpaycoButtonDataDto = {
      publicKey, // Public key del admin (centralizado)
      amount,
      tax: dto.tax || 0,
      taxIco: dto.taxIco || 0,
      taxBase: dto.taxBase || amount,
      name: `Pedido #${dto.pedidoId}`,
      description: dto.description,
      currency: 'COP',
      country: 'CO',
      test: isTestMode, // Modo de prueba del admin
      externalRef,
      confirmationUrl: `${apiUrl}/payments/webhook/epayco`,
      responseUrl: `${frontendUrl}/orders/${dto.pedidoId}`,
    };

    return buttonData;
  }

  /**
   * Procesa el webhook de confirmación de ePayco
   * Actualiza el estado del pago y la orden
   */
  async processEpaycoWebhook(response: any) {
    const externalRef =
      response?.x_extra1 || response?.x_ref_payco || response?.x_id_invoice;
    const paymentId = this.extractPaymentId(externalRef);
    if (!paymentId) {
      throw new BadRequestException(
        'No se pudo determinar el pago desde la confirmacion de ePayco',
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

    // Si el pago fue exitoso, marcar la orden como pagada
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
