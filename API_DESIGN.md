# API Tasarımı (Ön Bakış)

Bu doküman, TMS SaaS platformunun **Temel Plan (MVP)** özellikleri için gerekli olan RESTful API endpoint'lerini ve veri modellerini tanımlar.

**Önemli Notlar:**
- Tüm endpoint'ler, `Authorization` header'ında gönderilen JWT ile korunan, abone (tenant) bazlı çalışan endpoint'lerdir.
- Backend, gelen token'a göre veri kapsamını otomatik olarak doğru aboneye ayarlar.

---

## 1. Veri Modelleri (JSON)

**User (Kullanıcı)**
```json
{
  "id": "user-uuid-123",
  "tenantId": "tenant-uuid-456",
  "email": "admin@firma.com",
  "name": "Ahmet Yılmaz",
"role": "admin", // admin, operator
"isEmailVerified": true,
"emailVerifiedAt": "2026-03-03T09:30:00.000Z"
}
```

**Order (Sipariş/Sevkiyat)**
```json
{
  "id": "order-uuid-789",
  "orderNumber": "TR-2025-0001",
  "origin": "İstanbul, Türkiye",
  "destination": "Ankara, Türkiye",
  "loadDetails": "10 palet kuru gıda",
  "pickupDate": "2025-10-20T10:00:00Z",
  "deliveryDate": "2025-10-21T12:00:00Z",
  "status": "pending", // pending, assigned, in_transit, delivered, canceled
  "driverId": "driver-uuid-111",
  "vehicleId": "vehicle-uuid-222"
}
```

**Vehicle (Araç)**
```json
{
  "id": "vehicle-uuid-222",
  "plateNumber": "34 XYZ 34",
  "brand": "Ford",
  "model": "Transit",
  "capacityKg": 3500
}
```

**Driver (Şoför)**
```json
{
  "id": "driver-uuid-111",
  "name": "Mehmet Kaya",
  "phone": "+905551234567",
  "licenseNumber": "A123B456"
}
```

---

## 2. API Endpoint'leri

### Setup Wizard (`/setup`) - *Public (Setup Token Required)*

Setup wizard için özel endpoint'ler. Bu endpoint'ler setup tamamlanana kadar aktiftir.

- **`GET /setup/status`**: Kurulum durumunu kontrol eder.
  - **Success Response:**
    ```json
    {
      "isCompleted": false,
      "setupToken": "unique-setup-token-xyz",
      "expiresAt": "2025-10-23T15:30:00Z"
    }
    ```

- **`POST /setup/validate-database`**: Database bağlantısını test eder.
  - **Request Body:**
    ```json
    {
      "host": "localhost",
      "port": 5432,
      "username": "tmsuser",
      "password": "tmspassword",
      "database": "tmsdb"
    }
    ```
  - **Success Response:**
    ```json
    {
      "success": true,
      "message": "Database connection successful",
      "version": "PostgreSQL 14.5"
    }
    ```

- **`POST /setup/initialize`**: Kurulumu başlatır (database schema oluşturur).
  - **Request Body:**
    ```json
    {
      "setupToken": "unique-setup-token-xyz",
      "database": {
        "host": "localhost",
        "port": 5432,
        "username": "tmsuser",
        "password": "tmspassword",
        "database": "tmsdb"
      }
    }
    ```

- **`POST /setup/complete`**: Kurulumu tamamlar (admin user, settings).
  - **Request Body:**
    ```json
    {
      "setupToken": "unique-setup-token-xyz",
      "admin": {
        "companyName": "ABC Lojistik",
        "name": "Ahmet Yılmaz",
        "email": "admin@abclojistik.com",
        "password": "SecurePass123!"
      },
      "system": {
        "appName": "LogisticsTMS",
        "appUrl": "https://app.yourdomain.com",
        "timezone": "Europe/Istanbul",
        "jwtSecret": "generated-secret-key",
        "jwtExpiration": "24h"
      },
      "optional": {
        "email": {
          "host": "smtp.gmail.com",
          "port": 587,
          "username": "noreply@yourdomain.com",
          "password": "app-password",
          "from": "noreply@yourdomain.com"
        }
      }
    }
    ```
  - **Success Response:**
    ```json
    {
      "success": true,
      "message": "Setup completed successfully",
      "redirectUrl": "/dashboard"
    }
    ```

