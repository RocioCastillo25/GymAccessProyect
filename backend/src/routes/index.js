// Registro central de rutas de la API (prefijo /api).

import { Router } from 'express';
import saludRouter from './salud.routes.js';
import authRouter from './auth.routes.js';
import clienteRouter from './cliente.routes.js';
import usuarioRouter from './usuario.routes.js';
import tipoMembresiaRouter from './tipoMembresia.routes.js';
import membresiaRouter from './membresia.routes.js';
import pagoRouter from './pago.routes.js';
import entrenadorRouter from './entrenador.routes.js';
import asignacionRouter from './asignacion.routes.js';
import rutinaRouter from './rutina.routes.js';
import objetivoRouter from './objetivo.routes.js';
import progresoRouter from './progreso.routes.js';
import dashboardRouter from './dashboard.routes.js';

const router = Router();

router.use(saludRouter);
router.use(authRouter);
router.use(clienteRouter);
router.use(usuarioRouter);
router.use(tipoMembresiaRouter);
router.use(membresiaRouter);
router.use(pagoRouter);
router.use(entrenadorRouter);
router.use(asignacionRouter);
router.use(rutinaRouter);
router.use(objetivoRouter);
router.use(progresoRouter);
router.use(dashboardRouter);

export default router;
