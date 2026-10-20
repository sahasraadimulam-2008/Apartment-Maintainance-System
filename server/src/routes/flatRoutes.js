const express = require('express');
const { body } = require('express-validator');
const {
  createFlat,
  getFlats,
  getFlatById,
  updateFlat,
  deleteFlat,
  assignResident
} = require('../controllers/flatController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

const flatValidation = [
  body('flatNumber')
    .trim()
    .notEmpty()
    .withMessage('Flat number is required'),
  body('building')
    .trim()
    .notEmpty()
    .withMessage('Building or block name is required'),
  body('floor')
    .isInt()
    .withMessage('Floor must be a valid integer'),
  validateRequest
];

// All flat routes require authentication
router.use(protect);

router.route('/')
  .get(getFlats)
  .post(authorize('admin'), flatValidation, createFlat);

router.route('/:id')
  .get(getFlatById)
  .put(authorize('admin'), updateFlat)
  .delete(authorize('admin'), deleteFlat);

router.post('/:id/assign-resident', authorize('admin'), assignResident);

module.exports = router;
