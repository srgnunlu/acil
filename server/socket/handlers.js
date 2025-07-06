const jwt = require('jsonwebtoken');
const { User, Patient, Bed, Task, Notification } = require('../models');

// Store connected users
const connectedUsers = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.is_active) {
      return next(new Error('Authentication error'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io, socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);
  
  // Store user connection
  connectedUsers.set(socket.user.id, {
    socketId: socket.id,
    user: socket.user,
    joinedAt: new Date()
  });

  // Join user to their personal room
  socket.join(`user_${socket.user.id}`);
  
  // Join user to role-based room
  socket.join(`role_${socket.user.role}`);

  // Send initial data
  socket.emit('connection_established', {
    user: socket.user,
    timestamp: new Date()
  });

  // Handle patient updates
  socket.on('patient_update', async (data) => {
    try {
      const { patientId, updates } = data;
      
      // Update patient
      const patient = await Patient.findByPk(patientId);
      if (patient) {
        await patient.update(updates);
        
        // Broadcast to all connected users
        io.emit('patient_updated', {
          patient: patient.toJSON(),
          updatedBy: socket.user.id,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Patient update error:', error);
      socket.emit('error', { message: 'Hasta güncellenemedi' });
    }
  });

  // Handle bed status updates
  socket.on('bed_status_update', async (data) => {
    try {
      const { bedId, status } = data;
      
      const bed = await Bed.findByPk(bedId);
      if (bed) {
        await bed.update({ status });
        
        // Broadcast to all connected users
        io.emit('bed_status_updated', {
          bed: bed.toJSON(),
          updatedBy: socket.user.id,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Bed status update error:', error);
      socket.emit('error', { message: 'Yatak durumu güncellenemedi' });
    }
  });

  // Handle task updates
  socket.on('task_update', async (data) => {
    try {
      const { taskId, updates } = data;
      
      const task = await Task.findByPk(taskId);
      if (task) {
        await task.update(updates);
        
        // Notify assigned user if different from current user
        if (task.assigned_user_id && task.assigned_user_id !== socket.user.id) {
          io.to(`user_${task.assigned_user_id}`).emit('task_updated', {
            task: task.toJSON(),
            updatedBy: socket.user.id,
            timestamp: new Date()
          });
        }
        
        // Broadcast to all users
        io.emit('task_updated', {
          task: task.toJSON(),
          updatedBy: socket.user.id,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Task update error:', error);
      socket.emit('error', { message: 'Görev güncellenemedi' });
    }
  });

  // Handle new notifications
  socket.on('send_notification', async (data) => {
    try {
      const { userId, type, title, message, priority = 'medium' } = data;
      
      const notification = await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        priority
      });
      
      // Send to specific user
      io.to(`user_${userId}`).emit('new_notification', {
        notification: notification.toJSON(),
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Send notification error:', error);
      socket.emit('error', { message: 'Bildirim gönderilemedi' });
    }
  });

  // Handle emergency alerts
  socket.on('emergency_alert', async (data) => {
    try {
      const { title, message, patientId } = data;
      
      // Create emergency notification for all medical staff
      const medicalStaff = await User.findAll({
        where: {
          role: ['doctor', 'nurse'],
          is_active: true
        }
      });
      
      for (const staff of medicalStaff) {
        await Notification.createEmergencyAlert(
          staff.id,
          title,
          message,
          patientId ? `/patients/${patientId}` : null
        );
      }
      
      // Broadcast to all medical staff
      io.to('role_doctor').to('role_nurse').emit('emergency_alert', {
        title,
        message,
        patientId,
        alertedBy: socket.user.id,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Emergency alert error:', error);
      socket.emit('error', { message: 'Acil durum bildirimi gönderilemedi' });
    }
  });

  // Handle room joining
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.user.username} joined room: ${roomId}`);
  });

  // Handle room leaving
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.user.username} left room: ${roomId}`);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.broadcast.emit('user_typing', {
      userId: socket.user.id,
      username: socket.user.username,
      ...data
    });
  });

  // Handle stop typing
  socket.on('stop_typing', (data) => {
    socket.broadcast.emit('user_stop_typing', {
      userId: socket.user.id,
      username: socket.user.username,
      ...data
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
    
    // Remove from connected users
    connectedUsers.delete(socket.user.id);
    
    // Notify others
    socket.broadcast.emit('user_disconnected', {
      userId: socket.user.id,
      username: socket.user.username,
      timestamp: new Date()
    });
  });
};

// Broadcast functions
const broadcastToAll = (io, event, data) => {
  io.emit(event, data);
};

const broadcastToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

const broadcastToRole = (io, role, event, data) => {
  io.to(`role_${role}`).emit(event, data);
};

const broadcastToRoom = (io, roomId, event, data) => {
  io.to(roomId).emit(event, data);
};

// Get connected users
const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

// Get user connection status
const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

module.exports = (io, socket) => {
  // Apply authentication middleware
  socket.use(authenticateSocket);
  
  // Handle connection
  handleConnection(io, socket);
};

module.exports.broadcastToAll = broadcastToAll;
module.exports.broadcastToUser = broadcastToUser;
module.exports.broadcastToRole = broadcastToRole;
module.exports.broadcastToRoom = broadcastToRoom;
module.exports.getConnectedUsers = getConnectedUsers;
module.exports.isUserConnected = isUserConnected;