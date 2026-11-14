CREATE DATABASE IF NOT EXISTS gestion_hardware
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gestion_hardware;
SET NAMES utf8mb4;

CREATE TABLE administrador (
  id_admin INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NULL,
  CONSTRAINT pk_administrador PRIMARY KEY (id_admin),
  CONSTRAINT uq_administrador_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE cliente (
  id_usuario INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  CONSTRAINT pk_cliente PRIMARY KEY (id_usuario),
  CONSTRAINT uq_cliente_email UNIQUE (email),
  CONSTRAINT ck_cliente_email CHECK (email LIKE '%_@_%._%')
) ENGINE=InnoDB;

CREATE TABLE telefonos (
  tel_id INT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  CONSTRAINT pk_telefonos PRIMARY KEY (tel_id),
  CONSTRAINT uq_telefonos UNIQUE (id_usuario, telefono),
  CONSTRAINT fk_telefonos_cliente FOREIGN KEY (id_usuario)
    REFERENCES cliente (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE compra (
  id_venta INT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  direccion_envio VARCHAR(255) NOT NULL,
  telefono_contacto VARCHAR(20) NOT NULL,
  CONSTRAINT pk_compra PRIMARY KEY (id_venta),
  CONSTRAINT ck_compra_metodo CHECK (metodo_pago IN
    ('Efectivo', 'Tarjeta de Credito', 'Tarjeta de Debito', 'Transferencia', 'Mercado Pago')),
  CONSTRAINT fk_compra_cliente FOREIGN KEY (id_usuario)
    REFERENCES cliente (id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE producto (
  id_producto INT NOT NULL AUTO_INCREMENT,
  tipo VARCHAR(20) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  imagen VARCHAR(255) NULL,
  CONSTRAINT pk_producto PRIMARY KEY (id_producto),
  CONSTRAINT uq_producto_id_tipo UNIQUE (id_producto, tipo),
  CONSTRAINT ck_producto_tipo CHECK (tipo IN
    ('PC_ARMADA', 'PROCESADOR', 'MEMORIA_RAM', 'TARJETA_MADRE',
     'FUENTE_PODER', 'PLACA_VIDEO', 'GABINETE')),
  CONSTRAINT ck_producto_stock CHECK (stock >= 0),
  CONSTRAINT ck_producto_precio CHECK (precio >= 0)
) ENGINE=InnoDB;

CREATE TABLE configuracion_portada (
  id TINYINT UNSIGNED NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  subtitulo VARCHAR(180) NOT NULL,
  texto_alternativo VARCHAR(180) NOT NULL,
  imagen VARCHAR(255) NULL,
  CONSTRAINT pk_configuracion_portada PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE pc_armada (
  id_pc INT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'PC_ARMADA',
  nombre VARCHAR(100) NOT NULL,
  fecha_armado DATE NOT NULL,
  CONSTRAINT pk_pc_armada PRIMARY KEY (id_pc),
  CONSTRAINT ck_pc_armada_tipo CHECK (tipo = 'PC_ARMADA'),
  CONSTRAINT fk_pc_armada_producto FOREIGN KEY (id_pc, tipo)
    REFERENCES producto (id_producto, tipo)
) ENGINE=InnoDB;

CREATE TABLE componente (
  id_componente INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  id_admin INT NOT NULL,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  CONSTRAINT pk_componente PRIMARY KEY (id_componente),
  CONSTRAINT uq_componente_id_tipo UNIQUE (id_componente, tipo),
  CONSTRAINT ck_componente_tipo CHECK (tipo IN
    ('PROCESADOR', 'MEMORIA_RAM', 'TARJETA_MADRE', 'FUENTE_PODER', 'PLACA_VIDEO', 'GABINETE')),
  CONSTRAINT fk_componente_producto FOREIGN KEY (id_componente, tipo)
    REFERENCES producto (id_producto, tipo),
  CONSTRAINT fk_componente_admin FOREIGN KEY (id_admin)
    REFERENCES administrador (id_admin) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE procesador (
  id_componente INT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'PROCESADOR',
  consumo INT NOT NULL,
  frecuencia INT NOT NULL,
  socket VARCHAR(20) NOT NULL,
  CONSTRAINT pk_procesador PRIMARY KEY (id_componente),
  CONSTRAINT ck_procesador_tipo CHECK (tipo = 'PROCESADOR'),
  CONSTRAINT ck_procesador_consumo CHECK (consumo > 0),
  CONSTRAINT ck_procesador_frecuencia CHECK (frecuencia > 0),
  CONSTRAINT fk_procesador_componente FOREIGN KEY (id_componente, tipo)
    REFERENCES componente (id_componente, tipo) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE memoria_ram (
  id_componente INT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'MEMORIA_RAM',
  frecuencia_mhz INT NOT NULL,
  capacidad_gb INT NOT NULL,
  tipo_ram VARCHAR(10) NOT NULL,
  CONSTRAINT pk_memoria_ram PRIMARY KEY (id_componente),
  CONSTRAINT ck_memoria_tipo CHECK (tipo = 'MEMORIA_RAM'),
  CONSTRAINT ck_memoria_frecuencia CHECK (frecuencia_mhz > 0),
  CONSTRAINT ck_memoria_capacidad CHECK (capacidad_gb > 0),
  CONSTRAINT fk_memoria_componente FOREIGN KEY (id_componente, tipo)
    REFERENCES componente (id_componente, tipo) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tarjeta_madre (
  id_componente INT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'TARJETA_MADRE',
  chipset VARCHAR(50) NOT NULL,
  formato VARCHAR(10) NOT NULL,
  socket VARCHAR(20) NOT NULL,
  tipo_ram VARCHAR(10) NOT NULL,
  pcie VARCHAR(10) NOT NULL,
  CONSTRAINT pk_tarjeta_madre PRIMARY KEY (id_componente),
  CONSTRAINT ck_tarjeta_tipo CHECK (tipo = 'TARJETA_MADRE'),
  CONSTRAINT fk_tarjeta_componente FOREIGN KEY (id_componente, tipo)
    REFERENCES componente (id_componente, tipo) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE fuente_de_poder (
  id_componente INT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'FUENTE_PODER',
  certificacion VARCHAR(50) NOT NULL,
  potencia INT NOT NULL,
  tipo_fuente VARCHAR(30) NOT NULL,
  CONSTRAINT pk_fuente PRIMARY KEY (id_componente),
  CONSTRAINT ck_fuente_tipo CHECK (tipo = 'FUENTE_PODER'),
  CONSTRAINT ck_fuente_potencia CHECK (potencia > 0),
  CONSTRAINT fk_fuente_componente FOREIGN KEY (id_componente, tipo)
    REFERENCES componente (id_componente, tipo) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE placa_de_video (
  id_componente INT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'PLACA_VIDEO',
  consumo INT NOT NULL,
  memoria_vram_gb INT NOT NULL,
  pcie VARCHAR(10) NOT NULL,
  CONSTRAINT pk_placa PRIMARY KEY (id_componente),
  CONSTRAINT ck_placa_tipo CHECK (tipo = 'PLACA_VIDEO'),
  CONSTRAINT ck_placa_consumo CHECK (consumo > 0),
  CONSTRAINT ck_placa_vram CHECK (memoria_vram_gb > 0),
  CONSTRAINT fk_placa_componente FOREIGN KEY (id_componente, tipo)
    REFERENCES componente (id_componente, tipo) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE gabinete (
  id_componente INT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'GABINETE',
  CONSTRAINT pk_gabinete PRIMARY KEY (id_componente),
  CONSTRAINT ck_gabinete_tipo CHECK (tipo = 'GABINETE'),
  CONSTRAINT fk_gabinete_componente FOREIGN KEY (id_componente, tipo)
    REFERENCES componente (id_componente, tipo) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE gabinete_formato (
  id_componente INT NOT NULL,
  formato VARCHAR(10) NOT NULL,
  CONSTRAINT pk_gabinete_formato PRIMARY KEY (id_componente, formato),
  CONSTRAINT ck_gabinete_formato CHECK (formato IN ('ATX', 'mATX', 'ITX')),
  CONSTRAINT fk_gabinete_formato FOREIGN KEY (id_componente)
    REFERENCES gabinete (id_componente) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE detalle_compra (
  id_venta INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  CONSTRAINT pk_detalle_compra PRIMARY KEY (id_venta, id_producto),
  CONSTRAINT ck_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT ck_detalle_precio CHECK (precio_unitario >= 0),
  CONSTRAINT fk_detalle_compra FOREIGN KEY (id_venta)
    REFERENCES compra (id_venta) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto)
    REFERENCES producto (id_producto) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE pc_componente (
  id_pc INT NOT NULL,
  id_componente INT NOT NULL,
  cantidad INT NOT NULL,
  CONSTRAINT pk_pc_componente PRIMARY KEY (id_pc, id_componente),
  CONSTRAINT ck_pc_componente_cantidad CHECK (cantidad > 0),
  CONSTRAINT fk_pcc_pc FOREIGN KEY (id_pc)
    REFERENCES pc_armada (id_pc) ON DELETE CASCADE,
  CONSTRAINT fk_pcc_componente FOREIGN KEY (id_componente)
    REFERENCES componente (id_componente) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE auditoria_producto (
  id_auditoria INT NOT NULL AUTO_INCREMENT,
  id_producto INT NOT NULL,
  campo VARCHAR(10) NOT NULL,
  valor_anterior DECIMAL(10,2) NOT NULL,
  valor_nuevo DECIMAL(10,2) NOT NULL,
  origen VARCHAR(20) NOT NULL,
  id_admin INT NULL,
  usuario_bd VARCHAR(100) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_auditoria PRIMARY KEY (id_auditoria),
  CONSTRAINT ck_auditoria_campo CHECK (campo IN ('precio', 'stock')),
  CONSTRAINT ck_auditoria_origen CHECK (origen IN ('Administrador', 'Venta')),
  CONSTRAINT fk_auditoria_admin FOREIGN KEY (id_admin)
    REFERENCES administrador (id_admin)
) ENGINE=InnoDB;

CREATE VIEW v_compra_total AS
SELECT c.id_venta, c.id_usuario, c.fecha, c.metodo_pago,
       c.direccion_envio, c.telefono_contacto,
       COALESCE(SUM(d.cantidad * d.precio_unitario), 0) AS total_venta
FROM compra c
LEFT JOIN detalle_compra d ON d.id_venta = c.id_venta
GROUP BY c.id_venta, c.id_usuario, c.fecha, c.metodo_pago,
         c.direccion_envio, c.telefono_contacto;

CREATE VIEW v_compat_procesador_tarjeta AS
SELECT p.id_componente AS id_procesador, t.id_componente AS id_tarjeta, p.socket
FROM procesador p JOIN tarjeta_madre t ON t.socket = p.socket;

CREATE VIEW v_compat_ram_tarjeta AS
SELECT m.id_componente AS id_memoria, t.id_componente AS id_tarjeta, m.tipo_ram
FROM memoria_ram m JOIN tarjeta_madre t ON t.tipo_ram = m.tipo_ram;

CREATE VIEW v_compat_placa_tarjeta AS
SELECT v.id_componente AS id_placa, t.id_componente AS id_tarjeta, v.pcie
FROM placa_de_video v JOIN tarjeta_madre t ON t.pcie = v.pcie;

CREATE VIEW v_compat_gabinete_tarjeta AS
SELECT g.id_componente AS id_gabinete, t.id_componente AS id_tarjeta, t.formato
FROM gabinete_formato g JOIN tarjeta_madre t ON t.formato = g.formato;

CREATE VIEW v_detalle_ventas AS
SELECT c.id_venta, c.id_usuario, c.fecha, c.metodo_pago, d.id_producto,
       COALESCE(pa.nombre, CONCAT(co.marca, ' ', co.modelo)) AS producto,
       d.cantidad, d.precio_unitario, d.cantidad * d.precio_unitario AS subtotal
FROM compra c
JOIN detalle_compra d ON d.id_venta = c.id_venta
JOIN producto p ON p.id_producto = d.id_producto
LEFT JOIN pc_armada pa ON pa.id_pc = p.id_producto
LEFT JOIN componente co ON co.id_componente = p.id_producto;

CREATE VIEW v_resumen_clientes AS
SELECT c.id_usuario, c.nombre, c.apellido, c.email,
       COUNT(vt.id_venta) AS cantidad_compras,
       COALESCE(SUM(vt.total_venta), 0) AS total_gastado,
       MAX(vt.fecha) AS ultima_compra
FROM cliente c
LEFT JOIN v_compra_total vt ON vt.id_usuario = c.id_usuario
GROUP BY c.id_usuario, c.nombre, c.apellido, c.email;

DELIMITER $$

CREATE FUNCTION fn_total_compra(p_id_venta INT)
RETURNS DECIMAL(12,2)
READS SQL DATA
BEGIN
  DECLARE v_total DECIMAL(12,2);
  IF NOT EXISTS (SELECT 1 FROM compra WHERE id_venta = p_id_venta) THEN
    RETURN NULL;
  END IF;
  SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
    INTO v_total
    FROM detalle_compra
   WHERE id_venta = p_id_venta;
  RETURN v_total;
END$$

CREATE TRIGGER trg_detalle_compra_bi
BEFORE INSERT ON detalle_compra
FOR EACH ROW
BEGIN
  DECLARE v_stock INT;
  DECLARE v_precio DECIMAL(10,2);
  SELECT stock, precio INTO v_stock, v_precio
    FROM producto
   WHERE id_producto = NEW.id_producto
   FOR UPDATE;
  IF NEW.precio_unitario IS NULL THEN
    SET NEW.precio_unitario = v_precio;
  END IF;
  IF v_stock < NEW.cantidad THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Stock insuficiente para registrar la venta del producto';
  END IF;
END$$

CREATE TRIGGER trg_detalle_compra_ai
AFTER INSERT ON detalle_compra
FOR EACH ROW
BEGIN
  UPDATE producto
     SET stock = stock - NEW.cantidad
   WHERE id_producto = NEW.id_producto;
END$$

CREATE TRIGGER trg_producto_au
AFTER UPDATE ON producto
FOR EACH ROW
BEGIN
  IF NEW.precio <> OLD.precio THEN
    INSERT INTO auditoria_producto
      (id_producto, campo, valor_anterior, valor_nuevo, origen, id_admin, usuario_bd)
    VALUES (NEW.id_producto, 'precio', OLD.precio, NEW.precio,
            IF(@id_admin IS NULL, 'Venta', 'Administrador'), @id_admin, CURRENT_USER());
  END IF;
  IF NEW.stock <> OLD.stock THEN
    INSERT INTO auditoria_producto
      (id_producto, campo, valor_anterior, valor_nuevo, origen, id_admin, usuario_bd)
    VALUES (NEW.id_producto, 'stock', OLD.stock, NEW.stock,
            IF(@id_admin IS NULL, 'Venta', 'Administrador'), @id_admin, CURRENT_USER());
  END IF;
END$$

CREATE PROCEDURE sp_actualizar_producto(
  IN p_id_admin INT,
  IN p_id_producto INT,
  IN p_precio DECIMAL(10,2),
  IN p_stock INT
)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM administrador WHERE id_admin = p_id_admin) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Solo un administrador registrado puede modificar productos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM producto WHERE id_producto = p_id_producto) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no existe';
  END IF;
  IF p_precio IS NULL AND p_stock IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Indicá el precio, el stock o ambos';
  END IF;
  IF p_precio IS NOT NULL AND p_precio < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El precio no puede ser negativo';
  END IF;
  IF p_stock IS NOT NULL AND p_stock < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El stock no puede ser negativo';
  END IF;

  SET @id_admin = p_id_admin;
  UPDATE producto
     SET precio = COALESCE(p_precio, precio),
         stock = COALESCE(p_stock, stock)
   WHERE id_producto = p_id_producto;
  SET @id_admin = NULL;
END$$

DELIMITER ;

INSERT INTO administrador (id_admin, nombre, email, password)
VALUES (1, 'Administrador ANStore', 'admin@anstore.com', NULL);

INSERT INTO configuracion_portada (id, titulo, subtitulo, texto_alternativo, imagen)
VALUES (
  1,
  'Bienvenido a ANStore',
  'Componentes y computadoras armadas',
  'Setup gamer con PC iluminada',
  NULL
);

INSERT INTO cliente (id_usuario, nombre, apellido, email, password) VALUES
(1, 'Agustín', 'Aguilera', 'agustin@anstore.com', '$2y$10$gr7ElLsccRF67OcLM0Yh.uaNVNy8qX5YZOMUWZazuIwGMMk6JAfci'),
(2, 'Usuario', 'Prueba', 'test@anstore.com', '$2y$10$xHs13jUjqijjHCzNcXI1/.1cEey2b9shvPUlNTDNWJwtpxv2zXHii');

INSERT INTO producto (id_producto, tipo, stock, precio) VALUES
(1, 'PROCESADOR', 15, 10000.00),
(2, 'MEMORIA_RAM', 8, 15000.00),
(3, 'TARJETA_MADRE', 12, 20000.00),
(4, 'FUENTE_PODER', 5, 25000.00),
(5, 'PLACA_VIDEO', 20, 30000.00),
(6, 'GABINETE', 7, 35000.00),
(7, 'PC_ARMADA', 3, 40000.00),
(8, 'PC_ARMADA', 10, 45000.00),
(9, 'PC_ARMADA', 6, 50000.00),
(10, 'PC_ARMADA', 4, 55000.00);

INSERT INTO componente (id_componente, tipo, id_admin, marca, modelo) VALUES
(1, 'PROCESADOR', 1, 'AN', 'Procesador 1'),
(2, 'MEMORIA_RAM', 1, 'AN', 'Memoria 2'),
(3, 'TARJETA_MADRE', 1, 'AN', 'Mother 3'),
(4, 'FUENTE_PODER', 1, 'AN', 'Fuente 4'),
(5, 'PLACA_VIDEO', 1, 'AN', 'Video 5'),
(6, 'GABINETE', 1, 'AN', 'Gabinete 6');

INSERT INTO procesador (id_componente, consumo, frecuencia, socket) VALUES (1, 65, 3600, 'AM4');
INSERT INTO memoria_ram (id_componente, frecuencia_mhz, capacidad_gb, tipo_ram) VALUES (2, 3200, 16, 'DDR4');
INSERT INTO tarjeta_madre (id_componente, chipset, formato, socket, tipo_ram, pcie) VALUES (3, 'B550', 'ATX', 'AM4', 'DDR4', '4.0');
INSERT INTO fuente_de_poder (id_componente, certificacion, potencia, tipo_fuente) VALUES (4, '80 PLUS Bronze', 650, 'Modular');
INSERT INTO placa_de_video (id_componente, consumo, memoria_vram_gb, pcie) VALUES (5, 200, 8, '4.0');
INSERT INTO gabinete (id_componente) VALUES (6);
INSERT INTO gabinete_formato (id_componente, formato) VALUES (6, 'ATX'), (6, 'mATX');

INSERT INTO pc_armada (id_pc, nombre, fecha_armado) VALUES
(7, 'ANStore Inicio', CURRENT_DATE),
(8, 'ANStore Gamer', CURRENT_DATE),
(9, 'ANStore Pro', CURRENT_DATE),
(10, 'ANStore Workstation', CURRENT_DATE);

INSERT INTO pc_componente (id_pc, id_componente, cantidad) VALUES
(7, 1, 1), (7, 2, 1), (7, 3, 1), (7, 4, 1), (7, 6, 1),
(8, 1, 1), (8, 2, 2), (8, 3, 1), (8, 4, 1), (8, 5, 1), (8, 6, 1);

INSERT INTO telefonos (id_usuario, telefono) VALUES
(1, '+54 376 4000000'),
(2, '+54 376 4000001');

INSERT INTO compra (id_venta, id_usuario, metodo_pago, fecha, direccion_envio, telefono_contacto) VALUES
(1, 1, 'Transferencia', CURRENT_TIMESTAMP, 'Domicilio de prueba 1', '+54 376 4000000'),
(2, 2, 'Mercado Pago', CURRENT_TIMESTAMP, 'Domicilio de prueba 2', '+54 376 4000001');

INSERT INTO detalle_compra (id_venta, id_producto, cantidad, precio_unitario) VALUES
(1, 1, 2, 10000.00),
(1, 3, 1, 20000.00),
(2, 5, 1, 30000.00);

ALTER TABLE compra AUTO_INCREMENT = 3;
ALTER TABLE cliente AUTO_INCREMENT = 3;
ALTER TABLE producto AUTO_INCREMENT = 11;
ALTER TABLE administrador AUTO_INCREMENT = 2;
