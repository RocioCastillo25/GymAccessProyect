// Pruebas de los índices compuestos del Sprint 4 (US-S4-05, migración 006).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';

const INDICES = {
  pagos: {
    idx_pagos_estado_fecha: ['estado', 'fecha_pago'],
    idx_pagos_estado_fecha_metodo: ['estado', 'fecha_pago', 'metodo_pago'],
  },
  accesos: {
    idx_accesos_fecha_resultado: ['fecha_hora', 'resultado'],
    idx_accesos_fecha_cliente_resultado: ['fecha_hora', 'id_cliente', 'resultado'],
  },
  membresias: {
    idx_membresias_cliente_estado_fin: ['id_cliente', 'estado', 'fecha_fin'],
    idx_membresias_estado_fin: ['estado', 'fecha_fin'],
  },
  rostros: {
    idx_rostros_estado: ['estado'],
  },
  clientes: {
    idx_clientes_apellido_nombre: ['apellido', 'nombre'],
  },
};

async function columnasDelIndice(tabla, indice) {
  const filas = await consultar(
    `SELECT column_name AS columna
     FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
     ORDER BY seq_in_index;`,
    [tabla, indice]
  );
  return filas.map((fila) => fila.columna);
}

beforeAll(async () => {
  // La migración se aplica fuera de las pruebas; aquí solo se verifica su efecto.
});

afterAll(async () => {
  await cerrarPool();
});

describe('Índices de rendimiento', () => {
  it('existen todos los índices compuestos con sus columnas en orden', async () => {
    for (const [tabla, indices] of Object.entries(INDICES)) {
      for (const [indice, columnas] of Object.entries(indices)) {
        expect(await columnasDelIndice(tabla, indice)).toEqual(columnas);
      }
    }
  });

  it('el reporte financiero usa un índice sobre pagos', async () => {
    const plan = await consultar(
      `EXPLAIN SELECT COUNT(*) AS total
       FROM pagos
       WHERE estado = 'completado'
         AND fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 2 DAY)
         AND fecha_pago < DATE_SUB(CURDATE(), INTERVAL 1 DAY);`
    );
    expect(plan[0].key).toMatch(/idx_pagos/);
    expect(plan[0].type).not.toBe('ALL');
  });

  it('el reporte de accesos usa un índice sobre accesos', async () => {
    const plan = await consultar(
      `EXPLAIN SELECT DATE(fecha_hora) AS fecha, HOUR(fecha_hora) AS hora, COUNT(*) AS total
       FROM accesos
       WHERE fecha_hora >= DATE_SUB(CURDATE(), INTERVAL 2 DAY)
         AND fecha_hora < DATE_SUB(CURDATE(), INTERVAL 1 DAY)
       GROUP BY DATE(fecha_hora), HOUR(fecha_hora);`
    );
    expect(plan[0].key).toMatch(/accesos/);
    expect(plan[0].type).not.toBe('ALL');
  });

  it('la validación facial puede filtrar por estado con índice', async () => {
    const plan = await consultar(
      `EXPLAIN SELECT id_cliente, descriptor_facial
       FROM rostros FORCE INDEX (idx_rostros_estado)
       WHERE estado = 'activo';`
    );
    expect(plan[0].key).toBe('idx_rostros_estado');
  });
});
