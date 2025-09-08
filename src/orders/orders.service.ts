import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async listMine(params: { userId?: number; phones?: string }) {
    let userId = params.userId;
    if (!userId && params.phones) {
      const user = await this.prisma.user.findFirst({ where: { phones: params.phones } });
      if (user) userId = user.id;
    }
    if (!userId) throw new NotFoundException('User not found');
    return this.prisma.pedido.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { pedido_producto: true, payment: true, shipment: true, pedido_address: true },
    });
  }

  listAllForAdmin() {
    return this.prisma.pedido.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, username: true } }, pedido_producto: true, payment: true, shipment: true },
    });
  }

  async setStatus(id: number, status: OrderStatus) {
    const exists = await this.prisma.pedido.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Order not found');
    return this.prisma.pedido.update({ where: { id }, data: { status } });
  }
}