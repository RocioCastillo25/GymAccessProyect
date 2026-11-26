// Presentadores de reportes: adaptan las filas de MySQL al formato camelCase
// del contrato y omiten cualquier dato sensible o biométrico (RN-S4-05).

import { aFechaIso } from '../utils/fechas.js';

function numero(valor) {
  return Number(valor ?? 0);
}

/**
 * @param {Object} reporte - Resultado del servicio financiero.
 * @returns {Object}
 */
export function presentarReporteFinanciero(reporte = {}) {
  return {
    fechaInicio: reporte.fechaInicio,
    fechaFin: reporte.fechaFin,
    filtros: {
      fechaInicio: reporte.filtros?.fechaInicio ?? reporte.fechaInicio,
      fechaFin: reporte.filtros?.fechaFin ?? reporte.fechaFin,
      metodoPago: reporte.filtros?.metodoPago ?? null,
    },
    resumen: {
      totalRecaudado: numero(reporte.resumen?.total_recaudado),
      totalTransacciones: numero(reporte.resumen?.total_transacciones),
    },
    porMetodoPago: (reporte.porMetodoPago ?? []).map((fila) => ({
      metodoPago: fila.metodo_pago,
      totalTransacciones: numero(fila.total_transacciones),
      ingresos: numero(fila.ingresos),
    })),
    porTipoMembresia: (reporte.porTipoMembresia ?? []).map((fila) => ({
      tipoMembresia: fila.tipo_membresia,
      totalTransacciones: numero(fila.total_transacciones),
      ingresos: numero(fila.ingresos),
    })),
  };
}

/**
 * @param {Object} reporte - Resultado del servicio de accesos.
 * @returns {Object}
 */
export function presentarReporteAccesos(reporte = {}) {
  return {
    fechaInicio: reporte.fechaInicio,
    fechaFin: reporte.fechaFin,
    filtros: {
      fechaInicio: reporte.filtros?.fechaInicio ?? reporte.fechaInicio,
      fechaFin: reporte.filtros?.fechaFin ?? reporte.fechaFin,
      idCliente: reporte.filtros?.idCliente ?? reporte.idCliente ?? null,
      resultado: reporte.filtros?.resultado ?? null,
    },
    idCliente: reporte.idCliente ?? null,
    resumen: {
      totalAccesos: numero(reporte.resumen?.totalAccesos),
      autorizados: numero(reporte.resumen?.autorizados),
      rechazados: numero(reporte.resumen?.rechazados),
      entradas: numero(reporte.resumen?.entradas),
      salidas: numero(reporte.resumen?.salidas),
    },
    porHora: (reporte.porHora ?? []).map((fila) => ({
      fecha: aFechaIso(fila.fecha),
      hora: numero(fila.hora),
      total: numero(fila.total),
      autorizados: numero(fila.autorizados),
      rechazados: numero(fila.rechazados),
    })),
    porTipo: (reporte.porTipo ?? []).map((fila) => ({
      tipo: fila.tipo,
      total: numero(fila.total),
      autorizados: numero(fila.autorizados),
      rechazados: numero(fila.rechazados),
    })),
    porMotivoRechazo: (reporte.porMotivoRechazo ?? []).map((fila) => ({
      motivo: fila.motivo,
      total: numero(fila.total),
    })),
  };
}

/**
 * @param {Object} fila - Fila de cliente vencido o sin membresía activa.
 * @returns {Object}
 */
export function presentarClienteVencido(fila) {
  return {
    idCliente: fila.id_cliente,
    cliente: `${fila.nombre} ${fila.apellido}`.trim(),
    correo: fila.correo,
    telefono: fila.telefono ?? null,
    idMembresia: fila.id_membresia ?? null,
    tipoMembresia: fila.tipo_membresia ?? null,
    fechaFin: fila.fecha_fin ? aFechaIso(fila.fecha_fin) : null,
    estado: fila.estado ?? 'sin_membresia',
  };
}

/**
 * @param {Object} reporte - Resultado del servicio de clientes vencidos.
 * @returns {Object}
 */
export function presentarReporteVencidos(reporte = {}) {
  const clientes = (reporte.clientes ?? []).map(presentarClienteVencido);
  return {
    fechaInicio: reporte.fechaInicio,
    fechaFin: reporte.fechaFin,
    filtros: {
      fechaInicio: reporte.filtros?.fechaInicio ?? reporte.fechaInicio,
      fechaFin: reporte.filtros?.fechaFin ?? reporte.fechaFin,
      buscar: reporte.filtros?.buscar ?? null,
    },
    clientes,
    total: clientes.length,
  };
}

/**
 * @param {Object} fila - Fila de membresía por vencer.
 * @returns {Object}
 */
export function presentarAlertaVencimiento(fila) {
  return {
    idMembresia: fila.id_membresia,
    idCliente: fila.id_cliente,
    cliente: `${fila.nombre} ${fila.apellido}`.trim(),
    correo: fila.correo,
    telefono: fila.telefono ?? null,
    tipoMembresia: fila.tipo_membresia,
    fechaFin: aFechaIso(fila.fecha_fin),
    diasRestantes: numero(fila.dias_restantes),
  };
}

/**
 * @param {Array} filas - Filas de membresías por vencer.
 * @returns {Array}
 */
export function presentarAlertasVencimiento(filas = []) {
  return filas.map(presentarAlertaVencimiento);
}
