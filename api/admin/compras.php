<?php

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../../models/CompraModel.php';
require_once __DIR__ . '/../../models/ProductoModel.php';

exigirMetodo('GET');
exigirSesion('administrador');

try {
    $pdo = obtenerConexion();
    $compras = todasLasCompras($pdo);
    $productos = consultarProductos($pdo);
    $limiteStockBajo = 5;
    $totalVendido = 0.0;
    foreach ($compras as $compra) {
        $totalVendido += (float) $compra['total'];
    }

    $productosBajoStock = array_values(array_map(
        static function (array $producto): array {
            return [
                'id' => (int) $producto['id'],
                'nombre' => $producto['nombre'],
                'stock' => (int) $producto['stock'],
            ];
        },
        array_filter(
            $productos,
            static fn (array $producto): bool => (int) $producto['stock'] <= $limiteStockBajo
        )
    ));

    responder(200, [
        'compras' => $compras,
        'resumen' => [
            'cantidad_compras' => count($compras),
            'total_vendido' => round($totalVendido, 2),
            'limite_stock_bajo' => $limiteStockBajo,
            'productos_bajo_stock' => $productosBajoStock,
        ],
    ]);
} catch (PDOException $error) {
    reportarErrorPDO($error);
}
