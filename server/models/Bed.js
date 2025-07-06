const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bed = sequelize.define('Bed', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bed_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 50
      }
    },
    room_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'rooms',
        key: 'id'
      }
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    bed_type: {
      type: DataTypes.ENUM(
        'standard',
        'monitor',
        'intensive',
        'isolation',
        'emergency'
      ),
      defaultValue: 'standard'
    },
    status: {
      type: DataTypes.ENUM(
        'available',
        'occupied',
        'maintenance',
        'cleaning',
        'reserved'
      ),
      defaultValue: 'available'
    },
    equipment: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    last_cleaned: {
      type: DataTypes.DATE,
      allowNull: true
    },
    maintenance_due: {
      type: DataTypes.DATE,
      allowNull: true
    },
    priority_level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 10
      }
    }
  }, {
    tableName: 'beds',
    indexes: [
      {
        unique: true,
        fields: ['room_id', 'bed_number']
      },
      {
        fields: ['is_available']
      },
      {
        fields: ['status']
      },
      {
        fields: ['bed_type']
      },
      {
        fields: ['priority_level']
      }
    ]
  });

  // Instance methods
  Bed.prototype.isOccupied = function() {
    return this.status === 'occupied';
  };

  Bed.prototype.isAvailable = function() {
    return this.status === 'available' && this.is_available;
  };

  Bed.prototype.getBedIdentifier = function() {
    return `${this.room?.name || 'Unknown'}-${this.bed_number}`;
  };

  Bed.prototype.setOccupied = function() {
    this.status = 'occupied';
    this.is_available = false;
    return this.save();
  };

  Bed.prototype.setAvailable = function() {
    this.status = 'available';
    this.is_available = true;
    return this.save();
  };

  Bed.prototype.setMaintenance = function() {
    this.status = 'maintenance';
    this.is_available = false;
    return this.save();
  };

  Bed.prototype.setCleaning = function() {
    this.status = 'cleaning';
    this.is_available = false;
    return this.save();
  };

  Bed.prototype.needsCleaning = function() {
    if (!this.last_cleaned) return true;
    const hoursSinceClean = (Date.now() - this.last_cleaned.getTime()) / (1000 * 60 * 60);
    return hoursSinceClean > 24; // 24 saat sonra temizlik gerekiyor
  };

  Bed.prototype.needsMaintenance = function() {
    if (!this.maintenance_due) return false;
    return new Date() >= this.maintenance_due;
  };

  // Class methods
  Bed.findAvailable = function() {
    return this.findAll({
      where: { 
        is_available: true,
        status: 'available'
      },
      include: [{
        model: sequelize.models.Room,
        as: 'room',
        where: { is_active: true }
      }],
      order: [['priority_level', 'DESC'], ['bed_number', 'ASC']]
    });
  };

  Bed.findByRoom = function(roomId) {
    return this.findAll({
      where: { room_id: roomId },
      order: [['bed_number', 'ASC']]
    });
  };

  Bed.findByRoomType = function(roomType) {
    return this.findAll({
      include: [{
        model: sequelize.models.Room,
        as: 'room',
        where: { type: roomType, is_active: true }
      }],
      order: [
        [{ model: sequelize.models.Room, as: 'room' }, 'priority_order', 'ASC'],
        ['bed_number', 'ASC']
      ]
    });
  };

  Bed.findOccupied = function() {
    return this.findAll({
      where: { status: 'occupied' },
      include: [{
        model: sequelize.models.Patient,
        as: 'patient',
        required: true
      }, {
        model: sequelize.models.Room,
        as: 'room'
      }]
    });
  };

  Bed.getStatusDisplayName = function(status) {
    const statusNames = {
      'available': 'Müsait',
      'occupied': 'Dolu',
      'maintenance': 'Bakım',
      'cleaning': 'Temizlik',
      'reserved': 'Rezerve'
    };
    return statusNames[status] || status;
  };

  return Bed;
};