import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ProductContainerModule } from './product-container/product-container.module';
import { UsersModule } from './users/users.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { CatalogModule } from './catalog/catalog.module';
import { AddressModule } from './address/address.module';
import { EpaycoConfigModule } from './epayco-config/epayco-config.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { VendorPayoutsModule } from './vendor-payouts/vendor-payouts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que ConfigModule esté disponible globalmente
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(), // Habilita tareas programadas
    AuthModule,
    ProductsModule,
    ProductContainerModule,
    UsersModule,
    CartModule,
    AddressModule,
    OrdersModule,
    PaymentsModule,
    ShipmentsModule,
    CatalogModule,
    EpaycoConfigModule,
    BankAccountsModule,
    VendorPayoutsModule,
  ],
  providers: [AppService],
})
export class AppModule {}
