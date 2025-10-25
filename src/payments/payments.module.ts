import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { EpaycoConfigModule } from '../epayco-config/epayco-config.module';

@Module({
  imports: [EpaycoConfigModule],
  providers: [PaymentsService, PrismaService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
