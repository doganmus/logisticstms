# TMS SaaS Platformu - Sistem Mimarisi

Bu doküman, projenin teknik mimarisini, servisler arası ilişkiyi ve temel tasarım prensiplerini açıklamaktadır.

## 1. Genel Bakış

Sistem, birbirinden bağımsız olarak geliştirilebilen ve ölçeklendirilebilen mikroservis benzeri bir yaklaşımla tasarlanmıştır. Tüm servisler Docker konteynerleri içinde çalışır ve `docker-compose` ile yönetilir.

- **`tms-backend`**: Ana iş mantığını, API'leri ve veritabanı operasyonlarını yürüten NestJS uygulaması.
- **`tms-webapp`**: Müşterilerin ve operatörlerin kullandığı React (Next.js) tabanlı web arayüzü.
- **`tms-mobileapp`**: Şoförlerin kullandığı, GPS takibi ve durum güncellemesi sağlayan React Native mobil uygulaması.
- **`tms-database`**: Tüm verilerin saklandığı PostgreSQL veritabanı.

## 2. Multi-Tenant (Çok Kullanıcılı) Mimarisi

Her abonenin (tenant) verisinin diğerlerinden tamamen izole edilmesi, sistemin en kritik gereksinimidir. Bu amaçla **Schema-per-Tenant** (Abone Başına Şema) modeli benimsenmiştir.

- **`public` Şeması:**
  - `tenants` (aboneler), `subscriptions` (abonelikler), `users` (kullanıcıların genel bilgileri) gibi global tabloları barındırır. Bir kullanıcının hangi aboneye ait olduğu burada belirlenir.

- **Aboneye Özel Şemalar (`tenant_1`, `tenant_2` vb.):**
  - Her abone için veritabanında dinamik olarak ayrı bir şema oluşturulur.
  - `orders`, `vehicles`, `drivers`, `invoices` gibi aboneye özel tüm tablolar bu şema altında yer alır.
  - Bu yapı, maksimum veri güvenliği ve izolasyonu sağlar.

## 3. Yetkilendirme ve Modül Erişimi

1.  Kullanıcı sisteme giriş yaptığında, backend bir JWT (JSON Web Token) üretir.
2.  Bu token, `userId`, `tenantId` ve `subscriptionPlan` (örn: "professional") bilgilerini içerir.
3.  Backend'e gelen her API isteğinde, bir "middleware" bu token'ı doğrular.
4.  Middleware, `tenantId`'ye göre veritabanı bağlantısının arama yolunu (`search_path`) o abonenin şemasına ayarlar. Böylece tüm sorgular otomatik olarak doğru şemada çalışır.

**Uygulama Detayı:** Bu mekanizma, NestJS üzerinde şu şekilde hayata geçirilmiştir:
- **`TenantMiddleware`**: Gelen her isteğin `Authorization` başlığındaki JWT'yi çözümleyerek içindeki `tenantId` bilgisini alan ve istek kapsamında saklayan bir ara katman yazılımıdır.
- **`TypeOrmModule.forRootAsync`**: `AppModule` içinde, bu fabrika metodu, istekten gelen `tenantId`'yi kullanarak TypeORM bağlantısının `schema` özelliğini dinamik olarak ayarlar. Bu sayede her veritabanı işlemi, doğru abonenin şeması üzerinde güvenli bir şekilde çalışır.
5.  Ayrıca, istenen özelliğin (modülün) abonenin planına (`subscriptionPlan`) dahil olup olmadığı kontrol edilir. Eğer erişim yetkisi yoksa, API isteği reddedilir.

## 4. Veri Akışı Örneği (Sipariş Listeleme)

1.  Kullanıcı web uygulamasından "Siparişlerim" sayfasını açar.
2.  Web uygulaması, `Authorization` header'ında JWT ile birlikte `GET /api/v1/orders` isteğini backend'e gönderir.
3.  Backend middleware'i token'ı çözer, `tenant_id`'yi alır (örn: `tenant_123`).
4.  Veritabanı bağlantısı için `SET search_path TO tenant_123;` komutunu çalıştırır.
5.  `OrderService`, `SELECT * FROM orders;` sorgusunu çalıştırır. Bu sorgu, otomatik olarak `tenant_123.orders` tablosundan veri çeker.
6.  Sonuçlar JSON formatında web uygulamasına geri döndürülür.

