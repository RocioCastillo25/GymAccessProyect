// Utilidades de reportes: construcción de CSV, descarga local y metadatos.
// Los archivos se generan en el navegador; no se envían tokens ni datos
// biométricos y no queda ningún archivo temporal en el servidor.

const ETIQUETAS_FILTROS = {
  fechaInicio: 'Desde',
  fechaFin: 'Hasta',
  metodoPago: 'Método de pago',
  resultado: 'Resultado',
  buscar: 'Búsqueda',
  idCliente: 'Cliente',
};

function texto(valor) {
  return String(valor ?? '');
}

/**
 * Escapa un valor para CSV entre comillas dobles.
 * @param {unknown} valor
 * @returns {string}
 */
export function escaparCsv(valor) {
  return `"${texto(valor).replace(/"/g, '""')}"`;
}

/**
 * Construye el contenido CSV con BOM UTF-8 y separador `;`.
 * @param {Array<Array<unknown>>} filas
 * @returns {string}
 */
export function construirCsv(filas = []) {
  const contenido = filas.map((fila) => fila.map(escaparCsv).join(';')).join('\r\n');
  return `\uFEFF${contenido}`;
}

/**
 * Descarga un CSV mediante un Blob temporal y libera la URL al terminar.
 * @param {string} nombre - Nombre del archivo.
 * @param {Array<Array<unknown>>} filas - Filas del CSV.
 * @returns {void}
 */
export function descargarCsv(nombre, filas) {
  const blob = new Blob([construirCsv(filas)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.style.display = 'none';
  document.body.appendChild(enlace);

  try {
    enlace.click();
  } finally {
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }
}

function limpiarParte(valor) {
  return texto(valor)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Genera un nombre de archivo estable a partir del reporte y sus filtros.
 * @param {string} reporte - financiero, accesos o vencidos.
 * @param {Object} filtros
 * @param {string} [extension] - csv o pdf.
 * @returns {string}
 */
export function generarNombreArchivo(reporte, filtros = {}, extension = 'csv') {
  const partes = [`reporte-${limpiarParte(reporte) || 'reporte'}`];
  if (filtros.fechaInicio) partes.push(limpiarParte(filtros.fechaInicio));
  if (filtros.fechaFin) partes.push(limpiarParte(filtros.fechaFin));
  if (filtros.metodoPago) partes.push(limpiarParte(filtros.metodoPago));
  if (filtros.resultado) partes.push(limpiarParte(filtros.resultado));
  if (filtros.buscar) partes.push(limpiarParte(filtros.buscar).slice(0, 40));
  return `${partes.filter(Boolean).join('-')}.${limpiarParte(extension) || 'csv'}`;
}

/**
 * Devuelve los filtros activos en texto legible para la pantalla y el CSV.
 * @param {Object} filtros
 * @returns {Array<string>}
 */
export function formatearFiltrosActivos(filtros = {}) {
  return Object.entries(ETIQUETAS_FILTROS)
    .filter(([clave]) => filtros[clave] !== undefined && filtros[clave] !== null && filtros[clave] !== '')
    .map(([clave, etiqueta]) => `${etiqueta}: ${filtros[clave]}`);
}

/**
 * Metadatos comunes de una exportación.
 * @param {string} titulo
 * @param {Object} filtros
 * @returns {Array<Array<unknown>>}
 */
export function filasMetadatos(titulo, filtros = {}) {
  return [
    [titulo],
    ['Generado por GymAccess'],
    ...formatearFiltrosActivos(filtros).map((filtro) => {
      const separador = filtro.indexOf(':');
      return [filtro.slice(0, separador), filtro.slice(separador + 1).trim()];
    }),
  ];
}

/**
 * Construye las filas CSV del reporte financiero.
 * @param {Object} reporte
 * @returns {Array<Array<unknown>>}
 */
export function filasFinancieroCsv(reporte = {}) {
  const filtros = reporte.filtros ?? {
    fechaInicio: reporte.fechaInicio,
    fechaFin: reporte.fechaFin,
  };
  const filas = [
    ...filasMetadatos('Reporte financiero GymAccess', filtros),
    [],
    ['Total recaudado', reporte.resumen?.totalRecaudado ?? 0],
    ['Total transacciones', reporte.resumen?.totalTransacciones ?? 0],
    [],
    ['Método de pago', 'Transacciones', 'Ingresos'],
    ...(reporte.porMetodoPago ?? []).map((fila) => [
      fila.metodoPago,
      fila.totalTransacciones,
      fila.ingresos,
    ]),
    [],
    ['Tipo de membresía', 'Transacciones', 'Ingresos'],
    ...(reporte.porTipoMembresia ?? []).map((fila) => [
      fila.tipoMembresia,
      fila.totalTransacciones,
      fila.ingresos,
    ]),
  ];
  if ((reporte.resumen?.totalTransacciones ?? 0) === 0) {
    filas.splice(filas.length, 0, [], ['Leyenda', 'No hay registros para este periodo']);
  }
  return filas;
}

/**
 * Construye las filas CSV del reporte de accesos.
 * @param {Object} reporte
 * @returns {Array<Array<unknown>>}
 */
export function filasAccesosCsv(reporte = {}) {
  const filtros = reporte.filtros ?? {
    fechaInicio: reporte.fechaInicio,
    fechaFin: reporte.fechaFin,
  };
  const filas = [
    ...filasMetadatos('Reporte de accesos GymAccess', filtros),
    [],
    ['Total accesos', reporte.resumen?.totalAccesos ?? 0],
    ['Autorizados', reporte.resumen?.autorizados ?? 0],
    ['Rechazados', reporte.resumen?.rechazados ?? 0],
    [],
    ['Fecha', 'Hora', 'Total', 'Autorizados', 'Rechazados'],
    ...(reporte.porHora ?? []).map((fila) => [
      fila.fecha,
      `${String(fila.hora).padStart(2, '0')}:00`,
      fila.total,
      fila.autorizados,
      fila.rechazados,
    ]),
    [],
    ['Motivo de rechazo', 'Total'],
    ...(reporte.porMotivoRechazo ?? []).map((fila) => [fila.motivo, fila.total]),
  ];
  if ((reporte.resumen?.totalAccesos ?? 0) === 0) {
    filas.splice(filas.length, 0, [], ['Leyenda', 'No hay registros para este periodo']);
  }
  return filas;
}

/**
 * Construye las filas CSV del reporte de clientes vencidos.
 * @param {Object} reporte
 * @returns {Array<Array<unknown>>}
 */
export function filasVencidosCsv(reporte = {}) {
  const filtros = reporte.filtros ?? {
    fechaInicio: reporte.fechaInicio,
    fechaFin: reporte.fechaFin,
  };
  const filas = [
    ...filasMetadatos('Reporte de clientes vencidos GymAccess', filtros),
    [],
    ['Cliente', 'Correo', 'Teléfono', 'Tipo de membresía', 'Fecha de fin', 'Estado'],
    ...(reporte.clientes ?? []).map((cliente) => [
      cliente.cliente,
      cliente.correo,
      cliente.telefono ?? '',
      cliente.tipoMembresia ?? 'Sin membresía',
      cliente.fechaFin ?? 'Sin fecha',
      cliente.estado,
    ]),
  ];
  if ((reporte.clientes ?? []).length === 0) {
    filas.splice(filas.length, 0, [], ['Leyenda', 'No hay clientes vencidos para este periodo']);
  }
  return filas;
}
