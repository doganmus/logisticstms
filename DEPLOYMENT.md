# Production Deployment Rehberi

Bu doküman, TMS SaaS platformunun production ortamına deploy edilmesi için gereken adımları ve best practices'leri içerir.

**Son Güncelleme:** 23 Ekim 2025

---

## 📋 İçindekiler

- [Production Checklist](#production-checklist)
- [Docker Production Optimizasyonu](#docker-production-optimizasyonu)
- [Database Migration Stratejisi](#database-migration-stratejisi)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring ve Logging](#monitoring-ve-logging)
- [Backup Stratejisi](#backup-stratejisi)
- [SSL/TLS Yapılandırması](#ssltls-yapılandırması)
- [Deployment Senaryoları](#deployment-senaryoları)

---

## 🪄 Setup Wizard for Production

### Setup Wizard Kullanımı

Production ortamında setup wizard kullanmak için iki yaklaşım:

#### Yaklaşım 1: Web-Based Setup (Önerilen)

1. **İlk Deployment:**
   ```bash
   # Container'ları başlat
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Domain'e Erişim:**
   ```
   https://app.yourdomain.com
   ```

3. **Setup Wizard Otomatik Açılır:**
   - Database ayarlarını yapın
   - Admin kullanıcı oluşturun
   - Sistem ayarlarını yapılandırın
   - Kurulumu tamamlayın

4. **Production için Önemli:**
   - ✅ Güçlü database şifresi kullanın
   - ✅ Güçlü admin şifresi (min 12 karakter)
   - ✅ JWT secret otomatik oluşturulsun
   - ✅ HTTPS kullanın
   - ✅ CORS allowed origins production domain

#### Yaklaşım 2: Pre-configured Deployment

Otomatik deployment için (CI/CD):

```bash
# 1. Environment variables hazırla
cat > .env << EOF
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# 2. Setup wizard'ı devre dışı bırak
echo "SKIP_SETUP_WIZARD=true" >> backend/.env

# 3. Initial setup script çalıştır
docker-compose -f docker-compose.prod.yml run backend npm run setup:init

# 4. Container'ları başlat
docker-compose -f docker-compose.prod.yml up -d
```

### Setup Wizard Security (Production)

#### SSL/TLS Zorunluluğu

```typescript
// backend/src/setup/setup.middleware.ts
if (process.env.NODE_ENV === 'production' && !req.secure) {
  throw new ForbiddenException('HTTPS required for setup in production');
}
```

#### Setup Token Expiration

Production'da daha kısa süre:

```typescript
// Production: 15 dakika
const SETUP_TOKEN_TTL = process.env.NODE_ENV === 'production' ? 900 : 1800;
```

#### Rate Limiting

Setup endpoint'leri için özel rate limit:

```typescript
@Throttle(5, 60) // 5 request per minute
@Post('validate-database')
async validateDatabase() { }
```

### Automated Setup (CI/CD)

GitHub Actions örneği:

```yaml
# .github/workflows/deploy-production.yml
- name: Initialize Production Setup
  run: |
    docker-compose -f docker-compose.prod.yml run \
      -e ADMIN_EMAIL=${{ secrets.ADMIN_EMAIL }} \
      -e ADMIN_PASSWORD=${{ secrets.ADMIN_PASSWORD }} \
      -e JWT_SECRET=${{ secrets.JWT_SECRET }} \
      backend npm run setup:automated
```

### Setup Reset (Production)

⚠️ **Dikkat:** Production'da setup reset **TÜM VERİLERİ SİLER!**

```bash
# Admin user ile
curl -X POST https://app.yourdomain.com/api/setup/reset \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Veya database direct
docker-compose exec database psql -U prod_user -d tmsdb \
  -c "DELETE FROM setup_status;"
```

---

## ✅ Production Checklist

### Pre-Deployment Kontrolleri

#### Setup & Configuration
- [ ] Setup wizard tamamlandı (veya SKIP_SETUP_WIZARD=true)
- [ ] Database credentials güvenli ve güçlü
- [ ] JWT secret minimum 32 karakter
- [ ] Admin kullanıcı oluşturuldu
- [ ] System settings production değerleri ile

#### Güvenlik
- [ ] Tüm environment variables production değerleriyle ayarlandı
- [ ] JWT secret key güvenli ve benzersiz
- [ ] Database credentials güçlü
- [ ] CORS sadece production domain'lerine izin veriyor
- [ ] Rate limiting aktif ve uygun değerlerde
- [ ] HTTPS zorunlu
- [ ] Security headers yapılandırıldı (Helmet)
- [ ] Input validation tüm endpoint'lerde
- [ ] SQL injection koruması aktif
- [ ] XSS koruması aktif
- [ ] CSRF koruması aktif (gerekirse)

#### Database
- [ ] Migration'lar test edildi
- [ ] `synchronize: false` ayarlandı
- [ ] Connection pooling yapılandırıldı
- [ ] Database backup stratejisi hazır
- [ ] Indexler oluşturuldu
- [ ] Query performance optimize edildi

#### Application
- [ ] Tüm testler geçti (unit, integration, e2e)
- [ ] Error handling tüm endpoint'lerde
- [ ] Logging yapılandırıldı
- [ ] Health check endpoint'leri çalışıyor
- [ ] API documentation güncel
- [ ] Dependencies güncel ve güvenli

#### DevOps
- [ ] Docker images optimize edildi
- [ ] CI/CD pipeline çalışıyor
- [ ] Monitoring kuruldu
- [ ] Alerting yapılandırıldı
- [ ] Backup ve restore test edildi
- [ ] Load testing yapıldı
- [ ] Rollback planı hazır

#### Frontend
- [ ] Production build optimize edildi
- [ ] Bundle size kontrol edildi
- [ ] Image'lar optimize edildi
- [ ] CDN yapılandırıldı (opsiyonel)
- [ ] SEO optimize edildi
- [ ] Performance audit yapıldı (Lighthouse)

---

## 🐳 Docker Production Optimizasyonu

### Backend Dockerfile (Production)

```dockerfile
# backend/Dockerfile.prod

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

# Install dumb-init (proper signal handling)
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /usr/src/app

# Copy only necessary files from builder
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package*.json ./

# Use non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
```

---

### Frontend Dockerfile (Production)

```dockerfile
# frontend/Dockerfile.prod

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy necessary files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

---

### Docker Compose (Production)

```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  database:
    image: postgres:14-alpine
    container_name: tms-database-prod
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    networks:
      - tms-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: tms-backend-prod
    restart: always
    depends_on:
      database:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DB_HOST: database
      DB_PORT: 5432
      DB_USERNAME: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_DATABASE: ${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: ${JWT_EXPIRATION}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    networks:
      - tms-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: tms-frontend-prod
    restart: always
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    networks:
      - tms-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  nginx:
    image: nginx:alpine
    container_name: tms-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - backend
      - frontend
    networks:
      - tms-network

volumes:
  postgres_data:
    driver: local

networks:
  tms-network:
    driver: bridge
```

---

## 🗄️ Database Migration Stratejisi

### Migration Oluşturma

```bash
# TypeORM migration oluştur
npm run migration:generate -- -n CreateInitialSchema

# Migration dosyası: src/migrations/1234567890-CreateInitialSchema.ts
```

### Migration Yapısı

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Schema oluştur
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "tenant_schema"`);
    
    // Tabloları oluştur
    await queryRunner.query(`
      CREATE TABLE "tenant_schema"."orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderNumber" varchar NOT NULL UNIQUE,
        "origin" varchar NOT NULL,
        "destination" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `);
    
    // Index'leri oluştur
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_status" ON "tenant_schema"."orders" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "tenant_schema"."IDX_orders_status"`);
    await queryRunner.query(`DROP TABLE "tenant_schema"."orders"`);
  }
}
```

### Multi-Tenant Migration

```typescript
// src/database/tenant-migration.service.ts

@Injectable()
export class TenantMigrationService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
  ) {}

  async runMigrationsForAllTenants(): Promise<void> {
    const tenants = await this.tenantRepository.find();
    
    for (const tenant of tenants) {
      console.log(`Running migrations for tenant: ${tenant.schema}`);
      
      // Set search_path
      await this.dataSource.query(`SET search_path TO "${tenant.schema}"`);
      
      // Run migrations
      await this.dataSource.runMigrations();
      
      console.log(`✓ Migrations completed for ${tenant.schema}`);
    }
  }

  async createTenantSchema(schemaName: string): Promise<void> {
    // Create schema
    await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // Run migrations for new schema
    await this.dataSource.query(`SET search_path TO "${schemaName}"`);
    await this.dataSource.runMigrations();
  }
}
```

### Migration Commands

```json
// package.json scripts
{
  "scripts": {
    "migration:generate": "typeorm migration:generate -d src/data-source.ts",
    "migration:create": "typeorm migration:create",
    "migration:run": "typeorm migration:run -d src/data-source.ts",
    "migration:revert": "typeorm migration:revert -d src/data-source.ts",
    "migration:show": "typeorm migration:show -d src/data-source.ts"
  }
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install Backend Dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run Backend Tests
        working-directory: ./backend
        run: npm test
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USERNAME: testuser
          DB_PASSWORD: testpass
          DB_DATABASE: testdb
      
      - name: Run Backend E2E Tests
        working-directory: ./backend
        run: npm run test:e2e
      
      - name: Install Frontend Dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run Frontend Tests
        working-directory: ./frontend
        run: npm test
      
      - name: Run Linter
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and Push Backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile.prod
          push: true
          tags: yourdockerhub/tms-backend:latest
          cache-from: type=registry,ref=yourdockerhub/tms-backend:buildcache
          cache-to: type=registry,ref=yourdockerhub/tms-backend:buildcache,mode=max
      
      - name: Build and Push Frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          file: ./frontend/Dockerfile.prod
          push: true
          tags: yourdockerhub/tms-frontend:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/tms
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose -f docker-compose.prod.yml exec -T backend npm run migration:run
            docker system prune -af
```

---

## 📊 Monitoring ve Logging

### Health Check Endpoints

```typescript
// src/health/health.controller.ts

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('liveness')
  @HealthCheck()
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1000 }),
    ]);
  }
}
```

### Prometheus Metrics

```typescript
// src/metrics/metrics.module.ts

