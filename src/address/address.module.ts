import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductContainerService } from 'src/product-container/product-container.service';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
@Module({
  controllers: [AddressController],
  providers: [AddressService, PrismaService, ProductContainerService],
  exports: [AddressService],
})
export class AddressModule {}
