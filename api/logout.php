<?php
require_once __DIR__ . '/../config/seguridad.php';

cerrarSesion();
header('Location: ../vistas/login.php');
exit();
?>
