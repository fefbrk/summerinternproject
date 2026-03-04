# AGENTS.md

Bu dokuman, proje icinde calisan insan/AI agentlari icin tek noktadan hizli operasyon rehberidir.

## 1) Proje Ozeti

- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + SQLite
- Auth: Token tabanli (Bearer), role bazli admin kontrolu
- CI: GitHub Actions (`.github/workflows/ci.yml`) -> lint + test + build
- Icerik alanlari: blog, press releases, media coverage, events
- Is alanlari: e-commerce orders, course registrations, contacts, user account data, payment domain hazirligi
- Admin dashboard: orders/users/contacts/blog/press/media/events tablari ve ana modallar `src/components/admin/*` altinda parcali yapiya alinmistir; order operasyonu fulfillment odaklidir, payment alani modalda read-only snapshot olarak izlenir

Ana dizinler:

- `src/` -> frontend sayfalari, context, servisler
- `src/routes.tsx` -> tum route tanimlari ve lazy import'lar
- `server/` -> API, auth middleware, SQLite islemleri
- `server/routes/` -> endpoint gruplari (auth, commerce, account, content, demo)
- `server/middleware/` -> authz/rate-limit middleware
- `server/services/` -> bootstrap/is kurallari, urun katalogu ve payment servisleri
- `server/utils/` -> paylasilan yardimci fonksiyonlar (pagination, contentImageUtils)
- `server/database/` -> schema ve DB islemleri (WAL mode aktif)
- `server/fixtures/` -> demo veri JSON dosyalari

## 2) Agent Rolleri

Asagidaki roller mantiksal ayrimdir; tek agent birden fazla rol ustlenebilir.

1. Coordinator Agent
- Is parcalarini planlar, siralar, dependency takibi yapar.
- Cikti: net TODO, kabul kriterleri, durum raporu.

2. Backend Agent
- `server/server.js`, `server/routes/*`, `server/middleware/*`, `server/services/*`, `server/database/*` uzerinde API, authz, validation, data consistency calisir.
- Cikti: endpoint degisikligi, DB uyumlulugu, backward compatibility notu.

3. Frontend Agent
- `src/pages/*`, `src/context/*`, `src/services/apiService.ts` uzerinde UI + API entegrasyonu yapar.
- Cikti: ekran davranisi, error handling, state uyumlulugu.

4. Security Agent
- Auth, role guard, sanitize, upload, secret handling, demo endpoint kontrolu yapar.
- Cikti: risk listesi, fix durumu, kalan riskler.

5. QA/Regression Agent
- Lint/build/smoke/regression komutlarini kosar, hatalari siniflandirir.
- Cikti: test matrisi, pass/fail, tekrar uretim adimlari.

6. Release Agent
- Git hygiene, commit kalitesi, release notlari ve deploy oncesi checklisti yonetir.
- Cikti: yayinlanabilir degisiklik seti.

## 3) Kullanilan Tools

### 3.1 Uygulama Teknolojileri

- Frontend: React, TypeScript, Vite, Tailwind, TanStack Query
- Backend: Express, sqlite3, multer, sanitize-html
- Payment domain: provider-agnostic payment service + payment attempt/event persistence
- Security yardimcilari: DOMPurify (frontend), sanitize-html (backend), scrypt hash

### 3.2 Gelistirme/CI Araçlari

- ESLint (`npm run lint`)
- Vite build (`npm run build`)
- Backend test (`npm run test:backend`)
- Frontend smoke + admin component test (`npm run test:frontend`)
- Tracked demo data safety check (`npm run test:db-safety`)
- Full test (`npm test`)
- Nodemon (`server` icinde `npm run dev`)

### 3.3 Agent Operasyon Araçlari

- Dosya arama: `glob`, `grep`
- Dosya okuma/yazma: `read`, patch tabanli edit
- Komut calistirma: `bash`
- Git/GitHub islemleri: `git`, `gh`

## 4) Prompt Yapilari (Sablonlar)

### 4.1 Feature Prompt

"<feature> ozelligini ekle. Backend endpointleri, frontend entegrasyonu ve validation dahil olsun. Sonunda lint/build ve smoke test sonucu ver."

### 4.2 Bugfix Prompt

