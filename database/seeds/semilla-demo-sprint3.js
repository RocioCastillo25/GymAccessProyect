// Semilla de demostración del Sprint 3 (opcional, T002).
// Crea un entrenador de ejemplo asociado a un usuario con rol `entrenador`.
// Es idempotente: no duplica datos si ya existen y nunca guarda la contraseña en
// texto plano (hash de bcrypt calculado al ejecutarla).
// Uso: se importa como `sembrarDemoSprint3(conexion)` desde un script o consola.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// bcrypt está instalado en backend/node_modules.
const requireFromBackend = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'backend', 'package.json')
);
const bcrypt = requireFromBackend('bcrypt');

const LONGITUD_MINIMA_PASSWORD = 8;

/**
 * Crea un usuario de entrenador de demostración y su registro en `entrenadores`.
 * Usa las variables de entorno SEED_TRAINER_EMAIL, SEED_TRAINER_PASSWORD y
 * SEED_TRAINER_NAME. Sin SEED_TRAINER_PASSWORD, omite la creación.
 * @param {object} conexion - Conexión activa de mysql2 sobre la base del proyecto.
 */
export async function sembrarDemoSprint3(conexion) {
  const correo = process.env.SEED_TRAINER_EMAIL || 'entrenador.demo@gimnasio.local';
  const password = process.env.SEED_TRAINER_PASSWORD;
  const nombre = process.env.SEED_TRAINER_NAME || 'Entrenador Demo';

  if (!password || password.length < LONGITUD_MINIMA_PASSWORD) {
    console.log(
      `[semilla] SEED_TRAINER_PASSWORD no definida con al menos ${LONGITUD_MINIMA_PASSWORD} caracteres; se omite el entrenador de demostración.`
    );
    return null;
  }

  const [existentes] = await conexion.query(
    'SELECT id_usuario FROM `usuarios` WHERE correo = ? LIMIT 1;',
    [correo]
  );

  let idUsuario;
  if (existentes.length > 0) {
    idUsuario = existentes[0].id_usuario;
    console.log(`[semilla] Usuario entrenador ya existente, se reutiliza: ${correo}`);
  } else {
    const hash = await bcrypt.hash(password, 10);
    const [resultado] = await conexion.query(
      'INSERT INTO `usuarios` (nombre, correo, password, rol, estado) VALUES (?, ?, ?, ?, ?);',
      [nombre, correo, hash, 'entrenador', 'activo']
    );
    idUsuario = resultado.insertId;
    console.log(`[semilla] Usuario entrenador creado: ${correo} (id ${idUsuario})`);
  }

  const [entrenadores] = await conexion.query(
    'SELECT id_entrenador FROM `entrenadores` WHERE id_usuario = ? LIMIT 1;',
    [idUsuario]
  );
  if (entrenadores.length > 0) {
    console.log(`[semilla] Entrenador ya existente (id ${entrenadores[0].id_entrenador})`);
    return entrenadores[0].id_entrenador;
  }

  const [entrenador] = await conexion.query(
    'INSERT INTO `entrenadores` (id_usuario, especialidad, telefono, estado) VALUES (?, ?, ?, ?);',
    [idUsuario, 'Acondicionamiento físico', null, 'activo']
  );
  console.log(`[semilla] Entrenador creado (id ${entrenador.insertId})`);
  return entrenador.insertId;
}
