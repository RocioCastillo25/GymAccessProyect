// Rutas de tipos de membresía (contracts/api-rest.md §1).
// Lectura para administrador, recepcionista y entrenador; escritura solo administrador.

import { Router } from 'express';
import {
  crear,
  modificar,
  cambiarEstado,
  listar,
  obtener,
} from '../controllers/tipoMembresia.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get(
  '/tipos-membresia',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listar
);
router.get(
  '/tipos-membresia/:id',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  obtener
);
router.post('/tipos-membresia', autorizar('administrador'), crear);
router.patch('/tipos-membresia/:id', autorizar('administrador'), modificar);
router.patch('/tipos-membresia/:id/estado', autorizar('administrador'), cambiarEstado);

export default router;