"<bug tanimi> hatasini root-cause ile cozmeyi hedefle. Repro adimi, kalici fix ve regression kontrolu ekle."

### 4.3 Security Prompt

"Auth, role guard, sanitize, upload ve secret yonetimini audit et. Kritikleri fixle, kalan riskleri onceliklendir."

### 4.4 Release Prompt

"Mevcut degisiklikleri release-ready hale getir. Gereksiz dosyalari ayikla, lint/build/smoke gecsin, commit mesaji olustur."

## 5) Workflow Akisi

1. Discovery
- Kod tabani ve etkilenmis alanlar bulunur.

2. Plan
- Degisiklikler kucuk, geri alinabilir adimlara bolunur.

3. Implement
- Backend/Frontend degisiklikleri mevcut patternlere uygun yapilir.

4. Verify
- Minimum: `npm run lint` + `npm run build` + `npm test`
- Backend odakli degisiklikte ek olarak: `npm run test:backend`
- Gerekirse backend smoke (`server` icinde `npm start`) ve login testi

5. Security Gate
- Public/protected endpoint ayrimi, role guard, sanitize ve env kontrolu dogrulanir.

6. Release Prep
- Secret dosyalari ignore edilir, gecici dosyalar temizlenir, degisiklik ozeti cikarilir.

## 6) API Baglantilari

Frontend API base:

- `src/services/apiService.ts`
- `ROOT_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'`
- Tum istekler `.../api/*` formatinda gider.
- Auth token storage key: `auth_token` (localStorage)
- Auth header: `Authorization: Bearer <token>`

Temel endpoint gruplari (`server/routes/*`):

- Auth: `/api/login`, `/api/register`, `/api/me`, `/api/refresh`, `/api/logout`
- Users: `/api/users`, `/api/users/:id/password`
- Orders: `/api/orders`, `/api/orders/my`, `/api/orders/:id/status`, `/api/orders/:id/payment-status`
- Carrier webhook: `POST /webhooks/carrier/orders/:id/status` (`x-carrier-webhook-timestamp` + `x-carrier-webhook-signature` HMAC)
- Registrations: `/api/registrations`, `/api/registrations/my`, `/api/registrations/:id/status`
- Contacts: `/api/contacts`, `/api/contacts/:id/status`
- CMS Public: `/api/blog`, `/api/press-releases`, `/api/media-coverage`, `/api/events` (yalnizca `published`)
- CMS Admin list: `/api/admin/blog`, `/api/admin/press-releases`, `/api/admin/media-coverage`, `/api/admin/events`
- Media upload: ilgili `.../images` endpointleri
- Account extras: `/api/addresses/*`, `/api/payment-methods/*`

Not: Public endpointler sinirlidir; digerleri token ister ve admin kontrolleri middleware tarafinda uygulanir.

Admin order operasyon notu:

- Order modalinda tek update aksiyonu fulfillment icindir (`Update Order`)
- Payment alani dashboard'da read-only snapshot olarak gosterilir (amount/currency/status izleme + attempts listesi)

## 7) Konfigurasyon Ornekleri

### 7.1 Frontend `.env`

```env
VITE_API_URL=http://localhost:3001
```

### 7.2 Backend `server/.env`

```env
AUTH_TOKEN_SECRET=<long-random-secret>
AUTH_TOKEN_TTL_MS=86400000
AUTH_REFRESH_TOKEN_SECRET=<long-random-refresh-secret>
AUTH_REFRESH_TOKEN_TTL_MS=604800000
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
PII_ENCRYPTION_KEY=<32-byte-key-utf8-base64-or-hex>
API_JSON_BODY_LIMIT=256kb
API_FORM_BODY_LIMIT=256kb
REGISTRATION_WINDOW_MS=900000
REGISTRATION_MAX_ATTEMPTS=20
REGISTRATION_RATE_LIMIT_MAX_ENTRIES=10000
LOGIN_LOCKOUT_WINDOW_MS=1800000
LOGIN_LOCKOUT_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_RATE_LIMIT_MAX_ENTRIES=50000
SECURITY_ALERT_LOGIN_FAILURE_THRESHOLD=5
SECURITY_ALERT_ADMIN_WINDOW_MS=600000
SECURITY_ALERT_ADMIN_MUTATION_THRESHOLD=15
SECURITY_ALERT_BUSINESS_HOUR_START=8
SECURITY_ALERT_BUSINESS_HOUR_END=20
TRUST_PROXY=false
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=<strong-password>
ENABLE_DEMO_ENDPOINTS=false
CARRIER_WEBHOOK_SECRET=<long-random-webhook-secret>
CARRIER_WEBHOOK_WINDOW_MS=60000
CARRIER_WEBHOOK_MAX_ATTEMPTS=120
CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES=50000
ENABLE_MANUAL_FULFILLMENT_OVERRIDE=false
ENABLE_MANUAL_PAYMENT_OVERRIDE=false
SUPER_ADMIN_EMAILS=admin@example.com
SQLITE_DB_PATH=./database/kinderlab.db
```

