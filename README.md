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

## 🛠️ Adım Adım Kurulum ve Çalıştırma Rehberi

Bu rehber, projeyi sıfırdan çalıştırmanız için gereken tüm adımları içerir.

### 📋 Ön Hazırlık Kontrol Listesi

- [ ] Node.js 18+ yüklü mü? (`node --version` ile kontrol edin)
- [ ] npm yüklü mü? (`npm --version` ile kontrol edin)
- [ ] Terminal/Command Prompt açık mı?

---

### 🔵 ADIM 1: Proje Bağımlılıklarını Yükleyin (2-3 dakika)

Terminal'de proje klasörüne gidin ve bağımlılıkları yükleyin:

```bash
# Proje klasörüne gidin (zaten içindeyseniz bu adımı atlayın)
cd /Users/sergenunlu/Desktop/kodlar/acil/acil

# Bağımlılıkları yükleyin (ilk kez çalıştırıyorsanız)
npm install
```

**Beklenen çıktı:** `added XXX packages` mesajı görmelisiniz.

---

### 🔵 ADIM 2: Supabase Projesi Oluşturun (5 dakika)

#### 2.1. Supabase Hesabı Oluşturun

1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın (veya e-posta ile kayıt olun)

#### 2.2. Yeni Proje Oluşturun

