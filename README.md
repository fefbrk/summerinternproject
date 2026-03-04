# 🤖 KinderLab Robotics - Yaz Dönemi Staj Projesi

Eğitim robotları için geliştirilmiş modern full-stack web platformu. E-ticaret, içerik yönetimi ve eğitim özelliklerini içeren kapsamlı bir uygulama.

## Agent / Session Dokumanlari

- `AGENT.md`: Yeni session icin 60 saniyelik hizli giris.
- `AGENTS.md`: Detayli operasyon rehberi (roller, workflow, prompt, config).
- `HANDOFF.md`: Son teknik durum, acik teknik borclar ve sonraki adimlar.

## Özellikler

**E-Ticaret Sistemi**
- Kapsamlı ürün kataloğu (79 ürün sayfası)
- 9 ana ürün kategorisi (KIBO Kitleri, Sınıf Paketleri, Uzantı Setleri vb.)
- Alışveriş sepeti, sipariş yönetimi ve ödeme domain hazırlık katmanı
- Sipariş yönetimi ve takip

**İçerik Yönetim Sistemi**
- Blog, basın bültenleri, medya kapsamı ve etkinlikler
- Rich text editor ile içerik oluşturma
- Görsel yükleme ve yönetim sistemi

**Admin Paneli**
- Kapsamlı dashboard ve CRUD işlemleri
- Kullanıcı, sipariş/fulfillment yonetimi ve payment snapshot izleme
- Orders/users/contacts/blog/press/media/events panelleri ve ana modallar parcali admin bilesenlerine ayrilmistir (`src/components/admin/*`)
- Fulfillment ownership akisi: admin `received/preparing/shipping`, teslimat sonrasi carrier-webhook kaynakli durum guncellemesi
- Order modalinda tek aksiyon fulfillment update'tir (`Update Order`); payment alani read-only snapshot olarak gorunur
- İstatistik kartları ve raporlama

**Eğitim Platformu**
- Kurs kayıt sistemi
- Öğretim materyalleri ve etkinlik yönetimi

**Web Sitesi Sayfaları**
- Ana sayfa ve navigasyon (Mega menü)
- Kurumsal sayfalar (Hakkımızda, Ödüller, Referanslar)
- Blog ve içerik sayfaları
- Hesap yönetimi ve kullanıcı paneli

## Teknolojiler

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Router

**Backend**
- Node.js + Express.js
- SQLite3 veritabanı

## Test Komutları

- `npm run test:backend`: Backend entegrasyon testleri
- `npm run test:frontend`: Frontend smoke + admin component testleri (Vitest + RTL)
- `npm run test:db-safety`: Track edilen demo DB/fixture e-posta domain guvenlik kontrolu
- `npm test`: Tüm testleri ardışık çalıştırır

## Güvenlik Notları

- API endpoint'leri token tabanlı kimlik doğrulama ile korunur.
- Admin işlemleri sunucu tarafında rol kontrolü ile sınırlandırılır.
- Parolalar `scrypt` ile hashlenerek saklanır (plaintext saklanmaz).
- Login/register/contact endpointlerinde rate-limit uygulanır.
- Login endpointinde hesap-bazli lockout uygulanir (`LOGIN_LOCKOUT_WINDOW_MS`, `LOGIN_LOCKOUT_MAX_ATTEMPTS`).
- Rate-limit state'i veritabaninda kalici tutulur (`rate_limits`), restart sonrasi sifirlanmaz.
- Demo/sıfırlama endpoint'leri sadece `ENABLE_DEMO_ENDPOINTS=true` olduğunda açılır.
- HTML içerikleri istemci ve sunucuda sanitize edilir (XSS koruması).
- Upload endpointlerinde mime/extension + magic-byte (dosya imzasi) kontrolu uygulanir.
- `server/database/kinderlab.db` bu repoda bilincli olarak takip edilir; production secret/veri tutulmaz.
- Public CMS endpoint'leri sadece `published` içerik döndürür; admin list endpoint'leri ayrıdır.
- `shipping` durumuna geciste `carrier + tracking` zorunludur; `delivered` varsayilan olarak carrier webhook ile guncellenir.
- Admin dashboard'da payment alanlari operasyonel olarak read-only tutulur; fulfillment adimlari tek update aksiyonuyla yonetilir.
- Auth token cookie `httpOnly` olarak set edilir; logout ile token denylist'e alinip tekrar kullanimi engellenir (`revoked_tokens`).
- Parola degisikligi sonrasinda onceki tokenlar sunucu tarafinda gecersiz sayilir.
- Event/media URL alanlari server tarafinda protokol dogrulamasi ile filtrelenir (`http/https` veya guvenli relative URL).
- Lokal prompt yardimci dosyalari (`agentsmdpromptu.txt`, `güvenlikodyazmapromptu.txt`, `optimizasyonpromptu.txt`) gitignore altindadir.
- Content-Security-Policy header aktif; CARRIER_WEBHOOK_SECRET prod'da zorunlu.
- Carrier webhook dogrulamasi `x-carrier-webhook-timestamp` + `x-carrier-webhook-signature` (HMAC-SHA256) ile yapilir.
- JSON/form request body size limitleri ayarlanmistir (`API_JSON_BODY_LIMIT`, `API_FORM_BODY_LIMIT`); malformed/oversized payload'lar 400/413 ile reddedilir.
- Carrier webhook endpoint'i rate-limit ile korunur (`CARRIER_WEBHOOK_WINDOW_MS`, `CARRIER_WEBHOOK_MAX_ATTEMPTS`, `CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES`).
- Admin state-changing aksiyonlari `audit_logs` tablosuna, erisim/rate-limit ihlalleri `security_events` tablosuna kaydedilir.
- Security header katmani Helmet ile yonetilir (CSP/HSTS/frame/noSniff/referrer/cross-origin policy).
- CMS ID uretimi UUID v4 ile yapilir; SQLite WAL mode aktif.

