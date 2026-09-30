import { Response } from 'express';
import { Asset } from '../models/Asset';
import { Department } from '../models/Department';
import { Maintenance } from '../models/Maintenance';
import { UsageRecord } from '../models/UsageRecord';
import { AuthRequest } from '../middleware/auth';

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // If user is DEPARTMENT_HEAD, optionally filter by their department
    const deptFilter: any = {};
    if (req.user?.role === 'DEPARTMENT_HEAD' && req.user?.department) {
      deptFilter.department = req.user.department;
    }

    const [
      totalAssets,
      availableAssets,
      inUseAssets,
      underMaintenanceAssets,
      damagedAssets,
      retiredAssets,
      allAssetsForStock,
      maintenanceDueSoon,
      maintenanceOverdue,
      recentActivity,
      recentCheckouts,
      upcomingMaintenance,
      recentlyAddedAssets,
      departments,
    ] = await Promise.all([
      Asset.countDocuments(deptFilter),
      Asset.countDocuments({ ...deptFilter, status: 'Available' }),
      Asset.countDocuments({ ...deptFilter, status: 'In Use' }),
      Asset.countDocuments({ ...deptFilter, status: 'Under Maintenance' }),
      Asset.countDocuments({ ...deptFilter, status: 'Damaged' }),
      Asset.countDocuments({ ...deptFilter, status: 'Retired' }),
      Asset.find(deptFilter).select('name assetId quantity availableQuantity minimumStockLevel unit department status'),
      Maintenance.countDocuments({
        status: { $in: ['Scheduled', 'In Progress'] },
        dueDate: { $gte: now, $lte: next7Days },
      }),
      Maintenance.countDocuments({
        status: { $in: ['Scheduled', 'In Progress', 'Overdue'] },
        dueDate: { $lt: now },
      }),
      UsageRecord.find()
        .populate('asset', 'name assetId')
        .populate('user', 'name role')
        .sort({ createdAt: -1 })
        .limit(8),
      UsageRecord.find({ action: 'CHECK_OUT', status: 'ACTIVE' })
        .populate('asset', 'name assetId category')
        .populate('user', 'name designation departmentName')
        .sort({ checkOutDate: -1 })
        .limit(6),
      Maintenance.find({
        status: { $in: ['Scheduled', 'In Progress', 'Overdue'] },
      })
        .populate('asset', 'name assetId location')
        .sort({ dueDate: 1 })
        .limit(6),
      Asset.find(deptFilter)
        .populate('department', 'name code')
        .populate('location', 'name roomNumber')
        .sort({ createdAt: -1 })
        .limit(5),
      Department.find().sort({ name: 1 }),
    ]);

    // Low stock items: where availableQuantity <= minimumStockLevel
    const lowStockItems = allAssetsForStock.filter(
      (a) => a.availableQuantity <= a.minimumStockLevel
    );

    // Calculate total valuation
    const totalValuation = allAssetsForStock.reduce((acc, curr: any) => acc + (curr.purchaseCost || 0), 0);

    // Department breakdown
    const departmentDistribution = await Promise.all(
      departments.map(async (d) => {
        const count = await Asset.countDocuments({ department: d._id });
        return {
          id: d._id,
          name: d.name,
          code: d.code,
          count,
        };
      })
    );

    // Category distribution
    const categoryAgg = await Asset.aggregate([
      ...(Object.keys(deptFilter).length ? [{ $match: deptFilter }] : []),
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Status distribution
    const statusDistribution = [
      { status: 'Available', count: availableAssets, color: '#10b981' },
      { status: 'In Use', count: inUseAssets, color: '#3b82f6' },
      { status: 'Under Maintenance', count: underMaintenanceAssets, color: '#f59e0b' },
      { status: 'Damaged', count: damagedAssets, color: '#ef4444' },
      { status: 'Retired', count: retiredAssets, color: '#6b7280' },
    ];

    // Condition distribution
    const conditionAgg = await Asset.aggregate([
      ...(Object.keys(deptFilter).length ? [{ $match: deptFilter }] : []),
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        totalAssets,
        availableAssets,
        inUseAssets,
        underMaintenanceAssets,
        damagedAssets,
        retiredAssets,
        lowStockCount: lowStockItems.length,
        maintenanceDueSoon,
        maintenanceOverdue,
        totalValuation,
      },
      charts: {
        statusDistribution,
        departmentDistribution: departmentDistribution.filter((d) => d.count > 0),
        categoryDistribution: categoryAgg.map((c) => ({ category: c._id, count: c.count })),
        conditionDistribution: conditionAgg.map((c) => ({ condition: c._id, count: c.count })),
      },
      lowStockItems: lowStockItems.slice(0, 5),
      recentActivity,
      recentCheckouts,
      upcomingMaintenance,
      recentlyAddedAssets,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDetailedReports(req: AuthRequest, res: Response) {
  try {
    const { reportType, department, category, status, condition, startDate, endDate } = req.query;

    const query: any = {};
    if (department) query.department = department;
    if (category) query.category = category;
    if (status) query.status = status;
    if (condition) query.condition = condition;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(String(startDate));
      if (endDate) query.createdAt.$lte = new Date(String(endDate));
    }

    if (reportType === 'stock') {
      const stockItems = await Asset.find(query)
        .populate('department', 'name code')
        .populate('location', 'name roomNumber')
        .sort({ availableQuantity: 1 });

      return res.status(200).json({
        success: true,
        reportType: 'stock',
        data: stockItems,
      });
    }

    if (reportType === 'maintenance') {
      const maintenanceQuery: any = {};
      if (status) maintenanceQuery.status = status;
      if (startDate || endDate) {
        maintenanceQuery.scheduledDate = {};
        if (startDate) maintenanceQuery.scheduledDate.$gte = new Date(String(startDate));
        if (endDate) maintenanceQuery.scheduledDate.$lte = new Date(String(endDate));
      }

      const records = await Maintenance.find(maintenanceQuery)
        .populate({
          path: 'asset',
          select: 'name assetId category department',
          populate: { path: 'department', select: 'name code' },
        })
        .populate('scheduledBy', 'name email')
        .sort({ scheduledDate: -1 });

      const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

      return res.status(200).json({
        success: true,
        reportType: 'maintenance',
        totalCost,
        data: records,
      });
    }

    if (reportType === 'usage') {
      const usageRecords = await UsageRecord.find()
        .populate('asset', 'name assetId category')
        .populate('user', 'name email designation departmentName')
        .populate('department', 'name code')
        .populate('location', 'name roomNumber')
        .sort({ createdAt: -1 })
        .limit(100);

      return res.status(200).json({
        success: true,
        reportType: 'usage',
        data: usageRecords,
      });
    }

    if (reportType === 'department') {
      const depts = await Department.find();
      const deptReport = await Promise.all(
        depts.map(async (d) => {
          const assets = await Asset.find({ department: d._id });
          const totalCost = assets.reduce((acc, curr) => acc + (curr.purchaseCost || 0), 0);
          const inUse = assets.filter((a) => a.status === 'In Use').length;
          const underMaint = assets.filter((a) => a.status === 'Under Maintenance').length;
          return {
            department: d.name,
            code: d.code,
            block: d.block,
            totalAssets: assets.length,
            inUse,
            underMaintenance: underMaint,
            totalValuation: totalCost,
          };
        })
      );

      return res.status(200).json({
        success: true,
        reportType: 'department',
        data: deptReport,
      });
    }

    // Default: Asset Report
    const assets = await Asset.find(query)
      .populate('department', 'name code')
      .populate('location', 'name code roomNumber')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const totalValuation = assets.reduce((acc, curr) => acc + (curr.purchaseCost || 0), 0);

    return res.status(200).json({
      success: true,
      reportType: 'assets',
      totalCount: assets.length,
      totalValuation,
      data: assets,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
