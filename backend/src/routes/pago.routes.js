// Rutas de pagos (contracts/api-rest.md §3).
// El registro es exclusivo de administrador y recepcionista (FR-011).

import { Router } from 'express';
import { crear, listar } from '../controllers/pago.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/pagos', autorizar('administrador', 'recepcionista'), listar);
router.post('/pagos', autorizar('administrador', 'recepcionista'), crear);

export default router;
