import { Router } from 'express';
import * as monitoringController from '../controllers/monitoring';
import { authenticateToken } from '../middleware';
import { requireTenant } from '../middleware/requireTenant';

const router = Router();

router.get('/measurements', authenticateToken, requireTenant, monitoringController.getMeasurements_handler);
router.post('/measurements', authenticateToken, requireTenant, monitoringController.createMeasurement);
router.get('/sensors/:labId', authenticateToken, requireTenant, monitoringController.getSensorData);
router.get('/realtime/:labId', authenticateToken, requireTenant, monitoringController.getLabRealtimeData);

export default router;
