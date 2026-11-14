<?php

const TAMANIO_MAXIMO_IMAGEN_LOCAL = 2097152;

function guardarImagenLocal($imagen, string $coleccion): ?string
{
    $coleccionesPermitidas = ['products', 'site'];
    if (!in_array($coleccion, $coleccionesPermitidas, true)) {
        throw new InvalidArgumentException('El destino de la imagen no es válido.');
    }

    if ($imagen === null) {
        return null;
    }

    if (!is_array($imagen)
        || !is_string($imagen['mime'] ?? null)
        || !is_string($imagen['base64'] ?? null)) {
        throw new InvalidArgumentException('El formato de la imagen no es válido.');
    }

    $extensiones = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    $mime = $imagen['mime'];
    $base64 = $imagen['base64'];
    $longitudMaximaBase64 = 4 * (int) ceil(TAMANIO_MAXIMO_IMAGEN_LOCAL / 3);

    if (!isset($extensiones[$mime]) || $base64 === ''
        || strlen($base64) > $longitudMaximaBase64) {
        throw new InvalidArgumentException('Usá una imagen JPEG, PNG o WebP de hasta 2 MB.');
    }

    $contenido = base64_decode($base64, true);
    if ($contenido === false || $contenido === ''
        || strlen($contenido) > TAMANIO_MAXIMO_IMAGEN_LOCAL) {
        throw new InvalidArgumentException('La imagen está vacía, supera 2 MB o no es Base64 válido.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    if ($finfo->buffer($contenido) !== $mime) {
        throw new InvalidArgumentException('El tipo de archivo no coincide con el contenido de la imagen.');
    }

    $dimensiones = getimagesizefromstring($contenido);
    if ($dimensiones === false || ($dimensiones['mime'] ?? null) !== $mime
        || $dimensiones[0] < 1 || $dimensiones[1] < 1
        || $dimensiones[0] > 6000 || $dimensiones[1] > 6000
        || $dimensiones[0] * $dimensiones[1] > 24000000) {
        throw new InvalidArgumentException('La imagen no es válida o supera las dimensiones permitidas.');
    }

    $directorioRelativo = 'images/' . $coleccion;
    $directorio = __DIR__ . '/../public/' . $directorioRelativo;
    if (!is_dir($directorio) && !@mkdir($directorio, 0755, true) && !is_dir($directorio)) {
        throw new RuntimeException('No se pudo preparar el almacenamiento de imágenes.');
    }

    $nombre = bin2hex(random_bytes(16)) . '.' . $extensiones[$mime];
    $ruta = $directorio . '/' . $nombre;
    $escritos = @file_put_contents($ruta, $contenido, LOCK_EX);
    if ($escritos !== strlen($contenido)) {
        if (is_file($ruta)) {
            @unlink($ruta);
        }
        throw new RuntimeException('No se pudo guardar la imagen.');
    }

    return $directorioRelativo . '/' . $nombre;
}

function eliminarImagenLocal(?string $imagen, string $coleccion): void
{
    $coleccionesPermitidas = ['products', 'site'];
    if ($imagen === null || !in_array($coleccion, $coleccionesPermitidas, true)) {
        return;
    }

    $directorioRelativo = 'images/' . $coleccion;
    $patron = '/\A' . preg_quote($directorioRelativo, '/') . '\/[a-f0-9]{32}\.(?:jpg|png|webp)\z/';
    if (!preg_match($patron, $imagen)) {
        return;
    }

    $ruta = __DIR__ . '/../public/' . $imagen;
    if (is_file($ruta) && !@unlink($ruta)) {
        error_log('ANStore could not remove local image: ' . $imagen);
    }
}
