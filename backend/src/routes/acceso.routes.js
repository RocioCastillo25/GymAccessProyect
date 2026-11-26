// Rutas de control de acceso (contracts/api-rest.md §4 bis y §4.1).

import { Router } from 'express';
import {
  validar,
  listar,
  obtener,
  obtenerPropios,
} from '../controllers/acceso.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.post('/accesos/validar', autorizar('administrador', 'recepcionista'), validar);
router.get('/accesos/yo', autorizar('cliente'), obtenerPropios);
router.get(
  '/accesos',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listar
);
router.get('/accesos/:id', autorizar('administrador', 'recepcionista'), obtener);

export default router;
