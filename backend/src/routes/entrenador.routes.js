// Rutas de entrenadores (contracts/api-rest.md §1).
// El registro y la modificación son exclusivos del administrador (FR-001, FR-002).

import { Router } from 'express';
import {
  crear,
  listar,
  obtener,
  obtenerPropio,
  actualizar,
  cambiarEstado,
} from '../controllers/entrenador.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/entrenadores/yo', autorizar('entrenador'), obtenerPropio);
router.get('/entrenadores', autorizar('administrador', 'recepcionista'), listar);
router.get('/entrenadores/:id', autorizar('administrador', 'recepcionista'), obtener);
router.post('/entrenadores', autorizar('administrador'), crear);
router.patch('/entrenadores/:id', autorizar('administrador'), actualizar);
router.patch('/entrenadores/:id/estado', autorizar('administrador'), cambiarEstado);

export default router;
