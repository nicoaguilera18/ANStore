USE gestion_hardware;

CREATE TABLE IF NOT EXISTS configuracion_portada (
  id TINYINT UNSIGNED NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  subtitulo VARCHAR(180) NOT NULL,
  texto_alternativo VARCHAR(180) NOT NULL,
  imagen VARCHAR(255) NULL,
  CONSTRAINT pk_configuracion_portada PRIMARY KEY (id)
) ENGINE=InnoDB;

INSERT IGNORE INTO configuracion_portada (
  id,
  titulo,
  subtitulo,
  texto_alternativo,
  imagen
) VALUES (
  1,
  'Bienvenido a ANStore',
  'Componentes y computadoras armadas',
  'Setup gamer con PC iluminada',
  NULL
);
