// Utilidades compartidas para las pruebas de integración del Sprint 3:
// creación y limpieza de clientes, entrenadores, asignaciones, rutinas,
// objetivos y progresos de prueba.

import { randomUUID } from 'node:crypto';
import { consultar, ejecutar } from '../../src/config/baseDatos.js';

const idsClientes = [];
const idsEntrenadores = [];

/**
 * Crea un cliente de prueba activo o inactivo.
 * @param {Object} [opciones] - `{ estado, correo }`.
 * @returns {Promise<{id: number, correo: string}>}
 */
export async function crearCliente({ estado = 'activo', correo = null } = {}) {
  const email = correo ?? `cliente.sprint3.${randomUUID()}@pruebas.local`;
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?);',
    ['Cliente', 'Sprint3', email, estado]
  );
  idsClientes.push(resultado.insertId);
  return { id: resultado.insertId, correo: email };
}

/**
 * Registra un entrenador ligado a un usuario ya existente.
 * @param {number} idUsuario
 * @param {Object} [opciones] - `{ estado, especialidad }`.
 * @returns {Promise<number>} Identificador del entrenador.
 */
export async function crearEntrenadorDeUsuario(idUsuario, { estado = 'activo', especialidad = 'Fuerza' } = {}) {
  const resultado = await ejecutar(
    'INSERT INTO entrenadores (id_usuario, especialidad, telefono, estado) VALUES (?, ?, ?, ?);',
    [idUsuario, especialidad, null, estado]
  );
  idsEntrenadores.push(resultado.insertId);
  return resultado.insertId;
}

/**
 * Inserta una asignación directa entre cliente y entrenador.
 * @returns {Promise<number>} Identificador de la asignación.
 */
export async function asignarDirecto(idCliente, idEntrenador, { esPrincipal = true, estado = 'activa' } = {}) {
  const resultado = await ejecutar(
    'INSERT INTO asignaciones_entrenador (id_cliente, id_entrenador, es_principal, estado) VALUES (?, ?, ?, ?);',
    [idCliente, idEntrenador, esPrincipal ? 1 : 0, estado]
  );
  return resultado.insertId;
}

/** Elimina todos los datos creados por el archivo de pruebas (en orden de FK). */
export async function limpiarSprint3() {
  if (idsClientes.length > 0) {
    const m = idsClientes.map(() => '?').join(', ');
    await consultar(`DELETE FROM progresos_clientes WHERE id_cliente IN (${m});`, idsClientes);
    await consultar(`DELETE FROM objetivos_entrenamiento WHERE id_cliente IN (${m});`, idsClientes);
    await consultar(
      `DELETE FROM ejercicios_rutina WHERE id_rutina IN (SELECT id_rutina FROM rutinas WHERE id_cliente IN (${m}));`,
      idsClientes
    );
    await consultar(`DELETE FROM rutinas WHERE id_cliente IN (${m});`, idsClientes);
    await consultar(`DELETE FROM asignaciones_entrenador WHERE id_cliente IN (${m});`, idsClientes);
    await consultar(`DELETE FROM clientes WHERE id_cliente IN (${m});`, idsClientes);
    idsClientes.length = 0;
  }
  if (idsEntrenadores.length > 0) {
    const m = idsEntrenadores.map(() => '?').join(', ');
    await consultar(`DELETE FROM progresos_clientes WHERE id_entrenador IN (${m});`, idsEntrenadores);
    await consultar(`DELETE FROM objetivos_entrenamiento WHERE id_entrenador IN (${m});`, idsEntrenadores);
    await consultar(
      `DELETE FROM ejercicios_rutina WHERE id_rutina IN (SELECT id_rutina FROM rutinas WHERE id_entrenador IN (${m}));`,
      idsEntrenadores
    );
    await consultar(`DELETE FROM rutinas WHERE id_entrenador IN (${m});`, idsEntrenadores);
    await consultar(`DELETE FROM asignaciones_entrenador WHERE id_entrenador IN (${m});`, idsEntrenadores);
    await consultar(`DELETE FROM entrenadores WHERE id_entrenador IN (${m});`, idsEntrenadores);
    idsEntrenadores.length = 0;
  }
}
