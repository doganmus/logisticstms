﻿# GÃ¼venlik PolitikasÄ± ve Best Practices

Bu dokÃ¼man, TMS SaaS platformunun gÃ¼venlik politikalarÄ±nÄ±, tespit edilen gÃ¼venlik aÃ§Ä±klarÄ±nÄ± ve Ã§Ã¶zÃ¼m planlarÄ±nÄ± iÃ§erir.

**Son GÃ¼ncelleme:** 23 Ekim 2025

---

## ğŸ“‹ Ä°Ã§indekiler

- [GÃ¼venlik PolitikasÄ±](#gÃ¼venlik-politikasÄ±)
- [Tespit Edilen GÃ¼venlik AÃ§Ä±klarÄ±](#tespit-edilen-gÃ¼venlik-aÃ§Ä±klarÄ±)
- [GÃ¼venlik Best Practices](#gÃ¼venlik-best-practices)
- [GÃ¼venlik AÃ§Ä±ÄŸÄ± Bildirimi](#gÃ¼venlik-aÃ§Ä±ÄŸÄ±-bildirimi)

---

## ğŸ”’ GÃ¼venlik PolitikasÄ±

### Desteklenen Versiyonlar

| Version | Destekleniyor |
| ------- | ------------- |
| 0.x     | âœ… (Development) |

### GÃ¼venlik GÃ¼ncellemeleri

- Kritik gÃ¼venlik aÃ§Ä±klarÄ± 24 saat iÃ§inde dÃ¼zeltilir
- YÃ¼ksek Ã¶ncelikli aÃ§Ä±klar 1 hafta iÃ§inde dÃ¼zeltilir
- Orta Ã¶ncelikli aÃ§Ä±klar 2 hafta iÃ§inde dÃ¼zeltilir

---

## âš ï¸ Tespit Edilen GÃ¼venlik AÃ§Ä±klarÄ±

### ğŸ”´ Kritik Ã–ncelikli

#### 1. JWT Validation EksikliÄŸi
**Durum:** ğŸš§ AÃ§Ä±k  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Kritik

**AÃ§Ä±klama:**
`TenantMiddleware`'de JWT token sadece `decode()` ediliyor, `verify()` ile doÄŸrulanmÄ±yor. Bu, sahte token'larÄ±n kabul edilmesine neden olabilir.

**Mevcut Kod:**
```typescript
// âŒ GÃ¼venlik aÃ§Ä±ÄŸÄ± var
const decoded: any = decode(token);
if (decoded && decoded.tenantId) {
  tenantId = decoded.tenantId;
}
```

**DÃ¼zeltme PlanÄ±:**
```typescript
// âœ… GÃ¼venli implementasyon
try {
  const decoded = this.jwtService.verify(token, {
    secret: process.env.JWT_SECRET,
  });
  tenantId = decoded.tenantId;
  (req as any).user = decoded;
} catch (error) {
  throw new UnauthorizedException('Invalid token');
}
```

**DÃ¼zeltme AdÄ±mlarÄ±:**
- [x] `JwtService` injection'ını `TenantMiddleware`'e ekle
- [x] `decode()` yerine `verify()` kullan
- [x] Error handling ekle
- [ ] Unit test yaz
- [ ] Integration test yaz

---

#### 2. DTO Validation EksikliÄŸi
**Durum:** ğŸš§ AÃ§Ä±k  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Kritik

**AÃ§Ä±klama:**
Input validation yapÄ±lmadÄ±ÄŸÄ± iÃ§in SQL injection, XSS ve diÄŸer injection saldÄ±rÄ±larÄ±na aÃ§Ä±k.

**DÃ¼zeltme PlanÄ±:**
- [ ] `class-validator` ve `class-transformer` paketlerini yÃ¼kle
- [ ] TÃ¼m DTO'lara validation decorator'larÄ± ekle
- [ ] `ValidationPipe`'Ä± global olarak aktifleÅŸtir
- [ ] Custom validation kurallarÄ± yaz (plaka formatÄ±, telefon vb.)
- [ ] Validation test'leri yaz

**Ã–rnek DÃ¼zeltme:**
```typescript
// before
export class CreateOrderDto {
  origin: string;
  destination: string;
}

// after
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  origin: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  destination: string;
}
```

---

#### 3. Environment Variables GÃ¼venliÄŸi
**Durum:** ğŸš§ AÃ§Ä±k  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Kritik

**AÃ§Ä±klama:**
- `.env` dosyalarÄ± mevcut deÄŸil
- Credentials docker-compose.yml'de hardcoded
- JWT secret gÃ¼venli deÄŸil
- `.env` dosyalarÄ± `.gitignore`'da ama `.env.example` yok

**DÃ¼zeltme PlanÄ±:**
- [ ] Backend iÃ§in `.env.example` oluÅŸtur
- [ ] Frontend iÃ§in `.env.local.example` oluÅŸtur
- [ ] Root iÃ§in `.env.example` oluÅŸtur (docker-compose)
- [ ] `.gitignore`'u gÃ¼ncelle
- [ ] `docker-compose.yml`'de environment variables kullan
- [ ] Production iÃ§in secrets management kullan (AWS Secrets Manager, HashiCorp Vault)
- [ ] README.md'de setup talimatlarÄ± ekle

---

#### 4. CORS YapÄ±landÄ±rmasÄ± Eksik
**Durum:** ğŸš§ AÃ§Ä±k  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** YÃ¼ksek

**AÃ§Ä±klama:**
CORS yapÄ±landÄ±rmasÄ± yapÄ±lmamÄ±ÅŸ, tÃ¼m origin'lere aÃ§Ä±k olabilir.

**DÃ¼zeltme PlanÄ±:**
```typescript
// main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**AdÄ±mlar:**
- [ ] CORS middleware ekle
- [ ] Allowed origins environment variable'dan al
- [ ] Credentials enable et
- [ ] Preflight requests handle et
- [ ] Test yaz

---

#### 5. Rate Limiting Yok
**Durum:** ğŸš§ AÃ§Ä±k  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** YÃ¼ksek

**AÃ§Ä±klama:**
API rate limiting olmadÄ±ÄŸÄ± iÃ§in DDoS ve brute force saldÄ±rÄ±larÄ±na aÃ§Ä±k.

**DÃ¼zeltme PlanÄ±:**
```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 dakika
      limit: 100, // 100 request
    }]),
  ],
})
```

**AdÄ±mlar:**
- [ ] `@nestjs/throttler` paketini yÃ¼kle
- [ ] Global rate limiting yapÄ±landÄ±r
- [ ] Login endpoint iÃ§in Ã¶zel rate limit (5 req/min)
- [ ] Register endpoint iÃ§in Ã¶zel rate limit (3 req/min)
- [ ] Rate limit headers ekle
- [ ] Test yaz

---

### ğŸŸ¡ Orta Ã–ncelikli

#### 6. Password Policy ZayÄ±f
**Durum:** ğŸš§ AÃ§Ä±k  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Orta

**AÃ§Ä±klama:**
Åifre politikasÄ± yok veya zayÄ±f.

**DÃ¼zeltme PlanÄ±:**
- [ ] Minimum 8 karakter
- [ ] En az 1 bÃ¼yÃ¼k harf, 1 kÃ¼Ã§Ã¼k harf, 1 rakam veya Ã¶zel karakter
- [ ] Common password kontrolÃ¼
- [ ] Password strength indicator (frontend)
- [ ] Åifre geÃ§miÅŸi kontrolÃ¼ (son 3 ÅŸifre kullanÄ±lmasÄ±n)

---

#### 7. Session Management
**Durum:** ğŸš§ AÃ§Ä±k  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Orta

**AÃ§Ä±klama:**
- Token refresh mekanizmasÄ± yok
- Token revocation sistemi yok
- Logout'ta token invalidation yapÄ±lmÄ±yor

**DÃ¼zeltme PlanÄ±:**
- [ ] Refresh token implementasyonu
- [ ] Token blacklist (Redis)
- [ ] Logout endpoint'te token revoke et
- [ ] Token rotation strategy

---

#### 8. Audit Logging Eksik
**Durum:** ğŸš§ AÃ§Ä±k  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Orta

**AÃ§Ä±klama:**
GÃ¼venlik olaylarÄ± log'lanmÄ±yor (baÅŸarÄ±sÄ±z login denemeleri, yetki ihlalleri vb.)

**DÃ¼zeltme PlanÄ±:**
- [ ] Audit log entity oluÅŸtur
- [ ] BaÅŸarÄ±sÄ±z login denemeleri log'la
- [ ] Authorization failures log'la
- [ ] Critical operations log'la (delete, user changes)
- [ ] Log retention policy

---

### ğŸŸ¢ DÃ¼ÅŸÃ¼k Ã–ncelikli

#### 9. HTTPS Enforcement
**Durum:** ğŸ“ PlanlandÄ±  
**Risk Seviyesi:** DÃ¼ÅŸÃ¼k (development'ta)

**DÃ¼zeltme PlanÄ±:**
- [ ] Production'da HTTPS zorunluluÄŸu
- [ ] HTTP to HTTPS redirect
- [ ] HSTS header ekle
- [ ] SSL/TLS certificate yÃ¶netimi

---

#### 10. Security Headers
**Durum:** ğŸ“ PlanlandÄ±  
**Risk Seviyesi:** DÃ¼ÅŸÃ¼k

**DÃ¼zeltme PlanÄ±:**
```typescript
// Helmet middleware ile security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

