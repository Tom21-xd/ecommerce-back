import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductContainerService } from 'src/product-container/product-container.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [CartService, PrismaService, ProductContainerService],
})
export class CartModule {}
