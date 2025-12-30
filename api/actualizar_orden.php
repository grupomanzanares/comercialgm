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

$items = $data['items'] ?? [];

if (!is_array($items) || empty($items)) {
    echo json_encode(['success' => false, 'mensaje' => 'Datos inválidos']);
    exit();
}

try {
    if (actualizarOrden($items)) {
        echo json_encode([
            'success' => true,
            'mensaje' => 'Orden actualizado exitosamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al actualizar orden'
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
