<?php

require_once __DIR__ . '/bootstrap.php';

exigirMetodo('POST');
iniciarSesionSegura();
$_SESSION = [];
session_destroy();

$https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
setcookie(session_name(), '', [
    'expires' => time() - 3600,
    'path' => '/',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);

responder(200, ['mensaje' => 'Sesión cerrada']);
