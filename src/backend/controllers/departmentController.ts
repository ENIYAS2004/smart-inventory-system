import { Response } from 'express';
import { Department } from '../models/Department';
import { Asset } from '../models/Asset';
import { Location } from '../models/Location';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export async function getDepartments(req: AuthRequest, res: Response) {
  try {
    const departments = await Department.find().sort({ name: 1 });

    // Aggregate counts of assets and locations per department
    const deptsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const assetCount = await Asset.countDocuments({ department: dept._id });
        const locationCount = await Location.countDocuments({ department: dept._id });
        return {
          ...dept.toObject(),
          assetCount,
          locationCount,
        };
      })
    );

    return res.status(200).json({ success: true, departments: deptsWithCounts });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDepartmentById(req: AuthRequest, res: Response) {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    const assets = await Asset.find({ department: dept._id }).select('name assetId category status condition');
    const locations = await Location.find({ department: dept._id });

    return res.status(200).json({
      success: true,
      department: {
        ...dept.toObject(),
        assets,
        locations,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createDepartment(req: AuthRequest, res: Response) {
  try {
    const { name, code, block, headOfDepartment, contactEmail, contactPhone, description } = req.body;

    if (!name || !code || !block) {
      return res.status(400).json({ success: false, message: 'Name, code, and block are required.' });
    }

    const existing = await Department.findOne({
      $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Department with this name or code already exists.' });
    }

    const newDept = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      block: block.trim(),
      headOfDepartment: headOfDepartment || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      description: description || '',
    });

    await logAudit({
      user: req.user,
      action: 'DEPARTMENT_CREATED',
      entity: 'Department',
      entityId: newDept._id.toString(),
      details: `Created new department: ${newDept.name} (${newDept.code})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, department: newDept });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateDepartment(req: AuthRequest, res: Response) {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    await logAudit({
      user: req.user,
      action: 'DEPARTMENT_UPDATED',
      entity: 'Department',
      entityId: dept._id.toString(),
      details: `Updated department details for: ${dept.name}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, department: dept });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteDepartment(req: AuthRequest, res: Response) {
  try {
    const assetCount = await Asset.countDocuments({ department: req.params.id });
    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department: ${assetCount} assets are currently assigned to it.`,
      });
    }

    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    await logAudit({
      user: req.user,
      action: 'DEPARTMENT_DELETED',
      entity: 'Department',
      entityId: req.params.id,
      details: `Deleted department: ${dept.name}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
