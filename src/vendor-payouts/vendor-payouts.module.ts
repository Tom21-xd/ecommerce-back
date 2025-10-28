import { Module } from '@nestjs/common';
import { VendorPayoutsService } from './vendor-payouts.service';
import { VendorPayoutsController } from './vendor-payouts.controller';
import { PayoutSchedulerService } from './payout-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [VendorPayoutsController],
  providers: [VendorPayoutsService, PayoutSchedulerService],
  exports: [VendorPayoutsService],
})
export class VendorPayoutsModule {}
