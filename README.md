# Acil Servis Hasta Yönetim Sistemi

Modern web teknolojileri kullanarak geliştirilmiş kapsamlı Acil Servis Hasta Yönetim Sistemi. Sağlık profesyonellerinin hasta takibi, yatak yönetimi ve görev koordinasyonunu kolaylaştırmak amacıyla tasarlanmıştır.

## ✨ Temel Özellikler

### 🏥 Yatak/Oda Yönetimi
- **İzole**: Yatak 1-2
- **KBB**: Yatak 1-2  
- **Kritik Bakım**: Yatak 1-5
- **Travma**: Yatak 1-8
- **İşlem**: Yatak 1-4
- **Bakı Göz**: Yatak 1-2
- **Jineko**: Yatak 1-2
- **Monitör**: Yatak 1-13 (ana arayüzde öncelikli yerleştirme)

### 👥 Hasta Yönetimi
- Hasta sıra numarası otomatik atama
- Triaj seviyesi takibi (1-5 arası öncelik)
- Yatak atama ve takibi
- Hasta durumu gerçek zamanlı güncelleme
- Detaylı hasta bilgileri ve tıbbi geçmiş
- Vital bulgular takibi

### 📋 Görev Yönetimi
- Zamanlanmış görev kontrol listesi
- Görev öncelik seviyesi (Düşük, Orta, Yüksek, Acil)
- Kullanıcıya özel görev atamaları
- Otomatik hatırlatıcılar
- Görev tamamlama takibi

### 🔔 Bildirim Sistemi
- Gerçek zamanlı pop-up bildirimleri
- Bekleyen görevler için kronolojik bildirim paneli
- Acil durum uyarıları
- Kullanıcı başına kapatılabilir bildirimler
- Email ve SMS entegrasyonu

### 👤 Kullanıcı Yönetimi
- Rol tabanlı erişim kontrolü (Admin, Doktor, Hemşire, Personel)
- JWT token bazlı kimlik doğrulama
- Kullanıcı profil yönetimi
- Oturum yönetimi

### 📊 Admin Panel
- Kullanıcı yönetimi
- Sistem konfigürasyonu
- Hasta verisi denetimi
- Bildirim yönetimi
- Gerçek zamanlı sistem izleme

### 🔄 Gerçek Zamanlı Özellikler
- Socket.IO ile anlık veri senkronizasyonu
- Çoklu kullanıcı desteği
- Gerçek zamanlı bildirimler
- Canlı hasta durumu güncellemeleri

## 🛠 Teknoloji Stack'i

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Veritabanı
- **Sequelize** - ORM
- **Socket.IO** - Gerçek zamanlı iletişim
- **JWT** - Kimlik doğrulama
- **bcryptjs** - Şifreleme
- **Joi** - Veri validasyonu

### Frontend
- **React.js** - UI framework
- **React Router** - Sayfa yönlendirme
- **React Query** - Veri yönetimi
- **Socket.IO Client** - Gerçek zamanlı iletişim
- **Tailwind CSS** - Styling framework
- **Lucide React** - İkonlar
- **React Hook Form** - Form yönetimi
- **React Hot Toast** - Bildirimler

### DevOps & Tools
- **Git** - Versiyon kontrolü
- **npm** - Paket yöneticisi
- **Concurrently** - Paralel script çalıştırma

## 🚀 Kurulum

### Gereksinimler
- Node.js (v16.0.0 veya üstü)
- PostgreSQL (v12.0.0 veya üstü)
- npm veya yarn

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/your-username/acil-servis-hasta-yonetim-sistemi.git
cd acil-servis-hasta-yonetim-sistemi
```

### 2. Bağımlılıkları Yükleyin
```bash
npm run install-all
```

### 3. Veritabanı Kurulumu
```bash
# PostgreSQL'de veritabanı oluşturun
createdb acil_servis_db

