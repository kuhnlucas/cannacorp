import { Router } from 'express';
import * as batchesController from '../controllers/batches';
import { authenticateToken } from '../middleware';
import { requireTenant } from '../middleware/requireTenant';

const router = Router();

router.get('/', authenticateToken, requireTenant, batchesController.getBatches_handler);
router.post('/', authenticateToken, requireTenant, batchesController.createBatch);
router.get('/:id', authenticateToken, requireTenant, batchesController.getBatchById);
router.patch('/:id', authenticateToken, requireTenant, batchesController.updateBatch);
router.delete('/:id', authenticateToken, requireTenant, batchesController.deleteBatch);

export default router;
