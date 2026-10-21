<?php
// POST api/registro.php
// Recibe JSON: { "nombre": "...", "email": "...", "password": "..." }

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Método no permitido
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

require __DIR__ . '/conexion.php';

// 1) Leer el cuerpo JSON enviado por fetch()
$datos = json_decode(file_get_contents('php://input'), true);

$nombre   = trim($datos['nombre']   ?? '');
$email    = trim($datos['email']    ?? '');
$password =      $datos['password'] ?? '';

// 2) Validaciones básicas
if ($nombre === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Todos los campos son obligatorios']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'El correo no es válido']);
    exit;
}
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'La contraseña debe tener al menos 6 caracteres']);
    exit;
}

// 3) Verificar que el email no exista (Prepared Statement)
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409); // Conflicto
    echo json_encode(['error' => 'Ese correo ya está registrado']);
    exit;
}

// 4) Hashear la contraseña con BCRYPT (nunca se guarda en texto plano)
$hash = password_hash($password, PASSWORD_BCRYPT);

// 5) Insertar con Prepared Statement (evita inyección SQL)
$stmt = $pdo->prepare('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)');
$stmt->execute([$nombre, $email, $hash]);

http_response_code(201); // Creado
echo json_encode(['mensaje' => 'Usuario registrado correctamente']);
