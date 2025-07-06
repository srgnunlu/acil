const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'acil_servis_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Import models
const User = require('./User')(sequelize);
const Patient = require('./Patient')(sequelize);
const Bed = require('./Bed')(sequelize);
const Task = require('./Task')(sequelize);
const Notification = require('./Notification')(sequelize);
const Room = require('./Room')(sequelize);

// Define associations
const db = {
  sequelize,
  Sequelize,
  User,
  Patient,
  Bed,
  Task,
  Notification,
  Room
};

// User associations
db.User.hasMany(db.Patient, { foreignKey: 'assigned_doctor_id', as: 'assignedPatients' });
db.User.hasMany(db.Task, { foreignKey: 'assigned_user_id', as: 'assignedTasks' });
db.User.hasMany(db.Task, { foreignKey: 'created_by_id', as: 'createdTasks' });
db.User.hasMany(db.Notification, { foreignKey: 'user_id', as: 'notifications' });

// Patient associations
db.Patient.belongsTo(db.User, { foreignKey: 'assigned_doctor_id', as: 'assignedDoctor' });
db.Patient.belongsTo(db.Bed, { foreignKey: 'bed_id', as: 'bed' });
db.Patient.hasMany(db.Task, { foreignKey: 'patient_id', as: 'tasks' });

// Bed associations
db.Bed.belongsTo(db.Room, { foreignKey: 'room_id', as: 'room' });
db.Bed.hasOne(db.Patient, { foreignKey: 'bed_id', as: 'patient' });

// Room associations
db.Room.hasMany(db.Bed, { foreignKey: 'room_id', as: 'beds' });

// Task associations
db.Task.belongsTo(db.User, { foreignKey: 'assigned_user_id', as: 'assignedUser' });
db.Task.belongsTo(db.User, { foreignKey: 'created_by_id', as: 'createdBy' });
db.Task.belongsTo(db.Patient, { foreignKey: 'patient_id', as: 'patient' });
db.Task.hasMany(db.Notification, { foreignKey: 'task_id', as: 'notifications' });

// Notification associations
db.Notification.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.Notification.belongsTo(db.Task, { foreignKey: 'task_id', as: 'task' });

module.exports = db;