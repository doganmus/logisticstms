# Lojistik TMS - SaaS Platformu

Bu proje, küçük, orta ve büyük ölçekli lojistik ve taşımacılık firmaları için geliştirilmiş modern, çok kullanıcılı (multi-tenant) ve modüler bir SaaS (Software as a Service) Taşımacılık Yönetim Sistemi (TMS) platformudur.

**Proje Durumu:** 🚧 MVP Geliştirme Aşaması (%75-80 tamamlandı)  
**Son Güncelleme:** 28 Ekim 2025

---

## 📋 İçindekiler

- [Proje Hedefleri](#proje-hedefleri)
- [Mevcut Durum](#mevcut-durum)
- [Teknoloji Stack](#teknoloji-stack)
- [Geliştirme Ortamını Başlatma](#geliştirme-ortamını-başlatma)
- [Bilinen Sorunlar](#bilinen-sorunlar)
- [Dokümantasyon](#dokümantasyon)
- [Katkıda Bulunma](#katkıda-bulunma)

---

## 🎯 Proje Hedefleri

- **Modülerlik:** Müşterilerin (abonelerin) yalnızca ihtiyaç duydukları özellikler için ödeme yapmalarını sağlayan esnek abonelik planları sunmak.
- **Ölçeklenebilirlik:** Küçük bir filodan yüzlerce araçlık büyük operasyonlara kadar her ölçekteki işletmeye hizmet verebilecek bir altyapı kurmak.
- **Kullanıcı Dostu Arayüz:** Hem web hem de mobil platformlarda karmaşık lojistik operasyonlarını basitleştiren, sezgisel ve modern bir kullanıcı deneyimi sağlamak.
- **Veri İzolasyonu:** Her abonenin verisini güvenli ve tamamen izole bir şekilde saklamak (Schema-per-Tenant mimarisi).

---

## ✅ Mevcut Durum

### Tamamlanan Özellikler

#### Backend
- ✅ **Multi-Tenant Mimarisi:** Schema-per-tenant veri izolasyonu
- ✅ **Authentication:** JWT tabanlı kimlik doğrulama sistemi
- ✅ **Sipariş Yönetimi (Orders):** CRUD işlemleri, durum yönetimi
- ✅ **Araç Yönetimi (Vehicles):** Araç ekleme, düzenleme, listeleme
- ✅ **Şoför Yönetimi (Drivers):** Şoför kayıt ve yönetim sistemi
- ✅ **Tedarikçi Yönetimi (Suppliers):** Harici taşıyıcı firma yönetimi
- ✅ **Temel Raporlama (Reports):** Aylık sevkiyat raporları

#### Frontend
- ✅ **Login/Register Sayfaları:** Kullanıcı girişi ve abone kaydı
- ✅ **Dashboard:** Ana kontrol paneli
- ✅ **Sipariş Listesi:** Siparişleri görüntüleme ve yönetme
- ✅ **Tedarikçi Atama:** Siparişlere tedarikçi atama özelliği
- ✅ **Material-UI Entegrasyonu:** Modern ve responsive UI bileşenleri

#### DevOps
- ✅ **Docker Compose:** Tüm servisler konteynerize edildi
- ✅ **Development Environment:** Geliştirme ortamı hazır

### Devam Eden Çalışmalar

- ✅ Güvenlik iyileştirmeleri (JWT validation, CORS, rate limiting) - Tamamlandı! (28 Ekim 2025)
- ✅ DTO validation implementasyonu - Tamamlandı! (28 Ekim 2025)
- ✅ Environment variables sistemi - Tamamlandı! (28 Ekim 2025)
- ✅ Error handling ve logging sistemi - Tamamlandı! (28 Ekim 2025)
- ✅ Multi-tenant mimarisi iyileştirmeleri - Tamamlandı! (28 Ekim 2025)
- 🚧 Dokümantasyon güncellemeleri

---

## 🛠 Teknoloji Stack

### Backend
- **Framework:** NestJS 11
- **Runtime:** Node.js
- **Database:** PostgreSQL 14
- **ORM:** TypeORM
- **Authentication:** JWT (Passport.js)
- **Password Hashing:** bcrypt

### Frontend
- **Framework:** Next.js 15
- **UI Library:** React 19
- **Component Library:** Material-UI (MUI) 7
- **HTTP Client:** Axios
- **Styling:** Emotion

### DevOps
- **Containerization:** Docker & Docker Compose
- **Database:** PostgreSQL (Alpine)

---

## 🚀 Geliştirme Ortamını Başlatma

### Gereksinimler

- **Docker:** v20.10 veya üzeri
- **Docker Compose:** v2.0 veya üzeri
- **Node.js:** v18+ (local development için)
- **npm/yarn:** Paket yöneticisi

### Hızlı Başlangıç

1. **Projeyi Klonlayın:**
   ```bash
   git clone <repository-url>
   cd LogisticsTMS
   ```

2. **Servisleri Başlatın:**
   ```bash
   docker compose up -d
   ```

3. **Servis URL'leri:**
   - **Frontend (Web):** http://localhost:3001
   - **Backend (API):** http://localhost:3000
   - **Database:** localhost:5432

### Local Development (Docker olmadan)

Eğer Docker kullanmak istemiyorsanız:

1. **PostgreSQL kurulu olmalı** (localhost:5432)
2. **Backend .env dosyası oluştur:**
   ```bash
   cd backend
   cp .env.example .env
   # .env içinde DB_HOST=localhost olarak değiştir
   npm install
   npm run start:dev
   ```

3. **Frontend çalıştır:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

> 💡 **Not:** Docker kullanımı önerilir, tüm servisler otomatik yapılandırılır.

### Veritabanı Yönetimi

> 🗄️ **Not:** TypeORM `synchronize` devre dışı bırakıldı; tüm şema değişiklikleri migration akışı ile yönetilir.

#### Migration Komutları

```bash
cd backend
npm run migration:generate --name <MigrationName>
npm run migration:run
npm run migration:revert
npm run migration:show
```

> 🌱 **Seed:** Örnek verileri eklemek için `cd backend && npm run db:seed` komutunu çalıştırın.


### İlk Kullanım

Servisleri başlattıktan sonra:

1. **Tarayıcıda açın:** http://localhost:3001
2. **Şirket Kaydı:** İlk olarak şirketinizi kaydedin
   - Company adı
   - Admin kullanıcı bilgileri (email, şifre)
3. **Login:** Oluşturduğunuz kullanıcı ile giriş yapın
4. **Platformu kullanmaya başlayın!**

> 💡 **Not:** Her şirket otomatik olarak kendi izole database schema'sında çalışır (Multi-tenant mimari)

---

## ⚠️ Bilinen Sorunlar

### ✅ Yakın Zamanda Çözüldü (28 Ekim 2025)

- ✅ **JWT Validation:** TenantMiddleware artık `verify()` kullanıyor
- ✅ **DTO Validation:** Tüm DTO'larda validation aktif, ValidationPipe global
- ✅ **Environment Variables:** `.env` sistemi kuruldu, `npm run setup:env` ile kolay kurulum
- ✅ **CORS:** CORS yapılandırması tamamlandı, environment variable'dan yönetiliyor
- ✅ **Rate Limiting:** Global ve endpoint-specific rate limiting aktif
- ✅ **Multi-Tenant Connection:** TypeORM request-scope ve connection pool yönetimi düzeltildi, tenant migrations otomatikleştirildi
- ✅ **Logging & Errors:** Winston tabanlı structured logging, global exception filtresi ve frontend error boundary + toast bildirimleri devrede
- ✅ **Database Migrations:** Migration script'leri eklendi, `synchronize` devre dışı bırakıldı

### Kritik

### Orta Öncelikli

- **Testing:** Unit ve integration test'ler yazılmamış

### Düşük Öncelikli

- **Pagination:** Liste sayfalarında sayfalama yok
- **Filtering:** Gelişmiş arama ve filtreleme eksik
- **User Management UI:** Kullanıcı yönetim sayfası yok
- **Token Refresh:** Refresh token mekanizması eksik
- **API Documentation:** Swagger/OpenAPI http://localhost:3000/docs adresinde yayinda

> 💡 **Not:** Tüm sorunlar ve çözüm planları [ROADMAP.md](./ROADMAP.md) dosyasında detaylı şekilde listelenmiştir.

---

## 📚 Dokümantasyon

Proje ile ilgili detaylı dokümantasyon aşağıdaki dosyalarda bulunmaktadır:

- **[SETUP_WIZARD.md](./SETUP_WIZARD.md)** - 🪄 İnteraktif kurulum sihirbazı kullanım kılavuzu
- **[ROADMAP.md](./ROADMAP.md)** - Proje yol haritası ve ilerleme takibi
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Sistem mimarisi ve tasarım kararları
- **[API_DESIGN.md](./API_DESIGN.md)** - API endpoint'leri ve veri modelleri
- **[SECURITY.md](./SECURITY.md)** - Güvenlik politikaları ve best practices
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment rehberi
- **[TESTING.md](./TESTING.md)** - Test stratejisi ve örnekler
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Katkıda bulunma kuralları
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - Environment variables dokümantasyonu

---

## 🤝 Katkıda Bulunma

Projeye katkıda bulunmak isterseniz lütfen [CONTRIBUTING.md](./CONTRIBUTING.md) dosyasını okuyun.

### Geliştirme Süreci

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje şu anda özel bir proje olarak geliştirilmektedir. Lisans bilgileri güncellenecektir.

---

## 📞 İletişim

Sorularınız ve önerileriniz için issue açabilir veya projeyi geliştiren ekiple iletişime geçebilirsiniz.

---

## 🗺️ Sonraki Adımlar

Projenin devamında yapılacak çalışmalar için [ROADMAP.md](./ROADMAP.md) dosyasına bakınız.

**Öncelikli Hedefler (1-2 Hafta):**
- Güvenlik açıklarının kapatılması
- Validation sisteminin kurulması
- Error handling implementasyonu
- Environment variables düzenlenmesi

**Orta Vadeli Hedefler (2-3 Hafta):**
- User management UI
- Pagination ve filtering
- Testing altyapısı
- API documentation (Swagger)