# Veritabanı bilgilerini yapılandırın
cp server/.env.example server/.env
# .env dosyasını düzenleyin
```

### 4. Environment Variables
`server/.env` dosyasını düzenleyin:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=acil_servis_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=24h

# Socket.io Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000
```

### 5. Uygulamayı Başlatın
```bash
# Development modunda (hem backend hem frontend)
npm run dev

# Veya ayrı ayrı
npm run server  # Backend (Port: 5000)
npm run client  # Frontend (Port: 3000)
```

### 6. İlk Kullanıcı Oluşturma
```bash
# Admin kullanıcısı oluşturmak için API endpoint'ini kullanın
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@acilservis.com",
    "password": "admin123",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }'
```

## 📚 API Dokümantasyonu

### Authentication Endpoints
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Kullanıcı kayıt
- `GET /api/auth/me` - Mevcut kullanıcı bilgileri
- `PUT /api/auth/profile` - Profil güncelleme
- `POST /api/auth/logout` - Çıkış

### Patient Endpoints
- `GET /api/patients` - Tüm hastalar
- `GET /api/patients/active` - Aktif hastalar
- `POST /api/patients` - Yeni hasta
- `GET /api/patients/:id` - Hasta detayı
- `PUT /api/patients/:id` - Hasta güncelleme
- `PUT /api/patients/:id/assign-bed` - Yatak atama
- `PUT /api/patients/:id/discharge` - Hasta taburcu

### Bed Endpoints
- `GET /api/beds` - Tüm yataklar
- `GET /api/beds/available` - Müsait yataklar
- `GET /api/beds/room/:roomId` - Oda bazlı yataklar
- `PUT /api/beds/:id/status` - Yatak durumu güncelleme

### Task Endpoints
- `GET /api/tasks` - Tüm görevler
- `POST /api/tasks` - Yeni görev
- `PUT /api/tasks/:id/complete` - Görev tamamlama

### Notification Endpoints
- `GET /api/notifications` - Kullanıcı bildirimleri
- `GET /api/notifications/unread` - Okunmamış bildirimler
- `PUT /api/notifications/:id/read` - Bildirim okundu işaretle
- `PUT /api/notifications/mark-all-read` - Tümünü okundu işaretle

## 🔐 Güvenlik

- JWT token bazlı kimlik doğrulama
- Bcrypt ile şifre hashleme
- Helmet.js ile güvenlik başlıkları
- Rate limiting ile DDoS koruması
- CORS konfigürasyonu
- Input validasyonu (Joi)
- SQL injection koruması (Sequelize ORM)

## 📱 Responsive Tasarım

- Mobile-first yaklaşım
- Tablet ve masaüstü optimizasyonu
- Touch-friendly arayüz
- Accessibility (WCAG 2.1) uyumlu

## 🧪 Test

```bash
# Backend testleri
cd server && npm test

# Frontend testleri
cd client && npm test

# E2E testleri
npm run test:e2e
```

## 📦 Deployment

### Production Build
```bash
npm run build
```

### Docker (Opsiyonel)
```bash
docker-compose up -d
```

### Environment Variables (Production)
```env
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret
DB_URL=your_production_database_url
```

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'i push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.

## 📞 İletişim

- **Proje Sahibi**: Acil Servis Hasta Yönetim Ekibi
- **Email**: info@acilservis.com
- **GitHub**: [https://github.com/your-username/acil-servis-hasta-yonetim-sistemi](https://github.com/your-username/acil-servis-hasta-yonetim-sistemi)

## 🙏 Teşekkürler

Bu projeyi mümkün kılan tüm açık kaynak topluluğuna ve katkıda bulunan geliştiricilere teşekkürler.

---

**Not**: Bu sistem sağlık verilerini işlediği için KVKK ve HIPAA uyumluluğu konusunda gerekli önlemlerin alınması gerekmektedir. Production ortamında kullanım öncesi güvenlik denetiminden geçirilmesi önerilir.