---

## 5. Güvenlik Mimarisi

### 5.1 Authentication ve Authorization

#### JWT Token Yapısı
```json
{
  "sub": "user-uuid-123",
  "email": "user@example.com",
  "tenantId": "tenant_schema_name",
  "iat": 1698058800,
  "exp": 1698145200
}
```

#### Token Doğrulama Akışı
1. İstek `Authorization: Bearer <token>` ile gelir
2. `TenantMiddleware` token'ı `jwtService.verify()` ile doğrular
3. Token geçerliyse, `tenantId` ve `userId` request objesine eklenir
4. Token geçersiz veya süresi dolmuşsa, 401 Unauthorized döner

#### Guards (Yetkilendirme Katmanları)
- **JwtAuthGuard:** Tüm korunan endpoint'lerde JWT token kontrolü yapar
- **RolesGuard:** Kullanıcı rollerine göre erişim kontrolü (Admin, Operator)
- **TenantGuard:** Cross-tenant data access'i önler

### 5.2 Veri Güvenliği

#### Tenant İzolasyonu
- Her tenant'ın verisi ayrı PostgreSQL schema'sında saklanır
- Schema switching middleware'de otomatik yapılır
- Cross-tenant query'ler mimari olarak engellenmiştir

#### Şifre Güvenliği
- Şifreler bcrypt ile hash'lenir (salt rounds: 10)
- Plain text şifre asla saklanmaz
- Şifre sıfırlama için time-limited token kullanılır

#### Input Validation
- Tüm DTO'lar `class-validator` ile doğrulanır
- SQL injection önleme: TypeORM parameterized queries
- XSS önleme: Frontend'de sanitization

### 5.3 Network Güvenliği

#### CORS Politikası
```typescript
// Allowed origins
const allowedOrigins = [
  'http://localhost:3001',
  'https://app.example.com'
];
```

#### Rate Limiting
- API endpoint'leri için rate limit: 100 req/dakika
- Login endpoint için: 5 req/dakika (brute force önleme)
- Throttler kullanılarak implement edilir

---

## 6. Bilinen Mimari Sorunlar ve Çözümleri

### 6.1 Multi-Tenant Connection Yönetimi

#### Güncel Uygulama (28 Ekim 2025)
- `TenantConnectionService` request scope olarak tanımlandı; `tenantId` doğrudan `REQUEST` objesinden okunuyor.
- Her HTTP isteği için tek bir `QueryRunner` açılıyor, `SET search_path` ile tenant şeması seçiliyor ve `Response` `finish/close` event'lerinde otomatik olarak release ediliyor.
- Böylece connection pool paylaşımlı kalıyor, leak veya cross-tenant contamination riski ortadan kalkıyor.

```typescript
@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService {
  private runner: QueryRunner | null = null;

  constructor(
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
    @Inject(REQUEST)
    private readonly request: Request,
  ) {}

  async getRepository<T>(entity: EntityTarget<T>): Promise<Repository<T>> {
    const runner = await this.ensureQueryRunner();
    return runner.manager.getRepository(entity);
  }

  private async ensureQueryRunner(): Promise<QueryRunner> {
    if (!this.runner) {
      this.runner = this.dataSource.createQueryRunner();
      await this.runner.connect();
      const tenantId = (this.request as any)?.tenantId ?? 'public';
      await this.runner.query(`SET search_path TO "${tenantId}"`);
      this.registerReleaseHook();
    }
    return this.runner;
  }

  private registerReleaseHook(): void {
    const res: Response | undefined = (this.request as any)?.res;
    if (!res || !this.runner) return;

    const release = () => {
      if (this.runner && !this.runner.isReleased) {
        void this.runner.release();
      }
      this.runner = null;
    };

    res.once('finish', release);
    res.once('close', release);
  }
}
```

> **Testler:** `src/tenant/tenant-connection.service.spec.ts` dosyası, query runner reuse, schema switching ve otomatik release davranışını doğrular.


