import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Location code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    floor: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      default: 30,
    },
    inCharge: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Location = mongoose.model('Location', locationSchema);
