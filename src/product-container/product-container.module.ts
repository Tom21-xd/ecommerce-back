import { Module } from '@nestjs/common';
import { ProductContainerService } from './product-container.service';
import { ProductContainerController } from './product-container.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProductContainerController],
  providers: [ProductContainerService, PrismaService],
})
export class ProductContainerModule {}
