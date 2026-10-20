const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true,
      maxlength: [3000, 'Message cannot exceed 3000 characters']
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required']
    },
    targetAudience: {
      type: String,
      enum: {
        values: ['All', 'Residents', 'Staff'],
        message: '{VALUE} is not a valid target audience'
      },
      default: 'All'
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Normal', 'Urgent'],
        message: '{VALUE} is not a valid priority level'
      },
      default: 'Normal'
    },
    publicationDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
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

announcementSchema.index({ isActive: 1, publicationDate: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;
