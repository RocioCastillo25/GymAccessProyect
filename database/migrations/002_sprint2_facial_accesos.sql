-- Migración 002: reconocimiento facial y control de acceso (Sprint 2)
-- Crea las tablas `rostros`, `accesos` y `auditoria` (FR-031, FR-032, FR-033).
-- Motor InnoDB y codificación utf8mb4 exigidos por la constitución.
-- Los descriptores faciales se guardan como JSON (128 números) y nunca se exponen (FR-020).

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Tabla: rostros (data-model.md §1)
-- Un único registro por cliente; un segundo registro actualiza el existente.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rostros` (
  `id_rostro` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cliente` INT UNSIGNED NOT NULL,
  `descriptor_facial` JSON NOT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_rostro`),
  UNIQUE KEY `uq_rostros_cliente` (`id_cliente`),
  CONSTRAINT `fk_rostros_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: accesos (data-model.md §1)
-- `id_cliente` es NULL cuando el rostro no se identifica (FR-019, FR-023).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `accesos` (
  `id_acceso` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cliente` INT UNSIGNED NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo` ENUM('entrada', 'salida') NOT NULL DEFAULT 'entrada',
  `resultado` ENUM('autorizado', 'rechazado') NOT NULL,
  `motivo_rechazo` VARCHAR(255) NULL,
  PRIMARY KEY (`id_acceso`),
  KEY `ix_accesos_cliente` (`id_cliente`),
  KEY `ix_accesos_fecha` (`fecha_hora`),
  CONSTRAINT `fk_accesos_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: auditoria (data-model.md §1)
-- Registra acciones relevantes del sprint; consulta exclusiva del administrador (FR-036).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auditoria` (
  `id_auditoria` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_usuario` INT UNSIGNED NULL,
  `accion` VARCHAR(100) NOT NULL,
  `modulo` VARCHAR(50) NOT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resultado` ENUM('exito', 'error') NOT NULL DEFAULT 'exito',
  `descripcion` VARCHAR(255) NULL,
  PRIMARY KEY (`id_auditoria`),
  KEY `ix_auditoria_fecha` (`fecha`),
  KEY `ix_auditoria_usuario` (`id_usuario`),
  CONSTRAINT `fk_auditoria_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
