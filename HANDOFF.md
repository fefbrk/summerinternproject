# HANDOFF.md

Bu dosya, yeni bir session basladiginda hizli teknik context vermek icin tutulur.

Yeni session kurali: once `AGENT.md`, `AGENTS.md`, `HANDOFF.md`, `README.md` sirasi ile okunur.

## 1) Guncel Durum (Son Tamamlananlar)

- Guvenlik sertlestirme aktif:
  - Auth/role guard,
  - sanitize,
  - upload validation,
  - prod env guard,
  - login/contact rate-limit.
- Backend moduler yapida:
  - `server/routes/authUserRoutes.js`
  - `server/routes/commerceRoutes.js`
  - `server/routes/accountRoutes.js`
  - `server/routes/contentRoutes.js`
  - `server/routes/contentUploadRoutes.js`
  - `server/routes/demoRoutes.js`
  - `server/routes/maintenanceRoutes.js`
  - `server/middleware/authMiddleware.js`
- Content/public access sertlestirmesi tamamlandi:
  - Public CMS endpointleri sadece `published` donuyor.
  - Admin list endpointleri `/api/admin/*` olarak ayrildi.
- Checkout ve account veri akisi sadeletildi:
  - duplicate submit kapatildi,
  - local order compatibility cache kaldirildi,
  - order kaynagi backend tek kaynak.
- Siparis guvenligi sertlestirildi:
  - urun/fiyat backend katalogundan dogrulaniyor (`server/services/productCatalogService.js`),
  - client total/price tampering engelleniyor.
- Payment domain hazirlik katmani eklendi (PSP bagimsiz):
  - Orders tablosunda payment kolonlari,
  - `payment_attempts` ve `payment_events` tablolari,
  - payment attempt/event persistence,
  - `server/services/paymentService.js` (provider-agnostic iskelet),
  - endpointler: `GET/PUT /api/orders/:id/payment-status`.
- Fulfillment guard aktif:
  - `preparing|shipping|delivered` gecisi icin payment `paid` zorunlu.
- Test altyapisi guncel:
  - Backend: `server/tests/api.integration.test.js`, `server/tests/database.transaction.test.js`
  - Frontend smoke: `src/test/smoke/auth-pages.smoke.test.tsx`
  - CI: `.github/workflows/ci.yml` (`lint + test + build`).
- Admin dashboard sadeletme (phase-3) uygulandi:
  - Orders + Payment, users, contacts, blog, press, media, events tablari `src/components/admin/*` altina tasindi,
  - Order/contact/content/event modallari component bazli parcali yapiya alindi,
  - Delete confirmation modal'i `src/components/admin/ConfirmDeleteModal.tsx` ile ortaklastirildi.

## 2) Hala Acik Olan Teknik Borc (Oncelik Sirasi)

1. PSP sandbox entegrasyonu (provider secimi bekliyor):
   - `create-session` + `webhook` route'lari,
   - webhook signature dogrulama,
   - idempotent event isleme (`payment_events`).
2. Payment UI entegrasyonu:
   - checkout redirect/return akisi,
   - account ekranlarinda payment status/attempt gorunurlugu.
3. Test kapsami artisi:
   - upload/content CRUD unhappy-path testleri,
   - account UI integration testleri,
   - admin dashboard kritik akislari icin frontend testleri (payment update, fulfillment update, content CRUD),
   - payment webhook replay/failure testleri.

## 3) Hemen Calistirilacak Komutlar (Yeni Session)

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

## 4) Operasyon Notlari

- Prod'da zorunlu env: `AUTH_TOKEN_SECRET`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`.
- `ENABLE_DEMO_ENDPOINTS` prod'da `false` kalmali.
- `TRUST_PROXY` sadece reverse proxy arkasinda `true` olmali.
- `server/database/kinderlab.db` bu repoda bilinclli olarak tracked; secret/gercek prod veri konmamalidir.
- Local prompt yardimci dosyalari (`agentsmdpromptu.txt`, `güvenlikodyazmapromptu.txt`, `optimizasyonpromptu.txt`) `.gitignore` altindadir; repoya alinmamali.
- CI Node 20 uyumu icin backend test scripti explicit dosya listesi kullanir.
