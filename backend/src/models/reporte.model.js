// Modelo de reportes: consultas agregadas sobre pagos, accesos y membresías
// (Sprint 4, US-S4-01 a US-S4-03 y US-S4-07). Solo lectura; no modifica datos.

import { consultar } from '../config/baseDatos.js';

function filtroMetodoPago(metodoPago) {
  return metodoPago ? { sql: ' AND metodo_pago = ?', parametros: [metodoPago] } : { sql: '', parametros: [] };
}

/**
 * Resumen financiero de ingresos completados en un rango de fechas.
 * @param {string} fechaInicio - 'YYYY-MM-DD'.
 * @param {string} fechaFin - 'YYYY-MM-DD'.
 * @param {string|null} metodoPago - Filtro opcional por método de pago.
 * @returns {Promise<Object>}
 */
export async function resumenFinanciero(fechaInicio, fechaFin, metodoPago = null) {
  const filtro = filtroMetodoPago(metodoPago);
  const filas = await consultar(
    `SELECT COUNT(*) AS total_transacciones,
            COALESCE(SUM(monto), 0) AS total_recaudado
     FROM pagos
     WHERE estado = 'completado'
       AND fecha_pago >= ?
       AND fecha_pago < DATE_ADD(?, INTERVAL 1 DAY)${filtro.sql};`,
    [fechaInicio, fechaFin, ...filtro.parametros]
  );
  return filas[0];
}

/**
 * Ingresos agrupados por método de pago.
 * @param {string} fechaInicio - 'YYYY-MM-DD'.
 * @param {string} fechaFin - 'YYYY-MM-DD'.
 * @param {string|null} metodoPago - Filtro opcional por método de pago.
 * @returns {Promise<Array>}
 */
export async function ingresosPorMetodoPago(fechaInicio, fechaFin, metodoPago = null) {
  const filtro = filtroMetodoPago(metodoPago);
  return consultar(
    `SELECT metodo_pago,
            COUNT(*) AS total_transacciones,
            COALESCE(SUM(monto), 0) AS ingresos
     FROM pagos
     WHERE estado = 'completado'
       AND fecha_pago >= ?
       AND fecha_pago < DATE_ADD(?, INTERVAL 1 DAY)${filtro.sql}
     GROUP BY metodo_pago
     ORDER BY ingresos DESC, metodo_pago ASC;`,
    [fechaInicio, fechaFin, ...filtro.parametros]
  );
}

/**
 * Ingresos agrupados por tipo de membresía.
 * @param {string} fechaInicio - 'YYYY-MM-DD'.
 * @param {string} fechaFin - 'YYYY-MM-DD'.
 * @param {string|null} metodoPago - Filtro opcional por método de pago.
 * @returns {Promise<Array>}
 */
export async function ingresosPorTipoMembresia(fechaInicio, fechaFin, metodoPago = null) {
  const filtro = metodoPago ? ' AND p.metodo_pago = ?' : '';
  const parametros = [fechaInicio, fechaFin, ...(metodoPago ? [metodoPago] : [])];
  return consultar(
    `SELECT COALESCE(t.nombre, 'Sin membresía') AS tipo_membresia,
            COUNT(*) AS total_transacciones,
            COALESCE(SUM(p.monto), 0) AS ingresos
     FROM pagos p
     LEFT JOIN membresias m ON m.id_membresia = p.id_membresia
     LEFT JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     WHERE p.estado = 'completado'
       AND p.fecha_pago >= ?
       AND p.fecha_pago < DATE_ADD(?, INTERVAL 1 DAY)${filtro}
     GROUP BY t.nombre
     ORDER BY ingresos DESC, tipo_membresia ASC;`,
    parametros
  );
}

function filtrosAccesos(fechaInicio, fechaFin, idCliente, resultado) {
  const filtros = ['fecha_hora >= ?', 'fecha_hora < DATE_ADD(?, INTERVAL 1 DAY)'];
  const parametros = [fechaInicio, fechaFin];

  if (idCliente !== null && idCliente !== undefined) {
    filtros.push('id_cliente = ?');
    parametros.push(idCliente);
  }

  if (resultado) {
    filtros.push('resultado = ?');
    parametros.push(resultado);
  }

  return { sql: filtros.join(' AND '), parametros };
}

/**
 * Accesos agrupados por fecha, hora, tipo y resultado.
 * @param {string} fechaInicio - 'YYYY-MM-DD'.
 * @param {string} fechaFin - 'YYYY-MM-DD'.
 * @param {Object} [opciones] - `{ idCliente, resultado }`.
 * @returns {Promise<Array>}
 */
