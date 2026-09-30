import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: [true, 'Asset ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Computing Equipment',
        'Laboratory Instruments',
        'Networking & Servers',
        'Audio-Visual & Presentation',
        'Power & Backup',
        'Tools & Machinery',
        'Furniture & Fixtures',
        'Consumables & Supplies',
      ],
    },
    description: {
      type: String,
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location is required'],
    },
    manufacturer: {
      type: String,
      default: '',
    },
    model: {
      type: String,
      default: '',
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    purchaseCost: {
      type: Number,
      required: [true, 'Purchase cost is required'],
      min: 0,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    minimumStockLevel: {
      type: Number,
      default: 1,
      min: 0,
    },
    unit: {
      type: String,
      default: 'Units',
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
      default: 'Good',
    },
    status: {
      type: String,
      enum: ['Available', 'In Use', 'Under Maintenance', 'Damaged', 'Retired'],
      default: 'Available',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedDate: {
      type: Date,
      default: null,
    },
    warrantyExpiry: {
      type: Date,
      default: null,
    },
    lastMaintenanceDate: {
      type: Date,
      default: null,
    },
    nextMaintenanceDate: {
      type: Date,
      default: null,
    },
    qrCode: {
      type: String,
      default: '',
    },
    barcode: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for search
assetSchema.index({ name: 'text', assetId: 'text', serialNumber: 'text', manufacturer: 'text', model: 'text' });

export const Asset = mongoose.model('Asset', assetSchema);
