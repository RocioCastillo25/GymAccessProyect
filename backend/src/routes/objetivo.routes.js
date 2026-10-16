// Rutas de objetivos de entrenamiento (contracts/api-rest.md §3.1).
// Solo el entrenador crea y cambia el estado; el cliente consulta los propios (FR-013, FR-017).

import { Router } from 'express';
import {
  crear,
  listar,
  listarDeCliente,
  listarPropios,
  cambiarEstado,
} from '../controllers/objetivo.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/objetivos/yo', autorizar('cliente'), listarPropios);
router.get(
  '/objetivos/cliente/:idCliente',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listarDeCliente
);
router.get('/objetivos', autorizar('administrador', 'recepcionista'), listar);
router.post('/objetivos', autorizar('entrenador'), crear);
router.patch('/objetivos/:id/estado', autorizar('entrenador'), cambiarEstado);

export default router;
