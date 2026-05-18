import { Router } from 'express';
import * as ctrl from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', rbac('administrador', 'seguridad'), ctrl.getAll);
router.get('/:id', rbac('administrador', 'seguridad'), ctrl.getById);
router.post('/', rbac('administrador'), ctrl.create);
router.patch('/:id', rbac('administrador'), ctrl.update);
router.delete('/:id', rbac('administrador'), ctrl.remove);

export default router;
