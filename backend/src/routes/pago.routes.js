// Rutas de pagos (contracts/api-rest.md §3).
// El registro es exclusivo de administrador y recepcionista (FR-011).

import { Router } from 'express';
import { crear, listar, listarPropios } from '../controllers/pago.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

// `/mios` se declara antes que cualquier ruta con parámetros para evitar sombrearla.
router.get('/pagos/mios', autorizar('cliente'), listarPropios);
router.get('/pagos', autorizar('administrador', 'recepcionista'), listar);
router.post('/pagos', autorizar('administrador', 'recepcionista'), crear);

export default router;
