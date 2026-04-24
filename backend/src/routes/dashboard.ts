import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard';
import { authenticateToken } from '../middleware';
import { requireTenant } from '../middleware/requireTenant';

const router = Router();

router.get('/stats', authenticateToken, requireTenant, dashboardController.getStats);
router.get('/activity', authenticateToken, requireTenant, dashboardController.getActivity);

export default router;
