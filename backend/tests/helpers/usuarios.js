// Utilidades compartidas para las pruebas de integración: creación de usuarios
// de prueba y obtención de tokens por rol.

import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, ejecutar } from '../../src/config/baseDatos.js';

// Usuarios creados por este archivo de pruebas: la limpieza posterior solo
// borra los propios, nunca los de otros archivos que corren en paralelo.
const usuariosCreados = [];

/**
 * Crea un usuario de prueba con un correo único y devuelve sus datos.
 * El sufijo aleatorio evita colisiones cuando los archivos de prueba se
 * ejecutan en paralelo.
 * @returns {Promise<{id: number, correo: string, password: string, rol: string}>}
 */
export async function crearUsuarioPrueba(rol, estado = 'activo') {
  const password = 'Prueba1234';
  const sufijo = randomUUID();
  const correo = `prueba.${rol}.${sufijo}@pruebas.local`;
  const hash = await bcrypt.hash(password, 10);
  const resultado = await ejecutar(
    'INSERT INTO usuarios (nombre, correo, password, rol, estado) VALUES (?, ?, ?, ?, ?);',
    [`Usuario ${rol}`, correo, hash, rol, estado]
  );
  const usuario = { id: resultado.insertId, correo, password, rol, estado };
  usuariosCreados.push(usuario.id);
  return usuario;
}

/**
 * Obtiene un token JWT iniciando sesión con las credenciales dadas.
 * @returns {Promise<string>}
 */
export async function obtenerToken(correo, password) {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo, password });
  if (respuesta.status !== 200) {
    throw new Error(`No se pudo iniciar sesión: ${respuesta.status} ${JSON.stringify(respuesta.body)}`);
  }
  return respuesta.body.token;
}

/**
 * Crea un usuario de prueba e inicia sesión con él.
 * @returns {Promise<{usuario: Object, token: string}>}
 */
export async function usuarioYToken(rol, estado = 'activo') {
  const usuario = await crearUsuarioPrueba(rol, estado);
  const token = await obtenerToken(usuario.correo, usuario.password);
  return { usuario, token };
}

/** Elimina solo los usuarios creados por este archivo de pruebas. */
export async function limpiarUsuariosPrueba() {
  if (usuariosCreados.length === 0) return;
  const marcadores = usuariosCreados.map(() => '?').join(', ');
  await consultar(
    `DELETE FROM auditoria WHERE id_usuario IN (${marcadores});`,
    usuariosCreados
  );
  await consultar(`DELETE FROM usuarios WHERE id_usuario IN (${marcadores});`, usuariosCreados);
  usuariosCreados.length = 0;
}
