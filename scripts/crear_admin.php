<?php

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/conexion.php';

function leerDato(string $etiqueta): string
{
    fwrite(STDOUT, $etiqueta);
    return trim((string) fgets(STDIN));
}

$nombre = leerDato('Nombre del administrador: ');
$email = leerDato('Correo del administrador: ');
$contrasena = leerDato('Contraseña (8 a 72 bytes): ');

if ($nombre === '' || strlen($nombre) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($email) > 150 || strlen($contrasena) < 8 || strlen($contrasena) > 72) {
    fwrite(STDERR, "Datos inválidos. Revisá los campos y volvé a intentar.\n");
    exit(1);
}

try {
    $pdo = obtenerConexion();
    $buscarAdmin = $pdo->prepare(
        'SELECT id_admin FROM administrador WHERE email = :email'
    );
    $buscarAdmin->execute(['email' => $email]);
    $administrador = $buscarAdmin->fetch();
    $hash = password_hash($contrasena, PASSWORD_BCRYPT);

    if ($administrador) {
        $actualizar = $pdo->prepare(
            'UPDATE administrador
                SET nombre = :nombre, password = :password
              WHERE id_admin = :id_admin'
        );
        $actualizar->execute([
            'nombre' => $nombre,
            'password' => $hash,
            'id_admin' => $administrador['id_admin'],
        ]);
    } else {
        $buscarCliente = $pdo->prepare(
            'SELECT id_usuario FROM cliente WHERE email = :email'
        );
        $buscarCliente->execute(['email' => $email]);
        if ($buscarCliente->fetch() !== false) {
            fwrite(STDERR, "Ese correo ya pertenece a un cliente.\n");
            exit(1);
        }

        $crear = $pdo->prepare(
            'INSERT INTO administrador (nombre, email, password)
             VALUES (:nombre, :email, :password)'
        );
        $crear->execute([
            'nombre' => $nombre,
            'email' => $email,
            'password' => $hash,
        ]);
    }

    fwrite(STDOUT, "Cuenta de administrador configurada correctamente.\n");
} catch (PDOException $error) {
    error_log('ANStore admin setup error: ' . $error->getMessage());
    fwrite(STDERR, "No se pudo configurar la cuenta de administrador.\n");
    exit(1);
}
