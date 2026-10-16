// Rutas de rutinas y ejercicios (contracts/api-rest.md §3).
// Solo el entrenador crea y edita; el cliente consulta la propia (FR-009, FR-012, FR-017).

import { Router } from 'express';
import {
  crear,
  listar,
  obtener,
  listarDeCliente,
  obtenerPropia,
  actualizar,
  actualizarEjercicios,
} from '../controllers/rutina.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/rutinas/yo', autorizar('cliente'), obtenerPropia);
router.get(
  '/rutinas/cliente/:idCliente',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listarDeCliente
);
router.get('/rutinas', autorizar('administrador', 'recepcionista'), listar);
router.get('/rutinas/:id', autorizar('administrador', 'recepcionista', 'entrenador'), obtener);
router.post('/rutinas', autorizar('entrenador'), crear);
router.patch('/rutinas/:id', autorizar('entrenador'), actualizar);
router.put('/rutinas/:id/ejercicios', autorizar('entrenador'), actualizarEjercicios);

export default router;
