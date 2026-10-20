const express = require('express');
const { body } = require('express-validator');
const {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

const paymentValidation = [
  body('residentId')
    .notEmpty()
    .withMessage('Resident ID is required'),
  body('flatId')
    .notEmpty()
    .withMessage('Flat ID is required'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a non-negative number'),
  body('billingPeriod')
    .trim()
    .notEmpty()
    .withMessage('Billing period is required (e.g., October 2026)'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  validateRequest
];

const statusValidation = [
  body('status')
    .notEmpty()
    .isIn(['Pending', 'Paid', 'Overdue', 'Failed', 'Cancelled'])
    .withMessage('Invalid payment status'),
  validateRequest
];

router.use(protect);

router.route('/')
  .post(authorize('admin'), paymentValidation, createPayment)
  .get(getPayments);

router.route('/:id')
  .get(getPaymentById);

router.patch('/:id/status', authorize('admin'), statusValidation, updatePaymentStatus);

module.exports = router;
