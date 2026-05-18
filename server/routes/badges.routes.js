import { Router } from 'express';
import { badgesController } from '../controllers/generic.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', badgesController.getAll);
router.get('/:id', badgesController.getById);
router.post('/', rbac('administrador'), badgesController.create);
router.patch('/:id', rbac('administrador'), badgesController.update);
router.delete('/:id', rbac('administrador'), badgesController.remove);
router.post('/batch-delete', rbac('administrador'), badgesController.batchDelete);

export default router;
