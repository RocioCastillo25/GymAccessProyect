// Rutas de usuarios: exclusivas del administrador (FR-007, FR-013).
// contracts/api-rest.md §2

import { Router } from 'express';
import {
  listar,
  obtener,
  crear,
  modificar,
  cambiarPassword,
  cambiarRol,
  cambiarEstadoUsuario,
} from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/usuarios', autorizar('administrador'), listar);
router.get('/usuarios/:id', autorizar('administrador'), obtener);
router.post('/usuarios', autorizar('administrador'), crear);
router.patch('/usuarios/:id', autorizar('administrador'), modificar);
router.patch('/usuarios/:id/rol', autorizar('administrador'), cambiarRol);
router.patch('/usuarios/:id/estado', autorizar('administrador'), cambiarEstadoUsuario);
router.patch('/usuarios/:id/password', autorizar('administrador'), cambiarPassword);

export default router;
