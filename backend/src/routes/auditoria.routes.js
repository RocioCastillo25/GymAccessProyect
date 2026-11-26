// Rutas de auditoría (contracts/api-rest.md §5).
// La consulta es exclusiva del administrador (FR-036).

import { Router } from 'express';
import { listar } from '../controllers/auditoria.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/auditoria', autorizar('administrador'), listar);

export default router;
