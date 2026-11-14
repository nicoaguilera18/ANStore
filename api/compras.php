<?php

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../models/CompraModel.php';

exigirMetodo('POST');
exigirSesion('cliente');
$datos = leerJSON();

$metodosPago = ['Efectivo', 'Tarjeta de Credito', 'Tarjeta de Debito', 'Transferencia', 'Mercado Pago'];
$metodoPago = $datos['metodo_pago'] ?? null;
$direccion = $datos['direccion'] ?? null;
$telefono = $datos['telefono'] ?? null;
$items = $datos['items'] ?? null;

if (!is_string($metodoPago) || !is_string($direccion) || !is_string($telefono)) {
    responder(400, ['error' => 'Los datos de entrega y pago deben ser texto']);
}
$metodoPago = trim($metodoPago);
$direccion = trim($direccion);
$telefono = trim($telefono);

if (!in_array($metodoPago, $metodosPago, true)
    || $direccion === '' || strlen($direccion) > 255
    || $telefono === '' || strlen($telefono) > 20
    || !is_array($items) || count($items) === 0 || count($items) > 100) {
    responder(400, ['error' => 'Revisá los datos de entrega, pago y productos']);
}

$normalizados = [];
foreach ($items as $item) {
    if (!is_array($item)
        || filter_var($item['id'] ?? null, FILTER_VALIDATE_INT) === false
        || filter_var($item['cantidad'] ?? null, FILTER_VALIDATE_INT) === false
        || (int) $item['id'] < 1
        || (int) $item['id'] > 2147483647
        || (int) $item['cantidad'] < 1
        || (int) $item['cantidad'] > 2147483647) {
        responder(400, ['error' => 'La lista contiene productos o cantidades inválidas']);
    }
    $id = (int) $item['id'];
    $normalizados[$id] = ($normalizados[$id] ?? 0) + (int) $item['cantidad'];
    if ($normalizados[$id] > 2147483647) {
        responder(400, ['error' => 'La cantidad total de un producto supera el máximo permitido']);
    }
}

ksort($normalizados, SORT_NUMERIC);
$itemsCompra = [];
foreach ($normalizados as $id => $cantidad) {
    $itemsCompra[] = ['id' => $id, 'cantidad' => $cantidad];
}

try {
    $idVenta = registrarCompra(
        obtenerConexion(),
        (int) $_SESSION['usuario_id'],
        $metodoPago,
        $direccion,
        $telefono,
        $itemsCompra
    );
    responder(201, ['mensaje' => 'Compra registrada correctamente', 'id_venta' => $idVenta]);
} catch (OutOfBoundsException $error) {
    responder(404, ['error' => $error->getMessage()]);
} catch (DomainException $error) {
    responder(409, ['error' => $error->getMessage()]);
} catch (PDOException $error) {
    reportarErrorPDO($error);
}
