const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
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
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    billingPeriod: {
      type: String,
      required: [true, 'Billing period is required (e.g., October 2026)'],
      trim: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Paid', 'Overdue', 'Failed', 'Cancelled'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'Pending'
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit Card', 'Debit Card', 'Other', null],
        message: '{VALUE} is not a valid payment method'
      },
      default: null
    },
    paymentReference: {
      type: String,
      trim: true,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ''
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

paymentSchema.index({ resident: 1, billingPeriod: 1 });
paymentSchema.index({ flat: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
