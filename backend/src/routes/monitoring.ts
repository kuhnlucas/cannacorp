import { Router } from 'express';
import * as monitoringController from '../controllers/monitoring';
import { authenticateToken } from '../middleware';

const router = Router();

router.get('/measurements', monitoringController.getMeasurements_handler);
router.post('/measurements', authenticateToken, monitoringController.createMeasurement);
router.get('/sensors/:labId', monitoringController.getSensorData);
router.get('/realtime/:labId', monitoringController.getLabRealtimeData);

export default router;
