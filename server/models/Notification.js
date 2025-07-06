const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    task_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'task_reminder',
        'task_overdue',
        'task_assigned',
        'task_completed',
        'patient_status_change',
        'bed_assignment',
        'system_alert',
        'emergency_alert',
        'maintenance_alert',
        'general_info'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('unread', 'read', 'dismissed'),
      defaultValue: 'unread'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_dismissed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    dismissed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    action_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    delivery_methods: {
      type: DataTypes.JSONB,
      defaultValue: ['web'],
      comment: 'Array of delivery methods: web, email, sms, push'
    },
    delivery_status: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Status of each delivery method'
    }
  }, {
    tableName: 'notifications',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['task_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['is_dismissed']
      },
      {
        fields: ['sent_at']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  // Instance methods
  Notification.prototype.markAsRead = function() {
    this.is_read = true;
    this.status = 'read';
    this.read_at = new Date();
    return this.save();
  };

  Notification.prototype.dismiss = function() {
    this.is_dismissed = true;
    this.status = 'dismissed';
    this.dismissed_at = new Date();
    return this.save();
  };

  Notification.prototype.isExpired = function() {
    if (!this.expires_at) return false;
    return new Date() > new Date(this.expires_at);
  };

  Notification.prototype.shouldShow = function() {
    if (this.is_dismissed) return false;
    if (this.isExpired()) return false;
    return true;
  };

  Notification.prototype.getPriorityWeight = function() {
    const weights = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'urgent': 4
    };
    return weights[this.priority] || 1;
  };

  Notification.prototype.getTimeAgo = function() {
    const now = new Date();
    const sentAt = new Date(this.sent_at);
    const diffInMinutes = Math.floor((now - sentAt) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} gün önce`;
    
    return sentAt.toLocaleDateString('tr-TR');
  };

  Notification.prototype.getIcon = function() {
    const icons = {
      'task_reminder': 'clock',
      'task_overdue': 'alert-triangle',
      'task_assigned': 'user-plus',
      'task_completed': 'check-circle',
      'patient_status_change': 'activity',
      'bed_assignment': 'bed',
      'system_alert': 'alert-circle',
      'emergency_alert': 'alert-octagon',
      'maintenance_alert': 'tool',
      'general_info': 'info'
    };
    return icons[this.type] || 'bell';
  };

  Notification.prototype.getColor = function() {
    const priorityColors = {
      'low': '#6B7280',
      'medium': '#3B82F6',
      'high': '#F59E0B',
      'urgent': '#EF4444'
    };
    return priorityColors[this.priority] || '#6B7280';
  };

  // Class methods
  Notification.findUnread = function(userId) {
    return this.findAll({
      where: { 
        user_id: userId,
        is_read: false,
        is_dismissed: false
      },
      order: [['priority', 'DESC'], ['sent_at', 'DESC']]
    });
  };

  Notification.findByUser = function(userId, limit = 50) {
    return this.findAll({
      where: { user_id: userId },
      order: [['sent_at', 'DESC']],
      limit: limit
    });
  };

  Notification.findByType = function(type, userId = null) {
    const where = { type };
    if (userId) where.user_id = userId;
    
    return this.findAll({
      where,
      order: [['sent_at', 'DESC']]
    });
  };

  Notification.findByPriority = function(priority, userId = null) {
    const where = { priority };
    if (userId) where.user_id = userId;
    
    return this.findAll({
      where,
      order: [['sent_at', 'DESC']]
    });
  };

  Notification.findActive = function(userId) {
    return this.findAll({
      where: { 
        user_id: userId,
        is_dismissed: false,
        [sequelize.Sequelize.Op.or]: [
          { expires_at: null },
          { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
        ]
      },
      order: [['priority', 'DESC'], ['sent_at', 'DESC']]
    });
  };

  Notification.findExpired = function() {
    return this.findAll({
      where: {
        expires_at: {
          [sequelize.Sequelize.Op.lt]: new Date()
        },
        is_dismissed: false
      }
    });
  };

  Notification.countUnread = function(userId) {
    return this.count({
      where: { 
        user_id: userId,
        is_read: false,
        is_dismissed: false
      }
    });
  };

  Notification.markAllAsRead = function(userId) {
    return this.update(
      { 
        is_read: true,
        status: 'read',
        read_at: new Date()
      },
      {
        where: { 
          user_id: userId,
          is_read: false
        }
      }
    );
  };

  Notification.dismissAll = function(userId) {
    return this.update(
      { 
        is_dismissed: true,
        status: 'dismissed',
        dismissed_at: new Date()
      },
      {
        where: { 
          user_id: userId,
          is_dismissed: false
        }
      }
    );
  };

  Notification.cleanupExpired = function() {
    return this.destroy({
      where: {
        expires_at: {
          [sequelize.Sequelize.Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      }
    });
  };

  Notification.createTaskReminder = function(userId, taskId, title, message, reminderTime = null) {
    return this.create({
      user_id: userId,
      task_id: taskId,
      type: 'task_reminder',
      title: title,
      message: message,
      priority: 'medium',
      expires_at: reminderTime ? new Date(reminderTime.getTime() + 2 * 60 * 60 * 1000) : null // 2 hours after reminder
    });
  };

  Notification.createTaskOverdue = function(userId, taskId, title, message) {
    return this.create({
      user_id: userId,
      task_id: taskId,
      type: 'task_overdue',
      title: title,
      message: message,
      priority: 'high'
    });
  };

  Notification.createEmergencyAlert = function(userId, title, message, actionUrl = null) {
    return this.create({
      user_id: userId,
      type: 'emergency_alert',
      title: title,
      message: message,
      priority: 'urgent',
      action_url: actionUrl
    });
  };

  Notification.getTypeDisplayName = function(type) {
    const typeNames = {
      'task_reminder': 'Görev Hatırlatıcısı',
      'task_overdue': 'Geciken Görev',
      'task_assigned': 'Görev Atandı',
      'task_completed': 'Görev Tamamlandı',
      'patient_status_change': 'Hasta Durumu Değişti',
      'bed_assignment': 'Yatak Atama',
      'system_alert': 'Sistem Uyarısı',
      'emergency_alert': 'Acil Durum',
      'maintenance_alert': 'Bakım Uyarısı',
      'general_info': 'Genel Bilgi'
    };
    return typeNames[type] || type;
  };

  Notification.getPriorityDisplayName = function(priority) {
    const priorityNames = {
      'low': 'Düşük',
      'medium': 'Orta',
      'high': 'Yüksek',
      'urgent': 'Acil'
    };
    return priorityNames[priority] || priority;
  };

  return Notification;
};