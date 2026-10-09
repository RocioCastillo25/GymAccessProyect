// Semilla del usuario administrador inicial (FR-002, FR-011, investigación R7).
// Es idempotente: no duplica el usuario si ya existe y nunca guarda la contraseña
// en texto plano (hash de bcrypt calculado en el momento de ejecutarla).

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
 * Crea el usuario administrador inicial usando las variables de entorno
 * SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD y SEED_ADMIN_NAME.
 * @param {object} conexion - Conexión activa de mysql2 sobre la base de datos del proyecto.
 */
export async function sembrarAdministrador(conexion) {
  const correo = process.env.SEED_ADMIN_EMAIL || 'admin@gimnasio.local';
  const password = process.env.SEED_ADMIN_PASSWORD;
  const nombre = process.env.SEED_ADMIN_NAME || 'Administrador';

  if (!password || password.length < LONGITUD_MINIMA_PASSWORD) {
    throw new Error(
      `SEED_ADMIN_PASSWORD debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres (FR-011).`
    );
  }

  const [existentes] = await conexion.query(
    'SELECT id_usuario FROM `usuarios` WHERE correo = ? LIMIT 1;',
    [correo]
  );

  if (existentes.length > 0) {
    console.log(`[semilla] Administrador ya existente, se omite: ${correo}`);
    return null;
  }

  const hash = await bcrypt.hash(password, 10);
  const [resultado] = await conexion.query(
    'INSERT INTO `usuarios` (nombre, correo, password, rol, estado) VALUES (?, ?, ?, ?, ?);',
    [nombre, correo, hash, 'administrador', 'activo']
  );

  console.log(`[semilla] Administrador creado: ${correo} (id ${resultado.insertId})`);
  return resultado.insertId;
}
