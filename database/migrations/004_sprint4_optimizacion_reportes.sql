-- Migración 004: optimización de consultas para reportes del Sprint 4 (RN-S4-04).
-- Crea los índices que falten sin fallar si la base ya los tiene (migración
-- reejecutable sobre instalaciones parcialmente actualizadas).

SET NAMES utf8mb4;

-- pagos.fecha_pago
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'pagos' AND index_name = 'idx_fecha_pago');
SET @sql = IF(@existe = 0,
  'ALTER TABLE pagos ADD INDEX idx_fecha_pago (fecha_pago)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pagos.metodo_pago
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'pagos' AND index_name = 'idx_metodo_pago');
SET @sql = IF(@existe = 0,
  'ALTER TABLE pagos ADD INDEX idx_metodo_pago (metodo_pago)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- accesos.fecha_hora (si no existe ya un índice equivalente)
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'accesos'
    AND column_name = 'fecha_hora' AND seq_in_index = 1);
SET @sql = IF(@existe = 0,
  'ALTER TABLE accesos ADD INDEX idx_fecha_hora (fecha_hora)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- accesos.tipo
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'accesos' AND index_name = 'idx_tipo');
SET @sql = IF(@existe = 0,
  'ALTER TABLE accesos ADD INDEX idx_tipo (tipo)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- accesos.resultado
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'accesos' AND index_name = 'idx_resultado');
SET @sql = IF(@existe = 0,
  'ALTER TABLE accesos ADD INDEX idx_resultado (resultado)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- membresias.estado
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'membresias' AND index_name = 'idx_estado');
SET @sql = IF(@existe = 0,
  'ALTER TABLE membresias ADD INDEX idx_estado (estado)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- membresias.fecha_fin
SET @existe = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'membresias' AND index_name = 'idx_fecha_fin');
SET @sql = IF(@existe = 0,
  'ALTER TABLE membresias ADD INDEX idx_fecha_fin (fecha_fin)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
