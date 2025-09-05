import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductContainerService } from 'src/product-container/product-container.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';


@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService, ProductContainerService],
  exports: [CartService],
})
export class CartModule {}
