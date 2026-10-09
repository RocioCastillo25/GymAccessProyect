// Modelo de usuarios: acceso a datos de la tabla `usuarios` (data-model.md §2.1).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_SEGURAS = 'id_usuario, nombre, correo, rol, estado';

/**
 * Busca un usuario por su correo.
 * @param {string} correo - Correo a buscar.
 * @param {boolean} incluirPassword - Si es true incluye el hash (solo para autenticar).
 * @returns {Promise<Object|null>}
 */
export async function buscarPorCorreo(correo, incluirPassword = false) {
  const columnas = incluirPassword ? `${COLUMNAS_SEGURAS}, password` : COLUMNAS_SEGURAS;
  const filas = await consultar(
    `SELECT ${columnas} FROM usuarios WHERE correo = ? LIMIT 1;`,
    [correo]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Busca un usuario por su identificador.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_SEGURAS} FROM usuarios WHERE id_usuario = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Lista todos los usuarios (sin contraseña).
 * @returns {Promise<Array>}
 */
export async function listar() {
  return consultar(`SELECT ${COLUMNAS_SEGURAS} FROM usuarios ORDER BY nombre;`);
}

/**
 * Crea un usuario con la contraseña ya hasheada.
 * @returns {Promise<number>} Identificador creado.
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    'INSERT INTO usuarios (nombre, correo, password, rol, estado) VALUES (?, ?, ?, ?, ?);',
    [datos.nombre, datos.correo, datos.password, datos.rol, datos.estado || 'activo']
  );
  return resultado.insertId;
}

/**
 * Actualiza nombre, correo, rol y/o estado de un usuario.
 * @returns {Promise<number>} Filas afectadas.
 */
export async function actualizar(id, datos) {
  const campos = [];
  const valores = [];
  for (const campo of ['nombre', 'correo', 'rol', 'estado']) {
    if (datos[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(datos[campo]);
    }
  }
  if (campos.length === 0) return 0;
  valores.push(id);
  const resultado = await ejecutar(
    `UPDATE usuarios SET ${campos.join(', ')} WHERE id_usuario = ?;`,
    valores
  );
  return resultado.affectedRows;
}

/**
 * Guarda el hash de una contraseña nueva (FR-011).
 * @returns {Promise<number>} Filas afectadas.
 */
export async function restablecerPassword(id, hashPassword) {
  const resultado = await ejecutar(
    'UPDATE usuarios SET password = ? WHERE id_usuario = ?;',
    [hashPassword, id]
  );
  return resultado.affectedRows;
}
