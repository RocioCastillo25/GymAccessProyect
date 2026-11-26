// Registro de exportaciones de reportes en auditoría (FR-032, R30).
// La exportación se genera en el navegador; este servicio solo deja constancia
// del evento y nunca bloquea la descarga si la auditoría falla.

import { registrarAccion } from './auditoria.service.js';
import { validarExportacion } from '../validators/reporte.validator.js';

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
 * Registra la exportación de un reporte.
 * @param {Object} datos - `{ idUsuario, reporte, formato, filtros }`.
 * @returns {Promise<number|null>} Identificador de auditoría o `null` si falló.
 */
export async function registrarExportacion(datos = {}) {
  const { idUsuario = null, ...exportacion } = datos;
  const { reporte, formato, filtros } = validarExportacion(exportacion);
  const detalle = describirFiltros(filtros);

  return registrarAccion({
    idUsuario,
    accion: 'exportar_reporte',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Exportación ${formato.toUpperCase()} del reporte ${reporte}${
      detalle ? ` (${detalle})` : ''
    }`.slice(0, 255),
  });
}
