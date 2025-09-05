import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { AddressType, OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CartService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private async findProduct(productId: number) {
    const p = await this.prisma.product.findUnique({ where: { id: productId }});
    if (!p || !p.isActive) throw new NotFoundException('Product not available');
    return p;
  }

  async getOrCreateCart(userId: number | null) {
    if (userId) {
      let cart = await this.prisma.cart.findFirst({ where: { userId }, include: { items: true } });
      if (!cart) {
        await this.prisma.cart.create({ data: { userId } });
        cart = await this.prisma.cart.findFirst({ where: { userId }, include: { items: { include: { product: true } } } });
      }
      return cart;
    }
    // Anónimo: crea carrito sin user
    const cart = await this.prisma.cart.create({ data: {} });
    return this.prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { product: true } } } });
  }

  async addItem(userId: number | null, dto: AddItemDto) {
    const { productId, qty } = dto;
    const product = await this.findProduct(productId);

    // valida stock
    if (qty > product.quantity) throw new BadRequestException('Insufficient stock');

    // get/create cart
    const cart = await this.getOrCreateCart(userId);

    // upsert item
    const existing = await this.prisma.cart_item.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (existing) {
      const newQty = existing.qty + qty;
      if (newQty > product.quantity) throw new BadRequestException('Insufficient stock');
      return this.prisma.cart_item.update({
        where: { id: existing.id },
        data: { qty: newQty, priceAtAdd: product.price },
      });
    }
    return this.prisma.cart_item.create({
      data: { cartId: cart.id, productId, qty, priceAtAdd: product.price },
    });
  }

  async updateItem(userId: number | null, productId: number, qty: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cart_item.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (!item) throw new NotFoundException('Item not found');

    if (qty === 0) {
      await this.prisma.cart_item.delete({ where: { id: item.id } });
      return { deleted: true };
    }
    const product = await this.findProduct(productId);
    if (qty > product.quantity) throw new BadRequestException('Insufficient stock');

    return this.prisma.cart_item.update({ where: { id: item.id }, data: { qty } });
  }

  async removeItem(userId: number | null, productId: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cart_item.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (!item) return { deleted: true };
    await this.prisma.cart_item.delete({ where: { id: item.id } });
    return { deleted: true };
  }

  /**
   * Checkout:
   * - Toma items del carrito
   * - Valida stock
   * - Crea pedido + detalles
   * - Duplica address en pedido_address (shipping y, opcional, billing)
   * - Crea registro payment (PENDING) y shipment (PENDING o NOT_REQUIRED)
   * - Descuenta stock
   * - Limpia carrito
   */
  async checkout(userId: number, dto: CheckoutDto) {
    const cart = await this.prisma.cart.findFirst({ where: { userId }, include: { items: { include: { product: true } } } });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    // Usa dirección por defecto del usuario o la addressId provista
    let address = null;
    if (dto.addressId) {
      address = await this.prisma.address.findFirst({ where: { id: dto.addressId, userId } });
      if (!address) throw new NotFoundException('Address not found');
    } else {
      address = await this.prisma.address.findFirst({ where: { userId, isDefault: true } });
      if (!address) throw new BadRequestException('No default address, provide one');
    }

    // Verificación de stock final
    for (const it of cart.items) {
      if (it.qty > it.product.quantity) {
        throw new BadRequestException(`Insufficient stock for ${it.product.name}`);
      }
    }

    const total = cart.items.reduce((acc, it) => acc + Number(it.priceAtAdd) * it.qty, 0);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.pedido.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          precio_total: total,
        },
      });

      // detalles
      for (const it of cart.items) {
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

        // descuenta stock
        await tx.product.update({
          where: { id: it.productId },
          data: { quantity: { decrement: it.qty } },
        });
      }

      // address SHIP
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

      // payment pending
      await tx.payment.create({
        data: {
          pedidoId: order.id,
          amount: total,
          status: PaymentStatus.PENDING,
          currency: 'COP',
        },
      });

      // shipment pending (puedes marcar NOT_REQUIRED si pickup)
      await tx.shipment.create({
        data: {
          pedidoId: order.id,
          status: ShipmentStatus.PENDING,
        },
      });

      // limpia carrito
      await tx.cart_item.deleteMany({ where: { cartId: cart.id } });

      return tx.pedido.findUnique({
        where: { id: order.id },
        include: {
          pedido_producto: true,
          payment: true,
          shipment: true,
          pedido_address: true,
        },
      });
    });
  }
}
