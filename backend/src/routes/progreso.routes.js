// Rutas de progresos del cliente (contracts/api-rest.md §3.1 bis).
// Solo el entrenador registra; el cliente consulta los propios (FR-014, FR-015, FR-017).

import { Router } from 'express';
import {
  crear,
  listar,
  listarDeCliente,
  listarPropios,
} from '../controllers/progreso.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/progresos/yo', autorizar('cliente'), listarPropios);
router.get(
  '/progresos/cliente/:idCliente',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listarDeCliente
);
router.get('/progresos', autorizar('administrador', 'recepcionista'), listar);
router.post('/progresos', autorizar('entrenador'), crear);

export default router;