### Backend Ortam Değişkenleri

- `server/.env` dosyası `npm start` ve `npm run dev` ile otomatik yüklenir.

- `AUTH_TOKEN_SECRET`: Üretimde güçlü bir gizli anahtar zorunlu.
- `AUTH_TOKEN_TTL_MS`: Token süresi (ms), varsayılan 24 saat (üretimde 24 saati asmamali).
- `CORS_ORIGINS`: İzin verilen origin listesi (virgülle ayrılmış).
- `API_JSON_BODY_LIMIT`, `API_FORM_BODY_LIMIT`: API body parser limitleri.
- `REGISTRATION_WINDOW_MS`, `REGISTRATION_MAX_ATTEMPTS`, `REGISTRATION_RATE_LIMIT_MAX_ENTRIES`: Register rate-limit ayarları.
- `LOGIN_LOCKOUT_WINDOW_MS`, `LOGIN_LOCKOUT_MAX_ATTEMPTS`, `LOGIN_LOCKOUT_RATE_LIMIT_MAX_ENTRIES`: Hesap lockout ayarlari.
- `SECURITY_ALERT_LOGIN_FAILURE_THRESHOLD`, `SECURITY_ALERT_ADMIN_WINDOW_MS`, `SECURITY_ALERT_ADMIN_MUTATION_THRESHOLD`, `SECURITY_ALERT_BUSINESS_HOUR_START`, `SECURITY_ALERT_BUSINESS_HOUR_END`: Guvenlik alert esikleri.
- `TRUST_PROXY`: Sadece reverse-proxy arkasında `true` olmalı.
- `DEFAULT_ADMIN_EMAIL`: İlk admin hesabı e-posta adresi.
- `DEFAULT_ADMIN_PASSWORD`: İlk admin hesabı şifresi (üretimde zorunlu).
- `ENABLE_DEMO_ENDPOINTS`: `true` ise demo/temizleme endpoint'leri aktif olur.
- `CARRIER_WEBHOOK_SECRET`: Carrier webhook endpoint gizli anahtarı.
- `CARRIER_WEBHOOK_WINDOW_MS`, `CARRIER_WEBHOOK_MAX_ATTEMPTS`, `CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES`: Carrier webhook rate-limit ayarları.
- `ENABLE_MANUAL_FULFILLMENT_OVERRIDE`: Acil durum manuel delivered override (`false` kalması önerilir).
- `ENABLE_MANUAL_PAYMENT_OVERRIDE`: Acil durum manuel payment status override (`false` kalması önerilir).
- `SUPER_ADMIN_EMAILS`: Override için yetkili super-admin e-posta listesi (virgülle ayrılmış).
- `SQLITE_DB_PATH`: Opsiyonel veritabanı yolu (test ortamları için geçici DB tanımlamakta kullanılır).

## Proje Büyüklüğü

**Toplam 129 Sayfa:**
- 79 ürün sayfası (9 kategoride)
- 20 eğitim ve kaynak sayfası (Kurslar, Etkinlikler, Öğretim materyalleri)
- 15 ana sayfa (Ana sayfa, Mağaza, Sepet, Ödeme, Giriş vb.)
- 10 kurumsal sayfa (Hakkımızda, Ödüller, Referanslar, İletişim)
- 5 hesap yönetimi sayfası (Profil, Siparişler, Ayarlar)

**Diğer:**
- 64 UI bileşeni
- 16+ veritabanı tablosu (orders/content/payment/fulfillment/security domain dahil)
- 50+ API endpoint
- 3 Context provider

## Veritabanı

```text
users
├─ orders
│  ├─ order_items
│  ├─ payment_attempts
│  ├─ payment_events
│  └─ fulfillment_events
├─ revoked_tokens
├─ rate_limits
├─ course_registrations
├─ user_addresses
└─ user_payment_methods

blog_posts
press_releases
media_coverage
events
contacts
```

## Klasör Yapısı

```
├── src/
│   ├── components/    # UI bilesenleri
│   │   └── admin/     # Admin dashboard parcali bilesenleri
│   ├── pages/         # Sayfa bileşenleri
│   │   └── products/  # Ürün kategorileri
│   ├── assets/        # Görsel ve medya dosyaları
│   ├── context/       # Global state
│   ├── services/      # API çağrıları
│   └── routes.tsx     # Route tanimlari ve lazy import'lar
├── server/
│   ├── database/      # Veritabanı (WAL mode)
│   ├── routes/        # Endpoint gruplari
│   ├── utils/         # Paylasilan yardimci fonksiyonlar
│   ├── fixtures/      # Demo veri JSON dosyalari
│   └── server.js      # Express sunucu
└── public/            # Statik dosyalar
```
