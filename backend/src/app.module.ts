import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { User } from './public-entities/user.entity';
import { Tenant } from './public-entities/tenant.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/order.entity';
import { VehiclesModule } from './vehicles/vehicles.module';
import { Vehicle } from './vehicles/vehicle.entity';
import { DriversModule } from './drivers/drivers.module';
import { Driver } from './drivers/driver.entity';
import { ReportsModule } from './reports/reports.module';
import { Supplier } from './suppliers/supplier.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          level: process.env.LOG_LEVEL || 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // Time to live in milliseconds
      limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10), // Max requests per TTL
    }]),
    // Connection for tenant-specific schemas (default connection)
    TypeOrmModule.forRoot({
      name: 'default',
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'tmsdb',
      entities: [Order, Vehicle, Driver, Supplier], // Add entities here
      synchronize: false, // Disable synchronize, use migrations only
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true, // Auto-run migrations on startup
      // Multi-tenant schema will be handled by TenantMiddleware
      // Connection pool optimization for multi-tenant
      extra: {
        max: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10), // Maximum connections
        min: parseInt(process.env.DB_MIN_CONNECTIONS || '2', 10),  // Minimum connections
        acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10), // 60 seconds
        createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000', 10),  // 30 seconds
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '600000', 10),    // 10 minutes
        reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000', 10),    // 1 second
        createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || '200', 10), // 200ms
      },
    }),
    // Connection for the public schema (for users, tenants)
    TypeOrmModule.forRoot({
      name: 'public',
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'tmsdb',
      entities: [User, Tenant],
      synchronize: false, // Disable synchronize, use migrations only
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true, // Auto-run migrations on startup
      schema: 'public',
      // Connection pool for public schema (smaller pool since less usage)
      extra: {
        max: parseInt(process.env.DB_PUBLIC_MAX_CONNECTIONS || '5', 10), // Smaller pool for public schema
        min: parseInt(process.env.DB_PUBLIC_MIN_CONNECTIONS || '1', 10),
        acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
        createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000', 10),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '600000', 10),
        reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000', 10),
        createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || '200', 10),
      },
    }),
    AuthModule,
    TenantModule,
    OrdersModule,
    VehiclesModule,
    DriversModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