### 6.2 Database Migration Stratejisi

#### Güncel Durum
- `synchronize` kapalı; `InitialMigration1761666643327` hem `public` hem tenant tablolarını uuid tabanlı olarak tanımlar.
- Uygulama açılışında `migrationsRun: true` sayesinde şablon şemalar senkronize edilir.
- Yeni tenant kayıtlarında `TenantConnectionService.createTenantSchema()` aynı query runner üzerinden `MigrationExecutor` çalıştırarak bekleyen migration'ları uygular.

```typescript
async createTenantSchema(tenantId: string): Promise<void> {
  const runner = this.dataSource.createQueryRunner();
  try {
    await runner.connect();
    await runner.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);
    await runner.query(`SET search_path TO "${tenantId}"`);

    const executor = new MigrationExecutor(this.dataSource, runner);
    executor.transaction = 'none';
    await executor.executePendingMigrations();
  } finally {
    await runner.release();
  }
}
```

- Her tenant kendi `migrations` tablosuna sahip olduğundan yeni migration'lar izolasyon bozulmadan çalıştırılır.
- `tenantSchemaExists` ve `dropTenantSchema` yardımcıları bakım ve test senaryoları için schema yönetimini kolaylaştırır.


### 6.3 Error Handling

#### Mevcut Sorun
- Global exception filter yok
- Error'lar tutarlı formatta dönmüyor
- Stack trace production'da expose ediliyor

#### Çözüm
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: this.getErrorMessage(exception),
      // Stack trace sadece development'ta
      ...(process.env.NODE_ENV === 'development' && { 
        stack: exception.stack 
      })
    };

    response.status(status).json(errorResponse);
  }
}
```

---

## 7. Logging ve Monitoring Yapısı

### 7.1 Structured Logging

Uygulama, `nest-winston` + `winston` kombinasyonu ile JSON tabanlı structured log üretir. Konfigürasyon `AppModule` içinde yapılır ve tüm loglar `tenantId`, `userId`, istek süresi gibi alanları içerir.

```typescript
// app.module.ts
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
});
```

`LoggingInterceptor` ile her HTTP isteğinin giriş/çıkış bilgileri loglanır; `AllExceptionsFilter` ise yakalanmayan hataları structured biçimde kaydeder.

### 7.2 Log Seviyeleri
- **error:** Kritik hatalar
- **warn:** Potansiyel sorunlar
- **info:** Önemli iş akışı events
- **debug:** Detaylı debug bilgisi
- **verbose:** Tüm detaylar

### 7.3 Monitoring Metrikleri

#### Application Metrics
- Request/response times
- Error rates
- Active connections
- Memory usage
- CPU usage

#### Business Metrics
- Orders per tenant
- API calls per endpoint
- User activity
- Database query times

---

## 8. Performance Optimizasyonu

### 8.1 Database Optimizasyonu

#### Indexleme Stratejisi
```sql
-- Frequently queried columns
CREATE INDEX idx_orders_tenant_status ON orders(status);
CREATE INDEX idx_orders_tenant_created ON orders(created_at);
CREATE INDEX idx_vehicles_plate ON vehicles(plate_number);
```

#### Query Optimization
- N+1 problem'i için eager loading kullanımı
- Pagination ile large dataset'leri handle etme
- Database connection pooling

### 8.2 Caching Stratejisi

```typescript
// Redis ile caching
@Injectable()
export class OrdersService {
  @Cacheable({ ttl: 300 }) // 5 dakika cache
  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find();
  }
}
```

### 8.3 API Response Optimization
- Gzip compression
- Response pagination
- Partial response (field filtering)
- ETags ile conditional requests

---

## 9. Scalability Considerations

### 9.1 Horizontal Scaling

#### Stateless Backend
- Session data Redis'te saklanır
- JWT kullanımı (stateless authentication)
- Load balancer arkasında multiple instance'lar

#### Database Scaling
- Read replicas için master-slave replication
- Connection pooling optimization
- Query result caching

### 9.2 Vertical Scaling

- Resource limits Docker'da ayarlanır
- Auto-scaling policies (Kubernetes)
- Database connection pool sizing

---

## 10. Disaster Recovery

### 10.1 Backup Stratejisi

- **Database Backups:** Günlük automated backups
- **File Storage:** S3 versioning enabled
- **Configuration:** Infrastructure as Code (Terraform)

### 10.2 Recovery Procedures

1. Database restore from backup
2. Application deployment from last stable version
3. Configuration restore from version control
4. Verification tests

### 10.3 High Availability

- Multiple availability zones
- Database replication
- Load balancer health checks
- Automatic failover

---

## 11. Teknoloji Seçim Gerekçeleri

### NestJS
- **Artılar:** Enterprise-grade, TypeScript native, modüler yapı, dependency injection
- **Eksiler:** Learning curve, boilerplate code

### TypeORM
- **Artılar:** TypeScript support, Active Record & Data Mapper patterns, migration support
- **Eksiler:** Multi-tenant kompleksliği, bazı edge case'lerde manual query gereksinimi

### PostgreSQL
- **Artılar:** Schema support (multi-tenancy için ideal), ACID compliance, JSON support
- **Eksiler:** Horizontal scaling zorluğu (vs. NoSQL)

### Next.js
- **Artılar:** Server-side rendering, routing, API routes, optimization
- **Eksiler:** Bundle size, React versiyonu bağımlılığı

---

## 12. Setup Wizard Mimarisi

### 12.1 Genel Bakış

Setup Wizard, platformun ilk kez kurulumunu kolaylaştıran interaktif bir sistemdir.

```
┌─────────────────────────────────────────────────────────────┐
│                    Setup Wizard Flow                         │
└─────────────────────────────────────────────────────────────┘

