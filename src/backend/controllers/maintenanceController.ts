import { Response } from 'express';
import { Maintenance } from '../models/Maintenance';
import { Asset } from '../models/Asset';
import { UsageRecord } from '../models/UsageRecord';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export async function getMaintenanceRecords(req: AuthRequest, res: Response) {
  try {
    const { status, priority, assetId, type, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assetId) query.asset = assetId;
    if (type) query.maintenanceType = type;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const pageSize = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * pageSize;

    // Check and update any scheduled records whose dueDate < now to 'Overdue' automatically
    const now = new Date();
    await Maintenance.updateMany(
      {
        status: { $in: ['Scheduled', 'In Progress'] },
        dueDate: { $lt: now },
      },
      { status: 'Overdue' }
    );

    const [records, total] = await Promise.all([
      Maintenance.find(query)
        .populate({
          path: 'asset',
          select: 'name assetId category serialNumber department location status condition',
          populate: [
            { path: 'department', select: 'name code' },
            { path: 'location', select: 'name code roomNumber' },
          ],
        })
        .populate('scheduledBy', 'name email designation')
        .sort({ dueDate: 1, scheduledDate: -1 })
        .skip(skip)
        .limit(pageSize),
      Maintenance.countDocuments(query),
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

export async function scheduleMaintenance(req: AuthRequest, res: Response) {
  try {
    const {
      assetId,
      maintenanceType = 'Preventive',
      scheduledDate,
      dueDate,
      technician,
      cost = 0,
      description,
      priority = 'Medium',
      notes = '',
    } = req.body;

    if (!assetId || !dueDate || !technician || !description) {
      return res.status(400).json({
        success: false,
        message: 'Asset, due date, technician, and description are required.',
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const maintenance = await Maintenance.create({
      asset: asset._id,
      maintenanceType,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      dueDate: new Date(dueDate),
      technician,
      cost: Number(cost) || 0,
      description,
      priority,
      status: 'Scheduled',
      notes,
      scheduledBy: req.user?._id,
    });

    // Update asset status to 'Under Maintenance' and nextMaintenanceDate
    asset.status = 'Under Maintenance';
    asset.nextMaintenanceDate = new Date(dueDate);
    await asset.save();

    // Create a usage history record tracking maintenance entry
    await UsageRecord.create({
      asset: asset._id,
      user: req.user?._id,
      action: 'MAINTENANCE',
      department: asset.department,
      location: asset.location,
      purpose: `Scheduled ${maintenanceType} Maintenance: ${description}`,
      conditionBefore: asset.condition,
      conditionAfter: asset.condition,
      status: 'RETURNED',
      notes: `Technician: ${technician}. Due by: ${new Date(dueDate).toLocaleDateString()}`,
      recordedBy: req.user?._id,
    });

    // Notification for upcoming maintenance
    await Notification.create({
      title: `Maintenance Scheduled: ${asset.name}`,
      message: `${maintenanceType} maintenance scheduled for ${asset.name} (${asset.assetId}), due on ${new Date(dueDate).toLocaleDateString()}. Technician: ${technician}.`,
      type: 'MAINTENANCE_DUE',
      priority: priority === 'Critical' || priority === 'High' ? 'danger' : 'warning',
      entityType: 'Maintenance',
      entityId: maintenance._id.toString(),
      link: '/maintenance',
    });

    await logAudit({
      user: req.user,
      action: 'MAINTENANCE_SCHEDULED',
      entity: 'Maintenance',
      entityId: maintenance._id.toString(),
      details: `${req.user?.name} scheduled ${maintenanceType} maintenance for ${asset.name} (${asset.assetId})`,
      ipAddress: req.ip,
    });

    const populated = await Maintenance.findById(maintenance._id)
      .populate('asset')
      .populate('scheduledBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Maintenance scheduled successfully.',
      maintenance: populated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateMaintenance(req: AuthRequest, res: Response) {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('asset');

    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }

    await logAudit({
      user: req.user,
      action: 'MAINTENANCE_UPDATED',
      entity: 'Maintenance',
      entityId: maintenance._id.toString(),
      details: `${req.user?.name} updated maintenance ticket #${maintenance._id}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, maintenance });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function completeMaintenance(req: AuthRequest, res: Response) {
  try {
    const { cost, notes, finalCondition = 'Good' } = req.body;

    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }

    const now = new Date();
    maintenance.status = 'Completed';
    maintenance.completedDate = now;
    if (cost !== undefined) maintenance.cost = Number(cost);
    if (notes) {
      maintenance.notes = (maintenance.notes ? maintenance.notes + ' | ' : '') + `Completion Note: ${notes}`;
    }
    await maintenance.save();

    // Update asset
    const asset = await Asset.findById(maintenance.asset);
    if (asset) {
      asset.status = 'Available';
      asset.condition = finalCondition;
      asset.lastMaintenanceDate = now;
      await asset.save();

      // Record in usage history
      await UsageRecord.create({
        asset: asset._id,
        user: req.user?._id,
        action: 'MAINTENANCE',
        department: asset.department,
        location: asset.location,
        purpose: `Completed maintenance: ${maintenance.description}`,
        conditionBefore: asset.condition,
        conditionAfter: finalCondition,
        status: 'RETURNED',
        notes: `Maintenance concluded by ${maintenance.technician}. Total cost: ₹${maintenance.cost}`,
        recordedBy: req.user?._id,
      });
    }

    await logAudit({
      user: req.user,
      action: 'MAINTENANCE_COMPLETED',
      entity: 'Maintenance',
      entityId: maintenance._id.toString(),
      details: `${req.user?.name} completed maintenance for asset ${asset?.name || ''} (${asset?.assetId || ''})`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Maintenance successfully marked as completed. Asset restored to Available status.',
      maintenance,
      asset,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteMaintenance(req: AuthRequest, res: Response) {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }

    await logAudit({
      user: req.user,
      action: 'MAINTENANCE_DELETED',
      entity: 'Maintenance',
      entityId: req.params.id,
      details: `${req.user?.name} deleted maintenance record #${req.params.id}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, message: 'Maintenance record deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
