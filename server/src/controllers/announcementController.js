const Announcement = require('../models/Announcement');
const notificationService = require('../services/notificationService');

/**
 * @desc    Create a new society announcement
 * @route   POST /api/announcements
 * @access  Private/Admin
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetAudience, priority, expiryDate } = req.body;

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      creator: req.user._id,
      targetAudience: targetAudience || 'All',
      priority: priority || 'Normal',
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });

    await notificationService.notifyAnnouncement(announcement);

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get announcements (filtered by active status and user role)
 * @route   GET /api/announcements
 * @access  Private (All authenticated users)
 */
const getAnnouncements = async (req, res, next) => {
  try {
    const { targetAudience, priority, activeOnly = 'true', page = 1, limit = 20 } = req.query;

    const filter = {};

    if (activeOnly === 'true') {
      filter.isActive = true;
      filter.$or = [
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ];
    }

    // Role-based target filtering for non-admins
    if (req.user.role === 'resident') {
      filter.targetAudience = { $in: ['All', 'Residents'] };
    } else if (req.user.role === 'staff') {
      filter.targetAudience = { $in: ['All', 'Staff'] };
    } else if (targetAudience) {
      filter.targetAudience = targetAudience;
    }

    if (priority) filter.priority = priority;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('creator', 'name email role')
        .sort({ publicationDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Announcement.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: announcements.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      },
      data: announcements
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single announcement details
 * @route   GET /api/announcements/:id
 * @access  Private
 */
const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('creator', 'name email role');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an announcement
 * @route   PUT /api/announcements/:id
 * @access  Private/Admin
 */
const updateAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetAudience, priority, expiryDate, isActive } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    if (title) announcement.title = title.trim();
    if (message) announcement.message = message.trim();
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (priority) announcement.priority = priority;
    if (expiryDate !== undefined) announcement.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (isActive !== undefined) announcement.isActive = Boolean(isActive);

    await announcement.save();

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private/Admin
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};
