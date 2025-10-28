import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { VendorBalanceDto } from './dto/vendor-balance.dto';
import { CreateDispersionConfigDto } from './dto/create-dispersion-config.dto';
import { PaymentStatus, PayoutStatus } from '@prisma/client';

@Injectable()
export class VendorPayoutsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Obtiene o crea la configuracion global de dispersion
   */
  async getOrCreateDispersionConfig() {
    let config = await this.prisma.dispersionConfig.findFirst();

    if (!config) {
      // Crear configuracion por defecto
      config = await this.prisma.dispersionConfig.create({
        data: {
          dispersalFrequency: 7,
          adminCommission: 10.0,
          minimumPayout: 50000,
          isAutoDispersalOn: true,
        },
      });
    }

    return config;
  }

  /**
   * Actualiza la configuracion de dispersion
   */
  async updateDispersionConfig(dto: CreateDispersionConfigDto) {
    const config = await this.getOrCreateDispersionConfig();

    return this.prisma.dispersionConfig.update({
      where: { id: config.id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Calcula el balance disponible de un vendedor
   */
  async calculateVendorBalance(vendorId: number): Promise<VendorBalanceDto> {
    // Verificar que el usuario sea vendedor
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      include: {
        bankAccounts: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    // Permitir BUYER y SELLER (BUYER puede no tener ventas pero puede ver su balance en 0)
    if (vendor.role !== 'SELLER' && vendor.role !== 'BUYER') {
      throw new BadRequestException('El usuario no tiene permisos para ver balances');
    }

    // Obtener configuracion de comision
    const config = await this.getOrCreateDispersionConfig();

    // Calcular total de ventas confirmadas del vendedor
    const payments = await this.prisma.payment.findMany({
      where: {
        containerId: vendorId,
        status: PaymentStatus.CONFIRMED,
      },
    });

    const totalSales = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    // Calcular total ya dispersado
    const completedPayouts = await this.prisma.vendorPayout.findMany({
      where: {
        vendorId,
        status: { in: [PayoutStatus.COMPLETED, PayoutStatus.PROCESSING] },
      },
    });

    const totalDispersed = completedPayouts.reduce(
      (sum, payout) => sum + Number(payout.netAmount),
      0,
    );

    // Calcular comision del admin
    const adminCommissionRate = Number(config.adminCommission) / 100;
    const adminCommission = totalSales * adminCommissionRate;

    // Balance disponible para dispersar
    const availableBalance = totalSales - adminCommission - totalDispersed;

    // Verificar si tiene cuenta bancaria verificada
    const hasBankAccountVerified =
      vendor.bankAccounts.length > 0 && vendor.bankAccounts[0].isVerified;

    return {
      vendorId,
      vendorName: vendor.username,
      vendorEmail: vendor.email,
      totalSales,
      adminCommission,
      availableBalance: Math.max(0, availableBalance), // No puede ser negativo
      totalDispersed,
      activeBankAccount: vendor.bankAccounts[0] || null,
      hasBankAccountVerified,
    };
  }

  /**
   * Obtiene balances de todos los vendedores
   */
  async getAllVendorBalances() {
    const vendors = await this.prisma.user.findMany({
      where: { role: 'SELLER' },
    });

    const balances = await Promise.all(
      vendors.map((vendor) => this.calculateVendorBalance(vendor.id)),
    );

    return balances;
  }

  /**
   * Procesa un payout para un vendedor especifico
   * Este metodo crea el registro pero NO ejecuta la transferencia real
   * La transferencia se ejecutara via el scheduler o manualmente
   */
  async createPayout(vendorId: number) {
    const balance = await this.calculateVendorBalance(vendorId);
    const config = await this.getOrCreateDispersionConfig();

    // Validaciones
    if (balance.availableBalance < Number(config.minimumPayout)) {
      throw new BadRequestException(
        `El balance disponible (${balance.availableBalance}) es menor al minimo requerido (${config.minimumPayout})`,
      );
    }

    if (!balance.activeBankAccount) {
      throw new BadRequestException(
        'El vendedor no tiene una cuenta bancaria activa',
      );
    }

    if (!balance.hasBankAccountVerified) {
      throw new BadRequestException(
        'La cuenta bancaria del vendedor no esta verificada',
      );
    }

    // Obtener IDs de payments que se van a incluir en este payout
    const payments = await this.prisma.payment.findMany({
      where: {
        containerId: vendorId,
        status: PaymentStatus.CONFIRMED,
      },
      select: { id: true },
    });

    // Calcular montos
    const amount = balance.availableBalance;
    const adminCommissionRate = Number(config.adminCommission) / 100;
    const grossAmount = amount / (1 - adminCommissionRate);
    const adminCommission = grossAmount * adminCommissionRate;
    const netAmount = amount;

    // Crear el registro de payout
    const payout = await this.prisma.vendorPayout.create({
      data: {
        vendorId,
        amount: grossAmount,
        adminCommission,
        netAmount,
        status: PayoutStatus.PENDING,
        paymentIds: JSON.stringify(payments.map((p) => p.id)),
        bankAccount: JSON.stringify(balance.activeBankAccount),
      },
    });

    return payout;
  }

  /**
   * Procesa multiples payouts (todos los vendedores elegibles)
   */
  async createMultiplePayouts(vendorIds?: number[]) {
    const config = await this.getOrCreateDispersionConfig();
    const balances = await this.getAllVendorBalances();

    // Filtrar vendedores elegibles
    const eligibleVendors = balances.filter((balance) => {
      // Filtrar por IDs si se especifican
      if (vendorIds && !vendorIds.includes(balance.vendorId)) {
        return false;
      }

      return (
        balance.availableBalance >= Number(config.minimumPayout) &&
        balance.activeBankAccount &&
        balance.hasBankAccountVerified
      );
    });

    const results = await Promise.allSettled(
      eligibleVendors.map((vendor) => this.createPayout(vendor.vendorId)),
    );

    return {
      total: eligibleVendors.length,
      successful: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
      results,
    };
  }

  /**
   * Ejecuta la transferencia real via ePayco para un payout
   * TODO: Implementar integracion con API de ePayco para dispersiones
   */
  async executePayoutTransfer(payoutId: number) {
    const payout = await this.prisma.vendorPayout.findUnique({
      where: { id: payoutId },
      include: { vendor: true },
    });

    if (!payout) {
      throw new NotFoundException('Payout no encontrado');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException(
        `El payout ya fue procesado (status: ${payout.status})`,
      );
    }

    try {
      // Marcar como procesando
      await this.prisma.vendorPayout.update({
        where: { id: payoutId },
        data: { status: PayoutStatus.PROCESSING },
      });

      // TODO: Aqui iria la integracion con ePayco para hacer la transferencia
      // const epaycoPrivateKey = this.configService.get<string>('EPAYCO_PRIVATE_KEY');
      // const epaycoResponse = await epayco.transfer({...});

      // Por ahora simulamos una respuesta exitosa
      const simulatedResponse = {
        success: true,
        referencia: `TRANSFER-${payoutId}-${Date.now()}`,
        fecha: new Date().toISOString(),
      };

      // Actualizar como completado
      await this.prisma.vendorPayout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.COMPLETED,
          epaycoReference: simulatedResponse.referencia,
          epaycoResponse: JSON.stringify(simulatedResponse),
          processedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Payout procesado exitosamente',
        payout,
      };
    } catch (error) {
      // Marcar como fallido
      await this.prisma.vendorPayout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Obtiene todos los payouts de un vendedor
   */
  async getVendorPayouts(vendorId: number) {
    return this.prisma.vendorPayout.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene todos los payouts (admin)
   */
  async getAllPayouts(filters?: {
    status?: PayoutStatus;
    vendorId?: number;
  }) {
    return this.prisma.vendorPayout.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.vendorId && { vendorId: filters.vendorId }),
      },
      include: {
        vendor: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancela un payout pendiente (solo admin)
   */
  async cancelPayout(payoutId: number) {
    const payout = await this.prisma.vendorPayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout no encontrado');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden cancelar payouts pendientes',
      );
    }

    return this.prisma.vendorPayout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.CANCELLED },
    });
  }
}
