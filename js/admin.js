// Variables globales
let contenidoActual = [];
let tipoActual = 'carnes';
let draggedElement = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarTabs();
    cargarContenido('carnes');
    
    // Manejar formulario de contenido
    document.getElementById('formContenido').addEventListener('submit', guardarContenido);
});

// Gestión de tabs
function inicializarTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tipo = this.dataset.tab;
            
            // Actualizar botones
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar contenido
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById('tab-' + tipo).classList.add('active');
            
            // Cargar contenido del tipo
            tipoActual = tipo;
            cargarContenido(tipo);
        });
    });
}

// Cargar contenido
async function cargarContenido(tipo) {
    const lista = document.getElementById('lista-' + tipo);
    lista.innerHTML = '<p class="cargando">Cargando contenido...</p>';
    
    try {
        const response = await fetch(`../api/obtener_contenido.php?tipo=${tipo}`);
        const data = await response.json();
        
        if (data.success) {
            contenidoActual = data.contenido;
            renderizarContenido(tipo, data.contenido);
        } else {
            lista.innerHTML = '<p class="cargando">Error al cargar contenido</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        lista.innerHTML = '<p class="cargando">Error de conexión</p>';
    }
}

// Renderizar contenido
function renderizarContenido(tipo, contenido) {
    const lista = document.getElementById('lista-' + tipo);
    
    if (contenido.length === 0) {
        lista.innerHTML = '<p class="cargando">No hay contenido agregado. Agrega imágenes o videos de YouTube.</p>';
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'contenido-grid';
    
    contenido.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'contenido-item';
        itemDiv.draggable = true;
        itemDiv.dataset.id = item.id;
        itemDiv.dataset.index = index;
        
        // Preview
        let preview = '';
        if (item.contenido_tipo === 'imagen') {
            preview = `<img src="../${item.url}" alt="Imagen">`;
        } else {
            const videoId = extraerIdYouTube(item.url);
            preview = `<img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" alt="Video YouTube">`;
        }
        
        itemDiv.innerHTML = `
            <div class="item-preview">
                ${preview}
            </div>
            <div class="item-info">
                <span class="item-tipo">${item.contenido_tipo === 'imagen' ? '🖼️ Imagen' : '▶️ YouTube'}</span>
                ${item.contenido_tipo === 'imagen' ? `<p class="item-duracion">Duración: ${item.duracion}s</p>` : ''}
            </div>
            <div class="item-acciones">
                <button class="btn-eliminar" onclick="eliminarContenido(${item.id})">🗑️ Eliminar</button>
            </div>
        `;
        
        // Eventos de drag and drop
        itemDiv.addEventListener('dragstart', handleDragStart);
        itemDiv.addEventListener('dragend', handleDragEnd);
        itemDiv.addEventListener('dragover', handleDragOver);
        itemDiv.addEventListener('drop', handleDrop);
        
        grid.appendChild(itemDiv);
    });
    
    lista.innerHTML = '';
    lista.appendChild(grid);
}

// Drag and Drop
function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        const items = Array.from(this.parentNode.children);
        const draggedIndex = items.indexOf(draggedElement);
        const targetIndex = items.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
        
        // Actualizar orden en servidor
        actualizarOrden();
    }
    
    return false;
}

// Actualizar orden
async function actualizarOrden() {
    const items = document.querySelectorAll(`#lista-${tipoActual} .contenido-item`);
    const orden = Array.from(items).map(item => parseInt(item.dataset.id));
    
    try {
        const response = await fetch('../api/actualizar_orden.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                csrf_token: document.querySelector('input[name="csrf_token"]').value,
                items: orden
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error al actualizar orden');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Mostrar formulario
function mostrarFormulario(tipo, contenidoTipo) {
    const modal = document.getElementById('modal');
    const titulo = document.getElementById('modal-titulo');
    
    // Resetear formulario
    document.getElementById('formContenido').reset();
    document.getElementById('mensaje-form').className = 'mensaje';
    
    // Configurar tipo
    document.getElementById('form-tipo').value = tipo;
    document.getElementById('form-contenido-tipo').value = contenidoTipo;
    
    // Mostrar campos apropiados
    if (contenidoTipo === 'imagen') {
        titulo.textContent = 'Agregar Imagen';
        document.getElementById('form-imagen').style.display = 'block';
        document.getElementById('form-youtube').style.display = 'none';
        document.getElementById('input-imagen').required = true;
        document.getElementById('input-youtube').required = false;
    } else {
        titulo.textContent = 'Agregar Video de YouTube';
        document.getElementById('form-imagen').style.display = 'none';
        document.getElementById('form-youtube').style.display = 'block';
        document.getElementById('input-imagen').required = false;
        document.getElementById('input-youtube').required = true;
    }
    
    modal.classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal').classList.remove('active');
}

// Guardar contenido
async function guardarContenido(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const mensaje = document.getElementById('mensaje-form');
    const tipo = formData.get('tipo');
    
    try {
        const response = await fetch('../api/guardar_contenido.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mensaje.className = 'mensaje success';
            mensaje.textContent = data.mensaje;
            
            setTimeout(() => {
                cerrarModal();
                cargarContenido(tipo);
            }, 1000);
        } else {
            mensaje.className = 'mensaje error';
            mensaje.textContent = data.mensaje;
        }
    } catch (error) {
        mensaje.className = 'mensaje error';
        mensaje.textContent = 'Error de conexión';
    }
}

// Eliminar contenido
async function eliminarContenido(id) {
    if (!confirm('¿Estás seguro de eliminar este contenido?')) {
        return;
    }
    
    try {
        const response = await fetch('../api/eliminar_contenido.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                csrf_token: document.querySelector('input[name="csrf_token"]').value,
                id: id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            cargarContenido(tipoActual);
        } else {
            alert('Error al eliminar: ' + data.mensaje);
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

// Cerrar sesión
async function cerrarSesion() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        window.location.href = '../api/logout.php';
    }
}

// Copiar enlace
function copiarEnlace(button) {
    const input = button.previousElementSibling;
    input.select();
    document.execCommand('copy');
    
    const textoOriginal = button.textContent;
    button.textContent = '✓ Copiado!';
    button.style.background = '#28a745';
    
    setTimeout(() => {
        button.textContent = textoOriginal;
        button.style.background = '';
    }, 2000);
}

// Extraer ID de YouTube
function extraerIdYouTube(url) {
    const match = url.match(/(?:embed\/|v=|\/v\/|youtu\.be\/|\/videos\/|embed\/|watch\?v=|&v=)([^#&?\/]{11})/);
    return match ? match[1] : '';
}
