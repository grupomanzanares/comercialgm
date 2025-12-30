<?php
require_once __DIR__ . '/../config/seguridad.php';
require_once __DIR__ . '/../includes/funciones.php';

// Verificar sesión
if (!verificarSesion()) {
    header('Location: login.php');
    exit();
}

$token = generarToken();
$usuario_nombre = $_SESSION['usuario_nombre'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Gestión Comercial</title>
    <link rel="stylesheet" href="../css/admin.css">
</head>
<body>
    <div class="admin-container">
        <!-- Header -->
        <header class="admin-header">
            <div class="header-content">
                <h1>📺 Gestión de Pantallas Digitales</h1>
                <div class="user-info">
                    <span>👤 <?php echo htmlspecialchars($usuario_nombre); ?></span>
                    <button onclick="cerrarSesion()" class="btn-logout">Cerrar Sesión</button>
                </div>
            </div>
        </header>
        
        <!-- Tabs -->
        <div class="tabs">
            <button class="tab-btn active" data-tab="carnes">🥩 Carnes</button>
            <button class="tab-btn" data-tab="cafe">☕ Café</button>
        </div>
        
        <!-- Contenido de Carnes -->
        <div id="tab-carnes" class="tab-content active">
            <div class="section-header">
                <h2>Gestión de Contenido - Carnes</h2>
                <div class="section-actions">
                    <button onclick="mostrarFormulario('carnes', 'imagen')" class="btn-primary">+ Agregar Imagen</button>
                    <button onclick="mostrarFormulario('carnes', 'youtube')" class="btn-primary">+ Agregar Video YouTube</button>
                </div>
            </div>
            
            <div id="lista-carnes" class="contenido-lista">
                <p class="cargando">Cargando contenido...</p>
            </div>
        </div>
        
        <!-- Contenido de Café -->
        <div id="tab-cafe" class="tab-content">
            <div class="section-header">
                <h2>Gestión de Contenido - Café</h2>
                <div class="section-actions">
                    <button onclick="mostrarFormulario('cafe', 'imagen')" class="btn-primary">+ Agregar Imagen</button>
                    <button onclick="mostrarFormulario('cafe', 'youtube')" class="btn-primary">+ Agregar Video YouTube</button>
                </div>
            </div>
            
            <div id="lista-cafe" class="contenido-lista">
                <p class="cargando">Cargando contenido...</p>
            </div>
        </div>
        
        <!-- Enlaces a vistas de pantalla -->
        <div class="enlaces-pantallas">
            <h3>Enlaces para Televisores:</h3>
            <div class="enlaces-grid">
                <div class="enlace-card">
                    <h4>🥩 Pantalla Carnes</h4>
                    <input type="text" readonly value="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/pantalla_carnes.php'; ?>" class="enlace-input">
                    <button onclick="copiarEnlace(this)" class="btn-copiar">Copiar Enlace</button>
                </div>
                <div class="enlace-card">
                    <h4>☕ Pantalla Café</h4>
                    <input type="text" readonly value="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/pantalla_cafe.php'; ?>" class="enlace-input">
                    <button onclick="copiarEnlace(this)" class="btn-copiar">Copiar Enlace</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal para agregar contenido -->
    <div id="modal" class="modal">
        <div class="modal-content">
            <span class="modal-close" onclick="cerrarModal()">&times;</span>
            <h2 id="modal-titulo">Agregar Contenido</h2>
            
            <form id="formContenido" enctype="multipart/form-data">
                <input type="hidden" name="csrf_token" value="<?php echo $token; ?>">
                <input type="hidden" name="tipo" id="form-tipo">
                <input type="hidden" name="contenido_tipo" id="form-contenido-tipo">
                
                <!-- Formulario para imagen -->
                <div id="form-imagen" style="display:none;">
                    <div class="form-group">
                        <label>Seleccionar Imagen:</label>
                        <input type="file" name="imagen" id="input-imagen" accept="image/*">
                        <p class="form-hint">Formatos: JPG, PNG, GIF, WEBP (Máx. 10MB)</p>
                    </div>
                    
                    <div class="form-group">
                        <label>Duración (segundos):</label>
                        <input type="number" name="duracion" id="duracion-imagen" value="10" min="1" max="60">
                        <p class="form-hint">Tiempo que se mostrará la imagen en pantalla</p>
                    </div>
                </div>
                
                <!-- Formulario para YouTube -->
                <div id="form-youtube" style="display:none;">
                    <div class="form-group">
                        <label>URL de YouTube:</label>
                        <input type="url" name="youtube_url" id="input-youtube" placeholder="https://www.youtube.com/watch?v=...">
                        <p class="form-hint">Ejemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
                    </div>
                </div>
                
                <div id="mensaje-form" class="mensaje"></div>
                
                <div class="form-buttons">
                    <button type="button" onclick="cerrarModal()" class="btn-secondary">Cancelar</button>
                    <button type="submit" class="btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="../js/admin.js"></script>
</body>
</html>
