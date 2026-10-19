-- Configuración inicial del usuario y la base de datos de la aplicación (FR-025).
-- Ejecutar como root o usuario administrador de MySQL en el puerto 3306:
--   mysql -u root -p < database/scripts/configurar-usuario.sql

CREATE DATABASE IF NOT EXISTS `gymaccess`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'gymapp'@'localhost'
  IDENTIFIED BY 'Gymapp_Sprint1_2026';
CREATE USER IF NOT EXISTS 'gymapp'@'127.0.0.1'
  IDENTIFIED BY 'Gymapp_Sprint1_2026';

GRANT ALL PRIVILEGES ON `gymaccess`.* TO 'gymapp'@'localhost';
GRANT ALL PRIVILEGES ON `gymaccess`.* TO 'gymapp'@'127.0.0.1';

FLUSH PRIVILEGES;
