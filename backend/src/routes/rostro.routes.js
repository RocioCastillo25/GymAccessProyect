// Rutas de rostros (contracts/api-rest.md §4).
// Solo administrador y recepcionista registran o consultan información facial.

import { Router } from 'express';
import { crear, modificar, estado } from '../controllers/rostro.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/rostros/:idCliente', autorizar('administrador', 'recepcionista'), estado);
router.post('/rostros', autorizar('administrador', 'recepcionista'), crear);
router.put('/rostros/:idCliente', autorizar('administrador', 'recepcionista'), modificar);

export default router;
