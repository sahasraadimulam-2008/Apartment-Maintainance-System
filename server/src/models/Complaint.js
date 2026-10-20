const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resident ID is required']
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: [true, 'Flat ID is required']
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: [
          'Plumbing',
          'Electrical',
          'Carpentry',
          'HVAC',
          'Security',
          'Sanitation',
          'Civil/Structural',
          'General',
          'Other'
        ],
        message: '{VALUE} is not a valid complaint category'
      },
      default: 'General'
    },
    priority: {
      type: String,
      required: true,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid priority level'
      },
      default: 'Medium'
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Open', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
        message: '{VALUE} is not a valid complaint status'
      },
      default: 'Open'
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null
    },
    aiSuggestions: {
      category: { type: String, default: null },
      priority: { type: String, default: null },
      suggestedAction: { type: String, default: null },
      confidenceScore: { type: Number, default: null },
      generatedAt: { type: Date, default: null }
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        note: {
          type: String,
          trim: true,
          default: ''
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
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

// Indexes for fast lookup by resident, flat, status, and category
complaintSchema.index({ resident: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ assignedStaff: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
