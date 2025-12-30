<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/seguridad.php';
require_once __DIR__ . '/../includes/funciones.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit();
}

$tipo = $_GET['tipo'] ?? '';

if (!in_array($tipo, ['carnes', 'cafe'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'mensaje' => 'Tipo inválido']);
    exit();
}

try {
    $contenido = obtenerContenido($tipo);
    
    echo json_encode([
        'success' => true,
        'contenido' => $contenido
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error al obtener contenido'
    ]);
}
?>
