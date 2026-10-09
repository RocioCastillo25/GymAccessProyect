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
router.use(autorizar('administrador'));

router.get('/usuarios', listar);
router.get('/usuarios/:id', obtener);
router.post('/usuarios', crear);
router.patch('/usuarios/:id', modificar);
router.patch('/usuarios/:id/rol', cambiarRol);
router.patch('/usuarios/:id/estado', cambiarEstadoUsuario);
router.patch('/usuarios/:id/password', cambiarPassword);

export default router;
