import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private readonly orderInclude = {
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
                    phones: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    payment: true,
    shipment: true,
    pedido_address: true,
  };

  private async resolveUserId(params: { userId?: number; phones?: string }) {
    let userId = params.userId;
    if (!userId && params.phones) {
      const user = await this.prisma.user.findFirst({
        where: { phones: params.phones },
      });
      if (user) userId = user.id;
    }
    return userId;
  }

  async listMine(params: { userId?: number; phones?: string }) {
    const userId = await this.resolveUserId(params);
    if (!userId) throw new NotFoundException('User not found');
    return this.prisma.pedido.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: this.orderInclude,
    });
  }

  listAllForAdmin() {
    return this.prisma.pedido.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, username: true } },
        ...this.orderInclude,
      },
    });
  }

  async getByIdForUser(
    id: number,
    params: { userId?: number; phones?: string },
  ) {
    const userId = await this.resolveUserId(params);
    if (!userId) throw new NotFoundException('User not found');
    const order = await this.prisma.pedido.findFirst({
      where: { id, userId },
      include: this.orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async setStatus(id: number, status: OrderStatus) {
    const exists = await this.prisma.pedido.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Order not found');
    return this.prisma.pedido.update({ where: { id }, data: { status } });
  }

  async listForSeller(sellerId: number) {
    return this.prisma.pedido.findMany({
      where: {
        status: OrderStatus.PAID,
        pedido_producto: {
          some: {
            producto: {
              container: {
                userId: sellerId,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, username: true, phones: true } },
        pedido_address: true,
        shipment: true,
        payment: true,
        pedido_producto: {
          where: {
            producto: {
              container: {
                userId: sellerId,
              },
            },
          },
          include: {
            producto: {
              include: {
                container: true,
              },
            },
          },
        },
      },
    });
  }
}
