const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM(
        'medication',
        'examination',
        'lab_test',
        'imaging',
        'consultation',
        'procedure',
        'monitoring',
        'documentation',
        'discharge',
        'other'
      ),
      allowNull: false,
      defaultValue: 'other'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'in_progress',
        'completed',
        'cancelled',
        'overdue'
      ),
      defaultValue: 'pending'
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    assigned_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_by_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reminder_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_by_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completion_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recurring_pattern: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'JSON object with recurring schedule details'
    },
    parent_task_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id'
      }
    }
  }, {
    tableName: 'tasks',
    indexes: [
      {
        fields: ['patient_id']
      },
      {
        fields: ['assigned_user_id']
      },
      {
        fields: ['created_by_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['type']
      },
      {
        fields: ['due_date']
      },
      {
        fields: ['reminder_time']
      },
      {
        fields: ['completed_at']
      },
      {
        fields: ['parent_task_id']
      }
    ]
  });

  // Instance methods
  Task.prototype.isOverdue = function() {
    if (!this.due_date || this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }
    return new Date() > new Date(this.due_date);
  };

  Task.prototype.isDue = function() {
    if (!this.due_date || this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }
    const now = new Date();
    const dueDate = new Date(this.due_date);
    const timeDiff = dueDate.getTime() - now.getTime();
    return timeDiff <= (30 * 60 * 1000); // 30 minutes
  };

  Task.prototype.needsReminder = function() {
    if (!this.reminder_time || this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }
    return new Date() >= new Date(this.reminder_time);
  };

  Task.prototype.complete = function(completedById, completionNotes = null) {
    this.status = 'completed';
    this.completed_at = new Date();
    this.completed_by_id = completedById;
    if (completionNotes) {
      this.completion_notes = completionNotes;
    }
    return this.save();
  };

  Task.prototype.cancel = function(reason = null) {
    this.status = 'cancelled';
    if (reason) {
      this.completion_notes = reason;
    }
    return this.save();
  };

  Task.prototype.start = function() {
    this.status = 'in_progress';
    return this.save();
  };

  Task.prototype.getPriorityWeight = function() {
    const weights = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'urgent': 4
    };
    return weights[this.priority] || 1;
  };

  Task.prototype.getTimeToDeadline = function() {
    if (!this.due_date) return null;
    const now = new Date();
    const dueDate = new Date(this.due_date);
    return Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60)); // minutes
  };

  Task.prototype.getDurationMinutes = function() {
    if (!this.completed_at) return null;
    const completedAt = new Date(this.completed_at);
    const createdAt = new Date(this.created_at);
    return Math.floor((completedAt.getTime() - createdAt.getTime()) / (1000 * 60));
  };

  // Class methods
  Task.findPending = function() {
    return this.findAll({
      where: { status: 'pending' },
      order: [['priority', 'DESC'], ['due_date', 'ASC']]
    });
  };

  Task.findOverdue = function() {
    return this.findAll({
      where: {
        due_date: {
          [sequelize.Sequelize.Op.lt]: new Date()
        },
        status: {
          [sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled']
        }
      },
      order: [['due_date', 'ASC']]
    });
  };

  Task.findByUser = function(userId) {
    return this.findAll({
      where: { assigned_user_id: userId },
      order: [['priority', 'DESC'], ['due_date', 'ASC']]
    });
  };

  Task.findByPatient = function(patientId) {
    return this.findAll({
      where: { patient_id: patientId },
      order: [['created_at', 'DESC']]
    });
  };

  Task.findByPriority = function(priority) {
    return this.findAll({
      where: { priority },
      order: [['due_date', 'ASC']]
    });
  };

  Task.findDueToday = function() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return this.findAll({
      where: {
        due_date: {
          [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay]
        },
        status: {
          [sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled']
        }
      },
      order: [['priority', 'DESC'], ['due_date', 'ASC']]
    });
  };

  Task.findNeedingReminder = function() {
    return this.findAll({
      where: {
        reminder_time: {
          [sequelize.Sequelize.Op.lte]: new Date()
        },
        status: {
          [sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled']
        }
      }
    });
  };

  Task.getTypeDisplayName = function(type) {
    const typeNames = {
      'medication': 'İlaç',
      'examination': 'Muayene',
      'lab_test': 'Laboratuvar',
      'imaging': 'Görüntüleme',
      'consultation': 'Konsültasyon',
      'procedure': 'Prosedür',
      'monitoring': 'Takip',
      'documentation': 'Dokümantasyon',
      'discharge': 'Taburcu',
      'other': 'Diğer'
    };
    return typeNames[type] || type;
  };

  Task.getPriorityDisplayName = function(priority) {
    const priorityNames = {
      'low': 'Düşük',
      'medium': 'Orta',
      'high': 'Yüksek',
      'urgent': 'Acil'
    };
    return priorityNames[priority] || priority;
  };

  Task.getStatusDisplayName = function(status) {
    const statusNames = {
      'pending': 'Bekliyor',
      'in_progress': 'Devam Ediyor',
      'completed': 'Tamamlandı',
      'cancelled': 'İptal Edildi',
      'overdue': 'Gecikti'
    };
    return statusNames[status] || status;
  };

  return Task;
};