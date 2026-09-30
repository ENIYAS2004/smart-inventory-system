import { Router, Request, Response } from 'express';
import { seedDatabase } from '../seed/seedData';
import { Asset } from '../models/Asset';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Location } from '../models/Location';
import { Maintenance } from '../models/Maintenance';
import { UsageRecord } from '../models/UsageRecord';
import mongoose from 'mongoose';

const router = Router();

router.get('/status', async (req: Request, res: Response) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const [assets, users, depts, locations, maintenance, usage] = await Promise.all([
      Asset.countDocuments(),
      User.countDocuments(),
      Department.countDocuments(),
      Location.countDocuments(),
      Maintenance.countDocuments(),
      UsageRecord.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      status: 'operational',
      database: isConnected ? 'Connected (MongoDB)' : 'Disconnected',
      records: {
        assets,
        users,
        departments: depts,
        locations,
        maintenance,
        usage,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/seed', async (req: Request, res: Response) => {
  try {
    // Force clear & re-seed
    await Promise.all([
      Asset.deleteMany({}),
      Department.deleteMany({}),
      Location.deleteMany({}),
      User.deleteMany({}),
      Maintenance.deleteMany({}),
      UsageRecord.deleteMany({}),
    ]);

    await seedDatabase();

    return res.status(200).json({
      success: true,
      message: 'Demo college dataset re-seeded successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
