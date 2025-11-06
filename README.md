# ACIL - AI Destekli Hasta Takip Sistemi

Acil tıp uzmanları için yapay zeka destekli hasta yönetim ve takip platformu.

## 🚀 Özellikler

- ✅ **AI Destekli Analiz**: OpenAI GPT-4 ile hasta değerlendirme ve tanı önerileri
- ✅ **Görsel Analiz**: Google Gemini ile EKG, cilt lezyonları ve radyolojik görüntü analizi
- ✅ **Akıllı Takip**: Sıralı veri ekleme ve anlık AI güncellemeleri
- ✅ **Akademik Referanslar**: Tüm öneriler güvenilir kaynaklara dayalı
- ✅ **Hasta Bazlı Chat**: Her hasta için özel AI asistan
- ✅ **Freemium Model**: İlk 3 hasta takibi ücretsiz

## 📋 Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı (ücretsiz)
- OpenAI API key
- Google Gemini API key

## 🛠️ Kurulum

### 1. Proje Bağımlılıklarını Yükleyin

```bash
npm install
```

### 2. Supabase Projesi Oluşturun

1. [Supabase](https://supabase.com) hesabı açın (ücretsiz)
2. Yeni bir proje oluşturun
3. Project Settings > API bölümünden şu bilgileri alın:
   - `Project URL`
   - `anon public` key

### 3. Veritabanını Kurun

1. Supabase Dashboard'da **SQL Editor** bölümüne gidin
2. `supabase-schema.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'a yapıştırın ve **Run** butonuna tıklayın

### 4. Ortam Değişkenlerini Ayarlayın

`.env.local` dosyasını düzenleyin:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Gemini
GEMINI_API_KEY=your-gemini-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FREE_PATIENT_LIMIT=3
```

#### API Key'leri Nasıl Alınır?

**OpenAI API Key:**
1. [OpenAI Platform](https://platform.openai.com/api-keys) sayfasına gidin
2. "Create new secret key" butonuna tıklayın
3. Key'i kopyalayın ve `.env.local` dosyasına yapıştırın

**Google Gemini API Key:**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) sayfasına gidin
2. "Create API Key" butonuna tıklayın
3. Key'i kopyalayın ve `.env.local` dosyasına yapıştırın

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📦 Deployment (Vercel)

### 1. GitHub'a Push

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercel'e Deploy

1. [Vercel](https://vercel.com) hesabınıza giriş yapın
2. "New Project" butonuna tıklayın
3. GitHub reponuzu seçin
4. Environment Variables bölümüne `.env.local` içeriğini ekleyin
5. "Deploy" butonuna tıklayın

✅ Projeniz birkaç dakika içinde yayınlanacak!

## 🏗️ Proje Yapısı

```
acil/
├── app/
│   ├── (auth)/              # Authentication sayfaları
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/           # Dashboard sayfaları
│   │   ├── patients/        # Hasta yönetimi
│   │   ├── guidelines/      # Kılavuzlar
│   │   └── settings/        # Ayarlar
│   ├── api/                 # API routes
│   │   ├── patients/
│   │   └── ai/
│   └── page.tsx             # Ana sayfa
├── components/              # React bileşenleri
│   ├── ui/
│   ├── patients/
│   └── ai/
├── lib/                     # Yardımcı fonksiyonlar
│   ├── supabase/           # Supabase client
│   ├── ai/                 # AI wrapper'lar
│   │   ├── openai.ts
│   │   └── gemini.ts
│   └── utils/
├── types/                   # TypeScript tipleri
└── supabase-schema.sql     # Veritabanı şeması
```

## 🎯 Geliştirme Fazları

### ✅ Faz 1: Temel Altyapı (Tamamlandı)
- [x] Next.js projesi kurulumu
- [x] Supabase entegrasyonu
- [x] Authentication sistemi
- [x] Basit hasta listesi
- [x] Temel UI

### 🔄 Faz 2: AI Entegrasyonu (Sonraki Adım)
- [ ] Hasta veri modeli genişletme
- [ ] AI analiz API endpoint'leri
- [ ] Hasta detay sayfası
- [ ] Veri ekleme formları
- [ ] AI sonuç gösterimi

### 📅 Faz 3: Gelişmiş Özellikler
- [ ] Görsel analiz (Gemini)
- [ ] Chat sistemi
- [ ] Tetkik karşılaştırma
- [ ] Hasta durumu yönetimi

### 💳 Faz 4: İş Mantığı
- [ ] Bildirim sistemi
- [ ] Kılavuz kütüphanesi
- [ ] Raporlama

### 🚀 Faz 5: Prodüksiyon
- [ ] Stripe entegrasyonu
- [ ] Performance optimizasyonu
- [ ] Güvenlik testleri

## 🔧 Geliştirme Komutları

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Production sunucusu
npm start

# Lint kontrolü
npm run lint
```

## 📝 Notlar

- Bu sistem bir **klinik karar destek aracıdır**
- Nihai klinik kararlar **hekim sorumluluğundadır**
- Hasta gizliliği ve KVKK uyumluluğuna dikkat edin
- API kullanım maliyetlerini takip edin

## 🆘 Yardım

Sorun mu yaşıyorsunuz?

1. `.env.local` dosyanızın doğru yapılandırıldığından emin olun
2. Supabase veritabanı şemasının çalıştırıldığını kontrol edin
3. API key'lerinizin geçerli olduğunu doğrulayın
4. Konsol hatalarını kontrol edin

## 📄 Lisans

Bu proje eğitim ve araştırma amaçlıdır.

---

**Geliştirici:** ACIL Takımı
**Versiyon:** 1.0.0
**Son Güncelleme:** 2024