- **`POST /setup/reset`**: Kurulumu sıfırlar (Sadece admin).
  - **Headers:** `Authorization: Bearer <admin-jwt>`
  - **Success Response:**
    ```json
    {
      "success": true,
      "message": "Setup reset successful"
    }
    ```

---

### Kimlik Doğrulama (`/auth`)

- **`POST /auth/register`**: Yeni bir abone (tenant) ve ilk admin kullanıcısını oluşturur.
- **`POST /auth/login`**: Kullanıcı girişi yapar ve JWT döndürür.
- **`POST /auth/forgot-password`**: Kullanıcının e-postasına sıfırlama tokenı üretir.
  - **Request Body:** `{ "email": "user@example.com" }`
- **`POST /auth/reset-password`**: Geçerli token ile yeni bir parola belirler.
  - **Request Body:** `{ "token": "uuid", "password": "YeniParola123!" }`
- **`POST /auth/verify-email`**: Doğrulama tokenını işleyerek kullanıcıyı aktif eder.
  - **Request Body:** `{ "token": "uuid" }`
- **`POST /auth/resend-verification`**: Doğrulama bağlantısını yeniden gönderir.
  - **Request Body:** `{ "email": "user@example.com" }`

### Kullanıcılar (`/users`) - *JWT Korumalı, Admin Yetkisi Gerekli*

- **`GET /users`**: Aboneye ait tüm kullanıcıları listeler.
- **`POST /users`**: Yeni bir kullanıcı oluşturur, rol ve isteğe bağlı geçici parola atar.
  - **Request Body:**
    ```json
    {
      "name": "Operatör Kullanıcı",
      "email": "operator@firma.com",
      "role": "operator",
      "temporaryPassword": "GeciciParola123!"
    }
    ```
- **`PATCH /users/{id}`**: Bir kullanıcının isim/e-posta/rol bilgisini günceller. Operatörler yalnızca kendi profillerini düzenleyebilir.
- **`DELETE /users/{id}`**: Bir kullanıcıyı siler.
- Tüm kullanıcı oluşturma/güncelleme işlemlerinde doğrulama maili otomatik gönderilir.
- **`POST /users/{id}/resend-verification`**: Kullanıcının doğrulama e-postasını yeniden gönderir (admin veya ilgili kullanıcı).

### Siparişler (`/orders`) - *JWT Korumalı*

- **`POST /orders`**: Yeni bir sipariş oluşturur.
- **`GET /orders`**: Aboneye ait tüm siparişleri sayfalı olarak listeler.
  - **Query Parametreleri:** `page`, `limit`, `sortBy`, `sortOrder`, `status`, `supplierId`, `search`, `dateFrom`, `dateTo`
  - **Response:** `{ "data": Order[], "meta": { "totalItems": 120, "itemCount": 20, "itemsPerPage": 20, "totalPages": 6, "currentPage": 3 } }`
- **`GET /orders/{id}`**: Belirli bir siparişin detaylarını getirir.
- **`PATCH /orders/{id}`**: Bir siparişi kısmen günceller.
- **`DELETE /orders/{id}`**: Bir siparişi siler.

### Tedarikçiler (`/suppliers`) - *JWT Korumalı*

- **`POST /suppliers`**: Yeni bir tedarikçi kaydı oluşturur.
- **`GET /suppliers`**: Aboneye ait tüm tedarikçileri listeler.
  - **Query Parametreleri:** `page`, `limit`, `search`
  - **Response:** `{ "data": Supplier[], "meta": { "totalItems": 12, "itemCount": 10, "itemsPerPage": 10, "totalPages": 2, "currentPage": 1 } }`
- **`GET /suppliers/{id}`**: Belirli bir tedarikçinin detaylarını getirir.
- **`PATCH /suppliers/{id}`**: Bir tedarikçiyi kısmen günceller.
- **`DELETE /suppliers/{id}`**: Bir tedarikçiyi siler.

### Araçlar (`/vehicles`) - *JWT Korumalı*

- **`POST /vehicles`**: Yeni bir araç oluşturur.
- **`GET /vehicles`**: Aboneye ait tüm araçları listeler.
- **`GET /vehicles/{id}`**: Belirli bir aracın detaylarını getirir.
- **`PATCH /vehicles/{id}`**: Bir aracı kısmen günceller.
- **`DELETE /vehicles/{id}`**: Bir aracı siler.

### Şoförler (`/drivers`) - *JWT Korumalı*

