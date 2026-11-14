USE gestion_hardware;

ALTER TABLE producto
  ADD COLUMN imagen VARCHAR(255) NULL AFTER precio;
