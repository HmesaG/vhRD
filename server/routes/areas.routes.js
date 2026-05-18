import { Router } from 'express';
import { areasController } from '../controllers/generic.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', areasController.getAll);
router.get('/:id', areasController.getById);
router.post('/', rbac('administrador'), areasController.create);
router.patch('/:id', rbac('administrador'), areasController.update);
router.delete('/:id', rbac('administrador'), areasController.remove);
router.post('/batch-delete', rbac('administrador'), areasController.batchDelete);

export default router;
