import { Router } from 'express';
import { reasonsController } from '../controllers/generic.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', reasonsController.getAll);
router.get('/:id', reasonsController.getById);
router.post('/', rbac('administrador'), reasonsController.create);
router.patch('/:id', rbac('administrador'), reasonsController.update);
router.delete('/:id', rbac('administrador'), reasonsController.remove);

export default router;
