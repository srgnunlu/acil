const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim reddedildi. Token gerekli.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token.'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Hesap devre dışı.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Geçersiz token.'
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok.'
      });
    }

    next();
  };
};

const requireAdmin = requireRole('admin');
const requireDoctorOrAbove = requireRole('admin', 'doctor');
const requireMedicalStaff = requireRole('admin', 'doctor', 'nurse');

module.exports = {
  auth,
  requireRole,
  requireAdmin,
  requireDoctorOrAbove,
  requireMedicalStaff
};