**Headers:**
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] X-XSS-Protection
- [ ] Content-Security-Policy
- [ ] Strict-Transport-Security

---

## ğŸ›¡ï¸ GÃ¼venlik Best Practices

### Backend GÃ¼venliÄŸi

#### 1. Authentication & Authorization
```typescript
// âœ… Guard'larÄ± her zaman kullan
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController { }

// âœ… Password'larÄ± hash'le
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// âœ… JWT secret'Ä± environment variable'dan al
jwtConstants.secret = process.env.JWT_SECRET;
```

#### 2. Input Validation
```typescript
// âœ… Her DTO'da validation kullan
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;
}

// âœ… ValidationPipe global olarak aktif
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

#### 3. Database Security
```typescript
// âœ… TypeORM parameterized queries kullan (SQL injection Ã¶nleme)
await repository.find({ where: { email } });

// âŒ Raw query'lerde parametre kullan
await repository.query('SELECT * FROM users WHERE email = $1', [email]);

// âœ… Tenant isolation kontrolÃ¼
if (order.tenantId !== req.user.tenantId) {
  throw new ForbiddenException('Access denied');
}
```

#### 4. Error Handling
```typescript
// âœ… Sensitive bilgileri error'larda expose etme
catch (error) {
  if (process.env.NODE_ENV === 'production') {
    throw new InternalServerErrorException('An error occurred');
  }
  throw error;
}

