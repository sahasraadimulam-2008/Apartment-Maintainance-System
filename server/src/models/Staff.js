const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Staff member name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    contactDetails: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Please provide a valid email address'
        ]
      },
      phone: {
        type: String,
        required: [true, 'Staff contact phone number is required'],
        trim: true
      }
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      enum: {
        values: [
          'Plumber',
          'Electrician',
          'Carpenter',
          'HVAC Technician',
          'Cleaner',
          'Security Guard',
          'Maintenance Supervisor',
          'Other'
        ],
        message: '{VALUE} is not a valid staff job role'
      }
    },
    availabilityStatus: {
      type: String,
      enum: {
        values: ['Available', 'On Duty', 'On Leave', 'Unavailable'],
        message: '{VALUE} is not a valid availability status'
      },
      default: 'Available'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // Optional link to User login account if staff has system access
    },
    assignedComplaints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
      }
    ]
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

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;
