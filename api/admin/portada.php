<?php

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../../models/PortadaModel.php';
require_once __DIR__ . '/../../models/ImagenLocalModel.php';

exigirSesion('administrador');
$metodo = $_SERVER['REQUEST_METHOD'] ?? '';

if (!in_array($metodo, ['GET', 'PUT'], true)) {
    header('Allow: GET, PUT');
    responder(405, ['error' => 'Método no permitido']);
}

try {
    $pdo = obtenerConexion();
    if ($metodo === 'GET') {
        responder(200, ['portada' => consultarPortada($pdo)]);
    }

    $datos = leerJSON();
    $titulo = validarTextoPortada($datos['titulo'] ?? null, 'título', 100);
    $subtitulo = validarTextoPortada($datos['subtitulo'] ?? null, 'subtítulo', 180);
    $textoAlternativo = validarTextoPortada(
        $datos['texto_alternativo'] ?? null,
        'texto alternativo',
        180
    );
    $actualizarImagen = array_key_exists('imagen', $datos);
    $imagenNueva = $actualizarImagen
        ? guardarImagenLocal($datos['imagen'], 'site')
        : null;
    $actualizado = false;

    try {
        $imagenAnterior = actualizarPortada(
            $pdo,
            $titulo,
            $subtitulo,
            $textoAlternativo,
            $actualizarImagen,
            $imagenNueva
        );
        $actualizado = true;
    } finally {
        if (!$actualizado) {
            eliminarImagenLocal($imagenNueva, 'site');
        }
    }

    if ($actualizarImagen) {
        eliminarImagenLocal($imagenAnterior, 'site');
    }
    responder(200, ['mensaje' => 'Portada actualizada']);
} catch (InvalidArgumentException $error) {
    responder(400, ['error' => $error->getMessage()]);
} catch (PDOException $error) {
    reportarErrorPDO($error);
} catch (RuntimeException $error) {
    error_log('ANStore home banner update error: ' . $error->getMessage());
    responder(500, ['error' => 'No se pudo actualizar la portada']);
}

function validarTextoPortada($valor, string $campo, int $limite): string
{
    if (!is_string($valor)) {
        throw new InvalidArgumentException("El {$campo} debe ser texto.");
    }

    $texto = trim($valor);
    $longitud = preg_match_all('/./us', $texto);
    if ($texto === '' || $longitud === false || $longitud > $limite) {
        throw new InvalidArgumentException(
            "El {$campo} es obligatorio y no puede superar {$limite} caracteres."
        );
    }

    return $texto;
}
