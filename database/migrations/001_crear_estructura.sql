-- Migración 001: estructura inicial del Sprint 1 (FR-021, FR-022, FR-027)
-- Motor InnoDB y codificación utf8mb4 exigidos por la constitución.
-- La base de datos en sí la crea database/scripts/aplicar-migraciones.js (DB_NAME).

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Tabla: usuarios (data-model.md §2.1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `rol` ENUM('administrador', 'recepcionista', 'entrenador', 'cliente') NOT NULL,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuarios_correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: clientes (data-model.md §2.2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientes` (
  `id_cliente` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(30) NULL,
  `direccion` VARCHAR(200) NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `uq_clientes_correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: tipos_membresia (solo estructura en el Sprint 1, FR-027)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tipos_membresia` (
  `id_tipo_membresia` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `duracion` INT NOT NULL,
  `precio` DECIMAL(10, 2) NOT NULL,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_tipo_membresia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: membresias (solo estructura en el Sprint 1, FR-027)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `membresias` (
  `id_membresia` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cliente` INT UNSIGNED NOT NULL,
  `id_tipo_membresia` INT UNSIGNED NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `estado` ENUM('activa', 'vencida', 'suspendida', 'cancelada') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (`id_membresia`),
  KEY `ix_membresias_cliente` (`id_cliente`),
  CONSTRAINT `fk_membresias_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_membresias_tipo`
    FOREIGN KEY (`id_tipo_membresia`) REFERENCES `tipos_membresia` (`id_tipo_membresia`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: pagos (solo estructura en el Sprint 1, FR-027)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pagos` (
  `id_pago` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cliente` INT UNSIGNED NOT NULL,
  `id_membresia` INT UNSIGNED NULL,
  `monto` DECIMAL(10, 2) NOT NULL,
  `fecha_pago` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metodo_pago` VARCHAR(50) NOT NULL,
  `estado` ENUM('pendiente', 'completado', 'cancelado') NOT NULL DEFAULT 'completado',
  PRIMARY KEY (`id_pago`),
  KEY `ix_pagos_cliente` (`id_cliente`),
  CONSTRAINT `fk_pagos_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pagos_membresia`
    FOREIGN KEY (`id_membresia`) REFERENCES `membresias` (`id_membresia`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
