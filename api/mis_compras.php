<?php
// GET api/mis_compras.php  -> ENDPOINT PRIVADO
// Devuelve los datos del usuario logueado y su historial de compras.

header('Content-Type: application/json; charset=utf-8');

session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict']);
session_start();

// ===== GUARDIÁN DE SESIÓN =====
// Si no hay usuario en la sesión, se corta acá con 401 Unauthorized.
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado. Iniciá sesión.']);
    exit;
}

require __DIR__ . '/conexion.php';

$id = $_SESSION['usuario_id'];

// Datos del usuario (nunca se devuelve el hash de la contraseña)
$stmt = $pdo->prepare('SELECT nombre, email FROM usuarios WHERE id = ?');
$stmt->execute([$id]);
$usuario = $stmt->fetch();

// Si el usuario fue borrado mientras tenía sesión abierta
if (!$usuario) {
    session_destroy();
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// Compras SOLO de este usuario
$stmt = $pdo->prepare(
    'SELECT producto, cantidad, total, fecha
       FROM compras
      WHERE usuario_id = ?
   ORDER BY fecha DESC'
);
$stmt->execute([$id]);

echo json_encode([
    'usuario' => $usuario,
    'compras' => $stmt->fetchAll(),
]);
