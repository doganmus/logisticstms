# Environment Variables Dokümantasyonu

Bu doküman, TMS SaaS platformunda kullanılan tüm environment variables'ların detaylı açıklamasını içerir.

**Son Güncelleme:** 3 Mart 2026

---

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Backend Environment Variables](#backend-environment-variables)
- [Frontend Environment Variables](#frontend-environment-variables)
- [Docker Compose Environment Variables](#docker-compose-environment-variables)
- [Environment Dosyaları Kurulumu](#environment-dosyaları-kurulumu)
- [Güvenlik Best Practices](#güvenlik-best-practices)

---

## 🌍 Genel Bakış

Projede üç farklı `.env` dosyası bulunmaktadır:

1. **Root `.env`** - Docker Compose için
2. **`backend/.env`** - NestJS backend için
3. **`frontend/.env.local`** - Next.js frontend için

> ⚠️ **Önemli:** `.env` dosyaları asla git'e commit edilmemelidir! Sadece `.env.example` dosyaları commit edilir.

---

## 🖥️ Backend Environment Variables

### Database Configuration

#### `DB_HOST`
**Tip:** String  
**Varsayılan:** `localhost` (local), `database` (docker)  
**Açıklama:** PostgreSQL database host adresi

**Örnekler:**
```bash
# Local development
DB_HOST=localhost

# Docker Compose
DB_HOST=database

# Production
DB_HOST=your-db-instance.region.rds.amazonaws.com
```

---

#### `DB_PORT`
**Tip:** Number  
**Varsayılan:** `5432`  
**Açıklama:** PostgreSQL database port numarası

```bash
DB_PORT=5432
```

---

#### `DB_USERNAME`
**Tip:** String  
**Varsayılan:** `tmsuser`  
**Açıklama:** Database kullanıcı adı

```bash
# Development
DB_USERNAME=tmsuser

# Production
DB_USERNAME=prod_tms_user
```

> ⚠️ Production'da güçlü kullanıcı adları kullanın

---

#### `DB_PASSWORD`
**Tip:** String  
**Varsayılan:** `tmspassword`  
**Açıklama:** Database şifresi

```bash
# Development
DB_PASSWORD=tmspassword

# Production
DB_PASSWORD=YourSuperSecurePasswordHere123!
```

> 🔒 **Güvenlik:** Production'da minimum 16 karakter, karışık karakterler içeren güçlü şifre kullanın

---

#### `DB_DATABASE`
**Tip:** String  
**Varsayılan:** `tmsdb`  
**Açıklama:** Database adı

```bash
DB_DATABASE=tmsdb
```

---

### JWT Configuration

#### `JWT_SECRET`
**Tip:** String  
**Zorunlu:** Evet  
**Açıklama:** JWT token'larını imzalamak için kullanılan secret key

```bash
# Development
JWT_SECRET=your-development-secret-key-change-in-production

# Production
JWT_SECRET=aVeryLongAndSecureRandomStringThatIsAtLeast32Characters!
```

> 🔒 **Güvenlik:** 
> - Minimum 32 karakter
> - Rastgele karakter kombinasyonu
> - Her environment için farklı olmalı
> - Generate: `openssl rand -base64 32`

---

#### `JWT_EXPIRATION`
**Tip:** String  
**Varsayılan:** `24h`  
**Açıklama:** JWT token'ın geçerlilik süresi

```bash
# Development (uzun süre)
JWT_EXPIRATION=24h

# Production (kısa süre)
JWT_EXPIRATION=15m
```

**Format:**
- `60s` - 60 saniye
- `5m` - 5 dakika
- `1h` - 1 saat
- `1d` - 1 gün
- `7d` - 7 gün

---

#### `JWT_REFRESH_SECRET`
**Tip:** String  
**Zorunlu:** Hayır (gelecekte eklenecek)  
**Açıklama:** Refresh token için ayrı secret key

```bash
JWT_REFRESH_SECRET=another-very-secure-secret-for-refresh-tokens
```

---

#### `JWT_REFRESH_EXPIRATION`
**Tip:** String  
**Varsayılan:** `7d`  
**Açıklama:** Refresh token geçerlilik süresi

```bash
JWT_REFRESH_EXPIRATION=7d
```

---

### Application Configuration

#### `NODE_ENV`
**Tip:** Enum  
**Değerler:** `development` | `staging` | `production` | `test`  
**Varsayılan:** `development`  
**Açıklama:** Uygulama çalışma ortamı

```bash
# Development
NODE_ENV=development

# Staging
NODE_ENV=staging

# Production
NODE_ENV=production
```

**Etkilediği Alanlar:**
- Error handling (stack trace görünürlüğü)
- Logging seviyesi
- Database synchronize modu

---

### Email Gönderimi

Bu değişkenler opsiyoneldir. Tanımlanmadığı durumda sistem e-posta içeriğini loglar.

#### `SMTP_HOST`
**Tip:** String  
**Açıklama:** SMTP sunucu adresi.

#### `SMTP_PORT`
**Tip:** Number  
**Varsayılan:** `587`

#### `SMTP_SECURE`
**Tip:** Boolean (`true` | `false`)  
**Varsayılan:** `false`  
**Açıklama:** TLS üzerinden bağlantı kurulması gerekir mi?

#### `SMTP_USERNAME` & `SMTP_PASSWORD`
**Tip:** String  
**Açıklama:** SMTP kimlik bilgileri. Basic auth gerektirmeyen bir yapılandırmada boş bırakılabilir.

#### `SMTP_FROM`
**Tip:** String  
**Varsayılan:** `LogisticsTMS <no-reply@logisticstms.local>`  
**Açıklama:** Gönderici adı ve adresi.

```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USERNAME=your-user
SMTP_PASSWORD=your-pass
SMTP_FROM="LogisticsTMS <no-reply@logisticstms.local>"
```

> 💡 `SMTP_HOST` tanımlı değilse, backend gönderilecek mailleri log çıktısına yazdırır.

---

#### `APP_URL`
**Tip:** String  
**Varsayılan:** `http://localhost:3001`  
**Açıklama:** Frontend taban adresi. Email doğrulama ve şifre sıfırlama linkleri bu taban üzerinden üretilir.

```bash
APP_URL=http://localhost:3001
```
- CORS politikası
- Cache stratejisi

---

#### `PORT`
**Tip:** Number  
**Varsayılan:** `3000`  
**Açıklama:** Backend API'nin çalışacağı port

```bash
PORT=3000
```

---

#### `API_PREFIX`
**Tip:** String  
**Varsayılan:** `/api/v1`  
**Açıklama:** API endpoint'leri için prefix

```bash
API_PREFIX=/api/v1
```

---

### CORS Configuration

#### `ALLOWED_ORIGINS`
**Tip:** String (comma-separated)  
**Zorunlu:** Evet (production)  
**Açıklama:** CORS için izin verilen origin'ler

```bash
# Development
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Production
ALLOWED_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com
```

---

### Rate Limiting

#### `THROTTLE_TTL`
**Tip:** Number  
**Varsayılan:** `60000` (60 saniye)  
**Açıklama:** Rate limit zaman penceresi (milisaniye)

```bash
THROTTLE_TTL=60000
```

---

#### `THROTTLE_LIMIT`
**Tip:** Number  
**Varsayılan:** `100`  
**Açıklama:** TTL içinde izin verilen maksimum request sayısı

```bash
# Development (gevşek)
THROTTLE_LIMIT=1000

# Production (katı)
THROTTLE_LIMIT=100
```

---

### Logging Configuration

#### `LOG_LEVEL`
**Tip:** Enum  
**Değerler:** `error` | `warn` | `info` | `debug` | `verbose`  
**Varsayılan:** `info`  
**Açıklama:** Minimum log seviyesi

```bash
# Production
LOG_LEVEL=warn

# Development
LOG_LEVEL=debug
```

---

### Email Configuration (Gelecek)

#### `MAIL_HOST`
**Tip:** String  
**Açıklama:** SMTP host adresi

```bash
MAIL_HOST=smtp.gmail.com
```

---

#### `MAIL_PORT`
**Tip:** Number  
**Açıklama:** SMTP port

```bash
MAIL_PORT=587
```

---

#### `MAIL_USER`
**Tip:** String  
**Açıklama:** Email gönderici adresi

```bash
MAIL_USER=noreply@yourdomain.com
```

---

#### `MAIL_PASSWORD`
**Tip:** String  
**Açıklama:** Email şifresi veya app password

```bash
MAIL_PASSWORD=your-email-password
```

---

### Storage Configuration (Gelecek)

#### `AWS_REGION`
**Tip:** String  
**Açıklama:** AWS region (S3 için)

```bash
AWS_REGION=eu-central-1
```

---

#### `AWS_ACCESS_KEY_ID`
**Tip:** String  
**Açıklama:** AWS access key

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
```

---

#### `AWS_SECRET_ACCESS_KEY`
**Tip:** String  
**Açıklama:** AWS secret key

```bash
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

---

#### `S3_BUCKET_NAME`
**Tip:** String  
**Açıklama:** S3 bucket adı

```bash
S3_BUCKET_NAME=tms-documents-prod
```

---

## 🎨 Frontend Environment Variables

> 💡 **Not:** Next.js'de browser'da erişilecek variable'lar `NEXT_PUBLIC_` prefix'i ile başlamalıdır.

### API Configuration

#### `NEXT_PUBLIC_API_URL`
**Tip:** String  
**Zorunlu:** Evet  
**Açıklama:** Backend API base URL

```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:3000

# Production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

#### `NEXT_PUBLIC_API_TIMEOUT`
**Tip:** Number  
**Varsayılan:** `10000` (10 saniye)  
**Açıklama:** API request timeout (milisaniye)

```bash
NEXT_PUBLIC_API_TIMEOUT=10000
```

---

### Application Configuration

#### `NEXT_PUBLIC_APP_NAME`
**Tip:** String  
**Varsayılan:** `TMS`  
**Açıklama:** Uygulama adı

```bash
NEXT_PUBLIC_APP_NAME=LogisticsTMS
```

---

#### `NEXT_PUBLIC_APP_VERSION`
**Tip:** String  
**Açıklama:** Uygulama versiyonu

```bash
NEXT_PUBLIC_APP_VERSION=0.1.0
```

---

### Feature Flags

#### `NEXT_PUBLIC_ENABLE_ANALYTICS`
**Tip:** Boolean  
**Varsayılan:** `false`  
**Açıklama:** Analytics özelliğini aktif et

```bash
# Development
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Production
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

#### `NEXT_PUBLIC_ENABLE_PWA`
**Tip:** Boolean  
**Varsayılan:** `false`  
**Açıklama:** Progressive Web App özelliğini aktif et

```bash
NEXT_PUBLIC_ENABLE_PWA=true
```

---

### Google Maps (Gelecek)

#### `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
**Tip:** String  
**Açıklama:** Google Maps API key

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

---

### Sentry (Gelecek)

#### `NEXT_PUBLIC_SENTRY_DSN`
**Tip:** String  
**Açıklama:** Sentry DSN for error tracking

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## 🐳 Docker Compose Environment Variables

### Database Service

```bash
POSTGRES_USER=tmsuser
POSTGRES_PASSWORD=tmspassword
POSTGRES_DB=tmsdb
```

### Backend Service

```bash
DATABASE_URL=postgresql://tmsuser:tmspassword@database:5432/tmsdb?schema=public
NODE_ENV=development
DB_HOST=database
DB_PORT=5432
DB_USERNAME=tmsuser
DB_PASSWORD=tmspassword
DB_DATABASE=tmsdb
JWT_SECRET=your-secret-key
```

---

## 📝 Environment Dosyaları Kurulumu

### Otomatik Kurulum (Önerilen)

Root dizinden tek komutla tüm environment dosyalarını oluşturun:

```bash
# Tüm .env dosyalarını otomatik oluştur
npm run setup:env

# Alternatif: Direkt script çalıştır
node scripts/setup-env.js
```

Bu script otomatik olarak:
- ✅ `backend/.env` dosyasını oluşturur
- ✅ `frontend/.env.local` dosyasını oluşturur
- ✅ Root `.env` dosyasını oluşturur
- ✅ Mevcut dosyaları yedekler (`.bak` uzantısı ile)
- ✅ Eksik dosyaları raporlar

---

### Manuel Kurulum

#### 1. Backend Setup

```bash
# Backend dizinine git
cd backend

# .env.example'dan .env oluştur
cp .env.example .env

# .env dosyasını düzenle
nano .env  # veya favori editörünüzü kullanın
```

**`backend/.env.example` İçeriği:**
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tmsuser
DB_PASSWORD=tmspassword
DB_DATABASE=tmsdb

# JWT Configuration
JWT_SECRET=change-this-to-a-secure-secret-key-in-production
JWT_EXPIRATION=24h

# Application
NODE_ENV=development
PORT=3000

# CORS
ALLOWED_ORIGINS=http://localhost:3001

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=debug
```

---

### 2. Frontend Setup

```bash
# Frontend dizinine git
cd frontend

# .env.local.example'dan .env.local oluştur
cp .env.local.example .env.local

# .env.local dosyasını düzenle
nano .env.local
```

**`frontend/.env.local.example` İçeriği:**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=10000

# Application
NEXT_PUBLIC_APP_NAME=LogisticsTMS
NEXT_PUBLIC_APP_VERSION=0.1.0

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=false
```

---

### 3. Docker Compose Setup

```bash
# Root dizinde .env.example'dan .env oluştur
cp .env.example .env

# .env dosyasını düzenle
nano .env
```

**`.env.example` İçeriği:**
```bash
# Database
POSTGRES_USER=tmsuser
POSTGRES_PASSWORD=tmspassword
POSTGRES_DB=tmsdb

# Backend
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

---

## 🔒 Güvenlik Best Practices

### 1. Secret Generation

Güvenli secret key'ler oluşturma:

```bash
# OpenSSL ile
openssl rand -base64 32

# Node.js ile
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Python ile
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

### 2. .gitignore Konfigürasyonu

```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# Keep example files
!.env.example
!.env.local.example
```

---

### 3. Production Checklist

- [ ] Tüm `.env` dosyaları oluşturuldu
- [ ] Secret key'ler güvenli şekilde generate edildi
- [ ] Database credentials güçlü
- [ ] CORS allowed origins production URL'leri içeriyor
- [ ] `NODE_ENV=production` ayarlandı
- [ ] Rate limiting production için ayarlandı
- [ ] Logging seviyesi `warn` veya `error`
- [ ] HTTPS enabled
- [ ] Sensitive değerler secrets manager'da (AWS Secrets Manager, Vault)

---

### 4. Secret Management (Production)

Production'da environment variables'ları şu yöntemlerle yönetin:

#### AWS Secrets Manager
```bash
# Secret oluştur
aws secretsmanager create-secret --name tms/prod/db-password --secret-string "YourPassword"

# Secret'ı al
aws secretsmanager get-secret-value --secret-id tms/prod/db-password
```

#### Docker Secrets
```yaml
# docker-compose.yml
secrets:
  db_password:
    external: true

services:
  backend:
    secrets:
      - db_password
```

#### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tms-secrets
type: Opaque
data:
  db-password: <base64-encoded-password>
```

---

## 🔄 Environment Variables Değişimi

### Development'tan Production'a Geçiş

1. **Database Credentials:**
   - Güçlü şifreler
   - Production database URL'i
   - Connection pooling ayarları

2. **JWT Configuration:**
   - Yeni secret key
   - Daha kısa expiration (15m-1h)
   - Refresh token implementasyonu

3. **CORS:**
   - Production domain'leri
   - Wildcard kullanmayın

4. **Logging:**
   - Log level `warn` veya `error`
   - Structured logging
   - Log aggregation (ELK, CloudWatch)

5. **Rate Limiting:**
   - Daha katı limitler
   - IP-based throttling

---

## 🤖 Setup Script Detayları

### Setup Script Nasıl Çalışır?

`scripts/setup-env.js` dosyası aşağıdaki işlemleri yapar:

1. **Kontrol:** `.env.example` dosyalarının varlığını kontrol eder
2. **Yedekleme:** Mevcut `.env` dosyaları varsa `.bak` uzantısı ile yedekler
3. **Kopyalama:** `.env.example` dosyalarını `.env` olarak kopyalar
4. **Raporlama:** Hangi dosyaların oluşturulduğunu/güncellendiğini bildirir
5. **Uyarı:** Production'da değiştirilmesi gereken değerleri listeler

### Script Kodu

```javascript
// scripts/setup-env.js
const fs = require('fs');
const path = require('path');

const envFiles = [
  {
    example: '.env.example',
    target: '.env',
    description: 'Root environment file (Docker Compose)'
  },
  {
    example: 'backend/.env.example',
    target: 'backend/.env',
    description: 'Backend environment file'
  },
  {
    example: 'frontend/.env.local.example',
    target: 'frontend/.env.local',
    description: 'Frontend environment file'
  }
];

console.log('🚀 Environment Setup Script\n');

let hasErrors = false;

envFiles.forEach(({ example, target, description }) => {
  console.log(`📝 ${description}`);
  
  // Check if example file exists
  if (!fs.existsSync(example)) {
    console.log(`   ❌ Example file not found: ${example}\n`);
    hasErrors = true;
    return;
  }

  // Backup existing file
  if (fs.existsSync(target)) {
    const backupFile = `${target}.bak`;
    fs.copyFileSync(target, backupFile);
    console.log(`   💾 Backed up existing file to: ${backupFile}`);
  }

  // Copy example to target
  fs.copyFileSync(example, target);
  console.log(`   ✅ Created: ${target}\n`);
});

if (!hasErrors) {
  console.log('✨ Environment files created successfully!\n');
  console.log('⚠️  IMPORTANT: Update these values before running in production:');
  console.log('   - JWT_SECRET (use: openssl rand -base64 32)');
  console.log('   - DB_PASSWORD (use strong password)');
  console.log('   - POSTGRES_PASSWORD (use strong password)');
  console.log('   - ALLOWED_ORIGINS (set production URLs)\n');
  console.log('📖 For more details, see: ENVIRONMENT.md\n');
} else {
  console.log('❌ Setup completed with errors. Please check the messages above.\n');
  process.exit(1);
}
```

### Script Kullanım Örnekleri

#### Temel Kullanım
```bash
npm run setup:env
```

#### Force Mode (Yedek almadan üzerine yaz)
```bash
node scripts/setup-env.js --force
```

#### Dry Run (Sadece rapor et, değişiklik yapma)
```bash
node scripts/setup-env.js --dry-run
```

#### Verbose Mode (Detaylı çıktı)
```bash
node scripts/setup-env.js --verbose
```

---

## 📚 Kaynaklar

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [12-Factor App: Config](https://12factor.net/config)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
