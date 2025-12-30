<?php
require_once __DIR__ . '/../config/seguridad.php';

// Si ya está logueado, redirigir al admin
if (verificarSesion()) {
    header('Location: admin.php');
    exit();
}

$token = generarToken();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Gestión Comercial</title>
    <link rel="stylesheet" href="../css/admin.css">
</head>
<body class="login-body">
    <div class="login-container">
        <div class="login-box">
            <div class="login-header">
                <h1>🔐 Gestión Comercial</h1>
                <p>Panel de Administración</p>
            </div>
            
            <form id="formLogin" method="POST" action="../api/login.php">
                <input type="hidden" name="csrf_token" value="<?php echo $token; ?>">
                
                <div class="form-group">
                    <label for="usuario">Usuario</label>
                    <input type="text" id="usuario" name="usuario" required autocomplete="username">
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password">
                </div>
                
                <div id="mensaje" class="mensaje"></div>
                
                <button type="submit" class="btn-login">Iniciar Sesión</button>
            </form>
            
            <div class="login-footer">
                <p>Acceso solo para personal autorizado</p>
            </div>
        </div>
    </div>
    
    <script src="../js/admin.js"></script>
    <script>
        document.getElementById('formLogin').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const mensaje = document.getElementById('mensaje');
            
            try {
                const response = await fetch('../api/login.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mensaje.className = 'mensaje success';
                    mensaje.textContent = 'Ingresando...';
                    setTimeout(() => {
                        window.location.href = 'admin.php';
                    }, 500);
                } else {
                    mensaje.className = 'mensaje error';
                    mensaje.textContent = data.mensaje || 'Error al iniciar sesión';
                }
            } catch (error) {
                mensaje.className = 'mensaje error';
                mensaje.textContent = 'Error de conexión';
            }
        });
    </script>
</body>
</html>
