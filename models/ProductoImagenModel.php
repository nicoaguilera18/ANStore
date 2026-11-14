<?php

require_once __DIR__ . '/ImagenLocalModel.php';

function guardarImagenProducto($imagen): ?string
{
    return guardarImagenLocal($imagen, 'products');
}

function eliminarImagenProducto(?string $imagen): void
{
    eliminarImagenLocal($imagen, 'products');
}
