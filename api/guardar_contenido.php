<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/seguridad.php';
require_once __DIR__ . '/../includes/funciones.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit();
}

// Verificar sesión
if (!verificarSesion()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'mensaje' => 'No autorizado']);
    exit();
}

// Verificar token CSRF
if (!isset($_POST['csrf_token']) || !verificarToken($_POST['csrf_token'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'mensaje' => 'Token inválido']);
    exit();
}

$tipo = $_POST['tipo'] ?? '';
$contenido_tipo = $_POST['contenido_tipo'] ?? '';

if (!in_array($tipo, ['carnes', 'cafe'])) {
    echo json_encode(['success' => false, 'mensaje' => 'Tipo inválido']);
    exit();
}

if (!in_array($contenido_tipo, ['imagen', 'youtube'])) {
    echo json_encode(['success' => false, 'mensaje' => 'Tipo de contenido inválido']);
    exit();
}

try {
    if ($contenido_tipo === 'imagen') {
        // Subir imagen
        if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'mensaje' => 'Error al subir imagen']);
            exit();
        }
        
        $resultado = subirImagen($_FILES['imagen'], $tipo);
        
        if (isset($resultado['error'])) {
            echo json_encode(['success' => false, 'mensaje' => $resultado['error']]);
            exit();
        }
        
        $url = $resultado['url'];
        $duracion = intval($_POST['duracion'] ?? 10);
        
        if ($duracion < 1 || $duracion > 60) {
            $duracion = 10;
        }
        
    } else {
        // Video de YouTube
        $youtube_url = $_POST['youtube_url'] ?? '';
        
        if (!validarUrlYouTube($youtube_url)) {
            echo json_encode(['success' => false, 'mensaje' => 'URL de YouTube inválida']);
            exit();
        }
        
        $video_id = extraerIdYouTube($youtube_url);
        // Usar youtube.com estándar - funciona tanto en HTTP local como HTTPS internet
        // YouTube.com maneja automáticamente HTTP y HTTPS
        $url = 'https://www.youtube.com/embed/' . $video_id . 
               '?autoplay=1' .           // Reproducción automática
               '&mute=1' .                // Silenciado (requerido para autoplay)
               '&loop=1' .                // Repetir video
               '&playlist=' . $video_id . // Necesario para loop
               '&controls=0' .            // Ocultar controles
               '&showinfo=0' .            // Ocultar información
               '&modestbranding=1' .      // Minimizar branding de YouTube
               '&playsinline=1' .         // Reproducir inline en móviles
               '&enablejsapi=1' .         // Habilitar API JavaScript
               '&rel=0' .                 // No mostrar videos relacionados
               '&iv_load_policy=3' .      // Ocultar anotaciones
               '&fs=0' .                  // Deshabilitar botón fullscreen de YouTube
               '&disablekb=1';            // Deshabilitar controles de teclado
        $duracion = 0; // Los videos de YouTube controlan su propia duración
    }
    
    // Guardar en base de datos
    if (guardarContenido($tipo, $contenido_tipo, $url, $duracion)) {
        echo json_encode([
            'success' => true,
            'mensaje' => 'Contenido agregado exitosamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al guardar contenido'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error del servidor'
    ]);
}
?>
