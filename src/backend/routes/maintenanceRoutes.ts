import { Router } from 'express';
import {
  getMaintenanceRecords,
  scheduleMaintenance,
  updateMaintenance,
  completeMaintenance,
  deleteMaintenance,
} from '../controllers/maintenanceController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getMaintenanceRecords);
router.post('/', authorizeRoles('ADMIN', 'STAFF', 'DEPARTMENT_HEAD'), scheduleMaintenance);
router.put('/:id', authorizeRoles('ADMIN', 'STAFF', 'DEPARTMENT_HEAD'), updateMaintenance);
router.post('/:id/complete', authorizeRoles('ADMIN', 'STAFF', 'DEPARTMENT_HEAD'), completeMaintenance);
router.delete('/:id', authorizeRoles('ADMIN'), deleteMaintenance);

export default router;
