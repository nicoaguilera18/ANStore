<?php

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../models/UsuarioModel.php';

exigirMetodo('POST');
$datos = leerJSON();
$email = $datos['email'] ?? null;
$contrasena = $datos['password'] ?? null;

if (!is_string($email) || !is_string($contrasena)
    || !filter_var(trim($email), FILTER_VALIDATE_EMAIL) || $contrasena === '') {
    responder(400, ['error' => 'Ingresá un correo válido y una contraseña']);
}
$email = trim($email);

try {
    $cuenta = buscarCuentaPorEmail(obtenerConexion(), $email);
} catch (PDOException $error) {
    reportarErrorPDO($error);
}

if (!$cuenta || !$cuenta['password'] || !password_verify($contrasena, $cuenta['password'])) {
    responder(401, ['error' => 'Correo o contraseña incorrectos']);
}

iniciarSesionSegura();
session_regenerate_id(true);
$_SESSION['usuario_id'] = (int) $cuenta['id'];
$_SESSION['rol'] = $cuenta['rol'];
$_SESSION['nombre'] = trim($cuenta['nombre'] . ' ' . ($cuenta['apellido'] ?? ''));
$_SESSION['email'] = $cuenta['email'];

responder(200, [
    'mensaje' => 'Ingreso correcto',
    'usuario' => [
        'id' => (int) $cuenta['id'],
        'nombre' => $_SESSION['nombre'],
        'email' => $cuenta['email'],
        'rol' => $cuenta['rol'],
    ],
]);
