import { Router } from 'express';
import { getStockOverview, adjustStock } from '../controllers/stockController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getStockOverview);
router.post('/adjust', authorizeRoles('ADMIN', 'STAFF', 'DEPARTMENT_HEAD'), adjustStock);

export default router;
