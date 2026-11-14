<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/conexion.php';

function responder(int $estado, array $datos): void
{
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function exigirMetodo(string $metodo): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $metodo) {
        header('Allow: ' . $metodo);
        responder(405, ['error' => 'Método no permitido']);
    }
}

function leerJSON(): array
{
    $contenido = file_get_contents('php://input');
    $datos = json_decode($contenido, true);

    if (!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        responder(400, ['error' => 'El cuerpo debe contener un objeto JSON válido']);
    }

    return $datos;
}

function iniciarSesionSegura(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    session_name('ANSTORESESSID');
    $https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function exigirSesion(?string $rol = null): void
{
    iniciarSesionSegura();

    if (!isset($_SESSION['usuario_id'], $_SESSION['rol'])) {
        responder(401, ['error' => 'Se requiere iniciar sesión']);
    }

    if ($rol !== null && $_SESSION['rol'] !== $rol) {
        responder(403, ['error' => 'No tenés permisos para acceder a este recurso']);
    }
}

function reportarErrorPDO(PDOException $error): void
{
    error_log('ANStore database error: ' . $error->getMessage());
    responder(500, ['error' => 'Error interno del servidor']);
}
