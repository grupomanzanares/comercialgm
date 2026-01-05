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
        
        // Detectar cuando se sale de pantalla completa
        this.detectarSalidaPantallaCompleta();
        
        // Ocultar cursor después de 3 segundos de inactividad
        this.configurarCursor();
        
        // Cargar contenido inicial
        await this.cargarContenido();
        
        // Actualizar contenido cada 5 minutos
        setInterval(() => {
            this.cargarContenido(false);
        }, 300000); // 5 minutos
    }
    
    detectarSalidaPantallaCompleta() {
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                this.mostrarBotonPantallaCompleta();
            } else {
                this.ocultarBotonPantallaCompleta();
            }
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            if (!document.webkitFullscreenElement) {
                this.mostrarBotonPantallaCompleta();
            } else {
                this.ocultarBotonPantallaCompleta();
            }
        });
        
        document.addEventListener('mozfullscreenchange', () => {
            if (!document.mozFullScreenElement) {
                this.mostrarBotonPantallaCompleta();
            } else {
                this.ocultarBotonPantallaCompleta();
            }
        });
    }
    
    mostrarBotonPantallaCompleta() {
        // Evitar crear múltiples botones
        if (document.getElementById('btn-fullscreen')) return;
        
        const button = document.createElement('button');
        button.id = 'btn-fullscreen';
        button.innerHTML = '⛶ Pantalla Completa';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 30px;
            background: rgba(102, 126, 234, 0.95);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.3s;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(102, 126, 234, 1)';
            button.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(102, 126, 234, 0.95)';
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', async () => {
            await this.activarPantallaCompleta();
        });
        
        document.body.appendChild(button);
    }
    
    ocultarBotonPantallaCompleta() {
        const button = document.getElementById('btn-fullscreen');
        if (button) {
            button.remove();
        }
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
                <p style="font-size: 16px; color: #999; margin-top: 10px;">Se activará pantalla completa automáticamente</p>
            </div>
        `;
        
        overlay.addEventListener('click', async () => {
            overlay.remove();
            
            // Activar pantalla completa
            await this.activarPantallaCompleta();
            
            // Mostrar primer contenido después de la interacción
            if (this.contenido.length > 0) {
                this.mostrarContenido();
            } else {
                this.mostrarMensajeSinContenido();
            }
        });
        
        document.body.appendChild(overlay);
    }
    
    async activarPantallaCompleta() {
        try {
            const elem = document.documentElement;
            
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) { // Safari
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { // IE11
                await elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) { // Firefox
                await elem.mozRequestFullScreen();
            }
            
            console.log('Pantalla completa activada');
        } catch (error) {
            console.log('No se pudo activar pantalla completa:', error);
            // No es crítico, continuar de todos modos
        }
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
                const contenidoAnterior = this.contenido.length;
                this.contenido = data.contenido;
                console.log(`Contenido cargado: ${this.contenido.length} items`);
                
                // Si el índice actual es mayor que el nuevo contenido, reiniciar
                if (this.indiceActual >= this.contenido.length) {
                    this.indiceActual = 0;
                }
                
                if (mostrarLoading) {
                    this.loading.classList.add('hidden');
                }
                
                return true;
            } else {
                console.log('No hay contenido disponible');
                if (this.contenido.length === 0) {
                    this.contenido = [];
                }
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
        
        // Generar ID único para el iframe
        const iframeId = 'youtube-player-' + Date.now();
        
        const iframe = document.createElement('iframe');
        iframe.id = iframeId;
        iframe.src = item.url + '&origin=' + window.location.origin;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('mozallowfullscreen', '');
        iframe.setAttribute('webkitallowfullscreen', '');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Variable para controlar si ya avanzamos
        let yaAvanzo = false;
        
        // Función para avanzar (solo una vez)
        const avanzarSiguiente = () => {
            if (!yaAvanzo) {
                yaAvanzo = true;
                console.log('Video terminado, avanzando al siguiente contenido...');
                this.siguiente();
            }
        };
        
        iframe.onload = () => {
            console.log('Video de YouTube cargado');
            
            // Método 1: Listener global para mensajes de YouTube (el más confiable)
            const messageHandler = (event) => {
                if (event.origin !== 'https://www.youtube.com') return;
                
                try {
                    let data;
                    if (typeof event.data === 'string') {
                        data = JSON.parse(event.data);
                    } else {
                        data = event.data;
                    }
                    
                    // YouTube envía playerState en el objeto info
                    // Estado 0 = video terminado
                    // Estado 1 = reproduciendo
                    // Estado 2 = pausado
                    if (data.event === 'onStateChange' && data.info === 0) {
                        console.log('YouTube API: Video terminado (state 0)');
                        window.removeEventListener('message', messageHandler);
                        avanzarSiguiente();
                    } else if (data.info && data.info.playerState === 0) {
                        console.log('YouTube API: Video terminado (playerState 0)');
                        window.removeEventListener('message', messageHandler);
                        avanzarSiguiente();
                    }
                } catch (e) {
                    // Ignorar errores de parsing
                }
            };
            
            window.addEventListener('message', messageHandler);
            
            // Método 2: Comando para iniciar reproducción
            setTimeout(() => {
                try {
                    iframe.contentWindow.postMessage('{"event":"listening","id":"' + iframeId + '"}', '*');
                    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                } catch(e) {
                    console.log('No se pudo enviar comando al video');
                }
            }, 1000);
            
            // Método 3: Timeout de seguridad (fallback)
            // Si después de 10 minutos no ha avanzado, forzar avance
            setTimeout(() => {
                console.log('Timeout de seguridad: 10 minutos alcanzados');
                window.removeEventListener('message', messageHandler);
                avanzarSiguiente();
            }, 600000); // 10 minutos
        };
        
        iframeContainer.appendChild(iframe);
        div.appendChild(iframeContainer);
        this.container.appendChild(div);
    }
    
    siguiente() {
        console.log(`Avanzando al siguiente contenido. Índice actual: ${this.indiceActual}`);
        
        this.indiceActual++;
        
        // Si llegamos al final, volver al inicio
        if (this.indiceActual >= this.contenido.length) {
            console.log('Fin del contenido, reiniciando desde el principio');
            this.indiceActual = 0;
        }
        
        console.log(`Nuevo índice: ${this.indiceActual}`);
        
        // Mostrar el siguiente contenido
        this.mostrarContenido();
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