- **`POST /drivers`**: Yeni bir şoför oluşturur.
- **`GET /drivers`**: Aboneye ait tüm şoförleri listeler.
- **`GET /drivers/{id}`**: Belirli bir şoförün detaylarını getirir.
- **`PATCH /drivers/{id}`**: Bir şoförü kısmen günceller.
- **`DELETE /drivers/{id}`**: Bir şoförü siler.

### Raporlama (`/reports`) - *JWT Korumalı*

- **`GET /reports/monthly-shipments`**: Aylık sevkiyat sayılarını içeren bir rapor döndürür.
  - **Success Response:**
    ```json
    [
      {
        "month": "2025-10",
        "shipmentCount": 150
      },
      {
        "month": "2025-09",
        "shipmentCount": 125
      }
    ]
    ```

---

## 3. Validation Kuralları

Tüm API endpoint'leri `class-validator` kullanarak input validation yapar. Validation hataları aşağıdaki formatta döner:

### Validation Error Response
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

### DTO Validation Örnekleri

#### CreateOrderDto Validation
```typescript
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  loadDetails: string;

  @IsDateString()
  @IsOptional()
  pickupDate?: string;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsEnum(['pending', 'assigned', 'in_transit', 'delivered', 'canceled'])
  @IsOptional()
  status?: string;
}
```

#### CreateVehicleDto Validation
```typescript
export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{2}\s[A-Z]{1,3}\s[0-9]{2,4}$/, {
    message: 'Plate number must be in format: 34 ABC 1234'
  })
  plateNumber: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsNumber()
  @Min(0)
  @Max(50000)
  capacityKg: number;
}
```

#### AuthCredentialsDto Validation
```typescript
export class AuthCredentialsDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number/special character'
  })
  password: string;
}
```

---

## 4. Error Response Formatları

Tüm error response'lar tutarlı bir formatta döner:

### Standard Error Response
```json
{
  "statusCode": 404,
  "timestamp": "2025-10-23T12:34:56.789Z",
  "path": "/api/orders/non-existent-id",
  "message": "Order with ID 'non-existent-id' not found",
  "error": "Not Found"
}
```

### HTTP Status Codes

| Status Code | Anlamı | Kullanım |
|-------------|--------|----------|
| 200 | OK | Başarılı GET, PATCH, DELETE |
| 201 | Created | Başarılı POST (resource oluşturma) |
| 400 | Bad Request | Validation hatası, geçersiz input |
| 401 | Unauthorized | Token yok veya geçersiz |
| 403 | Forbidden | Yetki yok (RBAC) |
| 404 | Not Found | Resource bulunamadı |
| 409 | Conflict | Resource zaten mevcut (örn: email) |
| 429 | Too Many Requests | Rate limit aşıldı |
| 500 | Internal Server Error | Sunucu hatası |

### Specific Error Examples

#### Unauthorized Error (401)
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

#### Validation Error (400)
```json
{
  "statusCode": 400,
  "message": [
    "origin should not be empty",
    "destination should not be empty",
    "capacityKg must be a positive number"
  ],
  "error": "Bad Request"
}
```

#### Conflict Error (409)
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

#### Rate Limit Error (429)
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later",
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

---

## 5. Pagination Parametreleri

Liste endpoint'leri pagination desteği sunar:

### Query Parameters
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt sayısı (default: 10, max: 100)
- `sortBy`: Sıralama alanı (örn: `createdAt`, `orderNumber`)
- `sortOrder`: Sıralama yönü (`ASC` veya `DESC`, default: `DESC`)

### Paginated Response Format
```json
{
  "data": [
    { "id": "1", "orderNumber": "ORD-001", ... },
    { "id": "2", "orderNumber": "ORD-002", ... }
  ],
  "meta": {
    "totalItems": 47,
    "itemCount": 10,
    "itemsPerPage": 10,
    "totalPages": 5,
    "currentPage": 1
  }
}
```

### Örnek Kullanım
```bash
GET /orders?page=2&limit=20&sortBy=createdAt&sortOrder=DESC
```

---

## 6. Filtering ve Search

Liste endpoint'leri filtering ve search desteği sunar:

### Query Parameters
- `search`: Genel arama (birden fazla alanda arama yapar)
- `status`: Status'a göre filtreleme
- `startDate` & `endDate`: Tarih aralığına göre filtreleme

