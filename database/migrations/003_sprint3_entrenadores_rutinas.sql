-- Migración 003: entrenadores, rutinas y dashboard (Sprint 3)
-- Crea las tablas `entrenadores`, `asignaciones_entrenador`, `rutinas`,
-- `ejercicios_rutina`, `objetivos_entrenamiento` y `progresos_clientes`.
-- Motor InnoDB y codificación utf8mb4 exigidos por la constitución.
-- Los descriptores de comportamiento siguen data-model.md (FR-001 a FR-031).

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Tabla: entrenadores (data-model.md §1)
-- Un único registro por usuario; `UNIQUE` evita duplicar el mismo usuario (FR-003).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `entrenadores` (
  `id_entrenador` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_usuario` INT UNSIGNED NOT NULL,
  `especialidad` VARCHAR(100) NULL,
  `telefono` VARCHAR(30) NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_entrenador`),
  UNIQUE KEY `ux_entrenadores_usuario` (`id_usuario`),
  CONSTRAINT `fk_entrenadores_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: asignaciones_entrenador (data-model.md §1)
-- La columna generada `cliente_principal_activo` con índice único garantiza
-- como máximo un entrenador principal activo por cliente (FR-006, R15).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asignaciones_entrenador` (
  `id_asignacion` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cliente` INT UNSIGNED NOT NULL,
  `id_entrenador` INT UNSIGNED NOT NULL,
  `fecha_asignacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `es_principal` TINYINT(1) NOT NULL DEFAULT 1,
  `estado` ENUM('activa', 'finalizada') NOT NULL DEFAULT 'activa',
  `cliente_principal_activo` INT UNSIGNED GENERATED ALWAYS AS (
    CASE WHEN `es_principal` = 1 AND `estado` = 'activa' THEN `id_cliente` ELSE NULL END
  ) VIRTUAL,
  PRIMARY KEY (`id_asignacion`),
  UNIQUE KEY `ux_asignaciones_principal_activo` (`cliente_principal_activo`),
  KEY `ix_asignaciones_cliente` (`id_cliente`),
  KEY `ix_asignaciones_entrenador` (`id_entrenador`),
  CONSTRAINT `fk_asignaciones_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_asignaciones_entrenador`
    FOREIGN KEY (`id_entrenador`) REFERENCES `entrenadores` (`id_entrenador`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: rutinas (data-model.md §1)
-- Al crear una rutina activa nueva, la activa anterior pasa a 'archivada' (FR-031, R16).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rutinas` (
  `id_rutina` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cliente` INT UNSIGNED NOT NULL,
  `id_entrenador` INT UNSIGNED NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` ENUM('activa', 'archivada') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (`id_rutina`),
  KEY `ix_rutinas_cliente` (`id_cliente`),
  KEY `ix_rutinas_entrenador` (`id_entrenador`),
  KEY `ix_rutinas_estado` (`estado`),
  CONSTRAINT `fk_rutinas_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rutinas_entrenador`
    FOREIGN KEY (`id_entrenador`) REFERENCES `entrenadores` (`id_entrenador`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: ejercicios_rutina (data-model.md §1)
-- `series` es numérico; repeticiones, peso y descanso son texto para admitir
-- rangos (R17).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ejercicios_rutina` (
  `id_ejercicio` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_rutina` INT UNSIGNED NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `series` INT NULL,
  `repeticiones` VARCHAR(50) NULL,
  `peso` VARCHAR(50) NULL,
  `descanso` VARCHAR(50) NULL,
  `instrucciones` VARCHAR(255) NULL,
  `orden` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_ejercicio`),
  KEY `ix_ejercicios_rutina` (`id_rutina`),
  CONSTRAINT `fk_ejercicios_rutina`
    FOREIGN KEY (`id_rutina`) REFERENCES `rutinas` (`id_rutina`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: objetivos_entrenamiento (data-model.md §1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `objetivos_entrenamiento` (
  `id_objetivo` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cliente` INT UNSIGNED NOT NULL,
  `id_entrenador` INT UNSIGNED NOT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `valor_objetivo` DECIMAL(10, 2) NULL,
  `unidad` VARCHAR(20) NULL,
  `fecha_objetivo` DATE NULL,
  `estado` ENUM('en_progreso', 'cumplido', 'cancelado') NOT NULL DEFAULT 'en_progreso',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_objetivo`),
  KEY `ix_objetivos_cliente` (`id_cliente`),
  KEY `ix_objetivos_entrenador` (`id_entrenador`),
  KEY `ix_objetivos_estado` (`estado`),
  CONSTRAINT `fk_objetivos_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_objetivos_entrenador`
    FOREIGN KEY (`id_entrenador`) REFERENCES `entrenadores` (`id_entrenador`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: progresos_clientes (data-model.md §1)
-- `id_objetivo` referencia un objetivo del mismo cliente (FR-014).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `progresos_clientes` (
  `id_progreso` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cliente` INT UNSIGNED NOT NULL,
  `id_entrenador` INT UNSIGNED NOT NULL,
  `id_objetivo` INT UNSIGNED NULL,
  `valor` DECIMAL(10, 2) NOT NULL,
  `unidad` VARCHAR(20) NULL,
  `observaciones` VARCHAR(255) NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_progreso`),
  KEY `ix_progresos_cliente` (`id_cliente`),
  KEY `ix_progresos_objetivo` (`id_objetivo`),
  KEY `ix_progresos_fecha` (`fecha_registro`),
  CONSTRAINT `fk_progresos_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_progresos_entrenador`
    FOREIGN KEY (`id_entrenador`) REFERENCES `entrenadores` (`id_entrenador`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_progresos_objetivo`
    FOREIGN KEY (`id_objetivo`) REFERENCES `objetivos_entrenamiento` (`id_objetivo`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
