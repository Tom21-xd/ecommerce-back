import { Module } from '@nestjs/common';
import { EpaycoConfigService } from './epayco-config.service';
import { EpaycoConfigController } from './epayco-config.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [EpaycoConfigController],
  providers: [EpaycoConfigService, PrismaService],
  exports: [EpaycoConfigService],
})
export class EpaycoConfigModule {}
