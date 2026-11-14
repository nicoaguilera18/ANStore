<?php

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../../models/ProductoModel.php';
require_once __DIR__ . '/../../models/ProductoAdminModel.php';
require_once __DIR__ . '/../../models/ProductoImagenModel.php';

exigirSesion('administrador');
$metodo = $_SERVER['REQUEST_METHOD'] ?? '';

try {
    $pdo = obtenerConexion();
    if ($metodo === 'GET') {
        responder(200, ['productos' => consultarProductos($pdo)]);
    }

    if ($metodo === 'POST') {
        $datos = leerJSON();
        $producto = validarProducto($datos);
        $imagen = guardarImagenProducto($datos['imagen'] ?? null);
        $creado = false;
        try {
            $id = crearProducto($pdo, (int) $_SESSION['usuario_id'], $producto, $imagen);
            $creado = true;
        } finally {
            if (!$creado) {
                eliminarImagenProducto($imagen);
            }
        }
        responder(201, ['mensaje' => 'Producto creado', 'id' => $id]);
    }

    if ($metodo === 'PUT') {
        $datos = leerJSON();
        $id = filter_var($datos['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false || $id < 1) {
            responder(400, ['error' => 'El identificador de producto no es válido']);
        }
        $imagen = guardarImagenProducto($datos['imagen'] ?? null);
        unset($datos['imagen']);
        $actualizado = false;
        try {
            $imagenAnterior = actualizarProducto(
                $pdo,
                (int) $_SESSION['usuario_id'],
                $id,
                $datos,
                $imagen
            );
            $actualizado = true;
        } finally {
            if (!$actualizado) {
                eliminarImagenProducto($imagen);
            }
        }
        if ($imagen !== null) {
            eliminarImagenProducto($imagenAnterior);
        }
        responder(200, ['mensaje' => 'Producto actualizado']);
    }

    if ($metodo === 'DELETE') {
        $datos = leerJSON();
        $id = filter_var($datos['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false || $id < 1) {
            responder(400, ['error' => 'El identificador de producto no es válido']);
        }
        $imagen = eliminarProducto($pdo, $id);
        eliminarImagenProducto($imagen);
        responder(200, ['mensaje' => 'Producto eliminado']);
    }

    header('Allow: GET, POST, PUT, DELETE');
    responder(405, ['error' => 'Método no permitido']);
} catch (InvalidArgumentException $error) {
    responder(400, ['error' => $error->getMessage()]);
} catch (OutOfBoundsException $error) {
    responder(404, ['error' => $error->getMessage()]);
} catch (DomainException $error) {
    responder(409, ['error' => $error->getMessage()]);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        responder(409, ['error' => 'No se puede eliminar el producto porque está asociado a una compra o PC armada']);
    }
    reportarErrorPDO($error);
} catch (RuntimeException $error) {
    error_log('ANStore image storage error: ' . $error->getMessage());
    responder(500, ['error' => 'No se pudo guardar la imagen del producto']);
}
