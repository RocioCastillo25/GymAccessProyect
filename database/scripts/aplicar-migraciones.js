// Aplicador de migraciones (FR-023, SC-004, investigación R8).
// Crea la base de datos si no existe, aplica los scripts numerados de
// database/migrations/ en orden y registra los ya aplicados para que la ejecución
// sea reejecutable. Uso: node database/scripts/aplicar-migraciones.js

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

// mysql2 vive en backend/node_modules; se resuelve desde ahí para que este script
// pueda ejecutarse directamente desde la raíz del repositorio.
const requireFromBackend = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'backend', 'package.json')
);
const mysql = requireFromBackend('mysql2/promise');

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const carpetaMigraciones = path.join(raiz, 'database', 'migrations');

// Carga las variables de entorno del backend o de la raíz.
const { config } = await import('../../backend/src/config/entorno.js');

const { host, port, user, password, name: dbName } = config.db;

async function crearConexionBase() {
  return mysql.createConnection({
    host,
    port: Number(port),
    user,
    password,
    multipleStatements: true,
  });
}

async function registrarControl(conexion) {
  await conexion.query(`
    CREATE TABLE IF NOT EXISTS \`_migraciones_aplicadas\` (
      \`archivo\` VARCHAR(255) NOT NULL PRIMARY KEY,
      \`aplicada_en\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function main() {
  console.log(`[migraciones] Base de datos: ${dbName} en ${host}:${port}`);

  const conexion = await crearConexionBase();
  await conexion.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await conexion.query(`USE \`${dbName}\`;`);
  await registrarControl(conexion);

  const [aplicadas] = await conexion.query('SELECT archivo FROM `_migraciones_aplicadas`;');
  const yaAplicadas = new Set(aplicadas.map((fila) => fila.archivo));

  const archivos = (await readdir(carpetaMigraciones))
    .filter((archivo) => archivo.endsWith('.sql'))
    .sort();

  let aplicadasAhora = 0;
  for (const archivo of archivos) {
    if (yaAplicadas.has(archivo)) {
      console.log(`[migraciones] Omitida (ya aplicada): ${archivo}`);
      continue;
    }
    const contenido = await readFile(path.join(carpetaMigraciones, archivo), 'utf8');
    await conexion.query(contenido);
    await conexion.query('INSERT INTO `_migraciones_aplicadas` (archivo) VALUES (?);', [archivo]);
    aplicadasAhora += 1;
    console.log(`[migraciones] Aplicada: ${archivo}`);
  }

  // La semilla se ejecuta después de las migraciones (es idempotente).
  const { sembrarAdministrador } = await import('../seeds/semilla-administrador.js');
  await sembrarAdministrador(conexion);

  await conexion.end();
  console.log(
    `[migraciones] Fin. ${aplicadasAhora} migración(es) nueva(s) de ${archivos.length} disponibles.`
  );
}

main().catch((error) => {
  console.error('[migraciones] Error:', error.message);
  process.exitCode = 1;
});
