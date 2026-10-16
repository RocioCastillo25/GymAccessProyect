// Rutas de asignaciones de entrenador (contracts/api-rest.md §2).
// Gestión para administrador y recepcionista; el entrenador consulta las propias (FR-005, FR-008).

import { Router } from 'express';
import {
  crear,
  listar,
  obtener,
  listarDeEntrenador,
  listarPropias,
  cambiarEstado,
} from '../controllers/asignacion.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/asignaciones/yo', autorizar('entrenador'), listarPropias);
router.get(
  '/asignaciones/entrenador/:idEntrenador',
  autorizar('administrador', 'recepcionista'),
  listarDeEntrenador
);
router.get('/asignaciones', autorizar('administrador', 'recepcionista'), listar);
router.get('/asignaciones/:id', autorizar('administrador', 'recepcionista'), obtener);
router.post('/asignaciones', autorizar('administrador', 'recepcionista'), crear);
router.patch(
  '/asignaciones/:id/estado',
  autorizar('administrador', 'recepcionista'),
  cambiarEstado
);

export default router;
