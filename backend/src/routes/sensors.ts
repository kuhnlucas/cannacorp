import { Router } from 'express';
import * as sensorsController from '../controllers/sensors';
import { authenticateToken } from '../middleware';
import { requireTenant } from '../middleware/requireTenant';

const router = Router();

router.get('/', authenticateToken, requireTenant, sensorsController.getSensors_handler);
router.post('/', authenticateToken, requireTenant, sensorsController.createSensor);
router.patch('/:id', authenticateToken, requireTenant, sensorsController.updateSensor);
router.delete('/:id', authenticateToken, requireTenant, sensorsController.deleteSensor);

export default router;
