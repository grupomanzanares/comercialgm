<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pantalla Café</title>
    <link rel="stylesheet" href="../css/pantalla.css">
</head>
<body>
    <div id="pantalla-container">
        <div id="contenido-actual"></div>
        <div class="loading">
            <div class="spinner"></div>
            <p>Cargando contenido...</p>
        </div>
    </div>
    
    <script src="../js/pantalla.js"></script>
    <script>
        // Inicializar pantalla de café
        const pantalla = new PantallaDigital('cafe');
        pantalla.iniciar();
    </script>
</body>
</html>
