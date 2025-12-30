<?php
require_once __DIR__ . '/../config/database.php';

// Función para validar usuario
function validarUsuario($usuario, $password) {
    $db = Database::getInstance()->getConnection();
    
    $sql = "SELECT id, usuario, password, nombre FROM usuarios WHERE usuario = :usuario AND activo = 1";
    $stmt = $db->prepare($sql);
    $stmt->execute(['usuario' => $usuario]);
    
    $user = $stmt->fetch();
    
    if ($user && verificarPassword($password, $user['password'])) {
        return [
            'id' => $user['id'],
            'usuario' => $user['usuario'],
            'nombre' => $user['nombre']
        ];
    }
    
    return false;
}

// Función para obtener contenido por tipo
function obtenerContenido($tipo) {
    $db = Database::getInstance()->getConnection();
    
    $sql = "SELECT * FROM contenido WHERE tipo = :tipo AND activo = 1 ORDER BY orden ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute(['tipo' => $tipo]);
    
    return $stmt->fetchAll();
}

// Función para guardar contenido
function guardarContenido($tipo, $contenido_tipo, $url, $duracion) {
    $db = Database::getInstance()->getConnection();
    
    // Obtener el último orden
    $sql = "SELECT MAX(orden) as max_orden FROM contenido WHERE tipo = :tipo";
    $stmt = $db->prepare($sql);
    $stmt->execute(['tipo' => $tipo]);
    $result = $stmt->fetch();
    $nuevo_orden = ($result['max_orden'] ?? 0) + 1;
    
    $sql = "INSERT INTO contenido (tipo, contenido_tipo, url, duracion, orden, activo, fecha_creacion) 
            VALUES (:tipo, :contenido_tipo, :url, :duracion, :orden, 1, NOW())";
    
    $stmt = $db->prepare($sql);
    return $stmt->execute([
        'tipo' => $tipo,
        'contenido_tipo' => $contenido_tipo,
        'url' => $url,
        'duracion' => $duracion,
        'orden' => $nuevo_orden
    ]);
}

// Función para eliminar contenido
function eliminarContenido($id) {
    $db = Database::getInstance()->getConnection();
    
    // Obtener información del contenido antes de eliminar
    $sql = "SELECT tipo, contenido_tipo, url FROM contenido WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute(['id' => $id]);
    $contenido = $stmt->fetch();
    
    if (!$contenido) {
        return false;
    }
    
    // Si es imagen, eliminar archivo físico
    if ($contenido['contenido_tipo'] === 'imagen' && file_exists(__DIR__ . '/../' . $contenido['url'])) {
        unlink(__DIR__ . '/../' . $contenido['url']);
    }
    
    // Eliminar de la base de datos
    $sql = "DELETE FROM contenido WHERE id = :id";
    $stmt = $db->prepare($sql);
    return $stmt->execute(['id' => $id]);
}

// Función para actualizar orden
function actualizarOrden($items) {
    $db = Database::getInstance()->getConnection();
    
    try {
        $db->beginTransaction();
        
        $sql = "UPDATE contenido SET orden = :orden WHERE id = :id";
        $stmt = $db->prepare($sql);
        
        foreach ($items as $index => $id) {
            $stmt->execute([
                'orden' => $index + 1,
                'id' => $id
            ]);
        }
        
        $db->commit();
        return true;
    } catch (Exception $e) {
        $db->rollBack();
        return false;
    }
}

// Función para subir imagen
function subirImagen($archivo, $tipo) {
    $directorio = __DIR__ . '/../imagenes/' . $tipo . '/';
    
    // Crear directorio si no existe
    if (!is_dir($directorio)) {
        mkdir($directorio, 0755, true);
    }
    
    // Validar tipo de archivo
    $extensiones_permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
    
    if (!in_array($extension, $extensiones_permitidas)) {
        return ['error' => 'Tipo de archivo no permitido'];
    }
    
    // Validar tamaño (máximo 10MB)
    if ($archivo['size'] > 10485760) {
        return ['error' => 'El archivo es demasiado grande (máximo 10MB)'];
    }
    
    // Generar nombre único
    $nombre_archivo = uniqid() . '_' . time() . '.' . $extension;
    $ruta_completa = $directorio . $nombre_archivo;
    
    // Mover archivo
    if (move_uploaded_file($archivo['tmp_name'], $ruta_completa)) {
        return [
            'success' => true,
            'url' => 'imagenes/' . $tipo . '/' . $nombre_archivo
        ];
    }
    
    return ['error' => 'Error al subir el archivo'];
}

// Función para extraer ID de video de YouTube
function extraerIdYouTube($url) {
    $patron = '/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i';
    if (preg_match($patron, $url, $coincidencias)) {
        return $coincidencias[1];
    }
    return false;
}

// Función para validar URL de YouTube
function validarUrlYouTube($url) {
    return extraerIdYouTube($url) !== false;
}
?>
