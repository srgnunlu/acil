const express = require('express');
const { Patient, User, Bed, Room } = require('../models');
const { auth, requireMedicalStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.findAll({
      include: [
        {
          model: User,
          as: 'assignedDoctor',
          attributes: ['id', 'first_name', 'last_name', 'username']
        },
        {
          model: Bed,
          as: 'bed',
          include: [{
            model: Room,
            as: 'room',
            attributes: ['id', 'name', 'type']
          }]
        }
      ],
      order: [['admission_time', 'DESC']]
    });

    res.json({
      success: true,
      data: { patients }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/patients/active
// @desc    Get active patients
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const patients = await Patient.findActive();

    res.json({
      success: true,
      data: { patients }
    });
  } catch (error) {
    console.error('Get active patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (Medical staff only)
router.post('/', auth, requireMedicalStaff, async (req, res) => {
  try {
    const queueNumber = await Patient.generateQueueNumber();
    
    const patient = await Patient.create({
      ...req.body,
      queue_number: queueNumber,
      assigned_doctor_id: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Hasta oluşturuldu',
      data: { patient }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignedDoctor',
          attributes: ['id', 'first_name', 'last_name', 'username']
        },
        {
          model: Bed,
          as: 'bed',
          include: [{
            model: Room,
            as: 'room'
          }]
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Hasta bulunamadı'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (Medical staff only)
router.put('/:id', auth, requireMedicalStaff, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Hasta bulunamadı'
      });
    }

    await patient.update(req.body);

    res.json({
      success: true,
      message: 'Hasta güncellendi',
      data: { patient }
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/patients/:id/assign-bed
// @desc    Assign bed to patient
// @access  Private (Medical staff only)
router.put('/:id/assign-bed', auth, requireMedicalStaff, async (req, res) => {
  try {
    const { bed_id } = req.body;
    
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Hasta bulunamadı'
      });
    }

    const bed = await Bed.findByPk(bed_id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Yatak bulunamadı'
      });
    }

    if (!bed.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Yatak müsait değil'
      });
    }

    await patient.update({ bed_id });
    await bed.setOccupied();

    res.json({
      success: true,
      message: 'Yatak atandı',
      data: { patient }
    });
  } catch (error) {
    console.error('Assign bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/patients/:id/discharge
// @desc    Discharge patient
// @access  Private (Medical staff only)
router.put('/:id/discharge', auth, requireMedicalStaff, async (req, res) => {
  try {
    const { discharge_notes } = req.body;
    
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Hasta bulunamadı'
      });
    }

    await patient.discharge(discharge_notes);

    // Free up the bed
    if (patient.bed_id) {
      const bed = await Bed.findByPk(patient.bed_id);
      if (bed) {
        await bed.setAvailable();
      }
    }

    res.json({
      success: true,
      message: 'Hasta taburcu edildi',
      data: { patient }
    });
  } catch (error) {
    console.error('Discharge patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;