// âœ… Generic error messages kullan
throw new UnauthorizedException('Invalid credentials');
// âŒ DetaylÄ± bilgi verme: 'User not found' veya 'Wrong password'
```

---

### Frontend GÃ¼venliÄŸi

#### 1. Token Storage
```typescript
// âœ… HttpOnly cookies kullan (XSS'den korunur)
// veya
// âœ… localStorage kullanÄ±yorsan XSS'e karÅŸÄ± dikkatli ol
localStorage.setItem('token', token);

// âŒ Token'Ä± URL'de gÃ¶nderme
// âŒ Token'Ä± console.log'lama
```

#### 2. Input Sanitization
```typescript
// âœ… User input'larÄ± sanitize et
import DOMPurify from 'dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);

// âœ… Form validation
const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});
```

#### 3. API Requests
```typescript
// âœ… HTTPS kullan (production)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// âœ… Timeout belirle
axios.defaults.timeout = 10000;

// âœ… Error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

---

### DevOps GÃ¼venliÄŸi

#### 1. Environment Variables
```bash
# âœ… .env dosyalarÄ±nÄ± git'e ekleme
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# âœ… .env.example oluÅŸtur
cp .env .env.example
# Sonra .env.example'daki deÄŸerleri temizle
```

#### 2. Docker Security
```dockerfile
# âœ… Non-root user kullan
USER node

# âœ… Multi-stage builds
FROM node:18-alpine AS builder
FROM node:18-alpine AS production

# âœ… Secrets build argument olarak geÃ§me
# âŒ ARG DB_PASSWORD=secret
# âœ… Runtime'da environment variable kullan
```