### Örnek Kullanım
```bash
# Status'a göre filtrele
GET /orders?status=pending

# Tarih aralığına göre filtrele
GET /orders?startDate=2025-10-01&endDate=2025-10-31

# Arama + filtreleme
GET /orders?search=istanbul&status=in_transit

# Kombinasyon
GET /orders?page=1&limit=20&status=pending&sortBy=createdAt&sortOrder=ASC
```

---

## 7. Authentication ve Authorization

### Authentication Header
Tüm korumalı endpoint'ler için:
```
Authorization: Bearer <JWT_TOKEN>
```

### JWT Token Alma
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Token Kullanımı
```bash
GET /orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ℹ️ **Not:** Email adresi doğrulanmamış hesaplar `POST /auth/login` çağrısında `403 Forbidden` hatası döner.

### Token Expiration
- **Access Token:** 24 saat
- Token süresi dolduğunda 401 Unauthorized döner
- Kullanıcı yeniden login olmalıdır

### Role-Based Access Control (RBAC)

#### Rol Tanımları
- **Admin:** Tüm kaynaklara tam erişim (kullanıcı yönetimi dahil)
- **Operator:** Operasyonel işlemler (siparişler, araçlar, şoförler)

#### Endpoint Yetkileri
| Endpoint | Admin | Operator |
|----------|-------|----------|
| POST /orders | ✅ | ✅ |
| GET /orders | ✅ | ✅ |
| PATCH /orders/:id | ✅ | ✅ |
| DELETE /orders/:id | ✅ | ❌ |
| POST /users | ✅ | ❌ |
| PATCH /users/:id | ✅ | ❌ |
| DELETE /users/:id | ✅ | ❌ |

---

## 8. Rate Limiting

API endpoint'leri rate limiting ile korunur:

### Rate Limit Kuralları
- **Genel API:** 100 request/dakika
- **Login Endpoint:** 5 request/dakika
- **Register Endpoint:** 3 request/dakika

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698058920
```

### Rate Limit Aşıldığında
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

---

## 9. API Versioning

API'leri versiyonlamak, geriye dönük uyumluluk ve kademeli geçişler için kritik. NestJS projesinde hem URI hem de header tabanlı yaklaşımları desteklemek kolaydır.

### 9.1 Varsayılan Kurulum (URI Versiyonlama)
`main.ts` içinde global versiyonlamayı açın:
```ts
import { VersioningType } from '@nestjs/common';

app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```
Bu yapılandırma ile endpoint'ler `/api/v1/orders` formatında servis edilir. Controller'larda `@Controller({ path: 'orders', version: '1' })` kullanarak hangi versiyonda oldukları belirtilir.

### 9.2 Çoklu Versiyon Stratejisi
Yeni versiyon yayınlarken mevcut controller'ı klonlayın ve yalnızca değişen metodları override edin. Örnek:
```ts
@Controller({ path: 'orders', version: '2' })
export class OrdersV2Controller {
  // V2'de farklı response dönen endpoint
}
```
`app.setGlobalPrefix('api');` satırının versiyonlama ile çakışmadığından emin olun ve prefix'i enableVersioning'den önce çağırın.

### 9.3 Header / Media Type Versiyonlama
URI yerine header kullanmak istediğiniz API'ler için:
```ts
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  defaultVersion: '1',
  header: 'Accept',
});
```
İstemci şu header ile versiyonu seçer:
```
Accept: application/vnd.tms.v1+json
```
Swagger dokümantasyonunda bu yaklaşımı yansıtmak için `@ApiConsumes('application/vnd.tms.v1+json')` gibi decorator'lar ekleyin.

---

## 10. CORS Politikası

### Allowed Origins
- `http://localhost:3001` (development)
- `https://app.yourdomain.com` (production)

### Allowed Methods
- GET, POST, PATCH, DELETE, OPTIONS

### Allowed Headers
- Content-Type, Authorization

### Credentials
- Enabled (cookies, authorization headers)

---

## 11. API Best Practices

### Request Guidelines
1. Her request'te `Content-Type: application/json` header'ı ekleyin
2. Authentication gereken endpoint'ler için JWT token kullanın
3. Rate limit'lere dikkat edin
4. Pagination kullanarak büyük veri setlerini çekin

### Response Handling
1. HTTP status code'ları kontrol edin
2. Error response'ları handle edin
3. Retry logic implementasyonu (429, 5xx hatalar için)
4. Token expiration'ı handle edin (401 → redirect to login)

