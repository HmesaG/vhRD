import { Router } from 'express';
import * as ctrl from '../controllers/visits.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', rbac('administrador', 'recepcion', 'seguridad'), ctrl.create);
router.patch('/:id', rbac('administrador', 'recepcion', 'seguridad'), ctrl.update);
router.delete('/:id', rbac('administrador'), ctrl.remove);

// Checkpoints endpoints (Ruta Multi-punto)
router.get('/:id/checkpoints', ctrl.getCheckpoints);
router.post('/:id/checkpoints', rbac('administrador', 'recepcion', 'seguridad', 'punto_de_control'), ctrl.addCheckpoint);

export default router;
