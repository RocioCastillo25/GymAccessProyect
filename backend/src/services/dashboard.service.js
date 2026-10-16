// Servicio del dashboard: indicadores agregados sin tabla propia (FR-019 a FR-021, R18).

import { consultar } from '../config/baseDatos.js';

async function contar(sql, parametros = []) {
  const filas = await consultar(sql, parametros);
  return Number(filas[0]?.total ?? 0);
}

/**
 * Resumen general del gimnasio (solo administrador, FR-019).
 * @returns {Promise<Object>}
 */
export async function resumenGeneral() {
  const clientesActivos = await contar(
    "SELECT COUNT(*) AS total FROM clientes WHERE estado = 'activo';"
  );
  const clientesInactivos = await contar(
    "SELECT COUNT(*) AS total FROM clientes WHERE estado = 'inactivo';"
  );
  const entrenadoresActivos = await contar(
    "SELECT COUNT(*) AS total FROM entrenadores WHERE estado = 'activo';"
  );
  const clientesConEntrenador = await contar(
    `SELECT COUNT(DISTINCT id_cliente) AS total FROM asignaciones_entrenador
     WHERE es_principal = 1 AND estado = 'activa';`
  );
  const rutinasActivas = await contar(
    "SELECT COUNT(*) AS total FROM rutinas WHERE estado = 'activa';"
  );
  const objetivosEnProgreso = await contar(
    "SELECT COUNT(*) AS total FROM objetivos_entrenamiento WHERE estado = 'en_progreso';"
  );
  const membresiasActivas = await contar(
    "SELECT COUNT(*) AS total FROM membresias WHERE estado = 'activa';"
  );
  const membresiasVencidas = await contar(
    "SELECT COUNT(*) AS total FROM membresias WHERE estado = 'activa' AND fecha_fin < CURDATE();"
  );
  const accesosRecientes = await contar(
    'SELECT COUNT(*) AS total FROM accesos WHERE fecha_hora >= (NOW() - INTERVAL 7 DAY);'
  );
  const accesosRechazados = await contar(
    "SELECT COUNT(*) AS total FROM accesos WHERE resultado = 'rechazado';"
  );

  return {
    clientesActivos,
    clientesInactivos,
    entrenadoresActivos,
    clientesConEntrenador,
    clientesSinEntrenador: Math.max(clientesActivos - clientesConEntrenador, 0),
    rutinasActivas,
    objetivosEnProgreso,
    membresiasActivas,
    membresiasVencidas,
    accesosRecientes,
    accesosRechazados,
  };
}

/**
 * Resumen operativo de personal (administrador y recepcionista, FR-020).
 * @returns {Promise<Object>}
 */
export async function resumenPersonal() {
  const clientesActivos = await contar(
    "SELECT COUNT(*) AS total FROM clientes WHERE estado = 'activo';"
  );
  const entrenadoresActivos = await contar(
    "SELECT COUNT(*) AS total FROM entrenadores WHERE estado = 'activo';"
  );
  const asignacionesActivas = await contar(
    `SELECT COUNT(DISTINCT id_cliente) AS total FROM asignaciones_entrenador
     WHERE es_principal = 1 AND estado = 'activa';`
  );

  return {
    entrenadoresActivos,
    asignacionesActivas,
    clientesSinEntrenador: Math.max(clientesActivos - asignacionesActivas, 0),
  };
}
