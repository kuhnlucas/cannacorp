import { Router } from 'express';
import * as operationsController from '../controllers/operations';
import { authenticateToken } from '../middleware';

const router = Router();

router.get('/', operationsController.getOperations_handler);
router.post('/', authenticateToken, operationsController.createOperation);
router.get('/:id', operationsController.getOperationById);
router.delete('/:id', authenticateToken, operationsController.deleteOperation);

export default router;