import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class MetricsModule {}
```

### Winston Logging

```typescript
// src/logger/logger.service.ts

import * as winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

---

## 💾 Backup Stratejisi

### Automated Database Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/tms_backup_${TIMESTAMP}.sql"

# Create backup
docker exec tms-database-prod pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > ${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_FILE}

# Delete backups older than 30 days
find ${BACKUP_DIR} -name "tms_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Cron Job Setup

```bash
# Günlük backup (her gece 2:00'de)
0 2 * * * /opt/tms/scripts/backup-database.sh >> /var/log/tms-backup.log 2>&1

# Haftalık full backup (Pazar günleri 3:00'te)
0 3 * * 0 /opt/tms/scripts/full-backup.sh >> /var/log/tms-full-backup.log 2>&1
```

### Backup Restore

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

# Uncompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c $BACKUP_FILE | docker exec -i tms-database-prod psql -U ${POSTGRES_USER} ${POSTGRES_DB}
else
  docker exec -i tms-database-prod psql -U ${POSTGRES_USER} ${POSTGRES_DB} < $BACKUP_FILE
fi

echo "Restore completed from: $BACKUP_FILE"
```

---

## 🔐 SSL/TLS Yapılandırması

### Nginx SSL Configuration

```nginx
# nginx/nginx.conf

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # HTTP to HTTPS redirect
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Let's Encrypt SSL

