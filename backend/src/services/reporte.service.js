// Servicio de reportes del Sprint 4: valida filtros, consulta agregados y
// registra en auditoría la generación de reportes sensibles (RN-S4-01, RN-S4-05).

import * as reporteModelo from '../models/reporte.model.js';
import { validarFiltrosReporte } from '../validators/reporte.validator.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'reportes';

function describirFiltros(filtros = {}) {
  const partes = [];
  if (filtros.fechaInicio) partes.push(`desde ${filtros.fechaInicio}`);
  if (filtros.fechaFin) partes.push(`hasta ${filtros.fechaFin}`);
  if (filtros.metodoPago) partes.push(`método ${filtros.metodoPago}`);
  if (filtros.resultado) partes.push(`resultado ${filtros.resultado}`);
  if (filtros.buscar) partes.push(`búsqueda ${filtros.buscar}`);
  if (filtros.idCliente) partes.push(`cliente ${filtros.idCliente}`);
  return partes.join(', ');
}

/**
 * Registra la generación de un reporte (FR-032).
 * @param {Object} datos - `{ usuario, reporte, filtros }`.
 * @returns {Promise<number|null>}
 */
export async function registrarGeneracionReporte({ usuario, reporte, filtros = {} }) {
  const detalle = describirFiltros(filtros);
  return registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: `generar_reporte_${reporte}`,
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Reporte ${reporte}${detalle ? ` (${detalle})` : ''}`.slice(0, 255),
  });
}

/**
 * Genera el reporte financiero de ingresos (US-S4-01).
 * @param {Object} filtros - `{ fechaInicio, fechaFin, metodoPago? }`.
 * @param {Object} usuario - Usuario autenticado.
 * @returns {Promise<Object>}
 */
export async function generarReporteFinanciero(filtros, usuario) {
  const limpios = validarFiltrosReporte(filtros, {
    permitirIdCliente: false,
    permitirResultado: false,
    permitirBuscar: false,
  });
  const { fechaInicio, fechaFin, metodoPago } = limpios;

  const [resumen, porMetodoPago, porTipoMembresia] = await Promise.all([
    reporteModelo.resumenFinanciero(fechaInicio, fechaFin, metodoPago),
    reporteModelo.ingresosPorMetodoPago(fechaInicio, fechaFin, metodoPago),
    reporteModelo.ingresosPorTipoMembresia(fechaInicio, fechaFin, metodoPago),
  ]);

  await registrarGeneracionReporte({
    usuario,
    reporte: 'financiero',
    filtros: { fechaInicio, fechaFin, metodoPago },
  });

  return {
    fechaInicio,
    fechaFin,
    filtros: { fechaInicio, fechaFin, metodoPago },
    resumen,
    porMetodoPago,
    porTipoMembresia,
  };
}

function agregarAccesos(filas, motivos = []) {
  const resumen = { totalAccesos: 0, autorizados: 0, rechazados: 0, entradas: 0, salidas: 0 };
  const porHora = new Map();
  const porTipo = new Map();

  for (const fila of filas) {
    const total = Number(fila.total);
    resumen.totalAccesos += total;
    if (fila.resultado === 'autorizado') resumen.autorizados += total;
    if (fila.resultado === 'rechazado') resumen.rechazados += total;
    if (fila.tipo === 'entrada') resumen.entradas += total;
    if (fila.tipo === 'salida') resumen.salidas += total;

    const claveHora = `${fila.fecha}-${fila.hora}`;
    if (!porHora.has(claveHora)) {
      porHora.set(claveHora, {
        fecha: fila.fecha,
        hora: Number(fila.hora),
        total: 0,
        autorizados: 0,
        rechazados: 0,
      });
    }
    const grupoHora = porHora.get(claveHora);
    grupoHora.total += total;
    if (fila.resultado === 'autorizado') grupoHora.autorizados += total;
    if (fila.resultado === 'rechazado') grupoHora.rechazados += total;

    if (!porTipo.has(fila.tipo)) {
      porTipo.set(fila.tipo, { tipo: fila.tipo, total: 0, autorizados: 0, rechazados: 0 });
    }
    const grupoTipo = porTipo.get(fila.tipo);
    grupoTipo.total += total;
    if (fila.resultado === 'autorizado') grupoTipo.autorizados += total;
    if (fila.resultado === 'rechazado') grupoTipo.rechazados += total;
  }

  return {
    resumen,
    porHora: [...porHora.values()],
    porTipo: [...porTipo.values()],
    porMotivoRechazo: motivos.map((fila) => ({
      motivo: fila.motivo,
      total: Number(fila.total),
    })),
  };
}

/**
 * Genera el reporte de accesos y concurrencia (US-S4-02).
 * @param {Object} filtros - `{ fechaInicio, fechaFin, idCliente?, resultado? }`.
 * @param {Object} usuario - Usuario autenticado.
 * @returns {Promise<Object>}
 */
export async function generarReporteAccesos(filtros, usuario) {
  const limpios = validarFiltrosReporte(filtros, {
    permitirMetodoPago: false,
    permitirBuscar: false,
  });
  const { fechaInicio, fechaFin, idCliente, resultado } = limpios;

  const [filas, motivos] = await Promise.all([
    reporteModelo.accesosAgrupados(fechaInicio, fechaFin, { idCliente, resultado }),
    resultado === 'autorizado'
      ? Promise.resolve([])
      : reporteModelo.motivosRechazo(fechaInicio, fechaFin, { idCliente }),
  ]);
  const { resumen, porHora, porTipo, porMotivoRechazo } = agregarAccesos(filas, motivos);

  await registrarGeneracionReporte({
    usuario,
    reporte: 'accesos',
    filtros: { fechaInicio, fechaFin, idCliente, resultado },
  });

  return {
    fechaInicio,
    fechaFin,
    filtros: { fechaInicio, fechaFin, idCliente, resultado },
    idCliente,
    resumen,
    porHora,
    porTipo,
    porMotivoRechazo,
  };
}

/**
 * Lista las membresías activas que vencen en los próximos cinco días (US-S4-03).
 * @param {Object} usuario - Usuario autenticado.
 * @returns {Promise<Array>}
 */
export async function listarMembresiasPorVencer(usuario) {
  const filas = await reporteModelo.membresiasPorVencer();
  await registrarGeneracionReporte({ usuario, reporte: 'vencimientos' });
  return filas;
}

/**
 * Genera el reporte de clientes vencidos o sin membresía activa (US-S4-07).
 * @param {Object} filtros - `{ fechaInicio, fechaFin, buscar? }`.
 * @param {Object} usuario - Usuario autenticado.
 * @returns {Promise<Object>}
 */
export async function generarReporteVencidos(filtros, usuario) {
  const limpios = validarFiltrosReporte(filtros, {
    permitirIdCliente: false,
    permitirMetodoPago: false,
    permitirResultado: false,
    permitirBuscar: true,
  });
  const { fechaInicio, fechaFin, buscar } = limpios;
  const filas = await reporteModelo.clientesVencidos(fechaInicio, fechaFin, buscar);

  await registrarGeneracionReporte({
    usuario,
    reporte: 'vencidos',
    filtros: { fechaInicio, fechaFin, buscar },
  });

  return {
    fechaInicio,
    fechaFin,
    filtros: { fechaInicio, fechaFin, buscar },
    clientes: filas,
  };
}