export async function accesosAgrupados(fechaInicio, fechaFin, opciones = {}) {
  const { idCliente = null, resultado = null } = opciones;
  const filtros = filtrosAccesos(fechaInicio, fechaFin, idCliente, resultado);

  return consultar(
    `SELECT DATE(fecha_hora) AS fecha,
            HOUR(fecha_hora) AS hora,
            tipo,
            resultado,
            COUNT(*) AS total
     FROM accesos
     WHERE ${filtros.sql}
     GROUP BY DATE(fecha_hora), HOUR(fecha_hora), tipo, resultado
     ORDER BY fecha ASC, hora ASC, tipo ASC, resultado ASC;`,
    filtros.parametros
  );
}

/**
 * Motivos de rechazo agrupados en un rango de fechas.
 * @param {string} fechaInicio - 'YYYY-MM-DD'.
 * @param {string} fechaFin - 'YYYY-MM-DD'.
 * @param {Object} [opciones] - `{ idCliente }`.
 * @returns {Promise<Array>}
 */
export async function motivosRechazo(fechaInicio, fechaFin, opciones = {}) {
  const { idCliente = null } = opciones;
  const filtros = filtrosAccesos(fechaInicio, fechaFin, idCliente, 'rechazado');

  return consultar(
    `SELECT COALESCE(motivo_rechazo, 'Sin motivo registrado') AS motivo,
            COUNT(*) AS total
     FROM accesos
     WHERE ${filtros.sql}
     GROUP BY COALESCE(motivo_rechazo, 'Sin motivo registrado')
     ORDER BY total DESC, motivo ASC;`,
    filtros.parametros
  );
}

/**
 * Membresías activas que vencen en los próximos cinco días (RN-S4-02).
 * @returns {Promise<Array>}
 */
export async function membresiasPorVencer() {
  return consultar(
    `SELECT m.id_membresia,
            m.id_cliente,
            c.nombre,
            c.apellido,
            c.correo,
            c.telefono,
            t.nombre AS tipo_membresia,
            m.fecha_fin,
            DATEDIFF(m.fecha_fin, CURDATE()) AS dias_restantes
     FROM membresias m
     INNER JOIN clientes c ON c.id_cliente = m.id_cliente
     INNER JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     WHERE m.estado = 'activa'
       AND DATEDIFF(m.fecha_fin, CURDATE()) BETWEEN 0 AND 5
     ORDER BY m.fecha_fin ASC, c.apellido ASC, c.nombre ASC;`
  );
}

/**
 * Clientes sin membresía activa vigente, con su membresía más reciente.
 * Devuelve una sola fila por cliente y no calcula adeudos (FR-034 a FR-039).
 * @param {string} fechaInicio - 'YYYY-MM-DD'.
 * @param {string} fechaFin - 'YYYY-MM-DD'.
 * @param {string|null} buscar - Texto opcional para nombre, apellido, correo o id.
 * @returns {Promise<Array>}
 */
export async function clientesVencidos(fechaInicio, fechaFin, buscar = null) {
  const condiciones = [
    `NOT EXISTS (
      SELECT 1
      FROM membresias activa
      WHERE activa.id_cliente = c.id_cliente
        AND activa.estado = 'activa'
        AND activa.fecha_fin >= CURDATE()
    )`,
  ];
  const parametros = [fechaInicio, fechaFin];

  condiciones.push('(m.fecha_fin BETWEEN ? AND ? OR m.id_membresia IS NULL)');

  if (buscar) {
    if (/^\d+$/.test(buscar.trim())) {
      condiciones.push('CAST(c.id_cliente AS CHAR) = ?');
      parametros.push(buscar.trim());
    } else {
      condiciones.push('(c.nombre LIKE ? OR c.apellido LIKE ? OR c.correo LIKE ?)');
      const patron = `%${buscar}%`;
      parametros.push(patron, patron, patron);
    }
  }

  return consultar(
    `SELECT c.id_cliente,
            c.nombre,
            c.apellido,
            c.correo,
            c.telefono,
            m.id_membresia,
            t.nombre AS tipo_membresia,
            m.fecha_fin,
            m.estado
     FROM clientes c
     LEFT JOIN membresias m ON m.id_membresia = (
       SELECT m2.id_membresia
       FROM membresias m2
       WHERE m2.id_cliente = c.id_cliente
       ORDER BY m2.fecha_fin DESC, m2.id_membresia DESC
       LIMIT 1
     )
     LEFT JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     WHERE ${condiciones.join(' AND ')}
     ORDER BY m.fecha_fin DESC, c.apellido ASC, c.nombre ASC;`,
    parametros
  );
}
