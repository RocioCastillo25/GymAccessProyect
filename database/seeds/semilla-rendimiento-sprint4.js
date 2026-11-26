// Semilla de rendimiento del Sprint 4.
// Crea al menos 10,000 pagos y 50,000 accesos distribuidos en un mes para medir
// reportes e índices. Es reejecutable y elimina únicamente los datos que crea.
// Uso: node database/seeds/semilla-rendimiento-sprint4.js

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const requireFromBackend = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'backend', 'package.json')
);
const mysql = requireFromBackend('mysql2/promise');

const { config } = await import('../../backend/src/config/entorno.js');

const PREFIJO_CORREO = 'rendimiento.sprint4.';
const PREFIJO_TIPO = 'Rendimiento Sprint 4';
const TOTAL_CLIENTES = 200;
const TOTAL_PAGOS = 10000;
const TOTAL_ACCESOS = 50000;
const TAMANO_LOTE = 1000;
const METODOS = ['efectivo', 'tarjeta', 'transferencia'];
const MOTIVOS = [
  'La membresía está vencida.',
  'El cliente no tiene una membresía registrada.',
  'La membresía está suspendida.',
  'Rostro no reconocido.',
];
const TIPOS = [
  { nombre: `${PREFIJO_TIPO} Mensual`, duracion: 30, precio: 250 },
  { nombre: `${PREFIJO_TIPO} Trimestral`, duracion: 90, precio: 650 },
  { nombre: `${PREFIJO_TIPO} Anual`, duracion: 365, precio: 2400 },
];

function fechaHora(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minuto = String(fecha.getMinutes()).padStart(2, '0');
  const segundo = String(fecha.getSeconds()).padStart(2, '0');
  return `${anio}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
}

function fechaIso(fecha) {
  return fechaHora(fecha).slice(0, 10);
}

function haceDias(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha;
}

async function eliminarDatosAnteriores(conexion) {
  const [clientes] = await conexion.query(
    'SELECT id_cliente FROM clientes WHERE correo LIKE ?;',
    [`${PREFIJO_CORREO}%`]
  );
  if (clientes.length === 0) return;

  const ids = clientes.map((fila) => fila.id_cliente);
  const marcadores = ids.map(() => '?').join(', ');
  await conexion.query(`DELETE FROM accesos WHERE id_cliente IN (${marcadores});`, ids);
  await conexion.query(`DELETE FROM pagos WHERE id_cliente IN (${marcadores});`, ids);
  await conexion.query(`DELETE FROM membresias WHERE id_cliente IN (${marcadores});`, ids);
  await conexion.query(`DELETE FROM clientes WHERE id_cliente IN (${marcadores});`, ids);
}

async function insertarPorLotes(conexion, sql, filas) {
  for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
    await conexion.query(sql, [filas.slice(i, i + TAMANO_LOTE)]);
  }
}

async function main() {
  const conexion = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });

  try {
    console.log('[rendimiento] Limpiando datos anteriores de la semilla...');
    await eliminarDatosAnteriores(conexion);

    const clientes = [];
    for (let i = 0; i < TOTAL_CLIENTES; i += 1) {
      clientes.push([
        `Cliente${i}`,
        `Rendimiento${i}`,
        `${PREFIJO_CORREO}${i}@pruebas.local`,
        `5555-${String(i).padStart(4, '0')}`,
        'activo',
      ]);
    }
    await insertarPorLotes(
      conexion,
      'INSERT INTO clientes (nombre, apellido, correo, telefono, estado) VALUES ?;',
      clientes
    );

    for (const tipo of TIPOS) {
      const [existentes] = await conexion.query(
        'SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = ? LIMIT 1;',
        [tipo.nombre]
      );
      if (existentes.length === 0) {
        await conexion.query(
          'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?);',
          [tipo.nombre, 'Datos de rendimiento del Sprint 4', tipo.duracion, tipo.precio, 'activo']
        );
      }
    }

    const [filasClientes] = await conexion.query(
      'SELECT id_cliente FROM clientes WHERE correo LIKE ? ORDER BY id_cliente;',
      [`${PREFIJO_CORREO}%`]
    );
    const [filasTipos] = await conexion.query(
      'SELECT id_tipo_membresia, duracion FROM tipos_membresia WHERE nombre LIKE ? ORDER BY id_tipo_membresia;',
      [`${PREFIJO_TIPO}%`]
    );

    const membresias = [];
    for (let i = 0; i < filasClientes.length; i += 1) {
      const tipo = filasTipos[i % filasTipos.length];
      const inicio = haceDias(15 + (i % 30));
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + tipo.duracion);
      const estado = i % 5 === 0 ? 'vencida' : 'activa';
      membresias.push([
        filasClientes[i].id_cliente,
        tipo.id_tipo_membresia,
        fechaIso(inicio),
        fechaIso(fin),
        estado,
      ]);
    }
    await insertarPorLotes(
      conexion,
      'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES ?;',
      membresias
    );

    const [filasMembresias] = await conexion.query(
      `SELECT m.id_membresia, m.id_cliente
       FROM membresias m
       INNER JOIN clientes c ON c.id_cliente = m.id_cliente
       WHERE c.correo LIKE ?
       ORDER BY m.id_membresia;`,
      [`${PREFIJO_CORREO}%`]
    );

    const pagos = [];
    for (let i = 0; i < TOTAL_PAGOS; i += 1) {
      const cliente = filasClientes[i % filasClientes.length];
      const membresia = filasMembresias[i % filasMembresias.length];
      const estado = i % 20 < 17 ? 'completado' : i % 20 < 19 ? 'pendiente' : 'cancelado';
      const fecha = haceDias(i % 30);
      fecha.setHours(8 + (i % 10), i % 60, 0, 0);
      pagos.push([
        cliente.id_cliente,
        membresia.id_membresia,
        100 + (i % 40) * 25,
        METODOS[i % METODOS.length],
        estado,
        fechaHora(fecha),
      ]);
    }
    await insertarPorLotes(
      conexion,
      'INSERT INTO pagos (id_cliente, id_membresia, monto, metodo_pago, estado, fecha_pago) VALUES ?;',
      pagos
    );

    const accesos = [];
    for (let i = 0; i < TOTAL_ACCESOS; i += 1) {
      const cliente = filasClientes[i % filasClientes.length];
      const fecha = haceDias(i % 30);
      fecha.setHours(i % 24, (i * 7) % 60, (i * 13) % 60, 0);
      const rechazado = i % 100 >= 85;
      accesos.push([
        cliente.id_cliente,
        fechaHora(fecha),
        i % 2 === 0 ? 'entrada' : 'salida',
        rechazado ? 'rechazado' : 'autorizado',
        rechazado ? MOTIVOS[i % MOTIVOS.length] : null,
      ]);
    }
    await insertarPorLotes(
      conexion,
      'INSERT INTO accesos (id_cliente, fecha_hora, tipo, resultado, motivo_rechazo) VALUES ?;',
      accesos
    );

    console.log(
      `[rendimiento] Listo: ${TOTAL_CLIENTES} clientes, ${membresias.length} membresías, ${pagos.length} pagos y ${accesos.length} accesos.`
    );
  } finally {
    await conexion.end();
  }
}

main().catch((error) => {
  console.error('[rendimiento] Error:', error.message);
  process.exitCode = 1;
});
