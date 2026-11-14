<?php

function registrarCompra(
    PDO $pdo,
    int $idCliente,
    string $metodoPago,
    string $direccion,
    string $telefono,
    array $items
): int {
    $pdo->beginTransaction();

    try {
        $buscarProducto = $pdo->prepare(
            'SELECT precio, stock
               FROM producto
              WHERE id_producto = :id_producto
              FOR UPDATE'
        );
        $lineas = [];

        foreach ($items as $item) {
            $idProducto = (int) $item['id'];
            $cantidad = (int) $item['cantidad'];
            $buscarProducto->execute(['id_producto' => $idProducto]);
            $producto = $buscarProducto->fetch();

            if (!$producto) {
                throw new OutOfBoundsException('Uno de los productos ya no está disponible.');
            }
            if ($cantidad > (int) $producto['stock']) {
                throw new DomainException('No hay stock suficiente para completar la compra.');
            }

            $lineas[] = [
                'id' => $idProducto,
                'cantidad' => $cantidad,
                'precio' => $producto['precio'],
            ];
        }

        $insertarCompra = $pdo->prepare(
            'INSERT INTO compra (id_usuario, metodo_pago, fecha, direccion_envio, telefono_contacto)
             VALUES (:id_usuario, :metodo_pago, CURRENT_TIMESTAMP, :direccion, :telefono)'
        );
        $insertarCompra->execute([
            'id_usuario' => $idCliente,
            'metodo_pago' => $metodoPago,
            'direccion' => $direccion,
            'telefono' => $telefono,
        ]);
        $idVenta = (int) $pdo->lastInsertId();

        $insertarDetalle = $pdo->prepare(
            'INSERT INTO detalle_compra (id_venta, id_producto, cantidad, precio_unitario)
             VALUES (:id_venta, :id_producto, :cantidad, :precio_unitario)'
        );
        foreach ($lineas as $linea) {
            $insertarDetalle->execute([
                'id_venta' => $idVenta,
                'id_producto' => $linea['id'],
                'cantidad' => $linea['cantidad'],
                'precio_unitario' => $linea['precio'],
            ]);
        }

        $buscarTelefono = $pdo->prepare(
            'SELECT tel_id FROM telefonos
              WHERE id_usuario = :id_usuario AND telefono = :telefono'
        );
        $buscarTelefono->execute([
            'id_usuario' => $idCliente,
            'telefono' => $telefono,
        ]);
        if ($buscarTelefono->fetch() === false) {
            $insertarTelefono = $pdo->prepare(
                'INSERT INTO telefonos (id_usuario, telefono)
                 VALUES (:id_usuario, :telefono)'
            );
            $insertarTelefono->execute([
                'id_usuario' => $idCliente,
                'telefono' => $telefono,
            ]);
        }

        $pdo->commit();
        return $idVenta;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function comprasDelCliente(PDO $pdo, int $idCliente): array
{
    $stmt = $pdo->prepare(
        'SELECT vt.id_venta, vt.fecha, vt.metodo_pago, vt.total_venta,
                vt.direccion_envio, vt.telefono_contacto,
                dv.id_producto, dv.producto, dv.cantidad, dv.precio_unitario, dv.subtotal
           FROM v_compra_total vt
           LEFT JOIN v_detalle_ventas dv ON dv.id_venta = vt.id_venta
          WHERE vt.id_usuario = :id_usuario
          ORDER BY vt.fecha DESC, dv.id_producto'
    );
    $stmt->execute(['id_usuario' => $idCliente]);

    return agruparCompras($stmt->fetchAll());
}

function todasLasCompras(PDO $pdo): array
{
    $stmt = $pdo->prepare(
        'SELECT vt.id_venta, vt.fecha, vt.metodo_pago, vt.total_venta,
                vt.direccion_envio, vt.telefono_contacto,
                c.id_usuario, c.nombre, c.apellido, c.email,
                dv.id_producto, dv.producto, dv.cantidad, dv.precio_unitario, dv.subtotal
           FROM v_compra_total vt
           JOIN cliente c ON c.id_usuario = vt.id_usuario
           LEFT JOIN v_detalle_ventas dv ON dv.id_venta = vt.id_venta
          ORDER BY vt.fecha DESC, vt.id_venta DESC, dv.id_producto'
    );
    $stmt->execute();

    return agruparCompras($stmt->fetchAll(), true);
}

function agruparCompras(array $filas, bool $incluirCliente = false): array
{
    $compras = [];

    foreach ($filas as $fila) {
        $id = (int) $fila['id_venta'];
        if (!isset($compras[$id])) {
            $compra = [
                'id' => $id,
                'fecha' => $fila['fecha'],
                'metodo_pago' => $fila['metodo_pago'],
                'total' => $fila['total_venta'],
                'direccion' => $fila['direccion_envio'],
                'telefono' => $fila['telefono_contacto'],
                'items' => [],
            ];
            if ($incluirCliente) {
                $compra['cliente'] = [
                    'id' => (int) $fila['id_usuario'],
                    'nombre' => trim($fila['nombre'] . ' ' . $fila['apellido']),
                    'email' => $fila['email'],
                ];
            }
            $compras[$id] = $compra;
        }

        if ($fila['id_producto'] !== null) {
            $compras[$id]['items'][] = [
                'id' => (int) $fila['id_producto'],
                'producto' => $fila['producto'],
                'cantidad' => (int) $fila['cantidad'],
                'precio_unitario' => $fila['precio_unitario'],
                'subtotal' => $fila['subtotal'],
            ];
        }
    }

    return array_values($compras);
}
