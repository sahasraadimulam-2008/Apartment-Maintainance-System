const express = require('express');
const { body } = require('express-validator');
const {
  classifyComplaint,
  chatWithAssistant,
  getAiStatus
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

const classifyValidation = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Complaint description is required for classification')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Description must be between 5 and 2000 characters'),
  validateRequest
];

const chatValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required for chat')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  validateRequest
];

// All AI routes require authentication
router.use(protect);

router.post('/classify-complaint', classifyValidation, classifyComplaint);
router.post('/chat', chatValidation, chatWithAssistant);
router.get('/status', getAiStatus);

module.exports = router;
