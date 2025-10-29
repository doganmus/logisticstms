import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TenantMiddleware } from './tenant.middleware';
import { TenantConnectionService } from './tenant-connection.service';
import { jwtConstants } from '../auth/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: (process.env.JWT_EXPIRATION || '24h') as any },
    }),
  ],
  providers: [TenantMiddleware, TenantConnectionService],
  exports: [TenantMiddleware, TenantConnectionService],
})
export class TenantModule {}
