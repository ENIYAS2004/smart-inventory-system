import { Response } from 'express';
import { UsageRecord } from '../models/UsageRecord';
import { Asset } from '../models/Asset';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export async function getUsageHistory(req: AuthRequest, res: Response) {
  try {
    const { assetId, userId, action, status, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (assetId) query.asset = assetId;
    if (userId) query.user = userId;
    if (action) query.action = action;
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const pageSize = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * pageSize;

    const [records, total] = await Promise.all([
      UsageRecord.find(query)
        .populate('asset', 'name assetId category serialNumber')
        .populate('user', 'name email designation departmentName')
        .populate('department', 'name code')
        .populate('location', 'name code roomNumber')
        .populate('recordedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      UsageRecord.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      records,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function checkOutAsset(req: AuthRequest, res: Response) {
  try {
    const { assetId, userId, purpose, expectedReturnDate, notes, locationId } = req.body;

    if (!assetId) {
      return res.status(400).json({ success: false, message: 'Asset ID is required.' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // Validation rule: Prevent invalid operations
    if (asset.status === 'In Use') {
      return res.status(400).json({
        success: false,
        message: `Asset ${asset.name} (${asset.assetId}) is already checked out (In Use). Please check it in before reissuing.`,
      });
    }

    if (asset.status === 'Under Maintenance') {
      return res.status(400).json({
        success: false,
        message: `Asset ${asset.name} is currently Under Maintenance and cannot be checked out.`,
      });
    }

    if (asset.status === 'Damaged' || asset.status === 'Retired') {
      return res.status(400).json({
        success: false,
        message: `Asset is marked as ${asset.status} and cannot be issued.`,
      });
    }

    if (asset.availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `No available units left for asset ${asset.name}.`,
      });
    }

    const targetUserId = userId || req.user?._id;

    // Create active usage circulation record
    const usage = await UsageRecord.create({
      asset: asset._id,
      user: targetUserId,
      action: 'CHECK_OUT',
      department: asset.department,
      location: locationId || asset.location,
      purpose: purpose || 'General academic laboratory use',
      checkOutDate: new Date(),
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      conditionBefore: asset.condition,
      status: 'ACTIVE',
      notes: notes || '',
      recordedBy: req.user?._id,
    });

    // Update asset
    asset.status = 'In Use';
    asset.availableQuantity = Math.max(0, asset.availableQuantity - 1);
    asset.assignedTo = targetUserId;
    asset.assignedDate = new Date();
    await asset.save();

    await logAudit({
      user: req.user,
      action: 'CHECK_OUT',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `${req.user?.name} checked out asset "${asset.name}" (${asset.assetId}) for purpose: ${purpose || 'Laboratory use'}`,
      ipAddress: req.ip,
    });

    const populated = await UsageRecord.findById(usage._id)
      .populate('asset')
      .populate('user', 'name email designation')
      .populate('recordedBy', 'name');

    return res.status(200).json({
      success: true,
      message: `Asset ${asset.assetId} successfully checked out.`,
      usage: populated,
      asset,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function checkInAsset(req: AuthRequest, res: Response) {
  try {
    const { assetId, conditionAfter, notes, locationId } = req.body;

    if (!assetId) {
      return res.status(400).json({ success: false, message: 'Asset ID is required.' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // Find the latest active check-out record
    const activeUsage = await UsageRecord.findOne({
      asset: asset._id,
      action: 'CHECK_OUT',
      status: 'ACTIVE',
    }).sort({ createdAt: -1 });

    const now = new Date();
    const finalCondition = conditionAfter || asset.condition;

    if (activeUsage) {
      activeUsage.status = 'RETURNED';
      activeUsage.actualReturnDate = now;
      activeUsage.conditionAfter = finalCondition;
      if (notes) {
        activeUsage.notes = (activeUsage.notes ? activeUsage.notes + ' | ' : '') + `Return Note: ${notes}`;
      }
      await activeUsage.save();
    }

    // Create a CHECK_IN audit record in UsageRecord
    await UsageRecord.create({
      asset: asset._id,
      user: activeUsage ? activeUsage.user : req.user?._id,
      action: 'CHECK_IN',
      department: asset.department,
      location: locationId || asset.location,
      purpose: 'Asset checked in / returned to inventory',
      checkOutDate: activeUsage ? activeUsage.checkOutDate : now,
      actualReturnDate: now,
      conditionBefore: activeUsage ? activeUsage.conditionBefore : asset.condition,
      conditionAfter: finalCondition,
      status: 'RETURNED',
      notes: notes || 'Returned to department inventory rack.',
      recordedBy: req.user?._id,
    });

    // Update asset status
    if (finalCondition === 'Poor' || finalCondition === 'Critical') {
      asset.status = 'Damaged';
      await Notification.create({
        title: `Asset Returned Damaged: ${asset.name}`,
        message: `${asset.name} (${asset.assetId}) was returned in ${finalCondition} condition. Inspection required.`,
        type: 'DAMAGE_REPORT',
        priority: 'danger',
        entityType: 'Asset',
        entityId: asset._id.toString(),
        link: `/assets/${asset._id}`,
      });
    } else {
      asset.status = 'Available';
    }

    asset.condition = finalCondition;
    asset.availableQuantity = Math.min(asset.quantity, asset.availableQuantity + 1);
    asset.assignedTo = null;
    asset.assignedDate = null;
    if (locationId) {
      asset.location = locationId;
    }
    await asset.save();

    await logAudit({
      user: req.user,
      action: 'CHECK_IN',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `${req.user?.name} checked in asset "${asset.name}" (${asset.assetId}) in ${finalCondition} condition.`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Asset ${asset.assetId} successfully checked in. Status is now ${asset.status}.`,
      asset,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
