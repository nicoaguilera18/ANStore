<?php

function consultarPortada(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT titulo, subtitulo, texto_alternativo, imagen
           FROM configuracion_portada
          WHERE id = 1'
    );
    $portada = $stmt->fetch();
    if ($portada === false) {
        throw new RuntimeException('No se encontró la configuración de portada.');
    }

    return $portada;
}

function actualizarPortada(
    PDO $pdo,
    string $titulo,
    string $subtitulo,
    string $textoAlternativo,
    bool $actualizarImagen,
    ?string $imagen
): ?string {
    $pdo->beginTransaction();

    try {
        $consulta = $pdo->query(
            'SELECT imagen
               FROM configuracion_portada
              WHERE id = 1
              FOR UPDATE'
        );
        $imagenAnterior = $consulta->fetchColumn();
        if ($imagenAnterior === false) {
            throw new RuntimeException('No se encontró la configuración de portada.');
        }

        if ($actualizarImagen) {
            $stmt = $pdo->prepare(
                'UPDATE configuracion_portada
                    SET titulo = :titulo,
                        subtitulo = :subtitulo,
                        texto_alternativo = :texto_alternativo,
                        imagen = :imagen
                  WHERE id = 1'
            );
            $stmt->execute([
                'titulo' => $titulo,
                'subtitulo' => $subtitulo,
                'texto_alternativo' => $textoAlternativo,
                'imagen' => $imagen,
            ]);
        } else {
            $stmt = $pdo->prepare(
                'UPDATE configuracion_portada
                    SET titulo = :titulo,
                        subtitulo = :subtitulo,
                        texto_alternativo = :texto_alternativo
                  WHERE id = 1'
            );
            $stmt->execute([
                'titulo' => $titulo,
                'subtitulo' => $subtitulo,
                'texto_alternativo' => $textoAlternativo,
            ]);
        }

        $pdo->commit();
        return $imagenAnterior === null ? null : (string) $imagenAnterior;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}
