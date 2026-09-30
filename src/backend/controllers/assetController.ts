import { Response } from 'express';
import { Asset } from '../models/Asset';
import { Maintenance } from '../models/Maintenance';
import { UsageRecord } from '../models/UsageRecord';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import { generateQRCode, generateBarcodeString } from '../utils/codeGenerators';

export async function getAssets(req: AuthRequest, res: Response) {
  try {
    const {
      search,
      category,
      department,
      location,
      status,
      condition,
      lowStock,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query: any = {};

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { assetId: searchRegex },
        { serialNumber: searchRegex },
        { manufacturer: searchRegex },
        { model: searchRegex },
      ];
    }

    if (category) query.category = category;
    if (department) query.department = department;
    if (location) query.location = location;
    if (status) query.status = status;
    if (condition) query.condition = condition;

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$availableQuantity', '$minimumStockLevel'] };
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const pageSize = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * pageSize;

    const sortOption: any = {};
    sortOption[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;

    const [assets, totalCount] = await Promise.all([
      Asset.find(query)
        .populate('department', 'name code')
        .populate('location', 'name code roomNumber floor')
        .populate('assignedTo', 'name email designation')
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize),
      Asset.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      assets,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAssetById(req: AuthRequest, res: Response) {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('department')
      .populate('location')
      .populate('assignedTo', 'name email designation phone departmentName');

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Fetch related usage records and maintenance history
    const [usageHistory, maintenanceHistory] = await Promise.all([
      UsageRecord.find({ asset: asset._id })
        .populate('user', 'name email designation')
        .populate('recordedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(20),
      Maintenance.find({ asset: asset._id })
        .populate('scheduledBy', 'name email')
        .sort({ scheduledDate: -1 })
        .limit(20),
    ]);

    return res.status(200).json({
      success: true,
      asset,
      usageHistory,
      maintenanceHistory,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAssetByScanCode(req: AuthRequest, res: Response) {
  try {
    let code = String(req.params.code || '').trim();

    // Check if code is JSON payload from QR scan
    try {
      const parsed = JSON.parse(code);
      if (parsed.assetId) {
        code = parsed.assetId;
      }
    } catch {
      // not JSON, use raw string
    }

    const asset = await Asset.findOne({
      $or: [
        { assetId: new RegExp(`^${code}$`, 'i') },
        { serialNumber: new RegExp(`^${code}$`, 'i') },
        { barcode: new RegExp(`^${code}$`, 'i') },
      ],
    })
      .populate('department')
      .populate('location')
      .populate('assignedTo', 'name email designation');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: `No asset found matching tag or barcode: "${code}"`,
      });
    }

    return res.status(200).json({ success: true, asset });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createAsset(req: AuthRequest, res: Response) {
  try {
    const {
      name,
      category,
      description,
      department,
      location,
      manufacturer,
      model,
      serialNumber,
      purchaseDate,
      purchaseCost,
      quantity = 1,
      minimumStockLevel = 1,
      unit = 'Units',
      condition = 'Good',
      status = 'Available',
      warrantyExpiry,
      nextMaintenanceDate,
    } = req.body;

    let assetId = req.body.assetId;

    // Auto-generate Asset ID if not provided: AST-2026-XXXX
    if (!assetId) {
      const count = await Asset.countDocuments();
      const seq = String(count + 1).padStart(4, '0');
      assetId = `AST-${new Date().getFullYear()}-${seq}`;
    } else {
      assetId = assetId.trim().toUpperCase();
    }

    // Check uniqueness
    const existing = await Asset.findOne({
      $or: [{ assetId }, { serialNumber: serialNumber.trim() }],
    });

    if (existing) {
      if (existing.assetId === assetId) {
        return res.status(409).json({ success: false, message: `Asset ID ${assetId} already exists.` });
      }
      return res.status(409).json({ success: false, message: `Serial Number ${serialNumber} is already registered.` });
    }

    const qrCode = await generateQRCode(assetId, name);
    const barcode = generateBarcodeString(assetId);

    const newAsset = new Asset({
      assetId,
      name: name.trim(),
      category,
      description: description || '',
      department,
      location,
      manufacturer: manufacturer || '',
      model: model || '',
      serialNumber: serialNumber.trim(),
      purchaseDate: purchaseDate || new Date(),
      purchaseCost: Number(purchaseCost) || 0,
      quantity: Number(quantity) || 1,
      availableQuantity: Number(quantity) || 1,
      minimumStockLevel: Number(minimumStockLevel) || 1,
      unit: unit || 'Units',
      condition: condition || 'Good',
      status: status || 'Available',
      warrantyExpiry: warrantyExpiry || null,
      nextMaintenanceDate: nextMaintenanceDate || null,
      qrCode,
      barcode,
    });

    const saved = await newAsset.save();

    // Check if low stock immediately
    if (saved.availableQuantity <= saved.minimumStockLevel) {
      await Notification.create({
        title: `Low Stock: ${saved.name}`,
        message: `${saved.name} (${saved.assetId}) has only ${saved.availableQuantity} ${saved.unit} available (threshold: ${saved.minimumStockLevel}).`,
        type: 'LOW_STOCK',
        priority: 'warning',
        entityType: 'Asset',
        entityId: saved._id.toString(),
        link: `/assets/${saved._id}`,
      });
    }

    // Log Usage record as creation
    await UsageRecord.create({
      asset: saved._id,
      user: req.user?._id,
      action: 'ASSET_CREATED',
      department: saved.department,
      location: saved.location,
      purpose: 'Initial registration into Institutional Asset Register',
      conditionBefore: saved.condition,
      conditionAfter: saved.condition,
      status: 'RETURNED',
      notes: `Asset registered with serial number ${saved.serialNumber}.`,
      recordedBy: req.user?._id,
    });

    // Log Audit
    await logAudit({
      user: req.user,
      action: 'ASSET_CREATED',
      entity: 'Asset',
      entityId: saved.assetId,
      details: `${req.user?.name} added new asset: ${saved.name} (${saved.assetId})`,
      ipAddress: req.ip,
    });

    const populated = await Asset.findById(saved._id).populate('department').populate('location');
    return res.status(201).json({ success: true, asset: populated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateAsset(req: AuthRequest, res: Response) {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Check if serial number collision
    if (req.body.serialNumber && req.body.serialNumber !== asset.serialNumber) {
      const serialConflict = await Asset.findOne({
        serialNumber: req.body.serialNumber.trim(),
        _id: { $ne: asset._id },
      });
      if (serialConflict) {
        return res.status(409).json({ success: false, message: 'Serial number already registered on another asset.' });
      }
    }

    const previousStatus = asset.status;
    const previousLocation = asset.location?.toString();

    // Update fields
    Object.assign(asset, req.body);

    // If availableQuantity changed and fell below threshold
    if (asset.availableQuantity <= asset.minimumStockLevel && asset.availableQuantity > 0) {
      await Notification.create({
        title: `Low Stock Alert: ${asset.name}`,
        message: `${asset.name} (${asset.assetId}) has reached low stock limit (${asset.availableQuantity} ${asset.unit}).`,
        type: 'LOW_STOCK',
        priority: 'warning',
        entityType: 'Asset',
        entityId: asset._id.toString(),
        link: `/assets/${asset._id}`,
      });
    }

    await asset.save();

    // Record usage action if status or location changed
    if (previousStatus !== asset.status || previousLocation !== asset.location?.toString()) {
      await UsageRecord.create({
        asset: asset._id,
        user: req.user?._id,
        action: previousStatus !== asset.status ? 'STATUS_CHANGE' : 'LOCATION_CHANGE',
        department: asset.department,
        location: asset.location,
        purpose: 'Asset configuration updated via management portal',
        conditionBefore: asset.condition,
        conditionAfter: asset.condition,
        status: 'RETURNED',
        notes: `Status changed from ${previousStatus} to ${asset.status}`,
        recordedBy: req.user?._id,
      });
    }

    await logAudit({
      user: req.user,
      action: 'ASSET_UPDATED',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `${req.user?.name} updated asset details: ${asset.name} (${asset.assetId})`,
      ipAddress: req.ip,
    });

    const populated = await Asset.findById(asset._id)
      .populate('department')
      .populate('location')
      .populate('assignedTo', 'name email designation');

    return res.status(200).json({ success: true, asset: populated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteAsset(req: AuthRequest, res: Response) {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    if (asset.status === 'In Use') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an asset that is currently checked out (In Use). Please check it in first.',
      });
    }

    await Asset.findByIdAndDelete(req.params.id);

    // Also remove related active records or cascade
    await Promise.all([
      Maintenance.deleteMany({ asset: req.params.id }),
      UsageRecord.deleteMany({ asset: req.params.id }),
    ]);

    await logAudit({
      user: req.user,
      action: 'ASSET_DELETED',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `${req.user?.name} deleted asset: ${asset.name} (${asset.assetId})`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, message: `Asset ${asset.assetId} deleted successfully.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
