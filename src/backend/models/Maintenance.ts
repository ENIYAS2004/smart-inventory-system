import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
    },
    maintenanceType: {
      type: String,
      enum: ['Preventive', 'Corrective', 'Emergency'],
      default: 'Preventive',
      required: true,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedDate: {
      type: Date,
      default: null,
    },
    technician: {
      type: String,
      required: [true, 'Technician name or agency is required'],
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'],
      default: 'Scheduled',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    notes: {
      type: String,
      default: '',
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
