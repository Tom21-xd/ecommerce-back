import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
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

  async addEvidence(pedidoId: number, body: { amount: number; method?: PaymentMethod; provider?: string; providerRef?: string; evidenceUrl?: string }) {
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
   * Genera los datos necesarios para el botón de pago de ePayco
   * @param dto Datos del pago a crear
   * @returns Datos del botón de ePayco para renderizar en el frontend
   */
  async generateEpaycoButtonData(dto: CreatePaymentEpaycoDto): Promise<EpaycoButtonDataDto> {
    // Verificar que el pedido existe
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: dto.pedidoId },
      include: {
        pedido_producto: {
          include: {
            producto: {
              include: {
                container: {
                  include: {
                    user: true,
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

    // Verificar que el vendedor existe
    const seller = await this.prisma.user.findUnique({
      where: { id: dto.sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    // Obtener la configuración de ePayco del vendedor
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
        'La configuración de ePayco del vendedor está desactivada',
      );
    }

    // Crear un registro de pago pendiente
    const payment = await this.prisma.payment.create({
      data: {
        pedidoId: dto.pedidoId,
        amount: dto.amount,
        method: PaymentMethod.GATEWAY,
        status: PaymentStatus.PENDING,
        provider: 'EPAYCO',
        containerId: dto.sellerId,
        currency: 'COP',
      },
    });

    // Generar datos del botón de ePayco
    const buttonData: EpaycoButtonDataDto = {
      publicKey: epaycoConfig.publicKey,
      amount: dto.amount,
      tax: dto.tax || 0,
      taxIco: dto.taxIco || 0,
      taxBase: dto.taxBase || dto.amount,
      name: `Pedido #${dto.pedidoId}`,
      description: dto.description,
      currency: 'COP',
      country: 'CO',
      test: epaycoConfig.isTestMode,
      externalRef: dto.externalRef || `PAYMENT-${payment.id}`,
      confirmationUrl: `${process.env.API_URL || 'http://localhost:4000'}/payments/webhook/epayco`,
    };

    return buttonData;
  }

  /**
   * Procesa la respuesta del webhook de ePayco
   * @param response Respuesta de ePayco
   */
  async processEpaycoWebhook(response: any) {
    // Buscar el pago por la referencia externa
    const externalRef = response.x_extra1 || response.x_ref_payco;

    // Extraer el ID del pago de la referencia
    const paymentId = parseInt(externalRef.split('-')[1]);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    // Actualizar el estado del pago según la respuesta de ePayco
    const status = this.mapEpaycoStatus(response.x_cod_response);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        providerRef: response.x_transaction_id || response.x_ref_payco,
        epaycoResponse: JSON.stringify(response),
      },
    });

    // Si el pago fue exitoso, actualizar el estado del pedido
    if (status === PaymentStatus.CONFIRMED) {
      await this.prisma.pedido.update({
        where: { id: payment.pedidoId },
        data: { status: 'PAID' },
      });
    }

    return { success: true, payment };
  }

  /**
   * Mapea el código de respuesta de ePayco a un estado de pago
   */
  private mapEpaycoStatus(codResponse: string): PaymentStatus {
    // Códigos de respuesta de ePayco:
    // 1 = Transacción aprobada
    // 2 = Transacción rechazada
    // 3 = Transacción pendiente
    // 4 = Transacción fallida

    switch (codResponse) {
      case '1':
      case '3': // Aceptada
        return PaymentStatus.CONFIRMED;
      case '2':
      case '4': // Rechazada
        return PaymentStatus.FAILED;
      case '3': // Pendiente
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.PENDING;
    }
  }
}