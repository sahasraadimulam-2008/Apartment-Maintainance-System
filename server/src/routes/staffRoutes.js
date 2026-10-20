const express = require('express');
const { body } = require('express-validator');
const {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

const staffValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Staff member name is required'),
  body('jobRole')
    .notEmpty()
    .isIn([
      'Plumber',
      'Electrician',
      'Carpenter',
      'HVAC Technician',
      'Cleaner',
      'Security Guard',
      'Maintenance Supervisor',
      'Other'
    ])
    .withMessage('Invalid staff job role'),
  body('contactDetails.phone')
    .notEmpty()
    .withMessage('Staff phone number is required'),
  validateRequest
];

router.use(protect);

router.route('/')
  .post(authorize('admin'), staffValidation, createStaff)
  .get(getStaff);

router.route('/:id')
  .get(getStaffById)
  .put(authorize('admin'), updateStaff)
  .delete(authorize('admin'), deleteStaff);

module.exports = router;
