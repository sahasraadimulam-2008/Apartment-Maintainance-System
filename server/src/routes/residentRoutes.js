const express = require('express');
const { getResidents, getResidentById, updateResident } = require('../controllers/residentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'staff'), getResidents);
router.get('/:id', getResidentById);
router.put('/:id', authorize('admin'), updateResident);

module.exports = router;
