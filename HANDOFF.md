# HANDOFF.md

Bu dosya, yeni bir session basladiginda hizli teknik context vermek icin tutulur.

Yeni session kurali: once `AGENT.md`, `AGENTS.md`, `HANDOFF.md`, `README.md` sirasi ile okunur.

## 1) Guncel Durum (Son Tamamlananlar)

- Guvenlik sertlestirme tamamlandi (auth/role guard, sanitize, upload validation, prod env guard).
- Backend monolith parcali hale getirildi:
  - `server/routes/authUserRoutes.js`
  - `server/routes/commerceRoutes.js`
  - `server/routes/accountRoutes.js`
  - `server/routes/contentRoutes.js`
  - `server/routes/contentUploadRoutes.js`
  - `server/routes/demoRoutes.js`
  - `server/routes/maintenanceRoutes.js`
  - `server/middleware/authMiddleware.js`
  - `server/services/bootstrapService.js`
- DB tarafinda transaction katmani eklendi (`runInTransaction`) ve kritik yazma akislarina uygulandi.
- Test altyapisi kuruldu:
  - Backend: `server/tests/api.integration.test.js`, `server/tests/database.transaction.test.js`
  - Frontend: `src/test/smoke/auth-pages.smoke.test.tsx`
- CI aktif: `.github/workflows/ci.yml` (`lint + test + build`).

## 2) Son Duzeltmeler (Account Domain)

- Address tipi UI bug'i duzeltildi (`home|office` secimi artik backend'e dogru mapleniyor).
- `isDefault` alaninda "undefined -> false" bug'i duzeltildi.
- Address/Payment create-update endpointleri artik metadata yerine guncel entity donduruyor.
- Bu davranislar backend integration testleri ile kapsandi.

## 3) Hala Acik Olan Teknik Borc (Oncelik Sirasi)

1. Frontend account context sadeleme:
   - `src/context/UserDataContext.tsx` icinde local order cache + backend order kaynagi ciftligi sadeletilmeli.
   - `Checkout` sayfasindaki `addOrder` compatibility katmani kaldirilip tek kaynak backend olmali.
2. Content route IO optimizasyonu:
   - `server/routes/contentRoutes.js` icindeki sync FS islemleri (`existsSync/readdirSync/renameSync/rmSync`) async'e alinmali.
3. DB policy karari:
   - `server/database/kinderlab.db` repoda takipte kalacak mi kalmayacak mi netlestirilmeli.
4. Test kapsami artisi:
   - upload/content CRUD unhappy-path testleri,
   - account UI integration testleri.

## 4) Hemen Calistirilacak Komutlar (Yeni Session)

```bash
git status -sb
```

```bash
npm run lint && npm test && npm run build -- --logLevel error
```

Opsiyonel backend smoke:

```bash
cd server && npm start
```

## 5) Operasyon Notlari

- Prod'da zorunlu env: `AUTH_TOKEN_SECRET`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`.
- `ENABLE_DEMO_ENDPOINTS` prod'da `false` kalmali.
- CI Node 20 uyumu icin backend test scripti explicit dosya listesi kullanir.
