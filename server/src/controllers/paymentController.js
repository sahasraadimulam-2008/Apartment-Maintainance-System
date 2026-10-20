const Payment = require('../models/Payment');
const Flat = require('../models/Flat');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

/**
 * @desc    Create a maintenance payment charge record
 * @route   POST /api/payments
 * @access  Private/Admin
 */
const createPayment = async (req, res, next) => {
  try {
    const {
      residentId,
      flatId,
      amount,
      billingPeriod,
      dueDate,
      notes
    } = req.body;

    // Verify resident and flat exist
    const [resident, flat] = await Promise.all([
      User.findById(residentId),
      Flat.findById(flatId)
    ]);

    if (!resident) {
      return res.status(404).json({ success: false, error: 'Resident not found' });
    }
    if (!flat) {
      return res.status(404).json({ success: false, error: 'Flat not found' });
    }

    const payment = await Payment.create({
      resident: resident._id,
      flat: flat._id,
      amount: Number(amount),
      billingPeriod: billingPeriod.trim(),
      dueDate: new Date(dueDate),
      status: 'Pending',
      notes: notes || ''
    });

    await notificationService.notifyPaymentStatus(payment);

    return res.status(201).json({
      success: true,
      message: 'Maintenance payment record created successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payments (Resident sees own; Admin/Staff sees all or filtered)
 * @route   GET /api/payments
 * @access  Private
 */
const getPayments = async (req, res, next) => {
  try {
    const { status, billingPeriod, flatId, page = 1, limit = 20 } = req.query;

    const filter = {};

    // Privacy restriction: Residents strictly see only their own payment records
    if (req.user.role === 'resident') {
      filter.resident = req.user._id;
    } else {
      if (flatId) filter.flat = flatId;
    }

    if (status) filter.status = status;
    if (billingPeriod) filter.billingPeriod = new RegExp(billingPeriod.trim(), 'i');

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('resident', 'name email phone')
        .populate('flat', 'flatNumber building floor')
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: payments.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      },
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single payment record details
 * @route   GET /api/payments/:id
 * @access  Private (Resident can only view own; Admin/Staff can view any)
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('resident', 'name email phone')
      .populate('flat', 'flatNumber building floor');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    // Security check
    if (
      req.user.role === 'resident' &&
      payment.resident._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to view other residents\' payment records'
      });
    }

    return res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update/record payment status manually (Offline/Direct receipt)
 * @route   PATCH /api/payments/:id/status
 * @access  Private/Admin
 */
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, paymentMethod, paymentReference, notes } = req.body;

    const validStatuses = ['Pending', 'Paid', 'Overdue', 'Failed', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    payment.status = status;
    if (status === 'Paid') {
      payment.paidAt = new Date();
      if (paymentMethod) payment.paymentMethod = paymentMethod;
      if (paymentReference) payment.paymentReference = paymentReference.trim();
    }
    if (notes) payment.notes = notes.trim();

    await payment.save();

    await notificationService.notifyPaymentStatus(payment);

    return res.status(200).json({
      success: true,
      message: `Payment record updated to ${status}`,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus
};
