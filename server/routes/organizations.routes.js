import { Router } from 'express';
import * as ctrl from '../controllers/organizations.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', rbac('superadmin'), ctrl.create);
router.patch('/:id', rbac('superadmin'), ctrl.update);
router.delete('/:id', rbac('superadmin'), ctrl.remove);

export default router;
