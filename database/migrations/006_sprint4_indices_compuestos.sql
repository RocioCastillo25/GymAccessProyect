-- Migración 006: índices compuestos para reportes y validación facial (Sprint 4).
-- Es reejecutable: cada índice se crea solo si no existe uno con el mismo nombre.

SET NAMES utf8mb4;

-- pagos (estado, fecha_pago)
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'pagos'
    AND index_name = 'idx_pagos_estado_fecha');
SET @sql = IF(@existe = 0,
  'ALTER TABLE pagos ADD INDEX idx_pagos_estado_fecha (estado, fecha_pago)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pagos (estado, fecha_pago, metodo_pago)
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'pagos'
    AND index_name = 'idx_pagos_estado_fecha_metodo');
SET @sql = IF(@existe = 0,
  'ALTER TABLE pagos ADD INDEX idx_pagos_estado_fecha_metodo (estado, fecha_pago, metodo_pago)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- accesos (fecha_hora, resultado)
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'accesos'
    AND index_name = 'idx_accesos_fecha_resultado');
SET @sql = IF(@existe = 0,
  'ALTER TABLE accesos ADD INDEX idx_accesos_fecha_resultado (fecha_hora, resultado)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- accesos (fecha_hora, id_cliente, resultado)
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'accesos'
    AND index_name = 'idx_accesos_fecha_cliente_resultado');
SET @sql = IF(@existe = 0,
  'ALTER TABLE accesos ADD INDEX idx_accesos_fecha_cliente_resultado (fecha_hora, id_cliente, resultado)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- membresias (id_cliente, estado, fecha_fin)
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'membresias'
    AND index_name = 'idx_membresias_cliente_estado_fin');
SET @sql = IF(@existe = 0,
  'ALTER TABLE membresias ADD INDEX idx_membresias_cliente_estado_fin (id_cliente, estado, fecha_fin)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- membresias (estado, fecha_fin)
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'membresias'
    AND index_name = 'idx_membresias_estado_fin');
SET @sql = IF(@existe = 0,
  'ALTER TABLE membresias ADD INDEX idx_membresias_estado_fin (estado, fecha_fin)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- rostros (estado)
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'rostros'
    AND index_name = 'idx_rostros_estado');
SET @sql = IF(@existe = 0,
  'ALTER TABLE rostros ADD INDEX idx_rostros_estado (estado)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- clientes (apellido, nombre)
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'clientes'
    AND index_name = 'idx_clientes_apellido_nombre');
SET @sql = IF(@existe = 0,
  'ALTER TABLE clientes ADD INDEX idx_clientes_apellido_nombre (apellido, nombre)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
