-- Migración 005: tipos de membresía iniciales para que el módulo de membresías
-- tenga opciones disponibles desde la primera ejecución (HU1, FR-001 a FR-004).
-- Es reejecutable: solo inserta el tipo cuando todavía no existe un nombre igual.

SET NAMES utf8mb4;

INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado)
SELECT 'Diario', 'Acceso al gimnasio por un día.', 1, 50.00, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM tipos_membresia WHERE nombre = 'Diario');

INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado)
SELECT 'Semanal', 'Acceso al gimnasio durante siete días.', 7, 250.00, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM tipos_membresia WHERE nombre = 'Semanal');

INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado)
SELECT 'Mensual', 'Plan de acceso por treinta días.', 30, 650.00, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM tipos_membresia WHERE nombre = 'Mensual');

INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado)
SELECT 'Trimestral', 'Plan de acceso por noventa días.', 90, 1800.00, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM tipos_membresia WHERE nombre = 'Trimestral');

INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado)
SELECT 'Semestral', 'Plan de acceso por ciento ochenta días.', 180, 3300.00, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM tipos_membresia WHERE nombre = 'Semestral');

INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado)
SELECT 'Anual', 'Plan de acceso por trescientos sesenta y cinco días.', 365, 6000.00, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM tipos_membresia WHERE nombre = 'Anual');
