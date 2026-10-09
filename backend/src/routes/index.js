// Registro central de rutas de la API (prefijo /api).

import { Router } from 'express';
import saludRouter from './salud.routes.js';
import authRouter from './auth.routes.js';
import clienteRouter from './cliente.routes.js';
import usuarioRouter from './usuario.routes.js';

const router = Router();

router.use(saludRouter);
router.use(authRouter);
router.use(clienteRouter);
router.use(usuarioRouter);

export default router;
