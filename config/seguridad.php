<?php
// Seguridad del sistema

// Configuración de seguridad de sesión (ANTES de session_start)
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Cambiar a 1 si usa HTTPS
ini_set('session.cookie_samesite', 'Strict');

// Iniciar sesión DESPUÉS de configurar
session_start();

// Regenerar ID de sesión periódicamente
if (!isset($_SESSION['last_regeneration'])) {
    $_SESSION['last_regeneration'] = time();
} elseif (time() - $_SESSION['last_regeneration'] > 300) {
    session_regenerate_id(true);
    $_SESSION['last_regeneration'] = time();
}

// Funciones de seguridad
function limpiarInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

function verificarSesion() {
    if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['usuario_nombre'])) {
        return false;
    }
    
    // Verificar tiempo de inactividad (30 minutos)
    if (isset($_SESSION['ultimo_acceso'])) {
        $inactivo = time() - $_SESSION['ultimo_acceso'];
        if ($inactivo > 1800) {
            cerrarSesion();
            return false;
        }
    }
    
    $_SESSION['ultimo_acceso'] = time();
    return true;
}

function cerrarSesion() {
    $_SESSION = array();
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
}

function generarToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verificarToken($token) {
    if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
        return false;
    }
    return true;
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_ARGON2ID, [
        'memory_cost' => 65536,
        'time_cost' => 4,
        'threads' => 3
    ]);
}

function verificarPassword($password, $hash) {
    return password_verify($password, $hash);
}

// Prevenir clickjacking
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Content Security Policy
$csp = "default-src 'self'; ";
$csp .= "script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; ";
$csp .= "style-src 'self' 'unsafe-inline'; ";
$csp .= "img-src 'self' data: https: http:; ";
$csp .= "frame-src https://www.youtube.com; ";
$csp .= "media-src https://www.youtube.com; ";
$csp .= "connect-src 'self' https://www.youtube.com;";
header("Content-Security-Policy: " . $csp);
?>
