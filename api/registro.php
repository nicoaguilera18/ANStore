<?php

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../models/UsuarioModel.php';

exigirMetodo('POST');
$datos = leerJSON();
$nombre = $datos['nombre'] ?? null;
$apellido = $datos['apellido'] ?? null;
$email = $datos['email'] ?? null;
$contrasena = $datos['password'] ?? null;

if (!is_string($nombre) || !is_string($apellido) || !is_string($email)
    || !is_string($contrasena)) {
    responder(400, ['error' => 'Completá nombre, apellido, correo y contraseña como texto']);
}
$nombre = trim($nombre);
$apellido = trim($apellido);
$email = trim($email);

if ($nombre === '' || $apellido === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(400, ['error' => 'Completá nombre, apellido y un correo válido']);
}
if (strlen($nombre) > 100 || strlen($apellido) > 100 || strlen($email) > 150) {
    responder(400, ['error' => 'Alguno de los campos supera la longitud permitida']);
}
if (strlen($contrasena) < 8 || strlen($contrasena) > 72) {
    responder(400, ['error' => 'La contraseña debe tener entre 8 y 72 bytes']);
}

try {
    $pdo = obtenerConexion();
    if (!emailDisponible($pdo, $email)) {
        responder(409, ['error' => 'Ese correo ya está registrado']);
    }

    $hash = password_hash($contrasena, PASSWORD_BCRYPT);
    $id = crearCliente($pdo, $nombre, $apellido, $email, $hash);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        responder(409, ['error' => 'Ese correo ya está registrado']);
    }
    reportarErrorPDO($error);
}

responder(201, ['mensaje' => 'Usuario registrado correctamente', 'id' => $id]);
