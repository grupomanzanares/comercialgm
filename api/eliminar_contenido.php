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

// Obtener JSON del body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Verificar token CSRF
if (!isset($data['csrf_token']) || !verificarToken($data['csrf_token'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'mensaje' => 'Token inválido']);
    exit();
}

$id = intval($data['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'mensaje' => 'ID inválido']);
    exit();
}

try {
    if (eliminarContenido($id)) {
        echo json_encode([
            'success' => true,
            'mensaje' => 'Contenido eliminado exitosamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al eliminar contenido'
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