```bash
# SSL certificate alma (Let's Encrypt)
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly \
  --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos

# Auto-renewal cron job
0 0 1 * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew
```

---

## 🚀 Deployment Senaryoları

### Zero-Downtime Deployment

```bash
# Blue-Green deployment script
#!/bin/bash

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start new containers (green)
docker-compose -f docker-compose.prod.yml up -d --scale backend=4

# Wait for health checks
sleep 30

# Scale down old containers (blue)
docker-compose -f docker-compose.prod.yml up -d --scale backend=2

# Verify deployment
curl -f https://yourdomain.com/health || exit 1

echo "Deployment successful!"
```

### Rollback Procedure

```bash
# Rollback script
#!/bin/bash

# Pull previous version
docker pull yourdockerhub/tms-backend:previous
docker pull yourdockerhub/tms-frontend:previous

# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Start previous version
docker-compose -f docker-compose.prod.yml up -d

# Revert migrations if needed
docker-compose -f docker-compose.prod.yml exec backend npm run migration:revert

echo "Rollback completed!"
```

---

## 📈 Performance Optimization

- [ ] Database query optimization
- [ ] Connection pooling
- [ ] Redis caching
- [ ] CDN for static assets
- [ ] Image optimization
- [ ] Gzip compression
- [ ] HTTP/2 enabled
- [ ] Load balancing

---

## 🔗 Kaynaklar

- [NestJS Production Best Practices](https://docs.nestjs.com/)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
