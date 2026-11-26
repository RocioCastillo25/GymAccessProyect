// Controladores de reportes del Sprint 4 (US-S4-01 a US-S4-04 y US-S4-07).

import {
  generarReporteFinanciero,
  generarReporteAccesos,
  generarReporteVencidos,
  listarMembresiasPorVencer,
} from '../services/reporte.service.js';
import { registrarExportacion } from '../services/reporteExportacion.service.js';
import { validarExportacion } from '../validators/reporte.validator.js';
import { errorAutorizacion } from '../utils/errores.js';
import {
  presentarReporteFinanciero,
  presentarReporteAccesos,
  presentarReporteVencidos,
  presentarAlertasVencimiento,
} from '../presenters/reporte.presentador.js';

export async function financiero(req, res, next) {
  try {
    const reporte = await generarReporteFinanciero(req.query, req.usuario);
    return res.status(200).json({ reporte: presentarReporteFinanciero(reporte) });
  } catch (error) {
    return next(error);
  }
}

export async function accesos(req, res, next) {
  try {
    const reporte = await generarReporteAccesos(req.query, req.usuario);
    return res.status(200).json({ reporte: presentarReporteAccesos(reporte) });
  } catch (error) {
    return next(error);
  }
}

export async function vencidos(req, res, next) {
  try {
    const reporte = await generarReporteVencidos(req.query, req.usuario);
    return res.status(200).json({ reporte: presentarReporteVencidos(reporte) });
  } catch (error) {
    return next(error);
  }
}

export async function alertasVencimiento(req, res, next) {
  try {
    const filas = await listarMembresiasPorVencer(req.usuario);
    const alertas = presentarAlertasVencimiento(filas);
    return res.status(200).json({ alertas, total: alertas.length });
  } catch (error) {
    return next(error);
  }
}

export async function registrarExportacionReporte(req, res, next) {
  try {
    const datos = validarExportacion(req.body);
    if (datos.reporte !== 'vencidos' && req.usuario?.rol !== 'administrador') {
      throw errorAutorizacion('No tiene permisos para exportar este reporte.');
    }

    const idAuditoria = await registrarExportacion({
      idUsuario: req.usuario?.id ?? null,
      ...datos,
    });

    return res.status(200).json({
      mensaje: 'Exportación registrada.',
      reporte: datos.reporte,
      formato: datos.formato,
      auditoria: idAuditoria,
    });
  } catch (error) {
    return next(error);
  }
}
