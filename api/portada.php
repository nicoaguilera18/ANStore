<?php

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../models/PortadaModel.php';

exigirMetodo('GET');

try {
    responder(200, ['portada' => consultarPortada(obtenerConexion())]);
} catch (PDOException $error) {
    reportarErrorPDO($error);
} catch (RuntimeException $error) {
    error_log('ANStore home banner error: ' . $error->getMessage());
    responder(500, ['error' => 'No se pudo cargar la portada']);
}
