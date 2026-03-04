# HANDOFF.md

Bu dosya, yeni bir session basladiginda hizli teknik context vermek icin tutulur.

Yeni session kurali: once `AGENT.md`, `AGENTS.md`, `HANDOFF.md`, `README.md` sirasi ile okunur.

## 1) Guncel Durum (Son Tamamlananlar)

- Guvenlik sertlestirme aktif:
  - Auth/role guard,
  - sanitize,
  - upload validation,
  - prod env guard,
  - login/register/contact rate-limit.
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
- Fulfillment ownership modeli guncellendi:
  - Admin fulfillment update'i `received|preparing|shipping` ile sinirli,
  - `shipping` icin `shipmentProvider + shipmentTrackingNumber` zorunlu,
  - `delivered` varsayilan olarak sadece carrier webhook ile guncellenir (`POST /webhooks/carrier/orders/:id/status`),
  - `ENABLE_MANUAL_FULFILLMENT_OVERRIDE=true` + `SUPER_ADMIN_EMAILS` + `overrideReason` ile acil durum manuel override desteği var,
  - Tüm fulfillment gecisleri `fulfillment_events` tablosuna loglanir.
- Content URL alanlari server tarafinda `http/https` + guvenli relative URL filtrelemesi ile dogrulaniyor.
- Test altyapisi guncel:
  - Backend: `server/tests/api.integration.test.js`, `server/tests/database.transaction.test.js`
  - Frontend smoke: `src/test/smoke/auth-pages.smoke.test.tsx`
  - CI: `.github/workflows/ci.yml` (`lint + test + build`).
- Admin dashboard sadeletme (phase-3) uygulandi:
  - Orders, users, contacts, blog, press, media, events tablari `src/components/admin/*` altina tasindi,
  - Order/contact/content/event modallari component bazli parcali yapiya alindi,
  - Order modalinda payment alani read-only snapshot'a cekildi (manual payment edit UI'dan kaldirildi),
  - Order modalinda tek update aksiyonu fulfillment icin birakildi (`Update Order`),
  - Delete confirmation modal'i `src/components/admin/ConfirmDeleteModal.tsx` ile ortaklastirildi.
- Kod inceleme ve refactoring (phase-4) tamamlandi:
  - Guvenlik: CSP header, CARRIER_WEBHOOK_SECRET prod guard, events public endpoint filtresi, plaintext parola uyarisi
  - Kod tekrari giderme: pagination utility (`server/utils/pagination.js`), temp image utility (`server/utils/contentImageUtils.js`), CMS sanitizer factory, admin guard loop, frontend upload dedup, multer mapping, order SQL helper
  - Optimizasyon: SQLite WAL mode, eksik DB indeksleri (payment_status, user_addresses, user_payment_methods)
  - Mimari: PressRelease/MediaCoverage ID uretimi Date.now() -> uuidv4(), demo veri JSON fixture'a tasinmasi, App.tsx route tanimlari ayristirilmasi (`src/routes.tsx`)

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
    - payment webhook replay/failure testleri,
    - carrier webhook retry/replay ve out-of-order event testleri.
4. Error response formati standardizasyonu (mevcut response'lar tutarli calisiyor, kozmetik iyilestirme).

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
- `CARRIER_WEBHOOK_SECRET` prod'da mutlaka set olmali.
- `ENABLE_MANUAL_FULFILLMENT_OVERRIDE` normalde `false` kalmali.
- `TRUST_PROXY` sadece reverse proxy arkasinda `true` olmali.
- Admin dashboard order ekrani operasyonel olarak fulfillment odaklidir; payment degerleri UI'da sadece izleme amacli read-only tutulur.
- `server/database/kinderlab.db` bu repoda bilinclli olarak tracked; secret/gercek prod veri konmamalidir.
- Local prompt yardimci dosyalari (`agentsmdpromptu.txt`, `güvenlikodyazmapromptu.txt`, `optimizasyonpromptu.txt`) `.gitignore` altindadir; repoya alinmamali.
- CI Node 20 uyumu icin backend test scripti explicit dosya listesi kullanir.
