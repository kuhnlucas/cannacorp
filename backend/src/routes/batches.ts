import { Router } from 'express';
import * as batchesController from '../controllers/batches';
import { authenticateToken } from '../middleware';

const router = Router();

router.get('/', batchesController.getBatches_handler);
router.post('/', authenticateToken, batchesController.createBatch);
router.get('/:id', batchesController.getBatchById);
router.patch('/:id', authenticateToken, batchesController.updateBatch);
router.delete('/:id', authenticateToken, batchesController.deleteBatch);

export default router;
