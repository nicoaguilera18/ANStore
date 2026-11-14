<?php

require_once __DIR__ . '/bootstrap.php';

exigirMetodo('GET');
exigirSesion();

try {
    $pdo = obtenerConexion();
    if ($_SESSION['rol'] === 'cliente') {
        require_once __DIR__ . '/../models/UsuarioModel.php';
        $usuario = obtenerCliente($pdo, (int) $_SESSION['usuario_id']);
    } else {
        $stmt = $pdo->prepare(
            'SELECT id_admin AS id, nombre, email
               FROM administrador
              WHERE id_admin = :id_admin'
        );
        $stmt->execute(['id_admin' => (int) $_SESSION['usuario_id']]);
        $usuario = $stmt->fetch();
    }

    if (!$usuario) {
        $_SESSION = [];
        session_destroy();
        responder(401, ['error' => 'La cuenta ya no está disponible']);
    }

    $nombre = isset($usuario['apellido'])
        ? trim($usuario['nombre'] . ' ' . $usuario['apellido'])
        : $usuario['nombre'];
    responder(200, [
        'usuario' => [
            'id' => (int) ($usuario['id'] ?? $usuario['id_usuario'] ?? $usuario['id_admin']),
            'nombre' => $nombre,
            'email' => $usuario['email'],
            'rol' => $_SESSION['rol'],
        ],
    ]);
} catch (PDOException $error) {
    reportarErrorPDO($error);
}
