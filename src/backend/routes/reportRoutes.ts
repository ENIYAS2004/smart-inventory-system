import { Router } from 'express';
import { getDashboardSummary, getDetailedReports } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard-summary', getDashboardSummary);
router.get('/detailed', getDetailedReports);

export default router;
