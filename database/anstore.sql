-- =========================================================
-- ANStore - Base de datos
-- Importar desde phpMyAdmin (pestaña "Importar") o ejecutar en la pestaña "SQL".
-- =========================================================

CREATE DATABASE IF NOT EXISTS anstore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE anstore;
SET NAMES utf8mb4;

-- ---------------------------------------------------------
-- Tabla usuarios (clientes de la tienda)
-- password es VARCHAR(255) para guardar el hash BCRYPT
-- (hoy ocupa 60 caracteres, pero PHP recomienda 255 por si cambia el algoritmo).
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  rol        VARCHAR(20)  NOT NULL DEFAULT 'cliente',
  creado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabla compras (dato privado de cada usuario)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS compras (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT           NOT NULL,
  producto    VARCHAR(100)  NOT NULL,
  cantidad    INT           NOT NULL DEFAULT 1,
  total       DECIMAL(10,2) NOT NULL,
  fecha       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Datos de prueba (las contraseñas ya están hasheadas con BCRYPT)
--   agustin@anstore.com  ->  Contraseña2026
--   test@anstore.com     ->  UserSecure123
-- ---------------------------------------------------------
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Agustín',        'agustin@anstore.com', '$2y$10$gr7ElLsccRF67OcLM0Yh.uaNVNy8qX5YZOMUWZazuIwGMMk6JAfci', 'cliente'),
('Usuario Prueba', 'test@anstore.com',    '$2y$10$xHs13jUjqijjHCzNcXI1/.1cEey2b9shvPUlNTDNWJwtpxv2zXHii', 'cliente');

INSERT INTO compras (usuario_id, producto, cantidad, total) VALUES
(1, 'Producto 1', 2, 20000),
(1, 'Producto 3', 1, 20000),
(2, 'Producto 5', 1, 30000);
