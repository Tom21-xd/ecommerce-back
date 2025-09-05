import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductContainerService } from 'src/product-container/product-container.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, ProductContainerService],
})
export class ProductsModule {}
