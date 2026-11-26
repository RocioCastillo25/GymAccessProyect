-- Configuración inicial del usuario y la base de datos de la aplicación (FR-025).
-- Ejecutar como root o usuario administrador de MySQL en el puerto 3306:
--   mysql -u root -p < database/scripts/configurar-usuario.sql
--
-- IMPORTANTE: antes de ejecutarlo, reemplaza CAMBIA_ESTA_CONTRASENA por la misma
-- contraseña que tienes en DB_PASSWORD de tu archivo .env. No guardes la contraseña
-- real en este archivo: está versionado en git.
-- Si el usuario ya existe, CREATE USER IF NOT EXISTS no cambia su contraseña.

CREATE DATABASE IF NOT EXISTS `gymaccess`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'RocioCastillo'@'localhost' IDENTIFIED BY 'CAMBIA_ESTA_CONTRASENA';
CREATE USER IF NOT EXISTS 'RocioCastillo'@'127.0.0.1' IDENTIFIED BY 'CAMBIA_ESTA_CONTRASENA';

GRANT ALL PRIVILEGES ON `gymaccess`.* TO 'RocioCastillo'@'localhost';
GRANT ALL PRIVILEGES ON `gymaccess`.* TO 'RocioCastillo'@'127.0.0.1';

FLUSH PRIVILEGES;
