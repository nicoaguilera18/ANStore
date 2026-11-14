<?php

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../models/UsuarioModel.php';
require_once __DIR__ . '/../models/CompraModel.php';

exigirMetodo('GET');
exigirSesion('cliente');

try {
    $pdo = obtenerConexion();
    $usuario = obtenerCliente($pdo, (int) $_SESSION['usuario_id']);
    if (!$usuario) {
        $_SESSION = [];
        session_destroy();
        responder(401, ['error' => 'La cuenta ya no está disponible']);
    }

    responder(200, [
        'usuario' => $usuario,
        'compras' => comprasDelCliente($pdo, (int) $_SESSION['usuario_id']),
    ]);
} catch (PDOException $error) {
    reportarErrorPDO($error);
}