[Browser]
    │
    ├─► GET / (first access)
    │
    ▼
[Frontend: Root Layout]
    │
    ├─► Check Setup Status
    │   GET /api/setup/status
    │
    ▼
[Backend: Setup Controller]
    │
    ├─► Query setup_status table
    │
    ├──► If NOT completed:
    │    │
    │    ├─► Generate setup token (30min TTL)
    │    └─► Return: { isCompleted: false, setupToken }
    │
    └──► If completed:
         └─► Return: { isCompleted: true }

[Frontend: Redirect Logic]
    │
    ├──► If NOT completed → /setup (wizard)
    └──► If completed → /login or /dashboard
```

### 12.2 Configuration Storage Strategy

**Hybrid Approach:**

```typescript
// Database Credentials → .env (static, requires restart)
DB_HOST=database
DB_PORT=5432
DB_USERNAME=tmsuser
DB_PASSWORD=tmspassword

// Other Settings → Database (dynamic, runtime changeable)
system_settings {
  key: 'app.name'
  value: 'LogisticsTMS'
  type: 'string'
}
```

**장점:**
- Database credentials güvenli (.env)
- Diğer ayarlar dinamik değiştirilebilir
- Multi-instance deployment destekler
- No file write permissions needed (security)

### 12.3 Entities

#### SetupStatus Entity

```typescript
@Entity({ schema: 'public' })
export class SetupStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'jsonb', nullable: true })
  configuration: {
    version: string;
    completedAt: Date;
    completedBy: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### SystemSettings Entity

```typescript
@Entity({ schema: 'public' })
export class SystemSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; // 'app.name', 'jwt.expiration'

  @Column({ type: 'text' })
  value: string; // JSON string for complex values

  @Column({ default: 'string' })
  type: string; // 'string' | 'number' | 'boolean' | 'json'

  @Column({ default: false })
  isSecret: boolean; // For sensitive data

  @Column({ nullable: true })
  description: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 12.4 Setup Wizard Steps

```
Step 1: Welcome
  ↓
Step 2: Database Configuration
  │ → Test Connection
  │ → Validate Credentials
  ↓
Step 3: Admin User Creation
  │ → Validate Email
  │ → Check Password Strength
  ↓
Step 4: System Configuration
  │ → Generate JWT Secret
  │ → Set Timezone
  ↓
Step 5: Optional Settings (Email, Storage)
  │ → Test SMTP (optional)
  ↓
Step 6: Review & Confirm
  │ → Display all settings
  │ → User confirmation
  ↓
Step 7: Execute Setup
  │ → Create database schema
  │ → Run migrations
  │ → Create admin user
  │ → Save settings
  │ → Mark setup complete
  ↓
Step 8: Success & Redirect
```

### 12.5 Security Measures

#### Setup Token

```typescript
// Generated on first access
const setupToken = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

// Stored in memory cache (Redis in production)
cache.set(`setup:token:${setupToken}`, {
  createdAt: new Date(),
  expiresAt,
  used: false
}, 1800); // 30 minutes TTL
```

**Özellikleri:**
- Single-use token
- 30 dakika TTL
- Memory/Redis cache
- Token validation her request'te

#### Setup Guard

```typescript
@Injectable()
export class SetupCompletedGuard implements CanActivate {
  async canActivate(context: ExecutionContext): boolean {
    const setupStatus = await this.checkSetupStatus();
    
    if (!setupStatus.isCompleted) {
      // Allow only /setup endpoints
      const request = context.switchToHttp().getRequest();
      if (!request.url.startsWith('/api/setup')) {
        throw new ServiceUnavailableException(
          'Setup not completed. Please complete setup wizard.'
        );
      }
    }
    
    return true;
  }
}
```

### 12.6 Setup Process Flow

```typescript
// 1. Database Connection Test
POST /api/setup/validate-database
  → Test connection
  → Return version info

// 2. Initialize Setup
POST /api/setup/initialize
  → Create public schema tables
  → Create initial tenant schema
  → Save database config to .env (optional)

// 3. Complete Setup
POST /api/setup/complete
  → Create admin user (bcrypt hash)
  → Create tenant record
  → Save system settings to database
  → Mark setup_status.isCompleted = true
  → Return success
```

### 12.7 Frontend State Management

```typescript
// Setup Context
interface SetupContextType {
  currentStep: number;
  formData: {
    database: DatabaseConfig;
    admin: AdminConfig;
    system: SystemConfig;
    optional: OptionalConfig;
  };
  setStep: (step: number) => void;
  updateFormData: (section: string, data: any) => void;
  submitSetup: () => Promise<void>;
}
```

### 12.8 Error Handling

```typescript
// Setup errors with recovery
try {
  await setupService.complete(data);
} catch (error) {
  if (error instanceof DatabaseConnectionError) {
    // Rollback: Nothing to rollback yet
    return { step: 2, error: 'Database connection failed' };
  }
  
  if (error instanceof SchemaCreationError) {
    // Rollback: Drop created schemas
    await this.rollbackSchemas();
    return { step: 2, error: 'Schema creation failed' };
  }
  
  if (error instanceof AdminUserCreationError) {
    // Rollback: Keep schema, user can retry
    return { step: 3, error: 'Admin user creation failed' };
  }
}
```

### 12.9 Post-Setup Behavior

Kurulum tamamlandıktan sonra:

1. **Setup Endpoints Disabled:**
   ```typescript
   // Returns 403 Forbidden
   GET /api/setup/status → { isCompleted: true }
   POST /api/setup/* → 403 Forbidden
   ```

2. **Normal Operations Enabled:**
   - Login endpoint active
   - All API endpoints accessible
   - Dashboard accessible

3. **Setup Token Invalidated:**
   - Token marked as used
   - Cache cleared
   - New setup requires reset

---

## 13. Gelecek Mimari İyileştirmeler

### Kısa Vadeli (1-2 Ay)
- [x] Setup Wizard implementation
- [ ] Microservices'e geçiş araştırması
- [ ] Event-driven architecture (RabbitMQ/Kafka)
- [ ] GraphQL API implementation (alternatif olarak)
- [ ] Redis caching layer

### Orta Vadeli (3-6 Ay)
- [ ] Message queue sistemi
- [ ] Real-time notifications (WebSockets)
- [ ] Analytics service ayrıştırması
- [ ] CDN entegrasyonu

### Uzun Vadeli (6-12 Ay)
- [ ] Multi-region deployment
- [ ] Event sourcing & CQRS pattern
- [ ] Service mesh (Istio)
- [ ] Kubernetes migration
