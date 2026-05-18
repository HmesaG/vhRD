import { Router } from 'express';
import { employeesController } from '../controllers/generic.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', employeesController.getAll);
router.get('/:id', employeesController.getById);
router.post('/', rbac('administrador'), employeesController.create);
router.patch('/:id', rbac('administrador'), employeesController.update);
router.delete('/:id', rbac('administrador'), employeesController.remove);
router.post('/batch-delete', rbac('administrador'), employeesController.batchDelete);

export default router;
