# Proje Yol Haritası ve Abonelik Planları

Bu doküman, projenin ilerlemesini ve özellik setini takip eder.

**Güncel Proje Durumu:** MVP Aşamasının %75-80'i tamamlanmış  
**Son Güncelleme:** 28 Ekim 2025

---

## 📊 Proje İlerleme Özeti

### ✅ Tamamlanan Aşamalar
- [x] Docker & Proje İskeleti Kurulumu
- [x] Çoklu-Kullanıcı (Multi-Tenant) Mimarisi (Temel)
- [x] JWT Tabanlı Kimlik Doğrulama
- [x] Temel CRUD İşlemleri (Orders, Vehicles, Drivers, Suppliers)
- [x] Frontend Temel Yapısı ve UI Bileşenleri

### 🚧 Devam Eden Çalışmalar
- [x] Güvenlik Sıkılaştırması ve Validation ✅ (28 Ekim 2025)
- [ ] Multi-Tenant Mimarisi İyileştirmeleri
- [ ] Error Handling ve Logging
- [ ] Dokümantasyon Güncellemeleri

---

## 🎯 Aşama 1: Stabilizasyon ve Güvenlik (1-2 Hafta) - MEVCUT AŞAMA

### 🔴 Kritik Öncelikli Görevler

#### Güvenlik Düzeltmeleri
- [x] Environment variables sistemi kurulumu ✅
  - [x] Backend `.env` dosyası oluşturma
  - [x] Frontend `.env.local` dosyası oluşturma
  - [x] Docker-compose `.env` entegrasyonu
  - [x] `.gitignore` güncelleme
  - [x] Setup script (`npm run setup:env`)
- [x] JWT validation düzeltmesi ✅
  - [x] TenantMiddleware'de `verify()` kullanımı
  - [x] Token expiration kontrolü
  - [ ] Refresh token mekanizması (gelecek)
- [x] DTO Validation ekleme ✅
  - [x] `class-validator` paketleri kurulumu
  - [x] Tüm DTO'lara validation decorator'ları ekleme
  - [x] ValidationPipe global olarak aktifleştirme
