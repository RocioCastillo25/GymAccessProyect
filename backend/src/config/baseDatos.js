// Conexión a MySQL (FR-024, FR-025).
// Únicamente el backend accede a la base de datos y siempre mediante consultas
// parametrizadas; nunca se concatenan valores de usuario en el SQL.

import mysql from 'mysql2/promise';
import { config } from './entorno.js';

let pool = null;

export function obtenerPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      // Las columnas DATE (fecha_inicio/fecha_fin) se leen como 'YYYY-MM-DD' para
      // compararlas sin desfases de zona horaria (Sprint 2, R5).
      dateStrings: ['DATE'],
    });
  }
  return pool;
}

/**
 * Ejecuta una consulta parametrizada.
 * @param {string} sql - Consulta con marcadores `?`.
 * @param {Array} parametros - Valores parametrizados.
 * @returns {Promise<Array>} Filas resultantes (o resultado de escritura).
 */
export async function consultar(sql, parametros = []) {
  const [filas] = await obtenerPool().query(sql, parametros);
  return filas;
}

/**
 * Ejecuta una sentencia de escritura (INSERT, UPDATE, DELETE) y devuelve el
 * resultado de MySQL (OkPacket con `insertId` y `affectedRows`).
 * @param {string} sql - Sentencia con marcadores `?`.
 * @param {Array} parametros - Valores parametrizados.
 * @returns {Promise<Object>} Resultado de la escritura.
 */
export async function ejecutar(sql, parametros = []) {
  const [resultado] = await obtenerPool().query(sql, parametros);
  return resultado;
}

/**
 * Ejecuta varias consultas dentro de una transacción.
 * Si alguna falla, se hace rollback y se relanza el error.
 * @param {Function} tarea - Recibe la conexión y debe usar `conexion.query(...)`.
 */
export async function transaccion(tarea) {
  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await tarea(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function cerrarPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Comprueba que MySQL esté accesible (usado por GET /api/salud).
 * @returns {Promise<boolean>}
 */
export async function verificarConexion() {
  try {
    await consultar('SELECT 1;');
    return true;
  } catch {
    return false;
  }
}
