import { Response } from 'express';
import { Location } from '../models/Location';
import { Asset } from '../models/Asset';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export async function getLocations(req: AuthRequest, res: Response) {
  try {
    const { department } = req.query;
    const filter: any = {};
    if (department) filter.department = department;

    const locations = await Location.find(filter).populate('department', 'name code').sort({ name: 1 });

    const locationsWithCounts = await Promise.all(
      locations.map(async (loc) => {
        const assetCount = await Asset.countDocuments({ location: loc._id });
        return {
          ...loc.toObject(),
          assetCount,
        };
      })
    );

    return res.status(200).json({ success: true, locations: locationsWithCounts });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getLocationById(req: AuthRequest, res: Response) {
  try {
    const loc = await Location.findById(req.params.id).populate('department', 'name code');
    if (!loc) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    const assets = await Asset.find({ location: loc._id }).select('name assetId category status condition');
    return res.status(200).json({ success: true, location: { ...loc.toObject(), assets } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createLocation(req: AuthRequest, res: Response) {
  try {
    const { name, code, department, floor, roomNumber, capacity, inCharge, description } = req.body;

    if (!name || !code || !department || !floor || !roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, department, floor, and room number are required.',
      });
    }

    const existing = await Location.findOne({
      $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Location with this name or code already exists.' });
    }

    const newLoc = await Location.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      department,
      floor,
      roomNumber,
      capacity: capacity || 30,
      inCharge: inCharge || '',
      description: description || '',
    });

    await logAudit({
      user: req.user,
      action: 'LOCATION_CREATED',
      entity: 'Location',
      entityId: newLoc._id.toString(),
      details: `Created new location: ${newLoc.name} (${newLoc.roomNumber})`,
      ipAddress: req.ip,
    });

    const populated = await newLoc.populate('department', 'name code');
    return res.status(201).json({ success: true, location: populated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateLocation(req: AuthRequest, res: Response) {
  try {
    const loc = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(
      'department',
      'name code'
    );

    if (!loc) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    await logAudit({
      user: req.user,
      action: 'LOCATION_UPDATED',
      entity: 'Location',
      entityId: loc._id.toString(),
      details: `Updated location details: ${loc.name}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, location: loc });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteLocation(req: AuthRequest, res: Response) {
  try {
    const assetCount = await Asset.countDocuments({ location: req.params.id });
    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete location: ${assetCount} assets are currently housed here. Relocate them first.`,
      });
    }

    const loc = await Location.findByIdAndDelete(req.params.id);
    if (!loc) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    await logAudit({
      user: req.user,
      action: 'LOCATION_DELETED',
      entity: 'Location',
      entityId: req.params.id,
      details: `Deleted location: ${loc.name}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, message: 'Location deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
