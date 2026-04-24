import { Router } from 'express';
import * as operationsController from '../controllers/operations';
import { authenticateToken } from '../middleware';
import { requireTenant } from '../middleware/requireTenant';

const router = Router();

router.get('/', authenticateToken, requireTenant, operationsController.getOperations_handler);
router.post('/', authenticateToken, requireTenant, operationsController.createOperation);
router.get('/:id', authenticateToken, requireTenant, operationsController.getOperationById);
router.patch('/:id', authenticateToken, requireTenant, operationsController.updateOperation);
router.delete('/:id', authenticateToken, requireTenant, operationsController.deleteOperation);

export default router;
