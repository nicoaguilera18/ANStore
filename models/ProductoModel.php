<?php

function consultarProductos(PDO $pdo, string $busqueda = '', ?int $id = null): array
{
    $stmt = $pdo->prepare(
        "SELECT p.id_producto AS id, p.tipo, p.precio, p.stock, p.imagen,
                COALESCE(pa.nombre, CONCAT(co.marca, ' ', co.modelo)) AS nombre,
                CASE p.tipo
                    WHEN 'PC_ARMADA' THEN 'Computadora armada'
                    WHEN 'PROCESADOR' THEN 'Procesador'
                    WHEN 'MEMORIA_RAM' THEN 'Memoria RAM'
                    WHEN 'TARJETA_MADRE' THEN 'Tarjeta madre'
                    WHEN 'FUENTE_PODER' THEN 'Fuente de poder'
                    WHEN 'PLACA_VIDEO' THEN 'Placa de video'
                    WHEN 'GABINETE' THEN 'Gabinete'
                END AS categoria,
                pa.fecha_armado,
                co.marca,
                co.modelo,
                pr.consumo AS consumo_procesador,
                pr.frecuencia AS frecuencia_procesador,
                pr.socket AS socket_procesador,
                mr.frecuencia_mhz, mr.capacidad_gb, mr.tipo_ram,
                tm.chipset, tm.formato AS formato_madre, tm.socket AS socket_madre,
                tm.pcie AS pcie_madre,
                fp.certificacion, fp.potencia, fp.tipo_fuente,
                pv.consumo AS consumo_video, pv.memoria_vram_gb, pv.pcie AS pcie_video
           FROM producto p
           LEFT JOIN pc_armada pa ON pa.id_pc = p.id_producto
           LEFT JOIN componente co ON co.id_componente = p.id_producto
           LEFT JOIN procesador pr ON pr.id_componente = p.id_producto
           LEFT JOIN memoria_ram mr ON mr.id_componente = p.id_producto
           LEFT JOIN tarjeta_madre tm ON tm.id_componente = p.id_producto
           LEFT JOIN fuente_de_poder fp ON fp.id_componente = p.id_producto
           LEFT JOIN placa_de_video pv ON pv.id_componente = p.id_producto
          WHERE (:buscar_nombre = ''
             OR COALESCE(pa.nombre, CONCAT(co.marca, ' ', co.modelo)) LIKE :patron_nombre
             OR p.tipo LIKE :patron_tipo)
            AND (:id_filtro IS NULL OR p.id_producto = :id_producto)
          ORDER BY p.id_producto"
    );
    $patron = '%' . $busqueda . '%';
    $stmt->execute([
        'buscar_nombre' => $busqueda,
        'patron_nombre' => $patron,
        'patron_tipo' => $patron,
        'id_filtro' => $id,
        'id_producto' => $id,
    ]);

    $productos = $stmt->fetchAll();

    foreach ($productos as &$producto) {
        $producto['descripcion'] = descripcionProducto($producto);
        $producto['especificaciones'] = especificacionesProducto($producto);
    }

    return $productos;
}

function consultarProducto(PDO $pdo, int $id): ?array
{
    $producto = consultarProductos($pdo, '', $id)[0] ?? null;
    if (!$producto) {
        return null;
    }

    if ($producto['tipo'] === 'PC_ARMADA') {
        $stmt = $pdo->prepare(
            "SELECT pc.id_componente AS id, pc.cantidad,
                    CONCAT(co.marca, ' ', co.modelo) AS nombre
               FROM pc_componente pc
               JOIN componente co ON co.id_componente = pc.id_componente
              WHERE pc.id_pc = :id_pc
              ORDER BY co.tipo, co.marca, co.modelo"
        );
        $stmt->execute(['id_pc' => $id]);
        $producto['componentes'] = $stmt->fetchAll();
    } elseif ($producto['tipo'] === 'GABINETE') {
        $stmt = $pdo->prepare(
            'SELECT formato
               FROM gabinete_formato
              WHERE id_componente = :id_componente
              ORDER BY formato'
        );
        $stmt->execute(['id_componente' => $id]);
        $producto['especificaciones'] = array_map(
            static function (array $row): string {
                return 'Formato admitido: ' . $row['formato'];
            },
            $stmt->fetchAll()
        );
        $producto['descripcion'] = implode(' | ', $producto['especificaciones']);
    }

    return $producto;
}

function descripcionProducto(array $producto): string
{
    $especificaciones = especificacionesProducto($producto);
    if ($producto['tipo'] === 'PC_ARMADA') {
        return 'Computadora armada disponible para compra.';
    }

    return implode(' | ', array_values($especificaciones));
}

function especificacionesProducto(array $producto): array
{
    switch ($producto['tipo']) {
        case 'PROCESADOR':
            return [
                'Consumo: ' . $producto['consumo_procesador'] . ' W',
                'Frecuencia: ' . $producto['frecuencia_procesador'] . ' MHz',
                'Socket: ' . $producto['socket_procesador'],
            ];
        case 'MEMORIA_RAM':
            return [
                'Capacidad: ' . $producto['capacidad_gb'] . ' GB',
                'Frecuencia: ' . $producto['frecuencia_mhz'] . ' MHz',
                'Tipo: ' . $producto['tipo_ram'],
            ];
        case 'TARJETA_MADRE':
            return [
                'Chipset: ' . $producto['chipset'],
                'Formato: ' . $producto['formato_madre'],
                'Socket: ' . $producto['socket_madre'],
                'PCIe: ' . $producto['pcie_madre'],
            ];
        case 'FUENTE_PODER':
            return [
                'Potencia: ' . $producto['potencia'] . ' W',
                'Certificación: ' . $producto['certificacion'],
                'Tipo: ' . $producto['tipo_fuente'],
            ];
        case 'PLACA_VIDEO':
            return [
                'Consumo: ' . $producto['consumo_video'] . ' W',
                'VRAM: ' . $producto['memoria_vram_gb'] . ' GB',
                'PCIe: ' . $producto['pcie_video'],
            ];
        default:
            return [];
    }
}
