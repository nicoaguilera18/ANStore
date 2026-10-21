<?php
// POST api/logout.php  -> destruye la sesión actual

header('Content-Type: application/json; charset=utf-8');

session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict']);
session_start();

$_SESSION = [];                 // vaciar datos
session_destroy();              // eliminar la sesión en el servidor
setcookie(session_name(), '', time() - 3600, '/'); // borrar la cookie del navegador

echo json_encode(['mensaje' => 'Sesión cerrada']);
