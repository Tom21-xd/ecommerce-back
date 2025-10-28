import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VendorPayoutsService } from './vendor-payouts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutStatus } from '@prisma/client';

@Injectable()
export class PayoutSchedulerService {
  private readonly logger = new Logger(PayoutSchedulerService.name);

  constructor(
    private vendorPayoutsService: VendorPayoutsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Se ejecuta todos los dias a las 3:00 AM
   * Verifica si es momento de hacer dispersiones automaticas
   */
  @Cron('0 3 * * *', {
    name: 'check-automatic-dispersions',
    timeZone: 'America/Bogota',
  })
  async handleAutomaticDispersions() {
    this.logger.log('Verificando si es momento de dispersiones automaticas...');

    try {
      const config = await this.vendorPayoutsService.getOrCreateDispersionConfig();

      if (!config.isAutoDispersalOn) {
        this.logger.log('Dispersiones automaticas desactivadas');
        return;
      }

      // Verificar si es momento de dispersar
      const now = new Date();
      const shouldDisperse = this.shouldRunDispersion(
        config.lastDispersalDate,
        config.dispersalFrequency,
        now,
      );

      if (!shouldDisperse) {
        this.logger.log('Aun no es momento de dispersar');
        return;
      }

      this.logger.log('Iniciando proceso de dispersion automatica...');

      // Crear payouts para todos los vendedores elegibles
      const result = await this.vendorPayoutsService.createMultiplePayouts();

      this.logger.log(
        `Payouts creados: ${result.successful} exitosos, ${result.failed} fallidos`,
      );

      // Actualizar fecha de ultima dispersion
      await this.prisma.dispersionConfig.update({
        where: { id: config.id },
        data: {
          lastDispersalDate: now,
          nextDispersalDate: this.calculateNextDispersalDate(
            now,
            config.dispersalFrequency,
          ),
        },
      });

      this.logger.log('Proceso de dispersion automatica completado');
    } catch (error) {
      this.logger.error('Error en dispersion automatica:', error);
    }
  }

  /**
   * Se ejecuta cada hora
   * Procesa payouts pendientes (ejecuta las transferencias reales)
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'process-pending-payouts',
  })
  async processPendingPayouts() {
    this.logger.log('Procesando payouts pendientes...');

    try {
      const pendingPayouts = await this.prisma.vendorPayout.findMany({
        where: { status: PayoutStatus.PENDING },
        take: 10, // Procesar maximo 10 por vez
      });

      if (pendingPayouts.length === 0) {
        this.logger.log('No hay payouts pendientes para procesar');
        return;
      }

      this.logger.log(`Procesando ${pendingPayouts.length} payouts...`);

      for (const payout of pendingPayouts) {
        try {
          await this.vendorPayoutsService.executePayoutTransfer(payout.id);
          this.logger.log(`Payout ${payout.id} procesado exitosamente`);
        } catch (error) {
          this.logger.error(`Error procesando payout ${payout.id}:`, error);
        }
      }

      this.logger.log('Procesamiento de payouts pendientes completado');
    } catch (error) {
      this.logger.error('Error procesando payouts pendientes:', error);
    }
  }

  /**
   * Determina si debe ejecutarse una dispersion
   */
  private shouldRunDispersion(
    lastDate: Date | null,
    frequency: number,
    now: Date,
  ): boolean {
    if (!lastDate) {
      return true; // Primera vez
    }

    const daysSinceLastDispersion = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysSinceLastDispersion >= frequency;
  }

  /**
   * Calcula la proxima fecha de dispersion
   */
  private calculateNextDispersalDate(
    lastDate: Date,
    frequency: number,
  ): Date {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + frequency);
    return nextDate;
  }

  /**
   * Metodo manual para ejecutar dispersion inmediatamente (para testing)
   */
  async runManualDispersion() {
    this.logger.log('Ejecutando dispersion manual...');
    return this.handleAutomaticDispersions();
  }
}