#### 3. Dependency Security
```bash
# âœ… DÃ¼zenli dependency audit
npm audit
npm audit fix

# âœ… Outdated packages kontrolÃ¼
npm outdated

# âœ… Security scanning (Snyk, Dependabot)
```

---

## ğŸ“Š GÃ¼venlik Checklist

### Pre-Production Checklist

- [ ] TÃ¼m kritik gÃ¼venlik aÃ§Ä±klarÄ± kapatÄ±ldÄ±
- [ ] Tüm kritik güvenlik açıkları kapatıldı
- [x] JWT validation implementasyonu
- [x] DTO validation tüm endpoint'lerde
- [x] CORS yapılandırması yapıldı
- [x] Rate limiting aktif
- [x] Environment variables düzenlendi
- [ ] HTTPS enabled
- [ ] Security headers eklendi
- [x] Error handling global filter ile
- [ ] Audit logging implementasyonu
- [ ] Dependency security audit yapıldı
- [ ] Session management gÃ¼venli
- [ ] Database backups yapÄ±landÄ±rÄ±ldÄ±
- [ ] Monitoring ve alerting kuruldu

### Regular Security Tasks

**GÃ¼nlÃ¼k:**
- [ ] Failed login attempts kontrolÃ¼
- [ ] Error rate monitoring
- [ ] Unusual activity detection

**HaftalÄ±k:**
- [ ] Security logs review
- [ ] Dependency updates kontrolÃ¼
- [ ] Backup test

**AylÄ±k:**
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Access control review
- [ ] Incident response plan update

---

## ğŸš¨ GÃ¼venlik AÃ§Ä±ÄŸÄ± Bildirimi

### GÃ¼venlik AÃ§Ä±ÄŸÄ± BulduysanÄ±z

1. **Hemen bildirin:** security@yourcompany.com
2. **DetaylÄ± aÃ§Ä±klama:** Sorunu reproduce etme adÄ±mlarÄ±
3. **Impact assessment:** GÃ¼venlik riskinin seviyesi
4. **Proof of concept:** MÃ¼mkÃ¼nse PoC kodu/screenshot

### Bildiri FormatÄ±

```markdown
**BaÅŸlÄ±k:** [KÄ±sa aÃ§Ä±klama]
**Risk Seviyesi:** [Kritik/YÃ¼ksek/Orta/DÃ¼ÅŸÃ¼k]
**Kategori:** [SQL Injection/XSS/CSRF/vb.]

**AÃ§Ä±klama:**
[DetaylÄ± aÃ§Ä±klama]

**Reproduce AdÄ±mlarÄ±:**
1. [AdÄ±m 1]
2. [AdÄ±m 2]
3. [AdÄ±m 3]

**Etki:**
[Potansiyel impact]

**Ã–nerilen DÃ¼zeltme:**
[EÄŸer varsa]
```

### YanÄ±t SÃ¼reci

1. **Teyit:** 24 saat iÃ§inde bildirimi alÄ±ndÄ± mesajÄ±
2. **DeÄŸerlendirme:** 48 saat iÃ§inde risk analizi
3. **DÃ¼zeltme:** Risk seviyesine gÃ¶re dÃ¼zeltme planÄ±
4. **Bilgilendirme:** DÃ¼zeltme tamamlandÄ±ÄŸÄ±nda bilgilendirme

---

## ğŸ”— Ä°lgili Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

## ğŸ“… GÃ¼venlik GÃ¼ncellemeleri

| Tarih | GÃ¼ncelleme | Durum |
|-------|------------|-------|
| 2025-10-23 | Ä°lk gÃ¼venlik analizi | âœ… TamamlandÄ± |
| 2025-10-xx | JWT validation dÃ¼zeltme | ğŸš§ PlanlandÄ± |
| 2025-10-xx | DTO validation implementasyonu | ğŸš§ PlanlandÄ± |

