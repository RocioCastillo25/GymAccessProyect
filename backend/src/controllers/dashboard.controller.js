// Controladores del dashboard administrativo (contracts/api-rest.md §4).

import { resumenGeneral, resumenPersonal } from '../services/dashboard.service.js';
import {
  presentarResumenGeneral,
  presentarResumenPersonal,
} from '../presenters/dashboard.presentador.js';

export async function obtenerGeneral(req, res, next) {
  try {
    const resumen = await resumenGeneral();
    return res.status(200).json({ resumen: presentarResumenGeneral(resumen) });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerPersonal(req, res, next) {
  try {
    const resumen = await resumenPersonal();
    return res.status(200).json({ resumen: presentarResumenPersonal(resumen) });
  } catch (error) {
    return next(error);
  }
}