Production notlari:

- `AUTH_TOKEN_SECRET` zorunlu
- `AUTH_TOKEN_SECRET` guclu/uzun olmali (kisa secretlar production'da reject edilir)
- `AUTH_TOKEN_TTL_MS` production'da 24 saati asmamali
- `AUTH_REFRESH_TOKEN_SECRET` opsiyonel; tanimlanmazsa access token secret kullanilir (ayri secret onerilir)
- `AUTH_REFRESH_TOKEN_TTL_MS` production'da operasyonel risklere gore sinirlanmali (onerilen <=30 gun)
- `PII_ENCRYPTION_KEY` production'da zorunlu ve 32-byte gecerli deger olmali
- `SECURITY_ALERT_*` esik degerleri operasyon gereksinimine gore ayarlanabilir
- `DEFAULT_ADMIN_EMAIL` gecerli e-posta olmali
- `DEFAULT_ADMIN_PASSWORD` zorunlu
- `ENABLE_DEMO_ENDPOINTS=false` kalmali
- `CARRIER_WEBHOOK_SECRET` tanimli olmali (carrier webhook akisi icin)
- `ENABLE_MANUAL_FULFILLMENT_OVERRIDE` normalde `false` kalmali (acil durum disinda acilmaz)
- `ENABLE_MANUAL_PAYMENT_OVERRIDE` normalde `false` kalmali
- `TRUST_PROXY` sadece reverse-proxy arkasinda `true` olmali
- `SQLITE_DB_PATH` opsiyoneldir (test ortaminda gecici DB vermek icin kullanilir)

## 8) Kurulum ve Kullanim

### 8.1 Gereksinimler

- Node.js 20+ onerilir
- npm

### 8.2 Kurulum

```bash
npm install
```

```bash
cd server && npm install
```

### 8.3 Calistirma

Frontend (dev):

```bash
npm run dev
```

Backend (dev):

```bash
cd server && npm run dev
```

Backend (prod-like start):

```bash
cd server && npm start
```

### 8.4 Dogrulama

```bash
npm run lint
```

```bash
npm run build
```

```bash
npm test
```

Opsiyonel backend smoke:

```bash
cd server && npm start
```

## 9) Guvenlik ve Release Checklist

- [ ] Secretlar `.env` dosyalarinda, repoya dahil degil
- [ ] `server/.env` gitignore kapsaminda
- [ ] Local prompt yardimci dosyalari (`agentsmdpromptu.txt`, `güvenlikodyazmapromptu.txt`, `optimizasyonpromptu.txt`) commit edilmedi
- [ ] Legacy default admin kimlik bilgileri aktif degil
- [ ] Auth middleware kullaniciyi DB'den yeniden dogruluyor
- [ ] Public CMS endpointleri draft icerik dondurmuyor
- [ ] Fulfillment status'lerine gecmeden once payment `paid` dogrulaniyor
- [ ] Admin `shipping` gecisinde carrier/tracking zorunlu
- [ ] `delivered` guncellemesi webhook disinda manuel acik degil (`ENABLE_MANUAL_FULFILLMENT_OVERRIDE=false`)
- [ ] Manual payment status update varsayilan olarak kapali (`ENABLE_MANUAL_PAYMENT_OVERRIDE=false`)
- [ ] Upload endpointleri dosya signature (magic-byte) kontrolu yapiyor
- [ ] Admin order modalinda payment alanlari read-only, fulfillment icin tek update aksiyonu aktif
- [ ] `npm run lint` ve `npm run build` basarili
- [ ] Demo endpointleri prod ortamda kapali

## 10) Hizli Referans

- Frontend API servis dosyasi: `src/services/apiService.ts`
- Auth context: `src/context/AuthContext.tsx`
- User data context: `src/context/UserDataContext.tsx`
- Backend app composition: `server/server.js`
- Auth middleware: `server/middleware/authMiddleware.js`
- Route modulleri: `server/routes/*.js`
- Bootstrap service: `server/services/bootstrapService.js`
- Product catalog service: `server/services/productCatalogService.js`
- Payment service: `server/services/paymentService.js`
- DB adapter: `server/database/database.js`
- DB schema: `server/database/schema.sql`
- Shared utilities: `server/utils/pagination.js`, `server/utils/contentImageUtils.js`
- Demo veri fixture: `server/fixtures/demo-data.json`
- Route tanimlari: `src/routes.tsx`
- Admin order tab: `src/components/admin/AdminOrdersTab.tsx`
- Admin order modal: `src/components/admin/OrderEditModal.tsx`
- Admin contact tab: `src/components/admin/AdminContactsTab.tsx`
- Admin contact modallari: `src/components/admin/ContactDetailModal.tsx`, `src/components/admin/ContactEditModal.tsx`
- Admin users tab: `src/components/admin/AdminUsersTab.tsx`
- Admin blog tab/modal: `src/components/admin/AdminBlogTab.tsx`, `src/components/admin/BlogEditModal.tsx`
- Admin press tab/modal: `src/components/admin/AdminPressReleasesTab.tsx`, `src/components/admin/PressReleaseEditModal.tsx`
- Admin media tab/modal: `src/components/admin/AdminMediaCoverageTab.tsx`, `src/components/admin/MediaCoverageEditModal.tsx`
- Admin events tab/modal: `src/components/admin/AdminEventsTab.tsx`, `src/components/admin/EventEditModal.tsx`
- Admin delete confirm modal: `src/components/admin/ConfirmDeleteModal.tsx`

## 11) Yeni Session Hizli Baslangic

1. Once `AGENT.md`, `AGENTS.md`, `HANDOFF.md`, `README.md` dosyalarini oku.
2. Ardindan `git status -sb` ile calisma alanini kontrol et.
3. Degisiklik yapmadan once ilgili modulu oku (`server/routes/*` veya `src/pages/*`).
4. Degisiklikten sonra minimum dogrulama: `npm run lint && npm test && npm run build -- --logLevel error`.

## 12) Bilinen Kritik Notlar

- `server/.env` repoya dahil edilmez; prod secretlar sadece ortam degiskeni ile yonetilir.
- `server/database/kinderlab.db` bu repoda bilinclli olarak takiptedir; production secret/veri icermemeli.
- Auth token middleware DB'den kullaniciyi yeniden dogrular (token tek basina yeterli degil).
- Node test scripti CI uyumu icin explicit dosya listesi kullanir (`server/package.json` test scripti).
- Address tipi frontendde `home|office`, backendde `delivery|billing` maplenir; bu donusumde regression testi bulunur.
- Orders tablosunda payment/fulfillment kolonlari ve `payment_attempts`/`payment_events`/`fulfillment_events` tablolari aktiftir; webhook idempotency kayitlari DB tarafinda tutulur.
- Guvenlik icin `revoked_tokens` (logout denylist) ve `rate_limits` (kalici throttle state) tablolari aktiftir.
- Guvenlik izleme icin `audit_logs` (admin mutating aksiyonlar) ve `security_events` (auth/rate-limit ihlalleri) tablolari aktiftir.
- Auth token cookie (`auth_token`) `httpOnly` olarak set edilir; logout ile token `revoked_tokens` tablosuna yazilarak denylist uygulanir.
- Login/register/contact rate-limitleri `rate_limits` tablosu uzerinden kalici/podlar-arasi paylasimli state ile takip edilir; login icin hesap lockout akisi da ayni store uzerindedir.
- Admin dashboard order modalinda payment status manuel edit UI'dan kapali tutulur; fulfillment adimlari operasyonel olarak ayridir.
