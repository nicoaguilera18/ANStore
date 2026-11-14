<?php

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../models/ProductoModel.php';

exigirMetodo('GET');

$busqueda = $_GET['q'] ?? '';
if (!is_string($busqueda)) {
    responder(400, ['error' => 'La búsqueda debe ser texto']);
}
$busqueda = trim($busqueda);
if (strlen($busqueda) > 100) {
    responder(400, ['error' => 'La búsqueda no puede superar los 100 caracteres']);
}

try {
    $pdo = obtenerConexion();
    if (isset($_GET['id'])) {
        $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
        if ($id === false || $id < 1) {
            responder(400, ['error' => 'El identificador de producto no es válido']);
        }
        $producto = consultarProducto($pdo, $id);
        if (!$producto) {
            responder(404, ['error' => 'Producto no encontrado']);
        }
        responder(200, ['producto' => $producto]);
    }

    responder(200, ['productos' => consultarProductos($pdo, $busqueda)]);
} catch (PDOException $error) {
    reportarErrorPDO($error);
}
