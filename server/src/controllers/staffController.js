const Staff = require('../models/Staff');

/**
 * @desc    Create a new staff technician record
 * @route   POST /api/staff
 * @access  Private/Admin
 */
const createStaff = async (req, res, next) => {
  try {
    const { name, contactDetails, jobRole, availabilityStatus, userId } = req.body;

    const staff = await Staff.create({
      name: name.trim(),
      contactDetails: {
        email: contactDetails?.email ? contactDetails.email.trim().toLowerCase() : '',
        phone: contactDetails?.phone ? contactDetails.phone.trim() : ''
      },
      jobRole,
      availabilityStatus: availabilityStatus || 'Available',
      user: userId || null
    });

    return res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all staff members (with filters and pagination)
 * @route   GET /api/staff
 * @access  Private (Admin, Staff, Resident)
 */
const getStaff = async (req, res, next) => {
  try {
    const { jobRole, availabilityStatus, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (jobRole) filter.jobRole = jobRole;
    if (availabilityStatus) filter.availabilityStatus = availabilityStatus;
    if (search) {
      filter.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { 'contactDetails.email': new RegExp(search.trim(), 'i') },
        { 'contactDetails.phone': new RegExp(search.trim(), 'i') }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [staffList, total] = await Promise.all([
      Staff.find(filter)
        .populate('assignedComplaints', 'title category priority status')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
      Staff.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: staffList.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      },
      data: staffList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single staff member by ID
 * @route   GET /api/staff/:id
 * @access  Private
 */
const getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('assignedComplaints', 'title category priority status createdAt')
      .populate('user', 'name email role');

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update staff member details
 * @route   PUT /api/staff/:id
 * @access  Private/Admin
 */
const updateStaff = async (req, res, next) => {
  try {
    const { name, contactDetails, jobRole, availabilityStatus, userId } = req.body;

    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    if (name) staff.name = name.trim();
    if (contactDetails?.email !== undefined) staff.contactDetails.email = contactDetails.email.trim().toLowerCase();
    if (contactDetails?.phone !== undefined) staff.contactDetails.phone = contactDetails.phone.trim();
    if (jobRole) staff.jobRole = jobRole;
    if (availabilityStatus) staff.availabilityStatus = availabilityStatus;
    if (userId !== undefined) staff.user = userId || null;

    await staff.save();

    return res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a staff member
 * @route   DELETE /api/staff/:id
 * @access  Private/Admin
 */
const deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    await Staff.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff
};