### Security Best Practices
1. HTTPS kullanın (production)
2. Token'ları güvenli saklayın (localStorage yerine httpOnly cookies)
3. Sensitive data log'lamayın
4. CORS policy'e uyun

---

## 12. Örnek API Kullanımı (cURL)

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "ABC Lojistik",
    "email": "admin@abclojistik.com",
    "password": "SecurePass123!",
    "userName": "Admin User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@abclojistik.com",
    "password": "SecurePass123!"
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "origin": "İstanbul, Türkiye",
    "destination": "Ankara, Türkiye",
    "loadDetails": "10 palet kuru gıda"
  }'
```

### List Orders with Pagination
```bash
curl -X GET "http://localhost:3000/orders?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Order
```bash
curl -X PATCH http://localhost:3000/orders/ORDER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "in_transit"
  }'
```

---

## 13. Swagger / OpenAPI Dokümantasyonu

Swagger arayüzü, backend ekibinin endpoint'leri görünür kılmasını ve frontend entegrasyonunun hızlanmasını sağlar. Aşağıdaki adımlar `apps/api` projesi örnek alınarak hazırlanmıştır.

### 13.1 Bağımlılıkların Yüklenmesi
```bash
npm install --save @nestjs/swagger swagger-ui-express
# veya
yarn add @nestjs/swagger swagger-ui-express
```
`class-transformer` ve `class-validator` zaten projede aktif olduğundan ekstra kurulum gerekmez.

### 13.2 Bootstrap Entegrasyonu
`main.ts` içerisinde Swagger kurulumunu global pipe'lar sonrasında ekleyin:
```ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('LogisticsTMS API')
  .setDescription('Çok kiracılı TMS platformu için REST API')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'access-token',
  )
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document, {
  swaggerOptions: { persistAuthorization: true },
});
```
`app.enableCors()` ve global prefix tanımları bu bloktan önce yapılmalıdır.

### 13.3 Controller ve Endpoint Dekoratörleri
Controller seviyesinde `@ApiTags('Orders')` ekleyerek gruplama yapın. Her endpoint için:
```ts
@ApiOperation({ summary: 'Yeni sipariş oluşturur' })
@ApiResponse({ status: 201, type: OrderResponseDto })
@ApiBearerAuth('access-token')
```
gibi decorator'larla işlevi ve response tipini açıkça belirtin. Rate limit veya özel hata dönüşleri için `@ApiTooManyRequestsResponse` vb. kullanılabilir.

### 13.4 DTO Dokümantasyonu
DTO alanlarını `@ApiProperty()` ile açıklayın:
```ts
export class CreateOrderDto {
  @ApiProperty({ example: 'TR-2025-0001', description: 'İş emri numarası' })
  orderNumber: string;

  @ApiProperty({ example: 'İstanbul, Türkiye' })
  origin: string;
}
```
Opsiyonel alanlarda `@ApiPropertyOptional()` kullanın. Enum değerleri için `enum` parametresi sağlayın ki swagger otomatik olarak seçenekleri göstersin.

### 13.5 Authentication Şeması
JWT tabanlı kimlik doğrulama için `DocumentBuilder` içinde `addBearerAuth` tanımı yeterlidir. Guard kullanılan endpoint'lere `@ApiBearerAuth()` eklemeyi unutmayın. Kullanıcı adı/şifre ile login olan endpoint için `@ApiBody()` ile JSON yapısını örnekleyin.

### 13.6 Çıktının Yayınlanması
`SwaggerModule.setup('docs', ...)` sayesinde `/docs` altında arayüz gelir. Deployment ortamlarında temel auth veya IP kısıtlaması eklemek için `app.use(['/docs', '/docs-json'], basicAuthMiddleware)` gibi ekstra korumalar planlayın.

### 13.7 CI Kontrolleri
Swagger şemasını bir JSON dosyasına export edip (`SwaggerModule.createDocument`) repo içinde saklamak regresyon testlerinde değişiklikleri takip etmeyi kolaylaştırır. `npm run lint` ile decorator import'larının eksik kalmadığından emin olun.

### 13.8 Frontend Entegrasyonu
Frontend ekibi `docs-json` endpoint'ini kullanarak otomatik client üretebilir (`pnpm openapi-typescript`). Bu endpoint'i açmak için `SwaggerModule.setup` çağrısından sonra `SwaggerModule.createDocument` çıktısını `/docs-json` rotasında servis etmek yeterli.

---
