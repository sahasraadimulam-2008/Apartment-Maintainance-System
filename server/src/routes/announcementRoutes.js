const express = require('express');
const { body } = require('express-validator');
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

const announcementValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Announcement title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Announcement message is required')
    .isLength({ max: 3000 })
    .withMessage('Message cannot exceed 3000 characters'),
  body('targetAudience')
    .optional()
    .isIn(['All', 'Residents', 'Staff'])
    .withMessage('Invalid target audience'),
  body('priority')
    .optional()
    .isIn(['Low', 'Normal', 'Urgent'])
    .withMessage('Invalid priority level'),
  validateRequest
];

router.use(protect);

router.route('/')
  .post(authorize('admin'), announcementValidation, createAnnouncement)
  .get(getAnnouncements);

router.route('/:id')
  .get(getAnnouncementById)
  .put(authorize('admin'), updateAnnouncement)
  .delete(authorize('admin'), deleteAnnouncement);

module.exports = router;
