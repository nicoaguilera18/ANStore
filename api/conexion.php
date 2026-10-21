<?php
// Conexión única a MySQL usando PDO.
// Ajustar usuario/contraseña si tu XAMPP/WAMP usa otros datos.

$host   = 'localhost';
$dbname = 'anstore';
$user   = 'root';
$pass   = '';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // los errores lanzan excepciones
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,      // filas como arrays asociativos
            PDO::ATTR_EMULATE_PREPARES   => false,                 // prepared statements reales
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'No se pudo conectar a la base de datos']);
    exit;
}
