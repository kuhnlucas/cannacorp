import { Router } from 'express';
import * as geneticsController from '../controllers/genetics';
import { authenticateToken } from '../middleware';

const router = Router();

router.get('/', geneticsController.getGenetics_handler);
router.post('/', authenticateToken, geneticsController.createGenetics);
router.get('/:id', geneticsController.getGeneticsById);
router.patch('/:id', authenticateToken, geneticsController.updateGenetics);
router.delete('/:id', authenticateToken, geneticsController.deleteGenetics);

export default router;
