// Medición de rendimiento del Sprint 4.
// Ejecuta las consultas principales de reportes y validación facial, muestra el
// plan EXPLAIN y calcula el tiempo promedio. Uso:
// node database/scripts/medir-rendimiento.js

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const requireFromBackend = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'backend', 'package.json')
);
const mysql = requireFromBackend('mysql2/promise');
const { config } = await import('../../backend/src/config/entorno.js');

const REPETICIONES = 5;
const OBJETIVO_REPORTES_MS = 3000;
const OBJETIVO_FACIAL_MS = 200;

function fechaIso(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function rangoUltimoMes() {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 30);
  return { fechaInicio: fechaIso(inicio), fechaFin: fechaIso(fin) };
}

async function medir(conexion, nombre, sql, parametros, objetivoMs) {
  const [plan] = await conexion.query(`EXPLAIN ${sql}`, parametros);
  const tiempos = [];

  for (let i = 0; i < REPETICIONES; i += 1) {
    const inicio = process.hrtime.bigint();
    await conexion.query(sql, parametros);
    const fin = process.hrtime.bigint();
    tiempos.push(Number(fin - inicio) / 1_000_000);
  }

  const promedio = tiempos.reduce((suma, tiempo) => suma + tiempo, 0) / tiempos.length;
  const maximo = Math.max(...tiempos);
  const cumple = promedio < objetivoMs;
  console.log(`\n[${nombre}] promedio ${promedio.toFixed(2)} ms, máximo ${maximo.toFixed(2)} ms`);
  console.log(`Objetivo < ${objetivoMs} ms: ${cumple ? 'CUMPLE' : 'NO CUMPLE'}`);
  console.table(
    plan.map((fila) => ({
      tabla: fila.table,
      tipo: fila.type,
      clave: fila.key,
      filas: fila.rows,
      extra: fila.Extra,
    }))
  );
  return { promedio, maximo, cumple };
}

async function main() {
  const conexion = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });
  const { fechaInicio, fechaFin } = rangoUltimoMes();

  try {
    const resultados = [];
    resultados.push(
      await medir(
        conexion,
        'Reporte financiero',
        `SELECT COUNT(*) AS total_transacciones, COALESCE(SUM(monto), 0) AS total_recaudado
         FROM pagos
         WHERE estado = 'completado'
           AND fecha_pago >= ? AND fecha_pago < DATE_ADD(?, INTERVAL 1 DAY);`,
        [fechaInicio, fechaFin],
        OBJETIVO_REPORTES_MS
      )
    );
    resultados.push(
      await medir(
        conexion,
        'Reporte de accesos',
        `SELECT DATE(fecha_hora) AS fecha, HOUR(fecha_hora) AS hora, tipo, resultado, COUNT(*) AS total
         FROM accesos
         WHERE fecha_hora >= ? AND fecha_hora < DATE_ADD(?, INTERVAL 1 DAY)
         GROUP BY DATE(fecha_hora), HOUR(fecha_hora), tipo, resultado;`,
        [fechaInicio, fechaFin],
        OBJETIVO_REPORTES_MS
      )
    );
    resultados.push(
      await medir(
        conexion,
        'Validación facial (descriptores activos)',
        "SELECT id_cliente, descriptor_facial FROM rostros WHERE estado = 'activo';",
        [],
        OBJETIVO_FACIAL_MS
      )
    );

    const cumpleTodo = resultados.every((resultado) => resultado.cumple);
    console.log(`\nResultado general: ${cumpleTodo ? 'CUMPLE' : 'REVISAR'} los objetivos.`);
    if (!cumpleTodo) process.exitCode = 2;
  } finally {
    await conexion.end();
  }
}

main().catch((error) => {
  console.error('[rendimiento] Error:', error.message);
  process.exitCode = 1;
});
