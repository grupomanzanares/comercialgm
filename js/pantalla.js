// Clase para gestionar la pantalla digital
class PantallaDigital {
    constructor(tipo) {
        this.tipo = tipo;
        this.contenido = [];
        this.indiceActual = 0;
        this.intervalo = null;
        this.container = document.getElementById('contenido-actual');
        this.loading = document.querySelector('.loading');
        this.cursorTimeout = null;
    }
    
    async iniciar() {
        console.log(`Iniciando pantalla ${this.tipo}...`);
        
        // Mostrar overlay de inicio para permitir autoplay
        this.mostrarOverlayInicio();
        
        // Ocultar cursor después de 3 segundos de inactividad
        this.configurarCursor();
        
        // Cargar contenido inicial
        await this.cargarContenido();
        
        // Actualizar contenido cada 5 minutos
        setInterval(() => {
            this.cargarContenido(false);
        }, 300000); // 5 minutos
    }
    
    mostrarOverlayInicio() {
        const overlay = document.createElement('div');
        overlay.id = 'overlay-inicio';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            cursor: pointer;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <div style="font-size: 80px; margin-bottom: 20px;">▶️</div>
                <h2 style="font-size: 36px; margin-bottom: 15px;">Toca para iniciar</h2>
                <p style="font-size: 20px; color: #ccc;">Pantalla ${this.tipo === 'carnes' ? 'Carnes' : 'Café'}</p>
            </div>
        `;
        
        overlay.addEventListener('click', () => {
            overlay.remove();
            
            // Mostrar primer contenido después de la interacción
            if (this.contenido.length > 0) {
                this.mostrarContenido();
            } else {
                this.mostrarMensajeSinContenido();
            }
        });
        
        document.body.appendChild(overlay);
    }
    
    async cargarContenido(mostrarLoading = true) {
        console.log('Cargando contenido...');
        
        if (mostrarLoading) {
            this.loading.classList.remove('hidden');
        }
        
        try {
            const response = await fetch(`../api/obtener_contenido.php?tipo=${this.tipo}&t=${Date.now()}`);
            const data = await response.json();
            
            if (data.success && data.contenido.length > 0) {
                this.contenido = data.contenido;
                console.log(`Contenido cargado: ${this.contenido.length} items`);
                
                if (mostrarLoading) {
                    this.loading.classList.add('hidden');
                }
                
                return true;
            } else {
                console.log('No hay contenido disponible');
                this.contenido = [];
                return false;
            }
        } catch (error) {
            console.error('Error al cargar contenido:', error);
            return false;
        }
    }
    
    mostrarContenido() {
        if (this.contenido.length === 0) {
            this.mostrarMensajeSinContenido();
            return;
        }
        
        // Limpiar intervalo anterior si existe
        if (this.intervalo) {
            clearInterval(this.intervalo);
        }
        
        // Mostrar contenido actual
        this.renderizarContenido(this.contenido[this.indiceActual]);
        
        // Si es imagen, programar siguiente
        const contenidoActual = this.contenido[this.indiceActual];
        if (contenidoActual.contenido_tipo === 'imagen') {
            const duracion = parseInt(contenidoActual.duracion) * 1000;
            
            setTimeout(() => {
                this.siguiente();
            }, duracion);
        }
    }
    
    renderizarContenido(item) {
        console.log(`Mostrando: ${item.contenido_tipo} - ${item.url}`);
        
        // Limpiar contenedor con transición
        this.container.classList.add('fade-out');
        
        setTimeout(() => {
            this.container.innerHTML = '';
            this.container.classList.remove('fade-out');
            
            if (item.contenido_tipo === 'imagen') {
                this.mostrarImagen(item);
            } else if (item.contenido_tipo === 'youtube') {
                this.mostrarYouTube(item);
            }
        }, 500);
    }
    
    mostrarImagen(item) {
        const div = document.createElement('div');
        div.className = 'contenido-imagen';
        
        const img = document.createElement('img');
        img.src = `../${item.url}`;
        img.alt = 'Contenido';
        
        // Precargar imagen
        img.onload = () => {
            console.log('Imagen cargada correctamente');
        };
        
        img.onerror = () => {
            console.error('Error al cargar imagen');
            this.siguiente();
        };
        
        div.appendChild(img);
        this.container.appendChild(div);
    }
    
    mostrarYouTube(item) {
        const div = document.createElement('div');
        div.className = 'contenido-youtube';
        
        // Crear contenedor para el iframe
        const iframeContainer = document.createElement('div');
        iframeContainer.style.width = '100%';
        iframeContainer.style.height = '100%';
        iframeContainer.style.position = 'relative';
        
        const iframe = document.createElement('iframe');
        iframe.src = item.url;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('mozallowfullscreen', '');
        iframe.setAttribute('webkitallowfullscreen', '');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Intentar forzar la reproducción mediante interacción simulada
        iframe.onload = () => {
            console.log('Video cargado');
            
            // Simular click en el iframe después de cargarlo
            setTimeout(() => {
                try {
                    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                } catch(e) {
                    console.log('No se pudo controlar el video via postMessage');
                }
            }, 1000);
            
            // Rotar después de 5 minutos
            setTimeout(() => {
                this.siguiente();
            }, 300000);
        };
        
        iframeContainer.appendChild(iframe);
        div.appendChild(iframeContainer);
        this.container.appendChild(div);
    }
    
    siguiente() {
        this.indiceActual++;
        
        if (this.indiceActual >= this.contenido.length) {
            this.indiceActual = 0;
            
            // Recargar contenido al completar ciclo
            this.cargarContenido(false).then(() => {
                this.mostrarContenido();
            });
        } else {
            this.mostrarContenido();
        }
    }
    
    mostrarMensajeSinContenido() {
        this.container.innerHTML = `
            <div style="text-align: center; color: white; padding: 40px;">
                <h1 style="font-size: 48px; margin-bottom: 20px;">📺</h1>
                <h2 style="font-size: 32px; margin-bottom: 10px;">Pantalla ${this.tipo === 'carnes' ? 'Carnes' : 'Café'}</h2>
                <p style="font-size: 24px; color: #999;">No hay contenido para mostrar</p>
                <p style="font-size: 18px; color: #666; margin-top: 20px;">Agrega imágenes o videos desde el panel de administración</p>
            </div>
        `;
        
        // Reintentar en 30 segundos
        setTimeout(() => {
            this.cargarContenido().then(success => {
                if (success) {
                    this.mostrarContenido();
                } else {
                    this.mostrarMensajeSinContenido();
                }
            });
        }, 30000);
    }
    
    configurarCursor() {
        // Ocultar cursor después de 3 segundos de inactividad
        document.addEventListener('mousemove', () => {
            document.body.classList.remove('hide-cursor');
            
            if (this.cursorTimeout) {
                clearTimeout(this.cursorTimeout);
            }
            
            this.cursorTimeout = setTimeout(() => {
                document.body.classList.add('hide-cursor');
            }, 3000);
        });
        
        // Ocultar inmediatamente al inicio
        setTimeout(() => {
            document.body.classList.add('hide-cursor');
        }, 3000);
    }
}

// Función auxiliar para extraer ID de YouTube (si se necesita)
function extraerIdYouTube(url) {
    const match = url.match(/(?:embed\/|v=|\/v\/|youtu\.be\/|\/videos\/|embed\/|watch\?v=|&v=)([^#&?\/]{11})/);
    return match ? match[1] : '';
}

// Manejo de errores global
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
});

// Prevenir que la pantalla se apague
if ('wakeLock' in navigator) {
    let wakeLock = null;
    
    async function requestWakeLock() {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock activado');
            
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock liberado');
            });
        } catch (err) {
            console.error('Error al activar Wake Lock:', err);
        }
    }
    
    requestWakeLock();
    
    // Reactivar al volver a la página
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            await requestWakeLock();
        }
    });
}
