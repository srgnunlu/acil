const express = require('express');
const { Task, User, Patient } = require('../models');
const { auth, requireMedicalStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'first_name', 'last_name', 'username']
        },
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'first_name', 'last_name', 'queue_number']
        }
      ],
      order: [['priority', 'DESC'], ['due_date', 'ASC']]
    });

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private (Medical staff only)
router.post('/', auth, requireMedicalStaff, async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      created_by_id: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Görev oluşturuldu',
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/tasks/:id/complete
// @desc    Complete task
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const { completion_notes } = req.body;
    
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Görev bulunamadı'
      });
    }

    await task.complete(req.user.id, completion_notes);

    res.json({
      success: true,
      message: 'Görev tamamlandı',
      data: { task }
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;