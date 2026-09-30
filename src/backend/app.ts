import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import departmentRoutes from './routes/departmentRoutes';
import locationRoutes from './routes/locationRoutes';
import assetRoutes from './routes/assetRoutes';
import usageRoutes from './routes/usageRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import stockRoutes from './routes/stockRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import auditRoutes from './routes/auditRoutes';
import systemRoutes from './routes/systemRoutes';

export function createExpressApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/assets', assetRoutes);
  app.use('/api/usage', usageRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/stock', stockRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/system', systemRoutes);

  // Centralized Error Handling
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled API Error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error occurred.',
    });
  });

  return app;
}
