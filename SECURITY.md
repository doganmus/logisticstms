# Güvenlik Politikası ve Best Practices

Bu doküman, TMS SaaS platformunun güvenlik politikalarını, tespit edilen güvenlik açıklarını ve çözüm planlarını içerir.

**Son Güncelleme:** 23 Ekim 2025

---

## 📋 İçindekiler

- [Güvenlik Politikası](#güvenlik-politikası)
- [Tespit Edilen Güvenlik Açıkları](#tespit-edilen-güvenlik-açıkları)
- [Güvenlik Best Practices](#güvenlik-best-practices)
- [Güvenlik Açığı Bildirimi](#güvenlik-açığı-bildirimi)

---

## 🔒 Güvenlik Politikası

### Desteklenen Versiyonlar

| Version | Destekleniyor |
| ------- | ------------- |
| 0.x     | ✅ (Development) |

### Güvenlik Güncellemeleri

- Kritik güvenlik açıkları 24 saat içinde düzeltilir
- Yüksek öncelikli açıklar 1 hafta içinde düzeltilir
- Orta öncelikli açıklar 2 hafta içinde düzeltilir

---

## ⚠️ Tespit Edilen Güvenlik Açıkları

### 🔴 Kritik Öncelikli

#### 1. JWT Validation Eksikliği
**Durum:** 🚧 Açık  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Kritik

**Açıklama:**
`TenantMiddleware`'de JWT token sadece `decode()` ediliyor, `verify()` ile doğrulanmıyor. Bu, sahte token'ların kabul edilmesine neden olabilir.

**Mevcut Kod:**
```typescript
// ❌ Güvenlik açığı var
const decoded: any = decode(token);
if (decoded && decoded.tenantId) {
  tenantId = decoded.tenantId;
}
```

**Düzeltme Planı:**
```typescript
// ✅ Güvenli implementasyon
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

**Düzeltme Adımları:**
- [ ] `JwtService` injection'ını `TenantMiddleware`'e ekle
- [ ] `decode()` yerine `verify()` kullan
- [ ] Error handling ekle
- [ ] Unit test yaz
- [ ] Integration test yaz

---

#### 2. DTO Validation Eksikliği
**Durum:** 🚧 Açık  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Kritik

**Açıklama:**
Input validation yapılmadığı için SQL injection, XSS ve diğer injection saldırılarına açık.

**Düzeltme Planı:**
- [ ] `class-validator` ve `class-transformer` paketlerini yükle
- [ ] Tüm DTO'lara validation decorator'ları ekle
- [ ] `ValidationPipe`'ı global olarak aktifleştir
- [ ] Custom validation kuralları yaz (plaka formatı, telefon vb.)
- [ ] Validation test'leri yaz

**Örnek Düzeltme:**
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

#### 3. Environment Variables Güvenliği
**Durum:** 🚧 Açık  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Kritik

**Açıklama:**
- `.env` dosyaları mevcut değil
- Credentials docker-compose.yml'de hardcoded
- JWT secret güvenli değil
- `.env` dosyaları `.gitignore`'da ama `.env.example` yok

**Düzeltme Planı:**
- [ ] Backend için `.env.example` oluştur
- [ ] Frontend için `.env.local.example` oluştur
- [ ] Root için `.env.example` oluştur (docker-compose)
- [ ] `.gitignore`'u güncelle
- [ ] `docker-compose.yml`'de environment variables kullan
- [ ] Production için secrets management kullan (AWS Secrets Manager, HashiCorp Vault)
- [ ] README.md'de setup talimatları ekle

---

#### 4. CORS Yapılandırması Eksik
**Durum:** 🚧 Açık  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Yüksek

**Açıklama:**
CORS yapılandırması yapılmamış, tüm origin'lere açık olabilir.

**Düzeltme Planı:**
```typescript
// main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Adımlar:**
- [ ] CORS middleware ekle
- [ ] Allowed origins environment variable'dan al
- [ ] Credentials enable et
- [ ] Preflight requests handle et
- [ ] Test yaz

---

#### 5. Rate Limiting Yok
**Durum:** 🚧 Açık  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Yüksek

**Açıklama:**
API rate limiting olmadığı için DDoS ve brute force saldırılarına açık.

**Düzeltme Planı:**
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

**Adımlar:**
- [ ] `@nestjs/throttler` paketini yükle
- [ ] Global rate limiting yapılandır
- [ ] Login endpoint için özel rate limit (5 req/min)
- [ ] Register endpoint için özel rate limit (3 req/min)
- [ ] Rate limit headers ekle
- [ ] Test yaz

---

### 🟡 Orta Öncelikli

#### 6. Password Policy Zayıf
**Durum:** 🚧 Açık  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Orta

**Açıklama:**
Şifre politikası yok veya zayıf.

**Düzeltme Planı:**
- [ ] Minimum 8 karakter
- [ ] En az 1 büyük harf, 1 küçük harf, 1 rakam veya özel karakter
- [ ] Common password kontrolü
- [ ] Password strength indicator (frontend)
- [ ] Şifre geçmişi kontrolü (son 3 şifre kullanılmasın)

---

#### 7. Session Management
**Durum:** 🚧 Açık  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Orta

**Açıklama:**
- Token refresh mekanizması yok
- Token revocation sistemi yok
- Logout'ta token invalidation yapılmıyor

**Düzeltme Planı:**
- [ ] Refresh token implementasyonu
- [ ] Token blacklist (Redis)
- [ ] Logout endpoint'te token revoke et
- [ ] Token rotation strategy

---

#### 8. Audit Logging Eksik
**Durum:** 🚧 Açık  
**Tespit Tarihi:** 23 Ekim 2025  
**Risk Seviyesi:** Orta

**Açıklama:**
Güvenlik olayları log'lanmıyor (başarısız login denemeleri, yetki ihlalleri vb.)

**Düzeltme Planı:**
- [ ] Audit log entity oluştur
- [ ] Başarısız login denemeleri log'la
- [ ] Authorization failures log'la
- [ ] Critical operations log'la (delete, user changes)
- [ ] Log retention policy

---

### 🟢 Düşük Öncelikli

#### 9. HTTPS Enforcement
**Durum:** 📝 Planlandı  
**Risk Seviyesi:** Düşük (development'ta)

**Düzeltme Planı:**
- [ ] Production'da HTTPS zorunluluğu
- [ ] HTTP to HTTPS redirect
- [ ] HSTS header ekle
- [ ] SSL/TLS certificate yönetimi

---

#### 10. Security Headers
**Durum:** 📝 Planlandı  
**Risk Seviyesi:** Düşük

**Düzeltme Planı:**
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

## 🛡️ Güvenlik Best Practices

### Backend Güvenliği

#### 1. Authentication & Authorization
```typescript
// ✅ Guard'ları her zaman kullan
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController { }

// ✅ Password'ları hash'le
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// ✅ JWT secret'ı environment variable'dan al
jwtConstants.secret = process.env.JWT_SECRET;
```

#### 2. Input Validation
```typescript
// ✅ Her DTO'da validation kullan
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;
}

// ✅ ValidationPipe global olarak aktif
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

#### 3. Database Security
```typescript
// ✅ TypeORM parameterized queries kullan (SQL injection önleme)
await repository.find({ where: { email } });

// ❌ Raw query'lerde parametre kullan
await repository.query('SELECT * FROM users WHERE email = $1', [email]);

// ✅ Tenant isolation kontrolü
if (order.tenantId !== req.user.tenantId) {
  throw new ForbiddenException('Access denied');
}
```

#### 4. Error Handling
```typescript
// ✅ Sensitive bilgileri error'larda expose etme
catch (error) {
  if (process.env.NODE_ENV === 'production') {
    throw new InternalServerErrorException('An error occurred');
  }
  throw error;
}

// ✅ Generic error messages kullan
throw new UnauthorizedException('Invalid credentials');
// ❌ Detaylı bilgi verme: 'User not found' veya 'Wrong password'
```

---

### Frontend Güvenliği

#### 1. Token Storage
```typescript
// ✅ HttpOnly cookies kullan (XSS'den korunur)
// veya
// ✅ localStorage kullanıyorsan XSS'e karşı dikkatli ol
localStorage.setItem('token', token);

// ❌ Token'ı URL'de gönderme
// ❌ Token'ı console.log'lama
```

#### 2. Input Sanitization
```typescript
// ✅ User input'ları sanitize et
import DOMPurify from 'dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);

// ✅ Form validation
const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});
```

#### 3. API Requests
```typescript
// ✅ HTTPS kullan (production)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ✅ Timeout belirle
axios.defaults.timeout = 10000;

// ✅ Error handling
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

### DevOps Güvenliği

#### 1. Environment Variables
```bash
# ✅ .env dosyalarını git'e ekleme
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# ✅ .env.example oluştur
cp .env .env.example
# Sonra .env.example'daki değerleri temizle
```

#### 2. Docker Security
```dockerfile
# ✅ Non-root user kullan
USER node

# ✅ Multi-stage builds
FROM node:18-alpine AS builder
FROM node:18-alpine AS production

# ✅ Secrets build argument olarak geçme
# ❌ ARG DB_PASSWORD=secret
# ✅ Runtime'da environment variable kullan
```

#### 3. Dependency Security
```bash
# ✅ Düzenli dependency audit
npm audit
npm audit fix

# ✅ Outdated packages kontrolü
npm outdated

# ✅ Security scanning (Snyk, Dependabot)
```

---

## 📊 Güvenlik Checklist

### Pre-Production Checklist

- [ ] Tüm kritik güvenlik açıkları kapatıldı
- [ ] JWT validation implementasyonu
- [ ] DTO validation tüm endpoint'lerde
- [ ] CORS yapılandırması yapıldı
- [ ] Rate limiting aktif
- [ ] Environment variables düzenlendi
- [ ] HTTPS enabled
- [ ] Security headers eklendi
- [ ] Error handling global filter ile
- [ ] Audit logging implementasyonu
- [ ] Dependency security audit yapıldı
- [ ] Password policy uygulandı
- [ ] Session management güvenli
- [ ] Database backups yapılandırıldı
- [ ] Monitoring ve alerting kuruldu

### Regular Security Tasks

**Günlük:**
- [ ] Failed login attempts kontrolü
- [ ] Error rate monitoring
- [ ] Unusual activity detection

**Haftalık:**
- [ ] Security logs review
- [ ] Dependency updates kontrolü
- [ ] Backup test

**Aylık:**
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Access control review
- [ ] Incident response plan update

---

## 🚨 Güvenlik Açığı Bildirimi

### Güvenlik Açığı Bulduysanız

1. **Hemen bildirin:** security@yourcompany.com
2. **Detaylı açıklama:** Sorunu reproduce etme adımları
3. **Impact assessment:** Güvenlik riskinin seviyesi
4. **Proof of concept:** Mümkünse PoC kodu/screenshot

### Bildiri Formatı

```markdown
**Başlık:** [Kısa açıklama]
**Risk Seviyesi:** [Kritik/Yüksek/Orta/Düşük]
**Kategori:** [SQL Injection/XSS/CSRF/vb.]

**Açıklama:**
[Detaylı açıklama]

**Reproduce Adımları:**
1. [Adım 1]
2. [Adım 2]
3. [Adım 3]

**Etki:**
[Potansiyel impact]

**Önerilen Düzeltme:**
[Eğer varsa]
```

### Yanıt Süreci

1. **Teyit:** 24 saat içinde bildirimi alındı mesajı
2. **Değerlendirme:** 48 saat içinde risk analizi
3. **Düzeltme:** Risk seviyesine göre düzeltme planı
4. **Bilgilendirme:** Düzeltme tamamlandığında bilgilendirme

---

## 🔗 İlgili Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

## 📅 Güvenlik Güncellemeleri

| Tarih | Güncelleme | Durum |
|-------|------------|-------|
| 2025-10-23 | İlk güvenlik analizi | ✅ Tamamlandı |
| 2025-10-xx | JWT validation düzeltme | 🚧 Planlandı |
| 2025-10-xx | DTO validation implementasyonu | 🚧 Planlandı |

