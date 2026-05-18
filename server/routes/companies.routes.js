import { Router } from 'express';
import { companiesController } from '../controllers/generic.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', companiesController.getAll);
router.get('/:id', companiesController.getById);
router.post('/', rbac('administrador'), companiesController.create);
router.patch('/:id', rbac('administrador'), companiesController.update);
router.delete('/:id', rbac('administrador'), companiesController.remove);
router.post('/batch-delete', rbac('administrador'), companiesController.batchDelete);

export default router;
