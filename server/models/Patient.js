const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Patient = sequelize.define('Patient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    queue_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    tc_number: {
      type: DataTypes.STRING(11),
      allowNull: true,
      unique: true,
      validate: {
        is: /^[0-9]{11}$/,
        len: [11, 11]
      }
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[\+]?[0-9\s\-\(\)]{10,20}$/
      }
    },
    emergency_contact: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    emergency_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    complaint: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    triage_level: {
      type: DataTypes.ENUM('1', '2', '3', '4', '5'),
      allowNull: true,
      comment: '1: Resuscitation, 2: Emergent, 3: Urgent, 4: Less Urgent, 5: Non-urgent'
    },
    assigned_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    bed_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'beds',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(
        'waiting',
        'in_treatment',
        'waiting_results',
        'ready_discharge',
        'discharged',
        'transferred',
        'deceased'
      ),
      defaultValue: 'waiting'
    },
    admission_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    discharge_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    vital_signs: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    medical_history: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    medications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    treatment_plan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discharge_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    insurance_info: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'patients',
    indexes: [
      {
        unique: true,
        fields: ['queue_number']
      },
      {
        unique: true,
        fields: ['tc_number'],
        where: {
          tc_number: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['assigned_doctor_id']
      },
      {
        fields: ['bed_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['triage_level']
      },
      {
        fields: ['admission_time']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Instance methods
  Patient.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };

  Patient.prototype.getAge = function() {
    if (!this.birth_date) return null;
    const today = new Date();
    const birthDate = new Date(this.birth_date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  Patient.prototype.getWaitingTime = function() {
    if (!this.admission_time) return 0;
    const now = new Date();
    const admissionTime = new Date(this.admission_time);
    return Math.floor((now - admissionTime) / (1000 * 60)); // minutes
  };

  Patient.prototype.getTreatmentDuration = function() {
    if (!this.admission_time) return 0;
    const endTime = this.discharge_time || new Date();
    const admissionTime = new Date(this.admission_time);
    return Math.floor((endTime - admissionTime) / (1000 * 60)); // minutes
  };

  Patient.prototype.getTriageLevelName = function() {
    const triageNames = {
      '1': 'Resuscitation',
      '2': 'Emergent',
      '3': 'Urgent',
      '4': 'Less Urgent',
      '5': 'Non-urgent'
    };
    return triageNames[this.triage_level] || 'Unknown';
  };

  Patient.prototype.getTriageColor = function() {
    const triageColors = {
      '1': '#FF0000', // Red
      '2': '#FF8C00', // Orange
      '3': '#FFD700', // Yellow
      '4': '#32CD32', // Green
      '5': '#0000FF'  // Blue
    };
    return triageColors[this.triage_level] || '#808080'; // Gray
  };

  Patient.prototype.discharge = function(notes = null) {
    this.status = 'discharged';
    this.discharge_time = new Date();
    if (notes) {
      this.discharge_notes = notes;
    }
    return this.save();
  };

  Patient.prototype.transfer = function(notes = null) {
    this.status = 'transferred';
    this.discharge_time = new Date();
    if (notes) {
      this.discharge_notes = notes;
    }
    return this.save();
  };

  // Class methods
  Patient.findByQueueNumber = function(queueNumber) {
    return this.findOne({ where: { queue_number: queueNumber } });
  };

  Patient.findByTcNumber = function(tcNumber) {
    return this.findOne({ where: { tc_number: tcNumber } });
  };

  Patient.findActive = function() {
    return this.findAll({
      where: { 
        is_active: true,
        status: {
          [sequelize.Sequelize.Op.notIn]: ['discharged', 'transferred', 'deceased']
        }
      },
      order: [['admission_time', 'ASC']]
    });
  };

  Patient.findByDoctor = function(doctorId) {
    return this.findAll({
      where: { assigned_doctor_id: doctorId },
      order: [['admission_time', 'ASC']]
    });
  };

  Patient.findByTriage = function(triageLevel) {
    return this.findAll({
      where: { triage_level: triageLevel },
      order: [['admission_time', 'ASC']]
    });
  };

  Patient.findWaiting = function() {
    return this.findAll({
      where: { status: 'waiting' },
      order: [['triage_level', 'ASC'], ['admission_time', 'ASC']]
    });
  };

  Patient.generateQueueNumber = async function() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const lastPatient = await this.findOne({
      where: {
        admission_time: {
          [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay]
        }
      },
      order: [['queue_number', 'DESC']]
    });

    if (lastPatient) {
      return lastPatient.queue_number + 1;
    } else {
      // Generate daily number: YYYYMMDD001
      const datePrefix = today.getFullYear() * 100000 + (today.getMonth() + 1) * 1000 + today.getDate() * 10;
      return datePrefix + 1;
    }
  };

  Patient.getStatusDisplayName = function(status) {
    const statusNames = {
      'waiting': 'Bekliyor',
      'in_treatment': 'Tedavi',
      'waiting_results': 'Sonuç Bekliyor',
      'ready_discharge': 'Taburcu Hazır',
      'discharged': 'Taburcu',
      'transferred': 'Sevk',
      'deceased': 'Vefat'
    };
    return statusNames[status] || status;
  };

  return Patient;
};