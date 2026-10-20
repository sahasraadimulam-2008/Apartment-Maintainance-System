const User = require('../models/User');
const Flat = require('../models/Flat');

/**
 * @desc    Get all residents
 * @route   GET /api/residents
 * @access  Private (Admin, Staff)
 */
const getResidents = async (req, res, next) => {
  try {
    const { search, flatId, page = 1, limit = 20 } = req.query;

    const filter = { role: 'resident' };

    if (search) {
      filter.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { email: new RegExp(search.trim(), 'i') },
        { phone: new RegExp(search.trim(), 'i') }
      ];
    }

    if (flatId) {
      filter.flat = flatId;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [residents, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('flat', 'flatNumber building floor occupancyStatus')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: residents.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      },
      data: residents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single resident details
 * @route   GET /api/residents/:id
 * @access  Private (Admin, Staff, or Self)
 */
const getResidentById = async (req, res, next) => {
  try {
    // If not admin/staff, resident can only view themselves
    if (req.user.role === 'resident' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to view other residents\' private details'
      });
    }

    const resident = await User.findOne({ _id: req.params.id, role: 'resident' })
      .select('-password')
      .populate('flat', 'flatNumber building floor occupancyStatus');

    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: resident
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update resident profile/status
 * @route   PUT /api/residents/:id
 * @access  Private/Admin
 */
const updateResident = async (req, res, next) => {
  try {
    const { name, phone, flatId, isActive } = req.body;
    const resident = await User.findOne({ _id: req.params.id, role: 'resident' });

    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }

    if (name) resident.name = name.trim();
    if (phone !== undefined) resident.phone = phone.trim();
    if (isActive !== undefined) resident.isActive = Boolean(isActive);

    if (flatId) {
      const flat = await Flat.findById(flatId);
      if (!flat) {
        return res.status(400).json({ success: false, error: 'Specified flat not found' });
      }
      resident.flat = flat._id;
      // Add resident to flat
      await Flat.findByIdAndUpdate(flat._id, {
        $addToSet: { residents: resident._id },
        occupancyStatus: 'occupied'
      });
    }

    await resident.save();

    return res.status(200).json({
      success: true,
      message: 'Resident updated successfully',
      data: {
        id: resident._id,
        name: resident.name,
        email: resident.email,
        role: resident.role,
        flat: resident.flat,
        phone: resident.phone,
        isActive: resident.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResidents,
  getResidentById,
  updateResident
};
