const Flat = require('../models/Flat');
const User = require('../models/User');

/**
 * @desc    Create a new flat
 * @route   POST /api/flats
 * @access  Private/Admin
 */
const createFlat = async (req, res, next) => {
  try {
    const { flatNumber, building, floor, occupancyStatus, bhkType, squareFootage } = req.body;

    // Check duplicate flat in same building
    const existingFlat = await Flat.findOne({
      building: building.trim(),
      flatNumber: flatNumber.trim()
    });

    if (existingFlat) {
      return res.status(409).json({
        success: false,
        error: `Flat ${flatNumber} in building ${building} already exists`
      });
    }

    const flat = await Flat.create({
      flatNumber: flatNumber.trim(),
      building: building.trim(),
      floor,
      occupancyStatus: occupancyStatus || 'vacant',
      bhkType: bhkType || '2BHK',
      squareFootage: squareFootage || 0
    });

    return res.status(201).json({
      success: true,
      message: 'Flat created successfully',
      data: flat
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all flats (with pagination and filters)
 * @route   GET /api/flats
 * @access  Private (Admin, Staff, Resident)
 */
const getFlats = async (req, res, next) => {
  try {
    const { building, occupancyStatus, floor, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (building) filter.building = new RegExp(building.trim(), 'i');
    if (occupancyStatus) filter.occupancyStatus = occupancyStatus;
    if (floor !== undefined) filter.floor = Number(floor);

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [flats, total] = await Promise.all([
      Flat.find(filter)
        .populate('residents', 'name email phone')
        .sort({ building: 1, flatNumber: 1 })
        .skip(skip)
        .limit(limitNum),
      Flat.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: flats.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      },
      data: flats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single flat by ID
 * @route   GET /api/flats/:id
 * @access  Private
 */
const getFlatById = async (req, res, next) => {
  try {
    const flat = await Flat.findById(req.params.id).populate(
      'residents',
      'name email phone role'
    );

    if (!flat) {
      return res.status(404).json({
        success: false,
        error: 'Flat not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: flat
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update flat details
 * @route   PUT /api/flats/:id
 * @access  Private/Admin
 */
const updateFlat = async (req, res, next) => {
  try {
    const { flatNumber, building, floor, occupancyStatus, bhkType, squareFootage } = req.body;

    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({
        success: false,
        error: 'Flat not found'
      });
    }

    if (flatNumber) flat.flatNumber = flatNumber.trim();
    if (building) flat.building = building.trim();
    if (floor !== undefined) flat.floor = floor;
    if (occupancyStatus) flat.occupancyStatus = occupancyStatus;
    if (bhkType) flat.bhkType = bhkType;
    if (squareFootage !== undefined) flat.squareFootage = squareFootage;

    await flat.save();

    return res.status(200).json({
      success: true,
      message: 'Flat updated successfully',
      data: flat
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a flat
 * @route   DELETE /api/flats/:id
 * @access  Private/Admin
 */
const deleteFlat = async (req, res, next) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({
        success: false,
        error: 'Flat not found'
      });
    }

    if (flat.residents && flat.residents.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete flat that currently has associated residents. Please reassign residents first.'
      });
    }

    await Flat.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Flat removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign a resident to flat
 * @route   POST /api/flats/:id/assign-resident
 * @access  Private/Admin
 */
const assignResident = async (req, res, next) => {
  try {
    const { residentId } = req.body;
    if (!residentId) {
      return res.status(400).json({
        success: false,
        error: 'residentId is required'
      });
    }

    const [flat, resident] = await Promise.all([
      Flat.findById(req.params.id),
      User.findById(residentId)
    ]);

    if (!flat) {
      return res.status(404).json({ success: false, error: 'Flat not found' });
    }
    if (!resident) {
      return res.status(404).json({ success: false, error: 'Resident user not found' });
    }

    // Add resident to flat if not already present
    if (!flat.residents.includes(resident._id)) {
      flat.residents.push(resident._id);
      flat.occupancyStatus = 'occupied';
      await flat.save();
    }

    // Update resident flat reference
    resident.flat = flat._id;
    await resident.save();

    return res.status(200).json({
      success: true,
      message: `Resident ${resident.name} assigned to Flat ${flat.building}-${flat.flatNumber}`,
      data: flat
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFlat,
  getFlats,
  getFlatById,
  updateFlat,
  deleteFlat,
  assignResident
};
