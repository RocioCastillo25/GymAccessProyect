// Rutas de reportes del Sprint 4 (US-S4-01 a US-S4-04 y US-S4-07).
// Los reportes financieros, de accesos y sus exportaciones son exclusivos del
// administrador; el reporte de vencidos y las alertas también los consulta el
// recepcionista (RN-S4-01).

import { Router } from 'express';
import {
  financiero,
  accesos,
  vencidos,
  alertasVencimiento,
  registrarExportacionReporte,
} from '../controllers/reporte.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();

router.use(autenticar);

router.get('/reports/financial', autorizar('administrador'), financiero);
router.get('/reports/access', autorizar('administrador'), accesos);
router.get('/reports/expiring-memberships', autorizar('administrador', 'recepcionista'), alertasVencimiento);
router.get('/reports/expired-clients', autorizar('administrador', 'recepcionista'), vencidos);
router.post(
  '/reports/exports',
  autorizar('administrador', 'recepcionista'),
  registrarExportacionReporte
);

export default router;
