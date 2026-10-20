const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema(
  {
    flatNumber: {
      type: String,
      required: [true, 'Flat number is required'],
      trim: true,
      maxlength: [20, 'Flat number cannot exceed 20 characters']
    },
    building: {
      type: String,
      required: [true, 'Building or block name is required'],
      trim: true,
      maxlength: [50, 'Building name cannot exceed 50 characters']
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required']
    },
    occupancyStatus: {
      type: String,
      enum: {
        values: ['vacant', 'occupied', 'under_maintenance'],
        message: '{VALUE} is not a valid occupancy status'
      },
      default: 'vacant'
    },
    residents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    bhkType: {
      type: String,
      enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Studio', 'Other'],
      default: '2BHK'
    },
    squareFootage: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index to guarantee uniqueness of flat numbers per building/block
flatSchema.index({ building: 1, flatNumber: 1 }, { unique: true });

const Flat = mongoose.model('Flat', flatSchema);
module.exports = Flat;
