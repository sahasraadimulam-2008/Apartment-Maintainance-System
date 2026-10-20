const User = require('../models/User');
const Flat = require('../models/Flat');
const Staff = require('../models/Staff');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public (Resident registration) / Admin-authorized (Staff or Admin registration)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'resident', flat, phone, jobRole } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in or use another email.'
      });
    }

    // Role restrictions:
    let assignedRole = 'resident';
    const validStaffInviteCode = (process.env.STAFF_INVITE_CODE || 'NESTORA-STAFF-2026').trim();
    const providedStaffCode = (req.body.staffInviteCode || req.body.inviteCode || '').trim();

    if (role === 'staff') {
      const isAdmin = req.user && req.user.role === 'admin';
      const hasValidCode = Boolean(providedStaffCode && providedStaffCode === validStaffInviteCode);

      if (isAdmin || hasValidCode) {
        assignedRole = 'staff';
      } else {
        return res.status(403).json({
          success: false,
          error: 'Staff registration requires a valid administrator authorization code. Please obtain a code from the property management office.'
        });
      }
    } else if (role === 'admin') {
      if (req.user && req.user.role === 'admin') {
        assignedRole = 'admin';
      } else {
        return res.status(403).json({
          success: false,
          error: 'Administrator accounts cannot be registered publicly. They must be provisioned through secure management tools.'
        });
      }
    }

    // If a flat is provided, verify it exists
    let validFlatId = null;
    if (flat) {
      const flatDoc = await Flat.findById(flat);
      if (!flatDoc) {
        return res.status(400).json({
          success: false,
          error: 'The selected apartment flat was not found.'
        });
      }
      validFlatId = flatDoc._id;
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      flat: validFlatId,
      phone: phone ? phone.trim() : ''
    });

    // If resident and flat assigned, associate user with flat
    if (validFlatId && assignedRole === 'resident') {
      await Flat.findByIdAndUpdate(validFlatId, {
        $addToSet: { residents: user._id },
        occupancyStatus: 'occupied'
      });
    }

    // If staff role, ensure linked Staff technician profile document is created
    if (assignedRole === 'staff') {
      const validJobRoles = [
        'Plumber',
        'Electrician',
        'Carpenter',
        'HVAC Technician',
        'Cleaner',
        'Security Guard',
        'Maintenance Supervisor',
        'Other'
      ];
      const normalizedJobRole = validJobRoles.includes(jobRole) ? jobRole : 'Other';

      // Check if a staff profile already exists with this email
      let staffProfile = await Staff.findOne({
        'contactDetails.email': user.email
      });

      if (staffProfile) {
        staffProfile.user = user._id;
        if (!staffProfile.contactDetails.phone && user.phone) {
          staffProfile.contactDetails.phone = user.phone;
        }
        await staffProfile.save();
      } else {
        await Staff.create({
          name: user.name,
          jobRole: normalizedJobRole,
          contactDetails: {
            email: user.email,
            phone: user.phone || '+1-555-0100'
          },
          availabilityStatus: 'Available',
          user: user._id
        });
      }
    }

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(201).json({
      success: true,
      message: `${assignedRole === 'staff' ? 'Staff technician' : 'Resident'} registered successfully`,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        flat: user.flat,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password'
      });
    }

    // Fetch user including password field for verification
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('flat', 'flatNumber building floor occupancyStatus');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your account is deactivated. Please contact society management.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        flat: user.flat,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('flat', 'flatNumber building floor occupancyStatus');

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
