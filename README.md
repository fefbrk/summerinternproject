# 🤖 KinderLab Robotics - Yaz Dönemi Staj Projesi

Eğitim robotları için geliştirilmiş modern full-stack web platformu. E-ticaret, içerik yönetimi ve eğitim özelliklerini içeren kapsamlı bir uygulama.

## Özellikler

**E-Ticaret Sistemi**
- Kapsamlı ürün kataloğu (79 ürün sayfası)
- 9 ana ürün kategorisi (KIBO Kitleri, Sınıf Paketleri, Uzantı Setleri vb.)
- Gelişmiş alışveriş sepeti ve ödeme sistemi
- Sipariş yönetimi ve takip

**İçerik Yönetim Sistemi**
- Blog, basın bültenleri, medya kapsamı ve etkinlikler
- Rich text editor ile içerik oluşturma
- Görsel yükleme ve yönetim sistemi

**Admin Paneli**
- Kapsamlı dashboard ve CRUD işlemleri
- Kullanıcı ve sipariş yönetimi
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

## Güvenlik Notları

- API endpoint'leri token tabanlı kimlik doğrulama ile korunur.
- Admin işlemleri sunucu tarafında rol kontrolü ile sınırlandırılır.
- Parolalar `scrypt` ile hashlenerek saklanır (plaintext saklanmaz).
- Demo/sıfırlama endpoint'leri sadece `ENABLE_DEMO_ENDPOINTS=true` olduğunda açılır.
- HTML içerikleri istemci ve sunucuda sanitize edilir (XSS koruması).

### Backend Ortam Değişkenleri

- `server/.env` dosyası `npm start` ve `npm run dev` ile otomatik yüklenir.

- `AUTH_TOKEN_SECRET`: Üretimde güçlü bir gizli anahtar zorunlu.
- `AUTH_TOKEN_TTL_MS`: Token süresi (ms), varsayılan 7 gün.
- `CORS_ORIGINS`: İzin verilen origin listesi (virgülle ayrılmış).
- `DEFAULT_ADMIN_EMAIL`: İlk admin hesabı e-posta adresi.
- `DEFAULT_ADMIN_PASSWORD`: İlk admin hesabı şifresi (üretimde zorunlu).
- `ENABLE_DEMO_ENDPOINTS`: `true` ise demo/temizleme endpoint'leri aktif olur.

## Proje Büyüklüğü

**Toplam 129 Sayfa:**
- 79 ürün sayfası (9 kategoride)
- 20 eğitim ve kaynak sayfası (Kurslar, Etkinlikler, Öğretim materyalleri)
- 15 ana sayfa (Ana sayfa, Mağaza, Sepet, Ödeme, Giriş vb.)
- 10 kurumsal sayfa (Hakkımızda, Ödüller, Referanslar, İletişim)
- 5 hesap yönetimi sayfası (Profil, Siparişler, Ayarlar)

**Diğer:**
- 64 UI bileşeni
- 9 veritabanı tablosu
- 50+ API endpoint
- 3 Context provider

## Veritabanı

{{ ... }}
users → orders → order_items
      → course_registrations
blog_posts, press_releases, events, media_coverage, contacts

## Klasör Yapısı

```
├── src/
│   ├── components/    # UI bileşenleri
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
