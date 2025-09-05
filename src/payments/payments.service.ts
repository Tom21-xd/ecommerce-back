import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

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
}