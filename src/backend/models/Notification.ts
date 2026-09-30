import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'LOW_STOCK',
        'MAINTENANCE_DUE',
        'MAINTENANCE_OVERDUE',
        'WARRANTY_EXPIRING',
        'DAMAGE_REPORT',
        'STATUS_CHANGE',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    priority: {
      type: String,
      enum: ['info', 'warning', 'danger'],
      default: 'info',
    },
    entityType: {
      type: String,
      default: 'Asset',
    },
    entityId: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    targetRole: {
      type: String,
      enum: ['ALL', 'ADMIN', 'STAFF', 'DEPARTMENT_HEAD'],
      default: 'ALL',
    },
    link: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model('Notification', notificationSchema);
