import { Response } from 'express';
import { Asset } from '../models/Asset';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export async function getStockOverview(req: AuthRequest, res: Response) {
  try {
    const { lowStockOnly, department, category, search } = req.query;
    const query: any = {};

    if (department) query.department = department;
    if (category) query.category = category;

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: searchRegex }, { assetId: searchRegex }, { model: searchRegex }];
    }

    if (lowStockOnly === 'true') {
      query.$expr = { $lte: ['$availableQuantity', '$minimumStockLevel'] };
    }

    const items = await Asset.find(query)
      .populate('department', 'name code')
      .populate('location', 'name code roomNumber')
      .sort({ availableQuantity: 1, name: 1 });

    const totalStockUnits = items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const availableUnits = items.reduce((acc, curr) => acc + (curr.availableQuantity || 0), 0);
    const lowStockCount = items.filter((item) => item.availableQuantity <= item.minimumStockLevel).length;

    const mapped = items.map((item) => ({
      _id: item._id,
      assetId: item.assetId,
      name: item.name,
      category: item.category,
      department: item.department,
      location: item.location,
      quantity: item.quantity,
      availableQuantity: item.availableQuantity,
      minimumStockLevel: item.minimumStockLevel,
      unit: item.unit,
      status: item.status,
      condition: item.condition,
      isLowStock: item.availableQuantity <= item.minimumStockLevel,
      updatedAt: item.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      stock: mapped,
      metrics: {
        totalItems: items.length,
        totalStockUnits,
        availableUnits,
        lowStockCount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function adjustStock(req: AuthRequest, res: Response) {
  try {
    const { assetId, adjustmentType, amount, reason } = req.body;
    // adjustmentType: 'RESTOCK' (add) | 'CONSUME' (subtract) | 'SET' (override)

    if (!assetId || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Asset ID and amount are required.' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const numAmount = Math.max(0, parseInt(amount, 10));
    const oldQty = asset.quantity;
    const oldAvail = asset.availableQuantity;

    if (adjustmentType === 'RESTOCK') {
      asset.quantity += numAmount;
      asset.availableQuantity += numAmount;
    } else if (adjustmentType === 'CONSUME') {
      if (numAmount > asset.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot consume ${numAmount} ${asset.unit}. Only ${asset.availableQuantity} available in stock.`,
        });
      }
      asset.quantity = Math.max(0, asset.quantity - numAmount);
      asset.availableQuantity = Math.max(0, asset.availableQuantity - numAmount);
    } else if (adjustmentType === 'SET') {
      const diff = numAmount - asset.quantity;
      asset.quantity = numAmount;
      asset.availableQuantity = Math.max(0, asset.availableQuantity + diff);
    }

    await asset.save();

    // Check low stock condition
    if (asset.availableQuantity <= asset.minimumStockLevel) {
      await Notification.create({
        title: `Low Stock Alert: ${asset.name}`,
        message: `${asset.name} (${asset.assetId}) reached critical stock level: ${asset.availableQuantity} ${asset.unit} remaining.`,
        type: 'LOW_STOCK',
        priority: 'warning',
        entityType: 'Asset',
        entityId: asset._id.toString(),
        link: `/assets/${asset._id}`,
      });
    }

    await logAudit({
      user: req.user,
      action: 'STOCK_ADJUSTED',
      entity: 'Asset',
      entityId: asset.assetId,
      details: `${req.user?.name} adjusted stock for ${asset.name} (${adjustmentType}: ${numAmount} ${asset.unit}). Reason: ${reason || 'General inventory adjustment'} (Qty: ${oldQty} -> ${asset.quantity})`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Stock level for ${asset.name} updated successfully.`,
      asset,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
