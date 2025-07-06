const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 100]
      }
    },
    type: {
      type: DataTypes.ENUM(
        'izole',
        'kbb',
        'kritik_bakim',
        'travma',
        'islem',
        'baki_goz',
        'jineko',
        'monitor'
      ),
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 20
      }
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 10
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    equipment: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    special_requirements: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    priority_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    }
  }, {
    tableName: 'rooms',
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['type']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['priority_order']
      }
    ]
  });

  // Instance methods
  Room.prototype.getAvailableBeds = function() {
    return this.getBeds({
      include: [{
        model: sequelize.models.Patient,
        as: 'patient',
        required: false
      }]
    }).then(beds => {
      return beds.filter(bed => bed.is_available && !bed.patient);
    });
  };

  Room.prototype.getOccupiedBeds = function() {
    return this.getBeds({
      include: [{
        model: sequelize.models.Patient,
        as: 'patient',
        required: true
      }]
    });
  };

  Room.prototype.getOccupancyRate = function() {
    return this.getBeds({
      include: [{
        model: sequelize.models.Patient,
        as: 'patient',
        required: false
      }]
    }).then(beds => {
      const total = beds.length;
      const occupied = beds.filter(bed => bed.patient).length;
      return total > 0 ? (occupied / total) * 100 : 0;
    });
  };

  // Class methods
  Room.findByType = function(type) {
    return this.findAll({ where: { type, is_active: true } });
  };

  Room.findActive = function() {
    return this.findAll({ 
      where: { is_active: true },
      order: [['priority_order', 'ASC'], ['name', 'ASC']]
    });
  };

  Room.getTypeDisplayName = function(type) {
    const typeNames = {
      'izole': 'İzole',
      'kbb': 'KBB',
      'kritik_bakim': 'Kritik Bakım',
      'travma': 'Travma',
      'islem': 'İşlem',
      'baki_goz': 'Bakı Göz',
      'jineko': 'Jineko',
      'monitor': 'Monitör'
    };
    return typeNames[type] || type;
  };

  return Room;
};