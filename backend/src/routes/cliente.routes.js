// Rutas de clientes (contracts/api-rest.md §3).
// Todas requieren autenticación; los roles se validan siempre en el backend.

import { Router } from 'express';
import {
  crear,
  modificar,
  listar,
  obtener,
  obtenerPropio,
} from '../controllers/cliente.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/clientes/yo', autorizar('cliente'), obtenerPropio);
router.get('/clientes', autorizar('administrador', 'recepcionista', 'entrenador'), listar);
router.get('/clientes/:id', autorizar('administrador', 'recepcionista'), obtener);
router.post('/clientes', autorizar('administrador', 'recepcionista'), crear);
router.patch('/clientes/:id', autorizar('administrador', 'recepcionista'), modificar);

export default router;
