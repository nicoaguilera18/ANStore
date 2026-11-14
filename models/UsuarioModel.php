<?php

function buscarCuentaPorEmail(PDO $pdo, string $email): ?array
{
    $stmt = $pdo->prepare(
        "SELECT id_usuario AS id, nombre, apellido, email, password, 'cliente' AS rol
           FROM cliente
          WHERE email = :email_cliente
         UNION ALL
         SELECT id_admin AS id, nombre, '' AS apellido, email, password, 'administrador' AS rol
           FROM administrador
          WHERE email = :email_admin"
    );
    $stmt->execute([
        'email_cliente' => $email,
        'email_admin' => $email,
    ]);
    $cuenta = $stmt->fetch();

    return $cuenta ?: null;
}

function emailDisponible(PDO $pdo, string $email): bool
{
    $stmt = $pdo->prepare(
        'SELECT 1 FROM cliente WHERE email = :email_cliente
         UNION ALL
         SELECT 1 FROM administrador WHERE email = :email_admin'
    );
    $stmt->execute([
        'email_cliente' => $email,
        'email_admin' => $email,
    ]);

    return $stmt->fetchColumn() === false;
}

function crearCliente(PDO $pdo, string $nombre, string $apellido, string $email, string $hash): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO cliente (nombre, apellido, email, password)
         VALUES (:nombre, :apellido, :email, :password)'
    );
    $stmt->execute([
        'nombre' => $nombre,
        'apellido' => $apellido,
        'email' => $email,
        'password' => $hash,
    ]);

    return (int) $pdo->lastInsertId();
}

function obtenerCliente(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT c.id_usuario AS id, c.nombre, c.apellido, c.email,
                t.telefono
           FROM cliente c
           LEFT JOIN telefonos t ON t.id_usuario = c.id_usuario
          WHERE c.id_usuario = :id_usuario
          ORDER BY t.tel_id
          LIMIT 1'
    );
    $stmt->execute(['id_usuario' => $id]);
    $cliente = $stmt->fetch();

    return $cliente ?: null;
}
