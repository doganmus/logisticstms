import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let tenantId = 'public'; // Default to public
    let userId: string | null = null;
    let userRole: string | null = null;
    let tenantUuid: string | null = null;

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          // Verify the token instead of just decoding it
          const decoded: any = this.jwtService.verify(token, {
            secret: jwtConstants.secret,
          });
          
          if (decoded && decoded.tenantId) {
            tenantId = decoded.tenantId;
          }
          
          if (decoded && decoded.sub) {
            userId = decoded.sub;
          }
          if (decoded && decoded.role) {
            userRole = decoded.role;
          }
          if (decoded && decoded.tenantUuid) {
            tenantUuid = decoded.tenantUuid;
          }
        } catch (error) {
          // Token is invalid or expired
          // For middleware, we can either throw an error or let it pass with default tenant
          // Depending on whether the route requires authentication or not
          // If you want to throw error for invalid tokens:
          // throw new UnauthorizedException('Invalid or expired token');
          
          // Or silently fail and use public tenant (current behavior)
          console.warn('Invalid token in TenantMiddleware:', error.message);
        }
      }
    }

    (req as any).tenantId = tenantId;
    (req as any).userId = userId;
    (req as any).userRole = userRole;
    (req as any).tenantUuid = tenantUuid;
    next();
  }
}