- [x] CORS yapılandırması ✅
  - [x] Allowed origins tanımlama (environment variable'dan)
  - [x] Credentials ayarları
  - [x] Methods ve headers yapılandırması
- [x] Rate limiting implementasyonu ✅
  - [x] `@nestjs/throttler` kurulumu
  - [x] Global rate limiting ayarları
  - [x] Auth endpoint'leri için özel limitler (brute force önleme)

#### Multi-Tenant Düzeltmeleri
- [x] TypeORM connection yönetimi düzeltme
  - [x] Request-scoped injection doğru implementasyonu
  - [x] Connection pool yönetimi
  - [x] Tenant schema otomatik migration
- [x] Tenant isolation testleri
  - [x] Cross-tenant data access önleme
  - [x] Schema switching validation

#### Error Handling & Logging
- [x] Global exception filter implementasyonu
- [x] HTTP exception filter oluşturma
- [x] Structured logging sistemi (Winston tabanlı)
- [x] Frontend error boundary ekleme
- [x] User-friendly error mesajları
- [x] Error notification sistemi (Snackbar/Toast)

### 🟡 Yüksek Öncelikli Görevler

#### Database İyileştirmeleri
- [ ] TypeORM migrations sistemi kurulumu
  - [ ] Migration script'leri oluşturma
  - [ ] Initial schema migration
  - [ ] Seed data script'leri
- [ ] `synchronize: false` yapılandırması (production için)
- [ ] Database indexleme stratejisi
- [ ] Connection pooling optimize etme

#### API Documentation
- [ ] Swagger/OpenAPI kurulumu
  - [ ] @nestjs/swagger paketi ekleme
  - [ ] Tüm endpoint'lere decorator'lar ekleme
  - [ ] DTO'ları dokümante etme
  - [ ] Authentication scheme tanımlama
- [ ] API versioning stratejisi

---

## 🎯 Aşama 2: MVP Tamamlama (2-3 Hafta)

### User Management & RBAC
- [ ] User Management UI oluşturma
  - [ ] Kullanıcı listesi sayfası
  - [ ] Kullanıcı ekleme formu
  - [ ] Kullanıcı düzenleme sayfası
  - [ ] Rol atama interface'i
- [ ] Role-Based Access Control (RBAC)
  - [ ] Guards oluşturma
  - [ ] Decorator'lar ekleme
  - [ ] Permission sistemi
- [ ] Şifre sıfırlama özelliği
  - [ ] "Forgot Password" flow
  - [ ] Email verification
  - [ ] Reset token sistemi

### Form Validation & UX İyileştirmeleri
- [ ] Form validation (Frontend)
  - [ ] React Hook Form entegrasyonu
  - [ ] Yup/Zod schema validation
  - [ ] Inline error mesajları
- [ ] Loading states iyileştirme
  - [ ] Skeleton loaders
  - [ ] Progress indicators
  - [ ] Optimistic updates
- [ ] Notification sistemi
  - [ ] Success/error snackbar'lar
  - [ ] Confirmation dialog'ları
- [ ] Responsive design testleri
  - [ ] Mobile view optimizasyonu
  - [ ] Tablet view testleri

### Pagination & Filtering
- [ ] Backend pagination implementasyonu
  - [ ] Generic pagination utility
  - [ ] Page size ve offset parametreleri
  - [ ] Total count response
- [ ] Frontend pagination UI
  - [ ] Material-UI Pagination component
  - [ ] Per page selector
- [ ] Filtering sistemi
  - [ ] Search functionality
  - [ ] Multi-column filtering
  - [ ] Date range filters
- [ ] Sorting implementasyonu
  - [ ] Column sorting
  - [ ] Multi-column sort

### Testing Altyapısı
- [ ] Unit test örnekleri yazma
  - [ ] Service test'leri
  - [ ] Controller test'leri
  - [ ] Utility function test'leri
- [ ] Integration test'ler
  - [ ] API endpoint test'leri
  - [ ] Database integration test'leri
- [ ] E2E test kurulumu
  - [ ] Playwright/Cypress kurulumu
  - [ ] Kritik user flow test'leri
- [ ] Test coverage hedefi: %60+

---

## 🎯 Aşama 3: Profesyonel Plan Özellikleri (3-4 Hafta)

### Gerçek Zamanlı Takip Modülü
- [ ] Backend GPS tracking altyapısı
  - [ ] Location entity oluşturma
  - [ ] Location tracking endpoints
  - [ ] WebSocket implementasyonu
- [ ] Harita entegrasyonu
  - [ ] Google Maps / Mapbox entegrasyonu
  - [ ] Real-time marker güncelleme
  - [ ] Route visualization
- [ ] Mobile app GPS integration
  - [ ] Location permission yönetimi
  - [ ] Background location tracking
  - [ ] Battery optimization

### Belge Yönetimi Modülü
- [ ] File upload sistemi
  - [ ] Multer yapılandırması
  - [ ] File validation (type, size)
  - [ ] S3/Cloud storage entegrasyonu
- [ ] Document entity ve ilişkileri
  - [ ] Order-Document ilişkisi
  - [ ] Document metadata
  - [ ] Version control
- [ ] Document viewer/download UI
  - [ ] File preview
  - [ ] Download functionality
  - [ ] Bulk operations

### Müşteri Portalı Modülü
- [ ] Customer entity ve authentication
  - [ ] Separate customer authentication
  - [ ] Customer-Order ilişkisi
- [ ] Customer portal UI
  - [ ] Shipment tracking sayfası
  - [ ] Order history
  - [ ] Document access
- [ ] Notification sistemi
  - [ ] Email notifications
  - [ ] SMS notifications (opsiyonel)
  - [ ] In-app notifications

### Fatura Modülü
- [ ] Invoice entity oluşturma
  - [ ] Invoice-Order ilişkisi
  - [ ] Payment status tracking
- [ ] Invoice generation
  - [ ] PDF generation (PDFKit)
  - [ ] Invoice numbering
  - [ ] Tax calculations
- [ ] Invoice management UI
  - [ ] Invoice listesi
  - [ ] Invoice oluşturma/düzenleme
  - [ ] Payment recording

---

## 🎯 Aşama 4: Production Hazırlığı (2 Hafta)

### DevOps & CI/CD
- [ ] GitHub Actions workflow oluşturma
  - [ ] Test pipeline
  - [ ] Build pipeline
  - [ ] Deployment pipeline
- [ ] Docker production optimize
  - [ ] Multi-stage builds
  - [ ] Image size optimization
  - [ ] Security scanning
- [ ] Environment stratejisi
  - [ ] Development
  - [ ] Staging
  - [ ] Production

### Monitoring & Logging
- [ ] Logging sistemi kurulumu
  - [ ] Winston/Pino configuration
  - [ ] Log levels
  - [ ] Log rotation
- [ ] Health check endpoints
  - [ ] Liveness probe
  - [ ] Readiness probe
  - [ ] Database health check
- [ ] Monitoring kurulumu
  - [ ] Prometheus metrics
  - [ ] Grafana dashboard
  - [ ] Alert rules
- [ ] Error tracking
  - [ ] Sentry entegrasyonu
  - [ ] Error grouping
  - [ ] Alert notifications

### Performance & Security
- [ ] Performance optimization
  - [ ] Query optimization
  - [ ] Caching stratejisi (Redis)
  - [ ] CDN kurulumu
  - [ ] Image optimization
- [ ] Security audit
  - [ ] Dependency scanning
  - [ ] OWASP top 10 kontrolü
  - [ ] Penetration testing
- [ ] Load testing
  - [ ] Apache Bench / k6 testleri
  - [ ] Stress testing
  - [ ] Capacity planning

### Backup & Recovery
- [ ] Database backup stratejisi
  - [ ] Automated backups
  - [ ] Backup retention policy
  - [ ] Point-in-time recovery
- [ ] Disaster recovery planı
  - [ ] Recovery procedures
  - [ ] RTO/RPO tanımları
  - [ ] Backup testing

---

## 🎯 Aşama 5: Kurumsal Plan Özellikleri (4-6 Hafta)

### Rota ve Yük Optimizasyonu Modülü
- [ ] Route optimization algoritması
  - [ ] Multi-stop route planning
  - [ ] Traffic consideration
  - [ ] Distance matrix API entegrasyonu
- [ ] Load optimization
  - [ ] Capacity planning
  - [ ] Weight distribution
  - [ ] Vehicle compatibility
- [ ] Optimization UI
  - [ ] Route visualization
  - [ ] Manual adjustments
  - [ ] What-if scenarios

### Gelişmiş Analitik ve BI Modülü
- [ ] Analytics data model
  - [ ] Fact ve dimension tables
  - [ ] Aggregation queries
- [ ] Dashboard implementasyonu
  - [ ] KPI widgets
  - [ ] Chart visualizations (Chart.js)
  - [ ] Custom date ranges
- [ ] Raporlar
  - [ ] Performance reports
  - [ ] Cost analysis
  - [ ] Driver efficiency
  - [ ] Vehicle utilization
- [ ] Export functionality
  - [ ] Excel export
  - [ ] PDF reports
  - [ ] Scheduled reports

### API Entegrasyon Modülü
- [ ] API Gateway kurulumu
- [ ] Webhook sistemi
  - [ ] Webhook registry
  - [ ] Event triggering
  - [ ] Retry mechanism
- [ ] Third-party integrations
  - [ ] Accounting software (örn: SAP, Logo)
  - [ ] ERP systems
  - [ ] CRM integrations
- [ ] API rate limiting & throttling
- [ ] API key management

### Filo Yönetimi Modülü
- [ ] Maintenance scheduling
  - [ ] Service intervals
  - [ ] Maintenance history
  - [ ] Reminder system
- [ ] Fuel tracking
  - [ ] Fuel entry logging
  - [ ] Consumption analysis
  - [ ] Cost tracking
- [ ] Expense management
  - [ ] Expense categories
  - [ ] Receipt uploads
  - [ ] Budget tracking
- [ ] Vehicle documents
  - [ ] License/registration tracking
  - [ ] Insurance management
  - [ ] Document expiry alerts

### Dinamik Fiyatlandırma Modülü
- [ ] Pricing engine
  - [ ] Rule-based pricing
  - [ ] Dynamic factors (distance, weight, urgency)
  - [ ] Customer-specific pricing
- [ ] Quote generation
  - [ ] Automated quotes
  - [ ] Quote approval workflow
  - [ ] Quote-to-order conversion
- [ ] Pricing analytics
  - [ ] Price optimization
  - [ ] Margin analysis
  - [ ] Competitive analysis

---

## 📋 Abonelik Planları Özeti

### 1. Temel Plan (Küçük İşletmeler İçin)
Bu plan, kendi araçlarıyla operasyon yürüten ve temel dijitalleşmeye ihtiyaç duyan küçük firmalar için idealdir.

**Özellikler:**
- [x] Kullanıcı Yönetimi (Rol bazlı erişim)
- [x] Temel Sipariş Yönetimi
- [x] Araç ve Şoför Yönetimi
- [x] Manuel Durum Takibi
- [x] Temel Raporlama

**Durum:** %80 Tamamlandı (Validation ve UI iyileştirmeleri gerekli)

### 2. Profesyonel Plan (Orta Ölçekli İşletmeler İçin)
Hem kendi filosunu hem de dış tedarikçileri yöneten firmalar için.

**Özellikler:**
- [x] *Tüm Temel Plan özellikleri*
- [x] Tedarikçi Yönetimi Modülü
- [ ] Gerçek Zamanlı Takip Modülü
- [ ] Belge Yönetimi Modülü
- [ ] Müşteri Portalı Modülü
- [ ] Fatura Modülü

**Durum:** %20 Tamamlandı

### 3. Kurumsal Plan (Büyük Ölçekli Operasyonlar İçin)
Otomasyon, optimizasyon ve entegrasyon ihtiyacı olan büyük operasyonlar için.

**Özellikler:**
- [ ] *Tüm Profesyonel Plan özellikleri*
- [ ] Rota ve Yük Optimizasyonu Modülü
- [ ] Gelişmiş Analitik ve BI Modülü
- [ ] API Entegrasyon Modülü
- [ ] Filo Yönetimi Modülü
- [ ] Dinamik Fiyatlandırma Modülü

**Durum:** %0 Tamamlandı

---

## 📝 Üyelik Sırasında Sorulacak Anahtar Sorular

Bu sorular müşteriye en uygun planı önermek için kullanılacaktır:

1. "Filo'nuzda kaç araç bulunuyor?"
2. "Operasyonlarınızda harici taşıyıcılar (tedarikçiler) ile çalışıyor musunuz?"
3. "Aylık ortalama kaç sevkiyat yönetiyorsunuz?"
4. "Müşterilerinize sevkiyatlarını canlı olarak takip edebilecekleri bir portal sunmak ister misiniz?"
5. "Gelişmiş rota ve yük optimizasyonuna ihtiyacınız var mı?"

---

## 📅 Zaman Çizelgesi Özeti

| Aşama | Süre | Durum |
|-------|------|-------|
| Aşama 1: Stabilizasyon | 1-2 Hafta | 🚧 Devam Ediyor |
| Aşama 2: MVP Tamamlama | 2-3 Hafta | ⏳ Bekliyor |
| Aşama 3: Profesyonel Plan | 3-4 Hafta | ⏳ Bekliyor |
| Aşama 4: Production Hazırlığı | 2 Hafta | ⏳ Bekliyor |
| Aşama 5: Kurumsal Plan | 4-6 Hafta | ⏳ Bekliyor |

**Toplam Tahmini Süre:** 12-17 Hafta (3-4 Ay)

---

## 🔗 İlgili Dokümanlar

- [SECURITY.md](./SECURITY.md) - Güvenlik politikaları ve açıklar
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Sistem mimarisi detayları
- [API_DESIGN.md](./API_DESIGN.md) - API endpoint dokümantasyonu
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment ve production rehberi
- [TESTING.md](./TESTING.md) - Test stratejisi ve örnekler
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Katkıda bulunma kuralları
- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment variables dokümantasyonu
