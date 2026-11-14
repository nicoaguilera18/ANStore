<?php

function validarProducto(array $datos, ?string $tipoExistente = null): array
{
    $esActualizacion = $tipoExistente !== null;
    $tipoDato = $datos['tipo'] ?? null;
    if (!$esActualizacion && !is_string($tipoDato)) {
        throw new InvalidArgumentException('El tipo de producto no es válido.');
    }
    $tipo = $tipoExistente ?? strtoupper(trim($tipoDato));
    $tipos = [
        'PC_ARMADA', 'PROCESADOR', 'MEMORIA_RAM', 'TARJETA_MADRE',
        'FUENTE_PODER', 'PLACA_VIDEO', 'GABINETE',
    ];
    if (!in_array($tipo, $tipos, true)) {
        throw new InvalidArgumentException('El tipo de producto no es válido.');
    }

    $precio = $datos['precio'] ?? null;
    $stock = $datos['stock'] ?? null;
    if (!is_numeric($precio) || !is_finite((float) $precio)
        || (float) $precio < 0 || (float) $precio > 99999999.99) {
        throw new InvalidArgumentException('El precio debe estar entre 0 y 99.999.999,99.');
    }
    if (filter_var($stock, FILTER_VALIDATE_INT) === false
        || (int) $stock < 0 || (int) $stock > 2147483647) {
        throw new InvalidArgumentException('El stock debe ser un entero mayor o igual a cero.');
    }

    $producto = [
        'tipo' => $tipo,
        'precio' => number_format((float) $precio, 2, '.', ''),
        'stock' => (int) $stock,
    ];

    if ($tipo === 'PC_ARMADA') {
        $producto['nombre'] = campoTexto($datos, 'nombre', 100);
        $fecha = $datos['fecha_armado'] ?? date('Y-m-d');
        if (!is_string($fecha)) {
            throw new InvalidArgumentException('La fecha de armado no es válida.');
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
            throw new InvalidArgumentException('La fecha de armado no es válida.');
        }
        [$anio, $mes, $dia] = array_map('intval', explode('-', $fecha));
        if (!checkdate($mes, $dia, $anio)) {
            throw new InvalidArgumentException('La fecha de armado no es válida.');
        }
        $producto['fecha_armado'] = $fecha;
        if (!$esActualizacion) {
            $componentes = $datos['componentes'] ?? [];
            if (!is_array($componentes) || count($componentes) === 0) {
                throw new InvalidArgumentException('Una PC armada debe incluir al menos un componente.');
            }
            $producto['componentes'] = [];
            foreach ($componentes as $componente) {
                if (!is_array($componente)
                    || filter_var($componente['id'] ?? null, FILTER_VALIDATE_INT) === false
                    || filter_var($componente['cantidad'] ?? null, FILTER_VALIDATE_INT) === false
                    || (int) $componente['id'] < 1
                    || (int) $componente['cantidad'] < 1
                    || (int) $componente['id'] > 2147483647
                    || (int) $componente['cantidad'] > 2147483647) {
                    throw new InvalidArgumentException('La lista de componentes de la PC no es válida.');
                }
                $producto['componentes'][] = [
                    'id' => (int) $componente['id'],
                    'cantidad' => (int) $componente['cantidad'],
                ];
            }
        }
        return $producto;
    }

    if (!$esActualizacion && $tipo === 'PROCESADOR') {
        $producto['consumo'] = campoEnteroPositivo($datos, 'consumo');
        $producto['frecuencia'] = campoEnteroPositivo($datos, 'frecuencia');
        $producto['socket'] = campoTexto($datos, 'socket', 20);
    } elseif (!$esActualizacion && $tipo === 'MEMORIA_RAM') {
        $producto['frecuencia_mhz'] = campoEnteroPositivo($datos, 'frecuencia_mhz');
        $producto['capacidad_gb'] = campoEnteroPositivo($datos, 'capacidad_gb');
        $producto['tipo_ram'] = campoTexto($datos, 'tipo_ram', 10);
    } elseif (!$esActualizacion && $tipo === 'TARJETA_MADRE') {
        $producto['chipset'] = campoTexto($datos, 'chipset', 50);
        $producto['formato'] = campoTexto($datos, 'formato', 10);
        $producto['socket'] = campoTexto($datos, 'socket', 20);
        $producto['tipo_ram'] = campoTexto($datos, 'tipo_ram', 10);
        $producto['pcie'] = campoTexto($datos, 'pcie', 10);
    } elseif (!$esActualizacion && $tipo === 'FUENTE_PODER') {
        $producto['certificacion'] = campoTexto($datos, 'certificacion', 50);
        $producto['potencia'] = campoEnteroPositivo($datos, 'potencia');
        $producto['tipo_fuente'] = campoTexto($datos, 'tipo_fuente', 30);
    } elseif (!$esActualizacion && $tipo === 'PLACA_VIDEO') {
        $producto['consumo'] = campoEnteroPositivo($datos, 'consumo');
        $producto['memoria_vram_gb'] = campoEnteroPositivo($datos, 'memoria_vram_gb');
        $producto['pcie'] = campoTexto($datos, 'pcie', 10);
    } elseif (!$esActualizacion && $tipo === 'GABINETE') {
        $formatos = $datos['formatos'] ?? [];
        if (!is_array($formatos) || count($formatos) === 0) {
            throw new InvalidArgumentException('Seleccioná al menos un formato válido para el gabinete.');
        }
        foreach ($formatos as $formato) {
            if (!is_string($formato) || !in_array($formato, ['ATX', 'mATX', 'ITX'], true)) {
                throw new InvalidArgumentException('Seleccioná al menos un formato válido para el gabinete.');
            }
        }
        $producto['formatos'] = array_values(array_unique($formatos));
    }

    if ($tipo !== 'PC_ARMADA') {
        $producto['marca'] = campoTexto($datos, 'marca', 50);
        $producto['modelo'] = campoTexto($datos, 'modelo', 100);
    }

    return $producto;
}

