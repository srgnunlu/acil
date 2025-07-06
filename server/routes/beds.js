const express = require('express');
const { Bed, Room, Patient } = require('../models');
const { auth, requireMedicalStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/beds
// @desc    Get all beds
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const beds = await Bed.findAll({
      include: [
        {
          model: Room,
          as: 'room'
        },
        {
          model: Patient,
          as: 'patient',
          required: false
        }
      ],
      order: [
        [{ model: Room, as: 'room' }, 'priority_order', 'ASC'],
        ['bed_number', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: { beds }
    });
  } catch (error) {
    console.error('Get beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/beds/available
// @desc    Get available beds
// @access  Private
router.get('/available', auth, async (req, res) => {
  try {
    const beds = await Bed.findAvailable();

    res.json({
      success: true,
      data: { beds }
    });
  } catch (error) {
    console.error('Get available beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/beds/room/:roomId
// @desc    Get beds by room
// @access  Private
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const beds = await Bed.findByRoom(req.params.roomId);

    res.json({
      success: true,
      data: { beds }
    });
  } catch (error) {
    console.error('Get beds by room error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/beds/:id/status
// @desc    Update bed status
// @access  Private (Medical staff only)
router.put('/:id/status', auth, requireMedicalStaff, async (req, res) => {
  try {
    const { status } = req.body;
    
    const bed = await Bed.findByPk(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Yatak bulunamadı'
      });
    }

    await bed.update({ status });

    res.json({
      success: true,
      message: 'Yatak durumu güncellendi',
      data: { bed }
    });
  } catch (error) {
    console.error('Update bed status error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;