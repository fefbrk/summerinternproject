# AGENTS.md

Bu dokuman, proje icinde calisan insan/AI agentlari icin tek noktadan hizli operasyon rehberidir.

## 1) Proje Ozeti

- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + SQLite
- Auth: Token tabanli (Bearer), role bazli admin kontrolu
- Icerik alanlari: blog, press releases, media coverage, events
- Is alanlari: e-commerce orders, course registrations, contacts, user account data

Ana dizinler:

- `src/` -> frontend sayfalari, context, servisler
- `server/` -> API, auth middleware, SQLite islemleri
- `server/database/` -> schema ve DB islemleri

## 2) Agent Rolleri

Asagidaki roller mantiksal ayrimdir; tek agent birden fazla rol ustlenebilir.

1. Coordinator Agent
- Is parcalarini planlar, siralar, dependency takibi yapar.
- Cikti: net TODO, kabul kriterleri, durum raporu.

2. Backend Agent
- `server/server.js` ve `server/database/*` uzerinde API, authz, validation, data consistency calisir.
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
- Security yardimcilari: DOMPurify (frontend), sanitize-html (backend), scrypt hash

### 3.2 Gelistirme/CI Araçlari

- ESLint (`npm run lint`)
- Vite build (`npm run build`)
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
- Minimum: `npm run lint` + `npm run build`
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

Temel endpoint gruplari (`server/server.js`):

- Auth: `/api/login`, `/api/register`, `/api/me`
- Users: `/api/users`, `/api/users/:id/password`
- Orders: `/api/orders`, `/api/orders/my`, `/api/orders/:id/status`
- Registrations: `/api/registrations`, `/api/registrations/my`, `/api/registrations/:id/status`
- Contacts: `/api/contacts`, `/api/contacts/:id/status`
- CMS: `/api/blog`, `/api/press-releases`, `/api/media-coverage`, `/api/events`
- Media upload: ilgili `.../images` endpointleri
- Account extras: `/api/addresses/*`, `/api/payment-methods/*`

Not: Public endpointler sinirlidir; digerleri token ister ve admin kontrolleri middleware tarafinda uygulanir.

## 7) Konfigurasyon Ornekleri

### 7.1 Frontend `.env`

```env
VITE_API_URL=http://localhost:3001
```

### 7.2 Backend `server/.env`

```env
AUTH_TOKEN_SECRET=<long-random-secret>
AUTH_TOKEN_TTL_MS=604800000
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=<strong-password>
ENABLE_DEMO_ENDPOINTS=false
```

Production notlari:

- `AUTH_TOKEN_SECRET` zorunlu
- `DEFAULT_ADMIN_EMAIL` gecerli e-posta olmali
- `DEFAULT_ADMIN_PASSWORD` zorunlu
- `ENABLE_DEMO_ENDPOINTS=false` kalmali

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

Opsiyonel backend smoke:

```bash
cd server && npm start
```

## 9) Guvenlik ve Release Checklist

- [ ] Secretlar `.env` dosyalarinda, repoya dahil degil
- [ ] `server/.env` gitignore kapsaminda
- [ ] Legacy default admin kimlik bilgileri aktif degil
- [ ] Auth middleware kullaniciyi DB'den yeniden dogruluyor
- [ ] `npm run lint` ve `npm run build` basarili
- [ ] Demo endpointleri prod ortamda kapali

## 10) Hizli Referans

- Frontend API servis dosyasi: `src/services/apiService.ts`
- Auth context: `src/context/AuthContext.tsx`
- Backend API ve guardlar: `server/server.js`
- DB adapter: `server/database/database.js`
- DB schema: `server/database/schema.sql`
