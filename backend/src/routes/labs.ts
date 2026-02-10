import { Router } from 'express';
import * as labsController from '../controllers/labs';
import { authenticateToken } from '../middleware';
import { requireTenant } from '../middleware/requireTenant';

const router = Router();

router.get('/', authenticateToken, requireTenant, labsController.getLabs_handler);
router.post('/', authenticateToken, requireTenant, labsController.createLab);
router.get('/:id', authenticateToken, requireTenant, labsController.getLabById);
router.patch('/:id', authenticateToken, requireTenant, labsController.updateLab);
router.delete('/:id', authenticateToken, requireTenant, labsController.deleteLab);

export default router;
