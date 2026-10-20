const express = require('express');
const { body } = require('express-validator');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaintStaff,
  applyAiClassification
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

const complaintValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Complaint title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Complaint description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .optional()
    .isIn([
      'Plumbing',
      'Electrical',
      'Carpentry',
      'HVAC',
      'Security',
      'Sanitation',
      'Civil/Structural',
      'General',
      'Other'
    ])
    .withMessage('Invalid complaint category'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority level'),
  validateRequest
];

const statusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Open', 'In Progress', 'Resolved', 'Closed', 'Rejected'])
    .withMessage('Invalid complaint status value'),
  validateRequest
];

// All complaint routes require authentication
router.use(protect);

router.route('/')
  .post(complaintValidation, createComplaint)
  .get(getComplaints);

router.route('/:id')
  .get(getComplaintById);

router.patch('/:id/status', authorize('admin', 'staff'), statusValidation, updateComplaintStatus);
router.patch('/:id/assign', authorize('admin'), assignComplaintStaff);
router.post('/:id/ai-classify', applyAiClassification);

module.exports = router;
