const { sequelize, User, Room, Bed, Patient, Task, Notification } = require('../server/models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Veritabanı seeding başlatılıyor...');

    // Force sync database (development only)
    await sequelize.sync({ force: true });
    console.log('✅ Veritabanı tabloları sıfırlandı');

    // Create Users
    const users = await User.bulkCreate([
      {
        username: 'admin',
        email: 'admin@acilservis.com',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        department: 'Yönetim',
        phone: '+905551234567'
      },
      {
        username: 'drAhmet',
        email: 'ahmet.doktor@acilservis.com',
        password: 'doktor123',
        first_name: 'Ahmet',
        last_name: 'Kaya',
        role: 'doctor',
        department: 'Acil Tıp',
        phone: '+905551234568'
      },
      {
        username: 'drMehmet',
        email: 'mehmet.doktor@acilservis.com',
        password: 'doktor123',
        first_name: 'Mehmet',
        last_name: 'Yılmaz',
        role: 'doctor',
        department: 'Acil Tıp',
        phone: '+905551234569'
      },
      {
        username: 'hemAyse',
        email: 'ayse.hemsire@acilservis.com',
        password: 'hemsire123',
        first_name: 'Ayşe',
        last_name: 'Demir',
        role: 'nurse',
        department: 'Acil Servis',
        phone: '+905551234570'
      },
      {
        username: 'hemFatma',
        email: 'fatma.hemsire@acilservis.com',
        password: 'hemsire123',
        first_name: 'Fatma',
        last_name: 'Çelik',
        role: 'nurse',
        department: 'Acil Servis',
        phone: '+905551234571'
      }
    ]);

    console.log('✅ Kullanıcılar oluşturuldu');

    // Create Rooms
    const rooms = await Room.bulkCreate([
      {
        name: 'Monitör',
        type: 'monitor',
        capacity: 13,
        floor: 1,
        description: 'Ana monitör odası - yoğun bakım hastaları',
        priority_order: 1
      },
      {
        name: 'İzole-1',
        type: 'izole',
        capacity: 2,
        floor: 1,
        description: 'İzolasyon odası - bulaşıcı hastalıklar',
        priority_order: 2
      },
      {
        name: 'KBB',
        type: 'kbb',
        capacity: 2,
        floor: 1,
        description: 'Kulak Burun Boğaz odası',
        priority_order: 3
      },
      {
        name: 'Kritik Bakım',
        type: 'kritik_bakim',
        capacity: 5,
        floor: 1,
        description: 'Kritik bakım ünitesi',
        priority_order: 4
      },
      {
        name: 'Travma',
        type: 'travma',
        capacity: 8,
        floor: 1,
        description: 'Travma odası - acil müdahale',
        priority_order: 5
      },
      {
        name: 'İşlem',
        type: 'islem',
        capacity: 4,
        floor: 1,
        description: 'Küçük işlemler odası',
        priority_order: 6
      },
      {
        name: 'Bakı Göz',
        type: 'baki_goz',
        capacity: 2,
        floor: 1,
        description: 'Göz muayene odası',
        priority_order: 7
      },
      {
        name: 'Jineko',
        type: 'jineko',
        capacity: 2,
        floor: 1,
        description: 'Jinekoloji odası',
        priority_order: 8
      }
    ]);

    console.log('✅ Odalar oluşturuldu');

    // Create Beds
    const bedPromises = [];
    
    for (const room of rooms) {
      for (let i = 1; i <= room.capacity; i++) {
        bedPromises.push({
          bed_number: i,
          room_id: room.id,
          bed_type: room.type === 'monitor' ? 'monitor' : 
                   room.type === 'kritik_bakim' ? 'intensive' :
                   room.type === 'izole' ? 'isolation' : 'standard',
          status: Math.random() > 0.7 ? 'occupied' : 'available',
          is_available: Math.random() > 0.7 ? false : true
        });
      }
    }

    const beds = await Bed.bulkCreate(bedPromises);
    console.log('✅ Yataklar oluşturuldu');

    // Create Patients
    const queueStart = 20240101001;
    const patients = await Patient.bulkCreate([
      {
        queue_number: queueStart + 1,
        first_name: 'Ali',
        last_name: 'Veli',
        tc_number: '12345678901',
        birth_date: '1980-05-15',
        gender: 'male',
        phone: '+905551111111',
        complaint: 'Göğüs ağrısı, nefes darlığı',
        triage_level: '2',
        assigned_doctor_id: users[1].id,
        bed_id: beds.find(b => b.status === 'occupied')?.id,
        status: 'in_treatment',
        vital_signs: {
          blood_pressure: '140/90',
          pulse: 95,
          temperature: 37.2,
          oxygen_saturation: 96
        }
      },
      {
        queue_number: queueStart + 2,
        first_name: 'Ayşe',
        last_name: 'Yılmaz',
        tc_number: '12345678902',
        birth_date: '1995-03-22',
        gender: 'female',
        phone: '+905552222222',
        complaint: 'Karın ağrısı, bulantı',
        triage_level: '3',
        assigned_doctor_id: users[2].id,
        status: 'waiting',
        vital_signs: {
          blood_pressure: '120/80',
          pulse: 88,
          temperature: 36.8,
          oxygen_saturation: 98
        }
      },
      {
        queue_number: queueStart + 3,
        first_name: 'Mehmet',
        last_name: 'Kara',
        tc_number: '12345678903',
        birth_date: '1970-11-08',
        gender: 'male',
        phone: '+905553333333',
        complaint: 'Trafik kazası, kafa travması',
        triage_level: '1',
        assigned_doctor_id: users[1].id,
        bed_id: beds.find(b => b.status === 'occupied' && b.bed_type === 'intensive')?.id,
        status: 'in_treatment',
        vital_signs: {
          blood_pressure: '160/100',
          pulse: 110,
          temperature: 38.5,
          oxygen_saturation: 92
        }
      },
      {
        queue_number: queueStart + 4,
        first_name: 'Fatma',
        last_name: 'Öz',
        tc_number: '12345678904',
        birth_date: '1985-07-12',
        gender: 'female',
        phone: '+905554444444',
        complaint: 'Düşük riski, vajinal kanama',
        triage_level: '2',
        assigned_doctor_id: users[2].id,
        status: 'waiting_results',
        vital_signs: {
          blood_pressure: '110/70',
          pulse: 92,
          temperature: 36.9,
          oxygen_saturation: 97
        }
      },
      {
        queue_number: queueStart + 5,
        first_name: 'Hasan',
        last_name: 'Duman',
        tc_number: '12345678905',
        birth_date: '1990-12-03',
        gender: 'male',
        phone: '+905555555555',
        complaint: 'El kesisi, dikişli',
        triage_level: '4',
        assigned_doctor_id: users[1].id,
        status: 'ready_discharge',
        vital_signs: {
          blood_pressure: '125/85',
          pulse: 78,
          temperature: 36.5,
          oxygen_saturation: 99
        }
      }
    ]);

    console.log('✅ Hastalar oluşturuldu');

    // Create Tasks
    const tasks = await Task.bulkCreate([
      {
        title: 'EKG çekimi',
        description: 'Ali Veli hastası için acil EKG çekimi yapılması',
        type: 'examination',
        priority: 'high',
        patient_id: patients[0].id,
        assigned_user_id: users[3].id,
        created_by_id: users[1].id,
        due_date: new Date(Date.now() + 30 * 60 * 1000), // 30 dakika sonra
        reminder_time: new Date(Date.now() + 15 * 60 * 1000) // 15 dakika sonra
      },
      {
        title: 'Kan tahlili',
        description: 'Ayşe Yılmaz hastası için tam kan sayımı',
        type: 'lab_test',
        priority: 'medium',
        patient_id: patients[1].id,
        assigned_user_id: users[4].id,
        created_by_id: users[2].id,
        due_date: new Date(Date.now() + 60 * 60 * 1000), // 1 saat sonra
        reminder_time: new Date(Date.now() + 45 * 60 * 1000) // 45 dakika sonra
      },
      {
        title: 'BT çekimi',
        description: 'Mehmet Kara hastası için acil beyin BT',
        type: 'imaging',
        priority: 'urgent',
        patient_id: patients[2].id,
        assigned_user_id: users[3].id,
        created_by_id: users[1].id,
        due_date: new Date(Date.now() + 15 * 60 * 1000), // 15 dakika sonra
        reminder_time: new Date(Date.now() + 5 * 60 * 1000) // 5 dakika sonra
      },
      {
        title: 'Jinekoloji konsültasyonu',
        description: 'Fatma Öz hastası için jinekoloji konsültasyonu',
        type: 'consultation',
        priority: 'high',
        patient_id: patients[3].id,
        assigned_user_id: users[2].id,
        created_by_id: users[1].id,
        due_date: new Date(Date.now() + 45 * 60 * 1000), // 45 dakika sonra
        reminder_time: new Date(Date.now() + 30 * 60 * 1000) // 30 dakika sonra
      },
      {
        title: 'Taburcu işlemleri',
        description: 'Hasan Duman hastası taburcu işlemleri',
        type: 'discharge',
        priority: 'low',
        patient_id: patients[4].id,
        assigned_user_id: users[4].id,
        created_by_id: users[1].id,
        due_date: new Date(Date.now() + 90 * 60 * 1000), // 1.5 saat sonra
      }
    ]);

    console.log('✅ Görevler oluşturuldu');

    // Create Notifications
    const notifications = await Notification.bulkCreate([
      {
        user_id: users[3].id,
        task_id: tasks[0].id,
        type: 'task_reminder',
        title: 'EKG görevi hatırlatıcısı',
        message: 'Ali Veli hastası için EKG çekimi zamanı geldi',
        priority: 'high'
      },
      {
        user_id: users[3].id,
        task_id: tasks[2].id,
        type: 'task_overdue',
        title: 'Acil BT çekimi',
        message: 'Mehmet Kara hastası için acil beyin BT çekimi gerekli',
        priority: 'urgent'
      },
      {
        user_id: users[1].id,
        type: 'patient_status_change',
        title: 'Hasta durumu değişti',
        message: 'Ayşe Yılmaz hastasının durumu güncellendi',
        priority: 'medium'
      },
      {
        user_id: users[2].id,
        type: 'bed_assignment',
        title: 'Yatak ataması',
        message: 'Monitör-5 yatağı müsait hale geldi',
        priority: 'low'
      },
      {
        user_id: users[0].id,
        type: 'system_alert',
        title: 'Sistem bildirimi',
        message: 'Günlük hasta raporu hazır',
        priority: 'low'
      }
    ]);

    console.log('✅ Bildirimler oluşturuldu');

    console.log(`
🎉 Veritabanı seeding tamamlandı!

👥 Oluşturulan kullanıcılar:
  - admin / admin123 (Admin)
  - drAhmet / doktor123 (Doktor)
  - drMehmet / doktor123 (Doktor)
  - hemAyse / hemsire123 (Hemşire)
  - hemFatma / hemsire123 (Hemşire)

🏥 Oda sayısı: ${rooms.length}
🛏️ Yatak sayısı: ${beds.length}
👤 Hasta sayısı: ${patients.length}
📋 Görev sayısı: ${tasks.length}
🔔 Bildirim sayısı: ${notifications.length}

✨ Sistem test edilmeye hazır!
    `);

  } catch (error) {
    console.error('❌ Seeding hatası:', error);
    throw error;
  }
};

// Script olarak çalıştırılırsa
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding başarıyla tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding başarısız:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;