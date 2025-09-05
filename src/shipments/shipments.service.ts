import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}
  listByOrder(pedidoId: number) {
    return this.prisma.shipment.findMany({ where: { pedidoId } });
  }
  async update(id: number, body: { status?: ShipmentStatus; carrier?: string; trackingCode?: string; estimatedDate?: Date; deliveredAt?: Date }) {
    const s = await this.prisma.shipment.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Shipment not found');
    return this.prisma.shipment.update({ where: { id }, data: body });
  }
}