<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/seguridad.php';
require_once __DIR__ . '/../includes/funciones.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit();
}

// Verificar token CSRF
if (!isset($_POST['csrf_token']) || !verificarToken($_POST['csrf_token'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'mensaje' => 'Token inválido']);
    exit();
}

$usuario = limpiarInput($_POST['usuario'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($usuario) || empty($password)) {
    echo json_encode(['success' => false, 'mensaje' => 'Usuario y contraseña requeridos']);
    exit();
}

// Validar usuario
$user = validarUsuario($usuario, $password);

if ($user) {
    // Regenerar ID de sesión por seguridad
    session_regenerate_id(true);
    
    // Guardar datos en sesión
    $_SESSION['usuario_id'] = $user['id'];
    $_SESSION['usuario_nombre'] = $user['nombre'];
    $_SESSION['ultimo_acceso'] = time();
    
    echo json_encode([
        'success' => true,
        'mensaje' => 'Inicio de sesión exitoso'
    ]);
} else {
    // Pequeña demora para prevenir ataques de fuerza bruta
    sleep(1);
    
    echo json_encode([
        'success' => false,
        'mensaje' => 'Usuario o contraseña incorrectos'
    ]);
}
?>
