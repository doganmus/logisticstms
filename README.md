# Lojistik TMS - SaaS Platformu

Bu proje, kÃ¼Ã§Ã¼k, orta ve bÃ¼yÃ¼k Ã¶lÃ§ekli lojistik ve taÅŸÄ±macÄ±lÄ±k firmalarÄ± iÃ§in geliÅŸtirilmiÅŸ modern, Ã§ok kullanÄ±cÄ±lÄ± (multi-tenant) ve modÃ¼ler bir SaaS (Software as a Service) TaÅŸÄ±macÄ±lÄ±k YÃ¶netim Sistemi (TMS) platformudur.

**Proje Durumu:** ğŸš§ MVP GeliÅŸtirme AÅŸamasÄ± (%75-80 tamamlandÄ±)  
**Son GÃ¼ncelleme:** 28 Ekim 2025

---

## ğŸ“‹ Ä°Ã§indekiler

- [Proje Hedefleri](#proje-hedefleri)
- [Mevcut Durum](#mevcut-durum)
- [Teknoloji Stack](#teknoloji-stack)
- [GeliÅŸtirme OrtamÄ±nÄ± BaÅŸlatma](#geliÅŸtirme-ortamÄ±nÄ±-baÅŸlatma)
- [Bilinen Sorunlar](#bilinen-sorunlar)
- [DokÃ¼mantasyon](#dokÃ¼mantasyon)
- [KatkÄ±da Bulunma](#katkÄ±da-bulunma)

---

## ğŸ¯ Proje Hedefleri

- **ModÃ¼lerlik:** MÃ¼ÅŸterilerin (abonelerin) yalnÄ±zca ihtiyaÃ§ duyduklarÄ± Ã¶zellikler iÃ§in Ã¶deme yapmalarÄ±nÄ± saÄŸlayan esnek abonelik planlarÄ± sunmak.
- **Ã–lÃ§eklenebilirlik:** KÃ¼Ã§Ã¼k bir filodan yÃ¼zlerce araÃ§lÄ±k bÃ¼yÃ¼k operasyonlara kadar her Ã¶lÃ§ekteki iÅŸletmeye hizmet verebilecek bir altyapÄ± kurmak.
- **KullanÄ±cÄ± Dostu ArayÃ¼z:** Hem web hem de mobil platformlarda karmaÅŸÄ±k lojistik operasyonlarÄ±nÄ± basitleÅŸtiren, sezgisel ve modern bir kullanÄ±cÄ± deneyimi saÄŸlamak.
- **Veri Ä°zolasyonu:** Her abonenin verisini gÃ¼venli ve tamamen izole bir ÅŸekilde saklamak (Schema-per-Tenant mimarisi).

---

## âœ… Mevcut Durum

### Tamamlanan Ã–zellikler

#### Backend
- âœ… **Multi-Tenant Mimarisi:** Schema-per-tenant veri izolasyonu
- âœ… **Authentication:** JWT tabanlÄ± kimlik doÄŸrulama sistemi
- âœ… **SipariÅŸ YÃ¶netimi (Orders):** CRUD iÅŸlemleri, durum yÃ¶netimi
- âœ… **AraÃ§ YÃ¶netimi (Vehicles):** AraÃ§ ekleme, dÃ¼zenleme, listeleme
- âœ… **ÅofÃ¶r YÃ¶netimi (Drivers):** ÅofÃ¶r kayÄ±t ve yÃ¶netim sistemi
- âœ… **TedarikÃ§i YÃ¶netimi (Suppliers):** Harici taÅŸÄ±yÄ±cÄ± firma yÃ¶netimi
- âœ… **Temel Raporlama (Reports):** AylÄ±k sevkiyat raporlarÄ±

#### Frontend
- âœ… **Login/Register SayfalarÄ±:** KullanÄ±cÄ± giriÅŸi ve abone kaydÄ±
- âœ… **Dashboard:** Ana kontrol paneli
- âœ… **SipariÅŸ Listesi:** SipariÅŸleri gÃ¶rÃ¼ntÃ¼leme ve yÃ¶netme
- âœ… **TedarikÃ§i Atama:** SipariÅŸlere tedarikÃ§i atama Ã¶zelliÄŸi
- âœ… **Material-UI Entegrasyonu:** Modern ve responsive UI bileÅŸenleri

#### DevOps
- âœ… **Docker Compose:** TÃ¼m servisler konteynerize edildi
- âœ… **Development Environment:** GeliÅŸtirme ortamÄ± hazÄ±r

### Devam Eden Ã‡alÄ±ÅŸmalar

- âœ… GÃ¼venlik iyileÅŸtirmeleri (JWT validation, CORS, rate limiting) - TamamlandÄ±! (28 Ekim 2025)
- [x] Güvenlik iyileştirmeleri (JWT validation, CORS, rate limiting) - Tamamlandı! (28 Ekim 2025)
- [x] DTO validation implementasyonu - Tamamlandı! (28 Ekim 2025)
- [x] Environment variables sistemi - Tamamlandı! (28 Ekim 2025)
- [x] Error handling ve logging sistemi - Tamamlandı! (29 Ekim 2025)
- [x] Multi-tenant mimarisi iyileştirmeleri - Tamamlandı! (28 Ekim 2025)
- [ ] Dokümantasyon güncellemeleri
---

## ğŸ›  Teknoloji Stack

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

## ğŸš€ GeliÅŸtirme OrtamÄ±nÄ± BaÅŸlatma

### Gereksinimler

- **Docker:** v20.10 veya Ã¼zeri
- **Docker Compose:** v2.0 veya Ã¼zeri
- **Node.js:** v18+ (local development iÃ§in)
- **npm/yarn:** Paket yÃ¶neticisi

### HÄ±zlÄ± BaÅŸlangÄ±Ã§

1. **Projeyi KlonlayÄ±n:**
   ```bash
   git clone <repository-url>
   cd LogisticsTMS
   ```

2. **Servisleri BaÅŸlatÄ±n:**
   ```bash
   docker compose up -d
   ```

3. **Servis URL'leri:**
   - **Frontend (Web):** http://localhost:3001
   - **Backend (API):** http://localhost:3000
   - **Database:** localhost:5432

### Local Development (Docker olmadan)

EÄŸer Docker kullanmak istemiyorsanÄ±z:

1. **PostgreSQL kurulu olmalÄ±** (localhost:5432)
2. **Backend .env dosyasÄ± oluÅŸtur:**
   ```bash
   cd backend
   cp .env.example .env
   # .env iÃ§inde DB_HOST=localhost olarak deÄŸiÅŸtir
   npm install
   npm run start:dev
   ```

3. **Frontend Ã§alÄ±ÅŸtÄ±r:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

> ğŸ’¡ **Not:** Docker kullanÄ±mÄ± Ã¶nerilir, tÃ¼m servisler otomatik yapÄ±landÄ±rÄ±lÄ±r.
### Veritabanı Yönetimi


```bash
cd backend

# Yeni migration oluştur (örnek ad)
npm run migration:generate -- src/migrations/AddOrderStatusHistory

# Migration çalıştır / geri al
npm run migration:run
npm run migration:revert

# Uygulanan migration'ları görüntüle
npm run migration:show

# Varsayılan demo tenant ve admin kullanıcısını yükle
npm run db:seed
```

> Not: Seed komutu `.env` dosyasındaki `SEED_*` değişkenlerini kullanır. CLI komutlarını localde çalıştırırken `DB_HOST=localhost` olduğundan emin olun; Docker konteynerinde varsayılan `database` değeri kullanılmalıdır.


### Ä°lk KullanÄ±m

Servisleri baÅŸlattÄ±ktan sonra:

1. **TarayÄ±cÄ±da aÃ§Ä±n:** http://localhost:3001
2. **Åirket KaydÄ±:** Ä°lk olarak ÅŸirketinizi kaydedin
   - Company adÄ±
   - Admin kullanÄ±cÄ± bilgileri (email, ÅŸifre)
3. **Login:** OluÅŸturduÄŸunuz kullanÄ±cÄ± ile giriÅŸ yapÄ±n
4. **Platformu kullanmaya baÅŸlayÄ±n!**

> ğŸ’¡ **Not:** Her ÅŸirket otomatik olarak kendi izole database schema'sÄ±nda Ã§alÄ±ÅŸÄ±r (Multi-tenant mimari)

---

## âš ï¸ Bilinen Sorunlar

### âœ… YakÄ±n Zamanda Ã‡Ã¶zÃ¼ldÃ¼ (28 Ekim 2025)

- âœ… **JWT Validation:** TenantMiddleware artÄ±k `verify()` kullanÄ±yor
- âœ… **DTO Validation:** TÃ¼m DTO'larda validation aktif, ValidationPipe global
- âœ… **Environment Variables:** `.env` sistemi kuruldu, `npm run setup:env` ile kolay kurulum
- âœ… **CORS:** CORS yapÄ±landÄ±rmasÄ± tamamlandÄ±, environment variable'dan yÃ¶netiliyor
- âœ… **Rate Limiting:** Global ve endpoint-specific rate limiting aktif
- âœ… **Multi-Tenant Connection:** TypeORM request-scope ve connection pool yÃ¶netimi dÃ¼zeltildi, tenant migrations otomatikleÅŸtirildi
- âœ… **Logging & Errors:** Winston tabanlÄ± structured logging, global exception filtresi ve frontend error boundary + toast bildirimleri devrede
- [x] **Database Migrations:** CLI komutlarıyla yönetilen migration sistemi aktif, production configuration `synchronize: false`

### Kritik

### Orta Ã–ncelikli


- **Testing:** Unit ve integration test'ler yazÄ±lmamÄ±ÅŸ

### DÃ¼ÅŸÃ¼k Ã–ncelikli

- **Pagination:** Liste sayfalarÄ±nda sayfalama yok
- **Filtering:** GeliÅŸmiÅŸ arama ve filtreleme eksik
- **User Management UI:** KullanÄ±cÄ± yÃ¶netim sayfasÄ± yok
- **Token Refresh:** Refresh token mekanizmasÄ± eksik
- **API Documentation:** Swagger/OpenAPI dokÃ¼mantasyonu yok

> ğŸ’¡ **Not:** TÃ¼m sorunlar ve Ã§Ã¶zÃ¼m planlarÄ± [ROADMAP.md](./ROADMAP.md) dosyasÄ±nda detaylÄ± ÅŸekilde listelenmiÅŸtir.

---

## ğŸ“š DokÃ¼mantasyon

Proje ile ilgili detaylÄ± dokÃ¼mantasyon aÅŸaÄŸÄ±daki dosyalarda bulunmaktadÄ±r:

- **[SETUP_WIZARD.md](./SETUP_WIZARD.md)** - ğŸª„ Ä°nteraktif kurulum sihirbazÄ± kullanÄ±m kÄ±lavuzu
- **[ROADMAP.md](./ROADMAP.md)** - Proje yol haritasÄ± ve ilerleme takibi
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Sistem mimarisi ve tasarÄ±m kararlarÄ±
- **[API_DESIGN.md](./API_DESIGN.md)** - API endpoint'leri ve veri modelleri
- **[SECURITY.md](./SECURITY.md)** - GÃ¼venlik politikalarÄ± ve best practices
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment rehberi
- **[TESTING.md](./TESTING.md)** - Test stratejisi ve Ã¶rnekler
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - KatkÄ±da bulunma kurallarÄ±
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - Environment variables dokÃ¼mantasyonu

---

## ğŸ¤ KatkÄ±da Bulunma

Projeye katkÄ±da bulunmak isterseniz lÃ¼tfen [CONTRIBUTING.md](./CONTRIBUTING.md) dosyasÄ±nÄ± okuyun.

### GeliÅŸtirme SÃ¼reci

1. Fork yapÄ±n
2. Feature branch oluÅŸturun (`git checkout -b feature/amazing-feature`)
3. DeÄŸiÅŸikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request aÃ§Ä±n

---

## ğŸ“„ Lisans

Bu proje ÅŸu anda Ã¶zel bir proje olarak geliÅŸtirilmektedir. Lisans bilgileri gÃ¼ncellenecektir.

---

## ğŸ“ Ä°letiÅŸim

SorularÄ±nÄ±z ve Ã¶nerileriniz iÃ§in issue aÃ§abilir veya projeyi geliÅŸtiren ekiple iletiÅŸime geÃ§ebilirsiniz.

---

## ğŸ—ºï¸ Sonraki AdÄ±mlar

Projenin devamÄ±nda yapÄ±lacak Ã§alÄ±ÅŸmalar iÃ§in [ROADMAP.md](./ROADMAP.md) dosyasÄ±na bakÄ±nÄ±z.

**Ã–ncelikli Hedefler (1-2 Hafta):**
- GÃ¼venlik aÃ§Ä±klarÄ±nÄ±n kapatÄ±lmasÄ±
- Validation sisteminin kurulmasÄ±
- Error handling implementasyonu
- Environment variables dÃ¼zenlenmesi

**Orta Vadeli Hedefler (2-3 Hafta):**
- User management UI
- Pagination ve filtering
- Testing altyapÄ±sÄ±
- API documentation (Swagger)
