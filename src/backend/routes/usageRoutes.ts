import { Router } from 'express';
import { getUsageHistory, checkOutAsset, checkInAsset } from '../controllers/usageController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getUsageHistory);
router.post('/checkout', checkOutAsset);
router.post('/checkin', checkInAsset);

export default router;
