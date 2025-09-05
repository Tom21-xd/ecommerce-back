import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';

@Module({
  providers: [ShipmentsService, PrismaService],
  controllers: [ShipmentsController],
})
export class ShipmentsModule {}
