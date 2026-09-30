import { Router } from 'express';
import {
  getAssets,
  getAssetById,
  getAssetByScanCode,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../controllers/assetController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssets);
router.get('/scan/:code', getAssetByScanCode);
router.get('/:id', getAssetById);
router.post('/', authorizeRoles('ADMIN', 'STAFF', 'DEPARTMENT_HEAD'), createAsset);
router.put('/:id', authorizeRoles('ADMIN', 'STAFF', 'DEPARTMENT_HEAD'), updateAsset);
router.delete('/:id', authorizeRoles('ADMIN'), deleteAsset);

export default router;
