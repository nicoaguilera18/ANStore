<?php
// POST api/login.php
// Recibe JSON: { "email": "...", "password": "..." }

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

require __DIR__ . '/conexion.php';

$datos    = json_decode(file_get_contents('php://input'), true);
$email    = trim($datos['email'] ?? '');
$password =      $datos['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Completá correo y contraseña']);
    exit;
}

// 1) Buscar al usuario por email (Prepared Statement)
$stmt = $pdo->prepare('SELECT id, nombre, password FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
$usuario = $stmt->fetch();

// 2) Comparar la contraseña escrita con el hash guardado
//    (mismo mensaje si falla el email o la clave, para no dar pistas)
if (!$usuario || !password_verify($password, $usuario['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Correo o contraseña incorrectos']);
    exit;
}

// 3) Iniciar la sesión. La cookie no es accesible desde JavaScript (httponly).
session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict']);
session_start();

// 4) Generar un ID de sesión nuevo (evita "session fixation")
session_regenerate_id(true);

// 5) Guardar el identificador del usuario en la sesión
$_SESSION['usuario_id'] = $usuario['id'];

echo json_encode([
    'mensaje' => 'Ingreso correcto',
    'nombre'  => $usuario['nombre'],
]);
