const Complaint = require('../models/Complaint');
const Flat = require('../models/Flat');
const Staff = require('../models/Staff');
const aiService = require('../services/aiService');
const notificationService = require('../services/notificationService');

/**
 * @desc    Submit a new complaint
 * @route   POST /api/complaints
 * @access  Private (Resident, Admin)
 */
const createComplaint = async (req, res, next) => {
  try {
    const {
      title,
      description,
      flatId,
      category,
      priority,
      useAiClassification = false
    } = req.body;

    // Resolve target flat
    let resolvedFlatId = flatId;
    if (!resolvedFlatId && req.user.role === 'resident') {
      resolvedFlatId = req.user.flat;
    }

    if (!resolvedFlatId) {
      return res.status(400).json({
        success: false,
        error: 'Flat ID is required. Please specify a flat or ensure your profile has an assigned flat.'
      });
    }

    const flat = await Flat.findById(resolvedFlatId);
    if (!flat) {
      return res.status(404).json({
        success: false,
        error: 'The specified flat does not exist'
      });
    }

    // Residents can only file complaints for their own flat
    if (
      req.user.role === 'resident' &&
      req.user.flat &&
      req.user.flat.toString() !== flat._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only file complaints for your assigned flat'
      });
    }

    let finalCategory = category || 'General';
    let finalPriority = priority || 'Medium';
    let aiSuggestions = null;

    // Run AI classification if requested or if category/priority not provided
    if (useAiClassification || (!category && !priority)) {
      try {
        if (aiService.isAvailable()) {
          const aiResult = await aiService.classifyComplaint(
            { title, description },
            { allowFallback: true }
          );

          aiSuggestions = {
            category: aiResult.category,
            priority: aiResult.priority,
            suggestedAction: aiResult.suggestedAction,
            confidenceScore: aiResult.isFallback ? 0.7 : 0.95,
            generatedAt: new Date()
          };

          // If user didn't explicitly set category/priority, adopt AI recommendations
          if (!category) finalCategory = aiResult.category;
          if (!priority) finalPriority = aiResult.priority;
        } else if (useAiClassification) {
          // If explicitly requested AI but service is not configured
          const fallback = aiService.heuristicClassify(`${title} ${description}`);
          aiSuggestions = {
            category: fallback.category,
            priority: fallback.priority,
            suggestedAction: fallback.suggestedAction,
            confidenceScore: 0.6,
            generatedAt: new Date()
          };
          if (!category) finalCategory = fallback.category;
          if (!priority) finalPriority = fallback.priority;
        }
      } catch (aiErr) {
        console.warn(`[ComplaintController] AI classification failed during creation: ${aiErr.message}`);
      }
    }

    const complaint = await Complaint.create({
      title: title.trim(),
      description: description.trim(),
      resident: req.user._id,
      flat: flat._id,
      category: finalCategory,
      priority: finalPriority,
      status: 'Open',
      aiSuggestions: aiSuggestions || undefined,
      statusHistory: [
        {
          status: 'Open',
          updatedBy: req.user._id,
          note: 'Complaint registered by resident',
          updatedAt: new Date()
        }
      ]
    });

    await notificationService.notifyComplaintEvent(complaint, 'CREATED', {
      creatorRole: req.user.role
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all complaints according to user permissions
 * @route   GET /api/complaints
 * @access  Private (Resident sees own; Admin/Staff sees all or filtered)
 */
const getComplaints = async (req, res, next) => {
  try {
    const {
      status,
      category,
      priority,
      flatId,
      assignedStaff,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    // Privacy restriction: Residents strictly see only their own complaints
    if (req.user.role === 'resident') {
      filter.resident = req.user._id;
    } else {
      // Admin / Staff can filter by resident or flat
      if (flatId) filter.flat = flatId;
    }

    // Role-based staff filtering
    if (req.user.role === 'staff' && assignedStaff === 'me') {
      const staffRecord = await Staff.findOne({ user: req.user._id });
      if (staffRecord) {
        filter.assignedStaff = staffRecord._id;
      }
    } else if (assignedStaff && assignedStaff !== 'me') {
      filter.assignedStaff = assignedStaff;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('resident', 'name email phone')
        .populate('flat', 'flatNumber building floor')
        .populate('assignedStaff', 'name contactDetails jobRole availabilityStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Complaint.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      },
      data: complaints
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single complaint details
 * @route   GET /api/complaints/:id
 * @access  Private (Resident can only view own; Admin/Staff can view any)
 */
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('resident', 'name email phone')
      .populate('flat', 'flatNumber building floor')
      .populate('assignedStaff', 'name contactDetails jobRole availabilityStatus')
      .populate('statusHistory.updatedBy', 'name role email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Check permissions
    if (
      req.user.role === 'resident' &&
      complaint.resident._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to view other residents\' private complaints'
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update complaint status
 * @route   PATCH /api/complaints/:id/status
 * @access  Private/Admin or Staff
 */
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    complaint.status = status;
    complaint.statusHistory.push({
      status,
      updatedBy: req.user._id,
      note: note || `Status updated to ${status}`,
      updatedAt: new Date()
    });

    await complaint.save();

    await notificationService.notifyComplaintEvent(complaint, 'STATUS_UPDATED', {
      newStatus: status,
      updatedByRole: req.user.role
    });

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign complaint to maintenance staff
 * @route   PATCH /api/complaints/:id/assign
 * @access  Private/Admin
 */
const assignComplaintStaff = async (req, res, next) => {
  try {
    const { staffId, note } = req.body;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'staffId is required'
      });
    }

    const [complaint, staff] = await Promise.all([
      Complaint.findById(req.params.id),
      Staff.findById(staffId)
    ]);

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    complaint.assignedStaff = staff._id;
    if (complaint.status === 'Open') {
      complaint.status = 'In Progress';
    }

    complaint.statusHistory.push({
      status: complaint.status,
      updatedBy: req.user._id,
      note: note || `Assigned to staff technician ${staff.name} (${staff.jobRole})`,
      updatedAt: new Date()
    });

    await complaint.save();

    // Link complaint in staff's assigned complaints
    await Staff.findByIdAndUpdate(staff._id, {
      $addToSet: { assignedComplaints: complaint._id }
    });

    await notificationService.notifyComplaintEvent(complaint, 'ASSIGNED', {
      staffName: staff.name,
      jobRole: staff.jobRole
    });

    return res.status(200).json({
      success: true,
      message: `Complaint successfully assigned to ${staff.name}`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger AI categorization on an existing complaint
 * @route   POST /api/complaints/:id/ai-classify
 * @access  Private (Admin, Staff, or Complaint Owner)
 */
const applyAiClassification = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    // Permission check
    if (
      req.user.role === 'resident' &&
      complaint.resident.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only classify your own complaints'
      });
    }

    const { allowFallback = true, updateFields = false } = req.body;

    const aiResult = await aiService.classifyComplaint(
      { title: complaint.title, description: complaint.description },
      { allowFallback: Boolean(allowFallback) }
    );

    complaint.aiSuggestions = {
      category: aiResult.category,
      priority: aiResult.priority,
      suggestedAction: aiResult.suggestedAction,
      confidenceScore: aiResult.isFallback ? 0.7 : 0.95,
      generatedAt: new Date()
    };

    if (updateFields) {
      complaint.category = aiResult.category;
      complaint.priority = aiResult.priority;
    }

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'AI categorization applied to complaint',
      aiSuggestions: complaint.aiSuggestions,
      complaint
    });
  } catch (error) {
    if (error.isConfigError) {
      return res.status(error.statusCode || 503).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaintStaff,
  applyAiClassification
};
