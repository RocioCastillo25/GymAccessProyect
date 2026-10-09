// GET /api/salud: comprobación de disponibilidad del backend y de MySQL
// (Casos límite de spec.md, quickstart.md §3).

import { Router } from 'express';
import { verificarConexion } from '../config/baseDatos.js';

const router = Router();

router.get('/salud', async (req, res) => {
  const conectada = await verificarConexion();
  if (!conectada) {
    return res.status(503).json({ mensaje: 'Servicio no disponible.' });
  }
  return res.json({ estado: 'ok', baseDatos: 'conectada' });
});

export default router;
