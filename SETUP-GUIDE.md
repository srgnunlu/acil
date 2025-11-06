# 🚀 ACIL - Detaylı Kurulum Kılavuzu

Bu kılavuz, kodlama bilginiz olmasa bile projeyi adım adım kurmanıza yardımcı olacaktır.

## 📌 Hızlı Başlangıç Kontrol Listesi

- [ ] Supabase projesi oluşturuldu
- [ ] Veritabanı şeması çalıştırıldı
- [ ] API key'ler alındı
- [ ] .env.local dosyası yapılandırıldı
- [ ] Geliştirme sunucusu çalıştırıldı

---

## 1️⃣ Supabase Kurulumu (5 dakika)

### Adım 1: Hesap Oluşturun
1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın (veya e-posta ile kayıt olun)

### Adım 2: Yeni Proje Oluşturun
1. Dashboard'da "New Project" butonuna tıklayın
2. Şu bilgileri doldurun:
   - **Name**: acil-hasta-takip
   - **Database Password**: Güçlü bir şifre oluşturun (kaydedin!)
   - **Region**: En yakın bölgeyi seçin (örn: Europe - Frankfurt)
3. "Create new project" butonuna tıklayın
4. Proje hazırlanırken (~2 dakika) bekleyin

### Adım 3: API Bilgilerini Alın
1. Sol menüden ⚙️ **Settings** > **API** bölümüne gidin
2. Şu bilgileri kopyalayın:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` ile başlayan uzun anahtar

### Adım 4: Veritabanı Şemasını Çalıştırın
1. Sol menüden 🗄️ **SQL Editor** bölümüne gidin
2. "New Query" butonuna tıklayın
3. Proje klasöründeki `supabase-schema.sql` dosyasını açın
4. Tüm içeriği kopyalayın
5. SQL Editor'a yapıştırın
6. Sağ alttaki **Run** (▶️) butonuna tıklayın
7. "Success" mesajını gördüğünüzde tamamdır! ✅

---

## 2️⃣ OpenAI API Key (2 dakika)

### Adım 1: OpenAI Hesabı
1. [platform.openai.com](https://platform.openai.com) adresine gidin
2. Hesap oluşturun veya giriş yapın

### Adım 2: API Key Oluşturun
1. Sağ üstteki profil simgesine tıklayın
2. "View API Keys" seçeneğini seçin
3. "Create new secret key" butonuna tıklayın
4. İsim verin (örn: "ACIL Projesi")
5. Key'i kopyalayın ve **GÜVENLİ BİR YERE KAYDET** (bir daha göremezsiniz!)

### 💰 Ücretlendirme Notu
- OpenAI API kullanım başına ücretlidir
- Yeni hesaplara $5-18 ücretsiz kredi verilir
- GPT-4 kullanımı: ~$0.01-0.03 per hasta analizi
- Maliyetleri takip etmek için: [platform.openai.com/usage](https://platform.openai.com/usage)

---

## 3️⃣ Google Gemini API Key (2 dakika)

### Adım 1: Google AI Studio
1. [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın

### Adım 2: API Key Oluşturun
1. "Create API Key" butonuna tıklayın
2. Yeni proje oluşturun veya mevcut birini seçin
3. Key'i kopyalayın ve kaydedin

### 💰 Ücretlendirme Notu
- Gemini API şu anda ÜCRETSİZ kullanıma sunuluyor!
- Görsel analiz için idealdir (EKG, cilt lezyonları)
- Aylık limit: 60 sorgu/dakika

---

## 4️⃣ Ortam Değişkenlerini Ayarlama (2 dakika)

### Adım 1: .env.local Dosyasını Düzenleyin
1. Proje klasöründe `.env.local` dosyasını açın
2. Placeholder değerleri kendi değerlerinizle değiştirin:

```env
# 👇 Supabase'den aldığınız bilgiler
NEXT_PUBLIC_SUPABASE_URL=https://kujfksjkfsd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 👇 OpenAI API key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# 👇 Gemini API key
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx

# ✅ Bunlar değişmeden kalabilir
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FREE_PATIENT_LIMIT=3
```

3. Dosyayı kaydedin

---

## 5️⃣ Projeyi Çalıştırma (1 dakika)

### Terminal'i Açın
- **Windows**: Git Bash veya CMD
- **Mac/Linux**: Terminal

### Komutları Çalıştırın

```bash
# Proje klasörüne gidin
cd acil

# Bağımlılıkları yükleyin (sadece ilk kez)
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

### Tarayıcıda Açın
1. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın
2. Ana sayfayı görmelisiniz! 🎉

---

## 6️⃣ İlk Kullanım (Test)

### 1. Hesap Oluşturun
1. "Kayıt Ol" butonuna tıklayın
2. Bilgilerinizi doldurun
3. Kayıt olun

### 2. İlk Hastayı Ekleyin
1. Dashboard'a yönlendirileceksiniz
2. "+ Yeni Hasta Ekle" butonuna tıklayın
3. Hasta bilgilerini girin
4. Ekle

✅ **Tebrikler!** Proje çalışıyor!

---

## 🔧 Sık Karşılaşılan Sorunlar

### ❌ "Invalid Supabase URL" Hatası
**Çözüm**: `.env.local` dosyanızda Supabase URL'sinin doğru olduğunu kontrol edin. `https://` ile başlamalı.

### ❌ "API Key Not Found" Hatası
**Çözüm**:
1. `.env.local` dosyasının proje kök dizininde olduğundan emin olun
2. Dosyayı kaydettikten sonra sunucuyu yeniden başlatın (Ctrl+C, sonra `npm run dev`)

### ❌ "RLS Policy Violation" Hatası
**Çözüm**: Supabase SQL şemasının tamamen çalıştırıldığından emin olun. SQL Editor'da tekrar çalıştırmayı deneyin.

### ❌ Sayfa Yüklenmiyor
**Çözüm**:
1. Terminal'de hata mesajlarını kontrol edin
2. 3000 portu kullanımda olabilir, `npm run dev -- -p 3001` ile farklı port deneyin

### ❌ "Module not found" Hatası
**Çözüm**: `npm install` komutunu tekrar çalıştırın

---

## 🚀 Vercel'e Deploy (İsteğe Bağlı)

### Ön Hazırlık: GitHub'a Push
```bash
git add .
git commit -m "Initial setup"
git push origin claude/ai-medical-emergency-app-011CUrhtqeBKSJuvUqSNMfuP
```

### Vercel Deploy
1. [vercel.com](https://vercel.com) adresine gidin
2. GitHub hesabınızla giriş yapın
3. "New Project" > GitHub reponuzu seçin
4. **Environment Variables** bölümüne `.env.local` içeriğini ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (production URL olarak)
   - `NEXT_PUBLIC_FREE_PATIENT_LIMIT`
5. "Deploy" butonuna tıklayın
6. 2-3 dakika içinde siteniz yayında! 🎉

---

## 📞 Yardım İhtiyacınız mı Var?

Sorun yaşıyorsanız:
1. Terminal'deki hata mesajını kopyalayın
2. Tarayıcı Console'unu açın (F12) ve hataları kontrol edin
3. `.env.local` dosyanızı tekrar gözden geçirin
4. Supabase Dashboard'da tabloların oluştuğunu kontrol edin

---

## ✅ Kurulum Tamamlandı!

Artık projeniz hazır! Bir sonraki adımlar:
- Hasta ekleme ve yönetimi testi
- AI analiz özelliklerinin geliştirilmesi
- Hasta detay sayfasının oluşturulması

**İyi çalışmalar! 🚀**
