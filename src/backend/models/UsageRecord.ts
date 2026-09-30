import mongoose from 'mongoose';

const usageRecordSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'CHECK_OUT',
        'CHECK_IN',
        'STATUS_CHANGE',
        'LOCATION_CHANGE',
        'MAINTENANCE',
        'ASSET_CREATED',
        'ASSET_UPDATED',
      ],
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    purpose: {
      type: String,
      default: '',
    },
    checkOutDate: {
      type: Date,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      default: null,
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    conditionBefore: {
      type: String,
      default: 'Good',
    },
    conditionAfter: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED'],
      default: 'ACTIVE',
    },
    notes: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const UsageRecord = mongoose.model('UsageRecord', usageRecordSchema);
