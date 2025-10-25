import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import {
  AddressType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
} from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private readonly cartInclude = {
    items: {
      include: {
        product: {
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
            ProductImage: true,
          },
        },
      },
    },
  };

  private async findProduct(productId: number) {
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!p || !p.isActive) throw new NotFoundException('Product not available');
    return p;
  }

  async getOrCreateCart(params: { userId?: number | null; phones?: string }) {
    let userId = params.userId;
    if (!userId && params.phones) {
      const user = await this.prisma.user.findFirst({
        where: { phones: params.phones },
      });
      if (user) userId = user.id;
    }
    if (userId) {
      let cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: this.cartInclude,
      });
      if (!cart) {
        await this.prisma.cart.create({ data: { userId } });
        cart = await this.prisma.cart.findFirst({
          where: { userId },
          include: this.cartInclude,
        });
      }
      return cart;
    }
    const cart = await this.prisma.cart.create({ data: {} });
    return this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.cartInclude,
    });
  }

  async addItem(
    params: { userId?: number | null; phones?: string },
    dto: AddItemDto,
  ) {
    const { productId, qty } = dto;
    const product = await this.findProduct(productId);

    if (qty > product.quantity)
      throw new BadRequestException('Insufficient stock');

    const cart = await this.getOrCreateCart(params);

    const existing = await this.prisma.cart_item.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (existing) {
      const newQty = existing.qty + qty;
      if (newQty > product.quantity)
        throw new BadRequestException('Insufficient stock');
      return this.prisma.cart_item.update({
        where: { id: existing.id },
        data: { qty: newQty, priceAtAdd: product.price },
      });
    }
    return this.prisma.cart_item.create({
      data: { cartId: cart.id, productId, qty, priceAtAdd: product.price },
    });
  }

  async updateItem(
    params: { userId?: number | null; phones?: string },
    productId: number,
    qty: number,
  ) {
    const cart = await this.getOrCreateCart(params);
    const item = await this.prisma.cart_item.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) throw new NotFoundException('Item not found');

    if (qty === 0) {
      await this.prisma.cart_item.delete({ where: { id: item.id } });
      return { deleted: true };
    }
    const product = await this.findProduct(productId);
    if (qty > product.quantity)
      throw new BadRequestException('Insufficient stock');

    return this.prisma.cart_item.update({
      where: { id: item.id },
      data: { qty },
    });
  }

  async removeItem(
    params: { userId?: number | null; phones?: string },
    productId: number,
  ) {
    const cart = await this.getOrCreateCart(params);
    const item = await this.prisma.cart_item.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) return { deleted: true };
    await this.prisma.cart_item.delete({ where: { id: item.id } });
    return { deleted: true };
  }

  /**
   * Checkout por vendedor:
   * - Valida la direccion y el stock
   * - Crea un pedido solo con los productos del vendedor indicado
   * - Genera pago y envio pendientes
   * - Elimina del carrito solo los items usados
   */
  async checkout(
    params: { userId?: number | null; phones?: string },
    dto: CheckoutDto,
  ) {
    let userId = params.userId;
    if (!userId && params.phones) {
      const user = await this.prisma.user.findFirst({
        where: { phones: params.phones },
      });
      if (user) userId = user.id;
    }
    if (!userId) throw new NotFoundException('User not found');

    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: this.cartInclude,
    });
    if (!cart || cart.items.length === 0)
      throw new BadRequestException('Cart is empty');

    let address = null;
    if (dto.addressId) {
      address = await this.prisma.address.findFirst({
        where: { id: dto.addressId, userId },
      });
      if (!address) throw new NotFoundException('Address not found');
    } else {
      address = await this.prisma.address.findFirst({
        where: { userId, isDefault: true },
      });
      if (!address)
        throw new BadRequestException('No default address, provide one');
    }

    const sellerIdFilter = dto.sellerId;
    let itemsForCheckout = cart.items;

    if (sellerIdFilter) {
      itemsForCheckout = cart.items.filter(
        (it) => it.product?.container?.userId === sellerIdFilter,
      );
      if (itemsForCheckout.length === 0) {
        throw new BadRequestException(
          'No hay productos de ese vendedor en tu carrito',
        );
      }
    } else {
      const sellerIds = new Set(
        cart.items.map((it) => it.product?.container?.userId).filter(Boolean),
      );
      if (sellerIds.size > 1) {
        throw new BadRequestException(
          'Tu carrito tiene productos de varios vendedores. Selecciona un vendedor para continuar',
        );
      }
    }

    const checkoutSellerId =
      sellerIdFilter ?? itemsForCheckout[0]?.product?.container?.userId;
    if (!checkoutSellerId) {
      throw new BadRequestException(
        'No se pudo determinar el vendedor para este pedido',
      );
    }

    for (const it of itemsForCheckout) {
      if (it.qty > it.product.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${it.product.name}`,
        );
      }
    }

    const total = itemsForCheckout.reduce(
      (acc, it) => acc + Number(it.priceAtAdd) * it.qty,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.pedido.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          precio_total: total,
        },
      });

      for (const it of itemsForCheckout) {
        await tx.detalle_pedido.create({
          data: {
            pedidoId: order.id,
            productoId: it.productId,
            cantidad: it.qty,
            subtotal: Number(it.priceAtAdd) * it.qty,
            nameAtPurchase: it.product.name,
            skuAtPurchase: it.product.sku,
            priceUnit: it.priceAtAdd,
          },
        });

        await tx.product.update({
          where: { id: it.productId },
          data: { quantity: { decrement: it.qty } },
        });
      }

      await tx.pedido_address.create({
        data: {
          pedidoId: order.id,
          type: AddressType.SHIPPING,
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 ?? null,
          city: address.city,
          state: address.state ?? null,
          country: address.country,
          zip: address.zip ?? null,
        },
      });

      await tx.payment.create({
        data: {
          pedidoId: order.id,
          amount: total,
          status: PaymentStatus.PENDING,
          currency: 'COP',
          method: PaymentMethod.GATEWAY,
          containerId: checkoutSellerId,
        },
      });

      await tx.shipment.create({
        data: {
          pedidoId: order.id,
          status: ShipmentStatus.PENDING,
        },
      });

      await tx.cart_item.deleteMany({
        where: {
          id: { in: itemsForCheckout.map((it) => it.id) },
        },
      });

      return tx.pedido.findUnique({
        where: { id: order.id },
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
        },
      });
    });
  }
}
