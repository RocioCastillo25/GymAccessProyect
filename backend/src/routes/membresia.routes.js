// Rutas de membresías (contracts/api-rest.md §2).
// Gestión para administrador y recepcionista; el cliente consulta la propia (FR-009).

import { Router } from 'express';
import {
  crear,
  listar,
  obtener,
  cambiarEstado,
  renovarMembresia,
  obtenerPropia,
} from '../controllers/membresia.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/membresias/yo', autorizar('cliente'), obtenerPropia);
router.get('/membresias', autorizar('administrador', 'recepcionista'), listar);
router.get('/membresias/:id', autorizar('administrador', 'recepcionista'), obtener);
router.post('/membresias', autorizar('administrador', 'recepcionista'), crear);
router.patch('/membresias/:id/estado', autorizar('administrador', 'recepcionista'), cambiarEstado);
router.post(
  '/membresias/:id/renovar',
  autorizar('administrador', 'recepcionista'),
  renovarMembresia
);

export default router;
