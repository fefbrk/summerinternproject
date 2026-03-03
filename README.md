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
- Kullanıcı, sipariş ve odeme durumu yonetimi
- Orders/contacts panelleri parcali admin bilesenlerine ayrilmistir (`src/components/admin/*`)
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
- `npm run test:frontend`: Frontend smoke testleri (Vitest + RTL)
- `npm test`: Tüm testleri ardışık çalıştırır

## Güvenlik Notları

- API endpoint'leri token tabanlı kimlik doğrulama ile korunur.
- Admin işlemleri sunucu tarafında rol kontrolü ile sınırlandırılır.
- Parolalar `scrypt` ile hashlenerek saklanır (plaintext saklanmaz).
- Demo/sıfırlama endpoint'leri sadece `ENABLE_DEMO_ENDPOINTS=true` olduğunda açılır.
- HTML içerikleri istemci ve sunucuda sanitize edilir (XSS koruması).
- `server/database/kinderlab.db` bu repoda bilincli olarak takip edilir; production secret/veri tutulmaz.
- Public CMS endpoint'leri sadece `published` içerik döndürür; admin list endpoint'leri ayrıdır.
- Lokal prompt yardimci dosyalari (`agentsmdpromptu.txt`, `güvenlikodyazmapromptu.txt`, `optimizasyonpromptu.txt`) gitignore altindadir.

### Backend Ortam Değişkenleri

- `server/.env` dosyası `npm start` ve `npm run dev` ile otomatik yüklenir.

- `AUTH_TOKEN_SECRET`: Üretimde güçlü bir gizli anahtar zorunlu.
- `AUTH_TOKEN_TTL_MS`: Token süresi (ms), varsayılan 7 gün.
- `CORS_ORIGINS`: İzin verilen origin listesi (virgülle ayrılmış).
- `TRUST_PROXY`: Sadece reverse-proxy arkasında `true` olmalı.
- `DEFAULT_ADMIN_EMAIL`: İlk admin hesabı e-posta adresi.
- `DEFAULT_ADMIN_PASSWORD`: İlk admin hesabı şifresi (üretimde zorunlu).
- `ENABLE_DEMO_ENDPOINTS`: `true` ise demo/temizleme endpoint'leri aktif olur.
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
- 13+ veritabanı tablosu (orders/content/payment domain dahil)
- 50+ API endpoint
- 3 Context provider

## Veritabanı

```text
users
├─ orders
│  └─ order_items
│  ├─ payment_attempts
│  └─ payment_events
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
│   └── services/      # API çağrıları
├── server/
│   ├── database/      # Veritabanı
│   └── server.js      # Express sunucu
└── public/            # Statik dosyalar
```