function campoTexto(array $datos, string $campo, int $maximo): string
{
    $valor = $datos[$campo] ?? null;
    if (!is_string($valor)) {
        throw new InvalidArgumentException("El campo {$campo} debe ser texto.");
    }
    $valor = trim($valor);
    if ($valor === '' || strlen($valor) > $maximo) {
        throw new InvalidArgumentException("El campo {$campo} es obligatorio y admite hasta {$maximo} caracteres.");
    }

    return $valor;
}

function campoEnteroPositivo(array $datos, string $campo): int
{
    $valor = $datos[$campo] ?? null;
    if (filter_var($valor, FILTER_VALIDATE_INT) === false
        || (int) $valor < 1 || (int) $valor > 2147483647) {
        throw new InvalidArgumentException("El campo {$campo} debe ser un entero positivo.");
    }

    return (int) $valor;
}

function crearProducto(PDO $pdo, int $idAdmin, array $producto, ?string $imagen = null): int
{
    $pdo->beginTransaction();

    try {
        $insertar = $pdo->prepare(
            'INSERT INTO producto (tipo, stock, precio, imagen)
             VALUES (:tipo, :stock, :precio, :imagen)'
        );
        $insertar->execute([
            'tipo' => $producto['tipo'],
            'stock' => $producto['stock'],
            'precio' => $producto['precio'],
            'imagen' => $imagen,
        ]);
        $id = (int) $pdo->lastInsertId();

        if ($producto['tipo'] === 'PC_ARMADA') {
            $stmt = $pdo->prepare(
                'INSERT INTO pc_armada (id_pc, tipo, nombre, fecha_armado)
                 VALUES (:id, :tipo, :nombre, :fecha_armado)'
            );
            $stmt->execute([
                'id' => $id,
                'tipo' => $producto['tipo'],
                'nombre' => $producto['nombre'],
                'fecha_armado' => $producto['fecha_armado'],
            ]);
            guardarComponentesPC($pdo, $id, $producto['componentes']);
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO componente (id_componente, tipo, id_admin, marca, modelo)
                 VALUES (:id, :tipo, :id_admin, :marca, :modelo)'
            );
            $stmt->execute([
                'id' => $id,
                'tipo' => $producto['tipo'],
                'id_admin' => $idAdmin,
                'marca' => $producto['marca'],
                'modelo' => $producto['modelo'],
            ]);
            insertarSubtipo($pdo, $id, $producto);
        }

        $pdo->commit();
        return $id;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function insertarSubtipo(PDO $pdo, int $id, array $producto): void
{
    if ($producto['tipo'] === 'PROCESADOR') {
        $stmt = $pdo->prepare(
            'INSERT INTO procesador (id_componente, tipo, consumo, frecuencia, socket)
             VALUES (:id, :tipo, :consumo, :frecuencia, :socket)'
        );
        $stmt->execute([
            'id' => $id, 'tipo' => $producto['tipo'], 'consumo' => $producto['consumo'],
            'frecuencia' => $producto['frecuencia'], 'socket' => $producto['socket'],
        ]);
    } elseif ($producto['tipo'] === 'MEMORIA_RAM') {
        $stmt = $pdo->prepare(
            'INSERT INTO memoria_ram (id_componente, tipo, frecuencia_mhz, capacidad_gb, tipo_ram)
             VALUES (:id, :tipo, :frecuencia, :capacidad, :tipo_ram)'
        );
        $stmt->execute([
            'id' => $id, 'tipo' => $producto['tipo'], 'frecuencia' => $producto['frecuencia_mhz'],
            'capacidad' => $producto['capacidad_gb'], 'tipo_ram' => $producto['tipo_ram'],
        ]);
    } elseif ($producto['tipo'] === 'TARJETA_MADRE') {
        $stmt = $pdo->prepare(
            'INSERT INTO tarjeta_madre (id_componente, tipo, chipset, formato, socket, tipo_ram, pcie)
             VALUES (:id, :tipo, :chipset, :formato, :socket, :tipo_ram, :pcie)'
        );
        $stmt->execute([
            'id' => $id, 'tipo' => $producto['tipo'], 'chipset' => $producto['chipset'],
            'formato' => $producto['formato'], 'socket' => $producto['socket'],
            'tipo_ram' => $producto['tipo_ram'], 'pcie' => $producto['pcie'],
        ]);
    } elseif ($producto['tipo'] === 'FUENTE_PODER') {
        $stmt = $pdo->prepare(
            'INSERT INTO fuente_de_poder (id_componente, tipo, certificacion, potencia, tipo_fuente)
             VALUES (:id, :tipo, :certificacion, :potencia, :tipo_fuente)'
        );
        $stmt->execute([
            'id' => $id, 'tipo' => $producto['tipo'], 'certificacion' => $producto['certificacion'],
            'potencia' => $producto['potencia'], 'tipo_fuente' => $producto['tipo_fuente'],
        ]);
    } elseif ($producto['tipo'] === 'PLACA_VIDEO') {
        $stmt = $pdo->prepare(
            'INSERT INTO placa_de_video (id_componente, tipo, consumo, memoria_vram_gb, pcie)
             VALUES (:id, :tipo, :consumo, :vram, :pcie)'
        );
        $stmt->execute([
            'id' => $id, 'tipo' => $producto['tipo'], 'consumo' => $producto['consumo'],
            'vram' => $producto['memoria_vram_gb'], 'pcie' => $producto['pcie'],
        ]);
    } elseif ($producto['tipo'] === 'GABINETE') {
        $stmt = $pdo->prepare(
            'INSERT INTO gabinete (id_componente, tipo) VALUES (:id, :tipo)'
        );
        $stmt->execute(['id' => $id, 'tipo' => $producto['tipo']]);
        $formato = $pdo->prepare(
            'INSERT INTO gabinete_formato (id_componente, formato)
             VALUES (:id_componente, :formato)'
        );
        foreach ($producto['formatos'] as $valor) {
            $formato->execute(['id_componente' => $id, 'formato' => $valor]);
        }
    }
}

function guardarComponentesPC(PDO $pdo, int $idPc, array $componentes): void
{
    $validar = $pdo->prepare(
        "SELECT id_producto
           FROM producto
          WHERE id_producto = :id_producto
            AND tipo IN ('PROCESADOR', 'MEMORIA_RAM', 'TARJETA_MADRE',
                         'FUENTE_PODER', 'PLACA_VIDEO', 'GABINETE')"
    );
    $insertar = $pdo->prepare(
        'INSERT INTO pc_componente (id_pc, id_componente, cantidad)
         VALUES (:id_pc, :id_componente, :cantidad)'
    );

    foreach ($componentes as $componente) {
        $validar->execute(['id_producto' => $componente['id']]);
        if ($validar->fetch() === false) {
            throw new InvalidArgumentException('La PC solo puede incluir componentes existentes.');
        }
        $insertar->execute([
            'id_pc' => $idPc,
            'id_componente' => $componente['id'],
            'cantidad' => $componente['cantidad'],
        ]);
    }
}

function actualizarProducto(PDO $pdo, int $idAdmin, int $id, array $datos, ?string $imagenNueva = null): ?string
{
    $stmt = $pdo->prepare('SELECT tipo, imagen FROM producto WHERE id_producto = :id_producto');
    $stmt->execute(['id_producto' => $id]);
    $existente = $stmt->fetch();
    if (!$existente) {
        throw new OutOfBoundsException('No se encontró el producto.');
    }

    $producto = validarProducto($datos, $existente['tipo']);
    $pdo->beginTransaction();

    try {
        $actualizar = $pdo->prepare(
            'CALL sp_actualizar_producto(:id_admin, :id_producto, :precio, :stock)'
        );
        $actualizar->execute([
            'id_admin' => $idAdmin,
            'id_producto' => $id,
            'precio' => $producto['precio'],
            'stock' => $producto['stock'],
        ]);
        $actualizar->closeCursor();

        if ($existente['tipo'] === 'PC_ARMADA') {
            $actualizarNombre = $pdo->prepare(
                'UPDATE pc_armada
                    SET nombre = :nombre, fecha_armado = :fecha_armado
                  WHERE id_pc = :id_pc'
            );
            $actualizarNombre->execute([
                'nombre' => $producto['nombre'],
                'fecha_armado' => $producto['fecha_armado'],
                'id_pc' => $id,
            ]);
        } elseif (isset($producto['marca'], $producto['modelo'])) {
            $actualizarComponente = $pdo->prepare(
                'UPDATE componente
                    SET marca = :marca, modelo = :modelo
                  WHERE id_componente = :id_componente'
            );
            $actualizarComponente->execute([
                'marca' => $producto['marca'],
                'modelo' => $producto['modelo'],
                'id_componente' => $id,
            ]);
        }

        if ($imagenNueva !== null) {
            $actualizarImagen = $pdo->prepare(
                'UPDATE producto SET imagen = :imagen WHERE id_producto = :id_producto'
            );
            $actualizarImagen->execute([
                'imagen' => $imagenNueva,
                'id_producto' => $id,
            ]);
        }

        $limpiarAdmin = $pdo->prepare('SET @id_admin = NULL');
        $limpiarAdmin->execute();
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $limpiarAdmin = $pdo->prepare('SET @id_admin = NULL');
        $limpiarAdmin->execute();
        throw $error;
    }

    return $existente['imagen'];
}

function eliminarProducto(PDO $pdo, int $id): ?string
{
    $stmt = $pdo->prepare('SELECT tipo, imagen FROM producto WHERE id_producto = :id_producto');
    $stmt->execute(['id_producto' => $id]);
    $existente = $stmt->fetch();
    if (!$existente) {
        throw new OutOfBoundsException('No se encontró el producto.');
    }

    $pdo->beginTransaction();
    try {
        if ($existente['tipo'] === 'PC_ARMADA') {
            $borrarPartes = $pdo->prepare('DELETE FROM pc_componente WHERE id_pc = :id_pc');
            $borrarPartes->execute(['id_pc' => $id]);
            $borrarSubtipo = $pdo->prepare('DELETE FROM pc_armada WHERE id_pc = :id_pc');
            $borrarSubtipo->execute(['id_pc' => $id]);
        } else {
            $enUso = $pdo->prepare(
                'SELECT 1 FROM pc_componente WHERE id_componente = :id_componente LIMIT 1'
            );
            $enUso->execute(['id_componente' => $id]);
            if ($enUso->fetch() !== false) {
                throw new DomainException('No se puede eliminar un componente incluido en una PC armada.');
            }
            borrarSubtipoComponente($pdo, $id, $existente['tipo']);
            $borrarComponente = $pdo->prepare(
                'DELETE FROM componente WHERE id_componente = :id_componente'
            );
            $borrarComponente->execute(['id_componente' => $id]);
        }

        $borrarProducto = $pdo->prepare(
            'DELETE FROM producto WHERE id_producto = :id_producto'
        );
        $borrarProducto->execute(['id_producto' => $id]);
        $pdo->commit();
        return $existente['imagen'];
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function borrarSubtipoComponente(PDO $pdo, int $id, string $tipo): void
{
    if ($tipo === 'PROCESADOR') {
        $stmt = $pdo->prepare('DELETE FROM procesador WHERE id_componente = :id');
    } elseif ($tipo === 'MEMORIA_RAM') {
        $stmt = $pdo->prepare('DELETE FROM memoria_ram WHERE id_componente = :id');
    } elseif ($tipo === 'TARJETA_MADRE') {
        $stmt = $pdo->prepare('DELETE FROM tarjeta_madre WHERE id_componente = :id');
    } elseif ($tipo === 'FUENTE_PODER') {
        $stmt = $pdo->prepare('DELETE FROM fuente_de_poder WHERE id_componente = :id');
    } elseif ($tipo === 'PLACA_VIDEO') {
        $stmt = $pdo->prepare('DELETE FROM placa_de_video WHERE id_componente = :id');
    } else {
        $stmt = $pdo->prepare('DELETE FROM gabinete WHERE id_componente = :id');
    }
    $stmt->execute(['id' => $id]);
}