1. Dashboard'da **"New Project"** butonuna tıklayın
2. Şu bilgileri doldurun:
   - **Name**: `acil-hasta-takip` (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre oluşturun ve **KAYDEDİN!**
   - **Region**: En yakın bölgeyi seçin (örn: `Europe - Frankfurt`)
3. **"Create new project"** butonuna tıklayın
4. Proje hazırlanırken bekleyin (~2 dakika)

#### 2.3. API Bilgilerini Alın

1. Sol menüden ⚙️ **Settings** > **API** bölümüne gidin
2. Şu bilgileri kopyalayın ve bir yere kaydedin:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co` (kopyalayın)
   - **anon public key**: `eyJhbGc...` ile başlayan uzun anahtar (kopyalayın)

---

### 🔵 ADIM 3: Veritabanı Şemasını Kurun (2 dakika)

1. Supabase Dashboard'da sol menüden 🗄️ **SQL Editor** bölümüne gidin
2. **"New Query"** butonuna tıklayın
3. Proje klasöründeki `supabase-schema.sql` dosyasını açın (metin editöründe)
4. **Tüm içeriği** kopyalayın (Ctrl+A, Ctrl+C veya Cmd+A, Cmd+C)
5. SQL Editor'a yapıştırın (Ctrl+V veya Cmd+V)
6. Sağ alttaki **▶️ Run** butonuna tıklayın
7. **"Success. No rows returned"** veya benzer bir başarı mesajı görmelisiniz ✅

**Kontrol:** Sol menüden **Table Editor** > **patients** tablosunu görebiliyorsanız başarılı!

---

### 🔵 ADIM 4: OpenAI API Key Alın (2 dakika)

1. [platform.openai.com](https://platform.openai.com) adresine gidin
2. Hesap oluşturun veya giriş yapın
3. Sağ üstteki profil simgesine tıklayın
4. **"View API Keys"** seçeneğini seçin
5. **"Create new secret key"** butonuna tıklayın
6. İsim verin (örn: "ACIL Projesi")
7. Key'i kopyalayın ve **GÜVENLİ BİR YERE KAYDEDİN** (bir daha göremezsiniz!)
   - Key `sk-` ile başlamalı

**💰 Not:** Yeni hesaplara $5-18 ücretsiz kredi verilir. GPT-4 kullanımı ~$0.01-0.03 per analiz.

---

### 🔵 ADIM 5: Google Gemini API Key Alın (2 dakika)

1. [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın
3. **"Create API Key"** butonuna tıklayın
4. Yeni proje oluşturun veya mevcut birini seçin
5. Key'i kopyalayın ve kaydedin

**💰 Not:** Gemini API şu anda **ÜCRETSİZ** kullanıma sunuluyor!

---

### 🔵 ADIM 6: .env.local Dosyası Oluşturun (2 dakika)

Proje klasöründe `.env.local` adında yeni bir dosya oluşturun:

**Mac/Linux Terminal:**

```bash
cd /Users/sergenunlu/Desktop/kodlar/acil/acil
touch .env.local
```

**Windows (PowerShell):**

```powershell
cd C:\path\to\acil
New-Item .env.local
```

**Veya manuel olarak:**

- Proje klasöründe sağ tık > Yeni Dosya > `.env.local` adını verin

#### .env.local Dosyası İçeriği:

Dosyayı açın ve şu içeriği yapıştırın, **kendi değerlerinizle** değiştirin:

```env
# ============================================
# SUPABASE AYARLARI (ADIM 2'den aldığınız)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# OPENAI API KEY (ADIM 4'ten aldığınız)
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key-here

# ============================================
# GOOGLE GEMINI API KEY (ADIM 5'ten aldığınız)
# ============================================
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx

# ============================================
# UYGULAMA AYARLARI (Bunlar değişmeden kalabilir)
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FREE_PATIENT_LIMIT=3
```

**Örnek dolu dosya:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FREE_PATIENT_LIMIT=3
```

**⚠️ ÖNEMLİ:** Dosyayı kaydedin! (Ctrl+S veya Cmd+S)

---

### 🔵 ADIM 7: Projeyi Çalıştırın (1 dakika)

Terminal'de şu komutu çalıştırın:

```bash
npm run dev
```

**Beklenen çıktı:**

```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
- Ready in 2.3s
```

✅ **Başarılı!** Artık proje çalışıyor!

---

### 🔵 ADIM 8: Tarayıcıda Açın

1. Tarayıcınızı açın (Chrome, Firefox, Safari, Edge)
2. Adres çubuğuna şunu yazın: `http://localhost:3000`
3. Enter'a basın

**Görmelisiniz:**

- ACIL ana sayfası
- "Giriş Yap" ve "Kayıt Ol" butonları

---

### 🔵 ADIM 9: İlk Kullanım (Test)

#### 9.1. Hesap Oluşturun

1. **"Kayıt Ol"** butonuna tıklayın
2. E-posta ve şifre girin
3. **"Kayıt Ol"** butonuna tıklayın
4. Dashboard'a yönlendirileceksiniz

#### 9.2. İlk Hastayı Ekleyin

1. Dashboard'da **"+ Yeni Hasta Ekle"** butonuna tıklayın
2. Hasta bilgilerini girin:
   - Ad: Test Hasta
   - Yaş: 45
   - Cinsiyet: Erkek
3. **"Ekle"** butonuna tıklayın

✅ **Tebrikler!** Proje başarıyla çalışıyor! 🎉

---

## 🆘 Sık Karşılaşılan Sorunlar ve Çözümleri

### ❌ "Invalid Supabase URL" Hatası

**Çözüm:**

- `.env.local` dosyasında Supabase URL'sinin `https://` ile başladığından emin olun
- URL'nin sonunda `/` olmamalı
- Dosyayı kaydettikten sonra sunucuyu yeniden başlatın (Ctrl+C, sonra `npm run dev`)

### ❌ "API Key Not Found" veya "Environment variable validation failed"

**Çözüm:**

1. `.env.local` dosyasının proje **kök dizininde** olduğundan emin olun
2. Dosya adının tam olarak `.env.local` olduğunu kontrol edin (`.env.local.txt` değil!)
3. Dosyayı kaydettikten sonra sunucuyu **yeniden başlatın**:
   ```bash
   # Terminal'de Ctrl+C ile durdurun
   # Sonra tekrar başlatın:
   npm run dev
   ```

### ❌ "RLS Policy Violation" veya "permission denied"

**Çözüm:**

- Supabase SQL şemasının tamamen çalıştırıldığından emin olun
- SQL Editor'da `supabase-schema.sql` dosyasını tekrar çalıştırın
- Supabase Dashboard > Table Editor'da tabloların oluştuğunu kontrol edin

### ❌ Port 3000 zaten kullanımda

**Çözüm:**

```bash
# Farklı bir port kullanın:
npm run dev -- -p 3001
# Sonra tarayıcıda http://localhost:3001 açın
```

### ❌ "Module not found" veya "Cannot find module"

**Çözüm:**

```bash
# Bağımlılıkları tekrar yükleyin:
rm -rf node_modules package-lock.json
npm install
```

### ❌ Sayfa yüklenmiyor veya beyaz ekran

**Çözüm:**

1. Terminal'deki hata mesajlarını kontrol edin
2. Tarayıcı Console'unu açın (F12) ve hataları kontrol edin
3. `.env.local` dosyanızı tekrar gözden geçirin
4. Sunucuyu yeniden başlatın

---

## ✅ Kurulum Kontrol Listesi

Kurulumun başarılı olduğunu kontrol edin:

- [ ] `npm install` hatasız tamamlandı
- [ ] Supabase projesi oluşturuldu ve API bilgileri alındı
- [ ] `supabase-schema.sql` başarıyla çalıştırıldı
- [ ] OpenAI API key alındı (`sk-` ile başlıyor)
- [ ] Gemini API key alındı
- [ ] `.env.local` dosyası oluşturuldu ve tüm değerler dolduruldu
- [ ] `npm run dev` hatasız çalışıyor
- [ ] `http://localhost:3000` açılıyor
- [ ] Kayıt ol ve giriş yap çalışıyor
- [ ] Hasta ekleme çalışıyor

**Tüm kutular işaretliyse, kurulum başarılı! 🎉**

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
