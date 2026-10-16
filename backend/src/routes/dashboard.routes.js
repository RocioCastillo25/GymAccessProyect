// Rutas del dashboard administrativo (contracts/api-rest.md §4).
// El resumen general es exclusivo del administrador; el operativo incluye al recepcionista (FR-019, FR-020).

import { Router } from 'express';
import {
  obtenerGeneral,
  obtenerPersonal,
} from '../controllers/dashboard.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/dashboard', autorizar('administrador'), obtenerGeneral);
router.get('/dashboard/personal', autorizar('administrador', 'recepcionista'), obtenerPersonal);

export default router;
