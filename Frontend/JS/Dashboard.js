document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:4000';
    const dispositivoSelect = document.getElementById('dispositivoSelect');
    
async function cargarCatalogoDispositivos() {
  try { const editDispositivoSelect = document.getElementById('editDispositivoSelect');
    const res = await fetch(`${API_BASE_URL}/api/catalogo-dispositivos`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Select del formulario (Agregar)
    dispositivoSelect.innerHTML = '<option value=""> Selecciona Dispositivo </option>';

    // Select del modal (Editar)
    if (editDispositivoSelect) {
      editDispositivoSelect.innerHTML = '<option value=""> Selecciona Dispositivo </option>';
    }

    data.forEach(d => {
      const opt1 = document.createElement('option');
      opt1.value = d.IdDispositivo;
      opt1.textContent = d.NombreDispositivo;
      dispositivoSelect.appendChild(opt1);

      if (editDispositivoSelect) {
        const opt2 = document.createElement('option');
        opt2.value = d.IdDispositivo;
        opt2.textContent = d.NombreDispositivo;
        editDispositivoSelect.appendChild(opt2);
      }
    });
    return data;
     } catch (err) {
     console.error('Error cargando dispositivos:', err);
     dispositivoSelect.innerHTML = '<option value="">Error al cargar</option>';

     const editDispositivoSelect = document.getElementById('editDispositivoSelect');
        if (editDispositivoSelect) editDispositivoSelect.innerHTML = '<option value="">Error al cargar</option>';
        return [];
    }
}

    // LLAMA AL CARGAR LA PÁGINA
    cargarCatalogoDispositivos();

    // ==============================
    // NUEVO DISPOSITIVO (MODAL + GUARDAR)
    // ==============================
    const btnAgregarDispositivo = document.getElementById('btnAgregarDispositivo');
    const nuevoDispositivoModal = document.getElementById('nuevoDispositivoModal');
    const closeNuevoDispositivoModal = document.getElementById('closeNuevoDispositivoModal');
    const nuevoNombreDispositivo = document.getElementById('nuevoNombreDispositivo');
    const guardarNuevoDispositivoBtn = document.getElementById('guardarNuevoDispositivoBtn');

    // ==============================
    // ADMINISTRAR DISPOSITIVOS (MODAL)
    // ==============================
    const btnAdministrarDispositivos = document.getElementById('btnAdministrarDispositivos');
    btnAdministrarDispositivos?.addEventListener('click', async () => {
    adminDispositivosModal.classList.add('active');

    const data = await cargarCatalogoDispositivos(); // regresa lista
    catalogoDispositivosCache = Array.isArray(data) ? data : [];

    renderAdminDispositivos(catalogoDispositivosCache); // pinta la tabla
});

    const adminDispositivosModal = document.getElementById('adminDispositivosModal');
    const closeAdminDispositivosModal = document.getElementById('closeAdminDispositivosModal');
    const adminDispositivosTbody = document.getElementById('adminDispositivosTbody');
    const adminDispositivosSearch = document.getElementById('adminDispositivosSearch');
    const adminDispositivosRefresh = document.getElementById('adminDispositivosRefresh');

    let catalogoDispositivosCache = [];

// ==============================
// ADMIN DISPOSITIVOS: CARGAR / FILTRAR / EDITAR / ELIMINAR
// ==============================

async function cargarAdminDispositivos() {
  const data = await cargarCatalogoDispositivos();   // ya existe en tu código
  catalogoDispositivosCache = data || [];
  renderAdminDispositivos(catalogoDispositivosCache);
}

// Botón Actualizar = recargar lista
adminDispositivosRefresh?.addEventListener('click', async () => {
  await cargarAdminDispositivos();
});

// Buscar (filtra sobre el cache)
adminDispositivosSearch?.addEventListener('input', () => {
  const q = (adminDispositivosSearch.value || '').toLowerCase().trim();
  // Filtra sobre la variable global que se llena al abrir el modal
  const filtrados = catalogoDispositivosCache.filter(d =>
    (d.NombreDispositivo || '').toLowerCase().includes(q)
  );
  // pinta solo los resultados filtrados
  renderAdminDispositivos(filtrados);
});

// Delegación de eventos para botones Editar/Eliminar de la tabla
adminDispositivosTbody?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const id = parseInt(btn.dataset.id, 10);
  if (Number.isNaN(id)) return;

  // EDITAR
  if (btn.classList.contains('btn-edit-dispositivo')) {
    const actual = catalogoDispositivosCache.find(x => x.IdDispositivo === id);
    const nombreActual = actual?.NombreDispositivo || '';

    const nuevo = prompt('Nuevo nombre del dispositivo:', nombreActual);
    if (nuevo === null) return; // canceló
    const nombreNuevo = nuevo.trim();
    if (!nombreNuevo) return alert('El nombre no puede ir vacío.');

    try {
      const res = await fetch(`${API_BASE_URL}/api/catalogo-dispositivos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NombreDispositivo: nombreNuevo })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data?.message || 'No se pudo actualizar.');

      // refrescar tabla + selects
      await cargarAdminDispositivos();
      await cargarCatalogoDispositivos();
    } catch (err) {
      console.error(err);
      alert('Error de conexión al editar.');
    }
    return;
  }

  // ELIMINAR
  if (btn.classList.contains('btn-delete-dispositivo')) {
    if (!confirm('¿Eliminar este dispositivo?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/catalogo-dispositivos/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data?.message || 'No se pudo eliminar.');

      // refrescar tabla + selects
      await cargarAdminDispositivos();
      await cargarCatalogoDispositivos();
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar.');
    }
  }
});

async function refrescarTablaConFiltro() {
    // Trae los datos nuevos del servidor
    const data = await cargarCatalogoDispositivos();
    // Actualiza la lista global (el cache)
    catalogoDispositivosCache = Array.isArray(data) ? data : [];
    // Forza al buscador a que vuelva a filtrar 
    adminDispositivosSearch.dispatchEvent(new Event('input'));
}

//Listado de Dispositivos
function renderAdminDispositivos(lista) {
  adminDispositivosTbody.innerHTML = '';

  if (!lista.length) {
    adminDispositivosTbody.innerHTML = `
      <tr>
        <td colspan="2" style="text-align:center;">No hay dispositivos</td>
      </tr>`;
    return;
  }

  lista.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.NombreDispositivo}</td>
      <td class="acciones">
        <div class="acciones-wrap">
          <button class="btn-action btn-edit-dispositivo" data-id="${d.IdDispositivo}">Editar</button>
          <button class="btn-action btn-delete-dispositivo" data-id="${d.IdDispositivo}">Eliminar</button>
        </div>
      </td>
    `;
    adminDispositivosTbody.appendChild(tr);
  });
}

function abrirNuevoDispositivoModal() {
  nuevoNombreDispositivo.value = '';
  nuevoDispositivoModal.classList.add('active');
  setTimeout(() => nuevoNombreDispositivo.focus(), 50);
}

function cerrarNuevoDispositivoModal() {
  nuevoDispositivoModal.classList.remove('active');
}

if (btnAgregarDispositivo) {
  btnAgregarDispositivo.addEventListener('click', abrirNuevoDispositivoModal);
}

if (closeNuevoDispositivoModal) {
  closeNuevoDispositivoModal.addEventListener('click', cerrarNuevoDispositivoModal);
}

// Cerrar si das click fuera
window.addEventListener('click', (e) => {
  if (e.target === nuevoDispositivoModal) cerrarNuevoDispositivoModal();
});

// Enter para guardar
nuevoNombreDispositivo?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') guardarNuevoDispositivoBtn.click();
});

guardarNuevoDispositivoBtn?.addEventListener('click', async () => {
  const nombre = (nuevoNombreDispositivo.value || '').trim();
  if (!nombre) {
    alert('Escribe el nombre del dispositivo.');
    return;
  }

  try {
    guardarNuevoDispositivoBtn.disabled = true;

    const res = await fetch(`${API_BASE_URL}/api/catalogo-dispositivos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NombreDispositivo: nombre })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data?.message || 'No se pudo guardar el dispositivo.');
      return;
    }

    // Recargar combo y seleccionar el nuevo (si backend regresa IdDispositivo)
    await cargarCatalogoDispositivos();
    if (data?.IdDispositivo) {
      dispositivoSelect.value = String(data.IdDispositivo);
    }

    cerrarNuevoDispositivoModal();
  } catch (err) {
    console.error(err);
    alert('Error de conexión al guardar dispositivo.');
  } finally {
    guardarNuevoDispositivoBtn.disabled = false;
  }
});

    // ==============================
    // Usuario actual (para IdUsuario en tareas)
    // ==============================
    const userDataJson = localStorage.getItem('userData');
    let currentUserId = null;
    if (userDataJson) {
        try {
            const userData = JSON.parse(userDataJson);
            currentUserId = userData.idUsuario || null;
        } catch (e) {
            console.error('No se pudo leer userData de localStorage', e);
        }
    }

    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // ===== Inventario de Materiales =====
    const inventarioTableBody = document.getElementById('inventarioTableBody');
    const marcaMaterialInput = document.getElementById('marcaMaterial');
    const modeloMaterialInput = document.getElementById('modeloMaterial');
    const numeroSerieMaterialInput = document.getElementById('numeroSerieMaterial');
    const numeroInventarioMaterialInput = document.getElementById('numeroInventarioMaterial');
    const descripcionMaterialInput = document.getElementById('descripcionMaterial');
    const imagenMaterialInput = document.getElementById('imagenMaterial');
    const guardarMaterialBtn = document.getElementById('guardarMaterialBtn');

    const addMaterialBtn = document.getElementById('addMaterialBtn');
    
    // ===== Lista de Tareas =====
    const tareasTableBody = document.getElementById('tareasTableBody');
    const descripcionTareaInput = document.getElementById('descripcionTarea');
    const guardarTareaBtn = document.getElementById('guardarTareaBtn');
    const historialTableBody = document.getElementById('historialTableBody');

    // ===== Categorías =====
    const nombreCategoriaInput = document.getElementById('nombreCategoria');
    const guardarCategoriaBtn = document.getElementById('guardarCategoriaBtn');
    const categoriasTableBody = document.getElementById('categoriasTableBody');

    // ===== Sitios =====
    const sitioNombreInput = document.getElementById('sitioNombre');
    const sitioCategoriaSelect = document.getElementById('sitioCategoria');
    const sitioURLMapsInput = document.getElementById('sitioURLMaps');
    const sitioFechaVisitaInput = document.getElementById('sitioFechaVisita');
    const sitioActivoInput = document.getElementById('sitioActivo');
    const sitioEquipoInput = document.getElementById('sitioEquipo');
    const sitioAnchoBandaInput = document.getElementById('sitioAnchoBanda');
    const sitioSSIDPassInput = document.getElementById('sitioSSIDPass');
    const sitioContactoInput = document.getElementById('sitioContacto');
    const sitioTelefonoInput = document.getElementById('sitioTelefono');
    const guardarSitioBtn = document.getElementById('guardarSitioBtn');
    // ==============================
    // MOSTRAR / OCULTAR FORMULARIO NUEVO SITIO
    // ==============================
    const toggleNuevoSitioBtn = document.getElementById('toggleNuevoSitioBtn');
    const nuevoSitioCard = document.getElementById('nuevoSitioCard');

    toggleNuevoSitioBtn.addEventListener('click', () => {
    const oculto = nuevoSitioCard.classList.contains('oculto');

    if (oculto) {
        nuevoSitioCard.classList.remove('oculto');
        toggleNuevoSitioBtn.textContent = 'Ocultar formulario';
    } else {
        nuevoSitioCard.classList.add('oculto');
        toggleNuevoSitioBtn.textContent = '+ Nuevo sitio';
      }
    }
  );

    const sitiosTableBody = document.getElementById('sitiosTableBody');
    //Funciones Modal Material
    const editMaterialModal = document.getElementById('editMaterialModal');
    const closeMaterialModalBtn = editMaterialModal.querySelector('.close-button');
    const editMaterialIdInput = document.getElementById('editMaterialId');
    const editDescripcionMaterialInput = document.getElementById('editDescripcionMaterial');
    const updateMaterialBtn = document.getElementById('updateMaterialBtn');
    
    // ===== NUEVOS INPUTS DEL MODAL EDITAR MATERIAL =====
    const editDispositivoSelect = document.getElementById('editDispositivoSelect');
    const editMarcaMaterialInput = document.getElementById('editMarcaMaterial');
    const editModeloMaterialInput = document.getElementById('editModeloMaterial');
    const editNumeroSerieMaterialInput = document.getElementById('editNumeroSerieMaterial');
    const editNumeroInventarioMaterialInput = document.getElementById('editNumeroInventarioMaterial');
    const editImagenMaterialInput = document.getElementById('editImagenMaterial');

    const editTaskModal = document.getElementById('editTaskModal');
    const closeTaskModalBtn = editTaskModal.querySelector('.close-button');
    const editTaskIdInput = document.getElementById('editTaskId');
    const editDescripcionTareaInput = document.getElementById('editDescripcionTarea');
    const updateTaskBtn = document.getElementById('updateTaskBtn');

    // ==============================
    // MODALES NUEVOS (CATEGORÍAS / SITIOS)
    // ==============================
    const editCategoriaModal = document.getElementById('editCategoriaModal');
    const closeCategoriaModalBtn = editCategoriaModal.querySelector('.close-button');
    const editCategoriaIdInput = document.getElementById('editCategoriaId');
    const editNombreCategoriaInput = document.getElementById('editNombreCategoria');
    const updateCategoriaBtn = document.getElementById('updateCategoriaBtn');
    const editSitioModal = document.getElementById('editSitioModal');
    const closeSitioModalBtn = editSitioModal.querySelector('.close-button');
    const editSitioIdInput = document.getElementById('editSitioId');
    const editSitioNombreInput = document.getElementById('editSitioNombre');
    const editSitioCategoriaSelect = document.getElementById('editSitioCategoria');
    const editSitioURLMapsInput = document.getElementById('editSitioURLMaps');
    const editSitioFechaVisitaInput = document.getElementById('editSitioFechaVisita');
    const editSitioActivoInput = document.getElementById('editSitioActivo');
    const editSitioEquipoInput = document.getElementById('editSitioEquipo');
    const editSitioAnchoBandaInput = document.getElementById('editSitioAnchoBanda');
    const editSitioSSIDPassInput = document.getElementById('editSitioSSIDPass');
    const editSitioContactoInput = document.getElementById('editSitioContacto');
    const editSitioTelefonoInput = document.getElementById('editSitioTelefono');
    const updateSitioBtn = document.getElementById('updateSitioBtn');

    // ==============================
    // Estado de la aplicación
    // ==============================
    // Materiales desde la BD (API)
    let materiales = [];
    // Tareas e historial también desde la BD
    let tareas = [];
    let historialActividad = [];
    // Categorias desde la BD
    let categorias = [];
    // Sitios tambien desde la BD
    let sitios = [];
    // Sitios  inventario de materiales tambien desde la BD
    let sitioInventarioActual = null;

    // PERFIL - cargar datos
    function cargarPerfilUsuario() {
     const data = localStorage.getItem('userData');
     if (!data) return;

     const user = JSON.parse(data);

    document.getElementById('perfilNombre').value = user.Nombre || '';
    document.getElementById('perfilApellidoP').value = user.Apellido_P || '';
    document.getElementById('perfilApellidoM').value = user.Apellido_M || '';
    document.getElementById('perfilCorreo').value = user.Correo || '';
    document.getElementById('perfilTelefono').value = user.Telefono || '';
    }

    // Funciones para API de materiales
   async function cargarMaterialesDesdeAPI() {
  try {
    if (!sitioInventarioActual) {
      materiales = [];
      renderMateriales();
      return;
    }

    const url = `${API_BASE_URL}/api/materiales?IdSitio=${sitioInventarioActual}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar materiales');

    materiales = await res.json();
    renderMateriales();
  } catch (err) {
    console.error(err);
    alert('No se pudieron cargar los materiales.');
  }
}

    async function crearMaterialEnAPI({ nombre, descripcion, cantidad }) {
        const res = await fetch(`${API_BASE_URL}/api/materiales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion, cantidad })
        });
        if (!res.ok) throw new Error('Error al crear material');
        const nuevo = await res.json();
        materiales.unshift(nuevo);
        renderMateriales();
    }

    async function actualizarMaterialEnAPI(id, payload) {
    const res = await fetch(`${API_BASE_URL}/api/materiales/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  // si backend manda mensaje
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || 'Error al actualizar material');
  }

  // recargar desde servidor para que la tabla se actualice con JOIN y todo
  await cargarMaterialesDesdeAPI();
}

    async function eliminarMaterialEnAPI(id) {
  const res = await fetch(`${API_BASE_URL}/api/materiales/${id}`, {
    method: 'DELETE'
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Error al eliminar material');
  }

  // Siempre recargar desde backend
  await cargarMaterialesDesdeAPI();
}

    // Funciones API para TAREAS
    async function cargarTareasDesdeAPI() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/tareas/pendientes`);
        if (!res.ok) throw new Error('Error al cargar tareas');

        tareas = await res.json();
        renderTareas();
    } catch (err) {
        console.error(err);
        alert('No se pudieron cargar las tareas desde el servidor.');
    }
    }

    async function crearTareaEnAPI(descripcion) {
        if (!currentUserId) {
            alert('No se encontró el usuario actual. Inicia sesión de nuevo.');
            return;
        }
        const res = await fetch(`${API_BASE_URL}/api/tareas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Descripcion: descripcion, IdUsuario: currentUserId })
        });
        if (!res.ok) throw new Error('Error al crear tarea');
        await cargarTareasDesdeAPI();
    }

    async function actualizarTareaEnAPI(id, descripcion) {
        const tarea = tareas.find(t => t.IdTarea === id);
        if (!tarea) return;

        const res = await fetch(`${API_BASE_URL}/api/tareas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Descripcion: descripcion,
                IdUsuario: tarea.IdUsuario,
                Estado: tarea.Estado
            })
        });
        if (!res.ok) throw new Error('Error al actualizar tarea');
        await cargarTareasDesdeAPI();
    }

    async function completarTareaEnAPI(id) {
        const res = await fetch(`${API_BASE_URL}/api/tareas/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Estado: 'Completada' })
        });
        if (!res.ok) throw new Error('Error al completar tarea');

        // El trigger se encargará de insertar en HistorialTareas
        await Promise.all([
            cargarTareasDesdeAPI(),
            cargarHistorialDesdeAPI()
        ]);
    }

    async function eliminarTareaEnAPI(id) {
        const res = await fetch(`${API_BASE_URL}/api/tareas/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Error al eliminar tarea');
        await cargarTareasDesdeAPI();
    }

    // ==============================
    // Funciones API para HISTORIAL
    // ==============================
    async function cargarHistorialDesdeAPI() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/historial`);
            if (!res.ok) throw new Error('Error al cargar historial');
            historialActividad = await res.json();
            renderHistorial();
        } catch (err) {
            console.error(err);
            alert('No se pudo cargar el historial de tareas.');
        }
    }

    // ==============================
    // Navegación entre secciones
    // ==============================
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            contentSections.forEach(section => section.classList.remove('active'));
            const target = item.dataset.target;
            document.getElementById(target).classList.add('active');

            // Cargar datos al cambiar de sección
            if (target === 'inventario') {
                cargarMaterialesDesdeAPI();
            } else if (target === 'tareas') {
                cargarTareasDesdeAPI();
            } else if (target === 'historial') {
                cargarHistorialDesdeAPI();
            } else if (target === 'categorias') {
                cargarCategoriasDesdeAPI();
            } else if (target === 'sitios') {
                cargarCategoriasDesdeAPI();
                cargarSitiosDesdeAPI();
            }
        });
    });

    // ==============================
    // PERFIL - abrir pantalla
    // ==============================
    const perfilBtn = document.querySelector('.user-profile');

    if (perfilBtn) {
     perfilBtn.addEventListener('click', () => {
        // quitar pantallas activas
        document.querySelectorAll('.content-section')
         .forEach(sec => sec.classList.remove('active'));

        // mostrar perfil
        document.getElementById('perfil').classList.add('active');

     // cargar datos del usuario
     cargarPerfilUsuario();
    });
}


    // ==============================
    // Funciones para Inventario de Materiales
    // ==============================
    function renderMateriales() {
    inventarioTableBody.innerHTML = '';

    materiales.forEach(material => {
    const row = inventarioTableBody.insertRow();

    const imagenHTML = material.rutaImagen
      ? `<img src="${API_BASE_URL}${material.rutaImagen}" alt="Material" class="thumb-material" />`
      : `<span class="no-img">Sin imagen</span>`;

    row.innerHTML = `
      <td>${material.dispositivo ?? ''}</td>
      <td>${material.marca ?? ''}</td>
      <td>${material.modelo ?? ''}</td>
      <td>${material.numeroSerie ?? ''}</td>
      <td>${material.numeroInventario ?? ''}</td>
      <td>${material.descripcion ?? ''}</td>
      <td>${imagenHTML}</td>
      <td class="acciones">
        <a href="#" class="btn-action btn-edit-material" data-id="${material.id}">Editar</a>
        <a href="#" class="btn-action btn-delete-material" data-id="${material.id}">Eliminar</a>
      </td>
    `;
  });
}

// ==============================
// VISOR DE IMÁGENES
// ==============================
const imageViewerModal = document.getElementById('imageViewerModal');
const closeImageViewerModal = document.getElementById('closeImageViewerModal');
const imageViewerImg = document.getElementById('imageViewerImg');

function abrirVisorImagen(src) {
  if (!imageViewerModal || !imageViewerImg) return;
  imageViewerImg.src = src;
  imageViewerModal.classList.add('active');
}

function cerrarVisorImagen() {
  if (!imageViewerModal || !imageViewerImg) return;
  imageViewerModal.classList.remove('active');
  imageViewerImg.src = '';
}

closeImageViewerModal?.addEventListener('click', cerrarVisorImagen);

window.addEventListener('click', (e) => {
  if (e.target === imageViewerModal) cerrarVisorImagen();
});

// clic en miniatura dentro de la tabla inventario
inventarioTableBody?.addEventListener('click', (e) => {
  const img = e.target.closest('img.thumb-material');
  if (!img) return;
  e.preventDefault();
  abrirVisorImagen(img.src);
});
    // ==============================
    // Boton para guardar nuevo material
    // ==============================
    guardarMaterialBtn.addEventListener('click', async () => {
  try {
    // Toma datos del formulario
    const idDispositivo = dispositivoSelect.value;
    const marca = marcaMaterialInput.value.trim();
    const modelo = modeloMaterialInput.value.trim();
    const numeroSerie = numeroSerieMaterialInput.value.trim();
    const numeroInventario = numeroInventarioMaterialInput.value.trim();
    const descripcion = descripcionMaterialInput.value.trim();
    const imagen = imagenMaterialInput.files[0];

    // Validación mínima
    if (!idDispositivo) {
      alert('Selecciona un dispositivo');
      return;
    }

    // Nombre automático
    const dispositivoTexto = dispositivoSelect.options[dispositivoSelect.selectedIndex].textContent.trim();
    const nombre = `${dispositivoTexto} ${marca} ${modelo}`.trim();
    
    // Validación mínima
    if (!sitioInventarioActual) {
    alert('No hay sitio seleccionado');
    return;
  }
    // Enviar como FormData (para que funcione imagen)
    const fd = new FormData();

    fd.append('descripcion', descripcion);
    fd.append('Cantidad', '0'); // si no usas cantidad, se manda 0
    fd.append('IdDispositivo', idDispositivo);
    fd.append('Marca', marca);
    fd.append('Modelo', modelo);
    fd.append('NumeroSerie', numeroSerie);
    fd.append('NumeroInventario', numeroInventario);
    if (imagen) fd.append('imagen', imagen);
    fd.append('IdSitio', sitioInventarioActual);

    // POST para API
    const res = await fetch(`${API_BASE_URL}/api/materiales`, {
      method: 'POST',
      body: fd
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || 'No se pudo guardar');
      return;
    }

    // Recargar para que aparezca en Inventario Actual
    await cargarMaterialesDesdeAPI();

    // Limpiar inputs
    dispositivoSelect.value = '';
    marcaMaterialInput.value = '';
    modeloMaterialInput.value = '';
    numeroSerieMaterialInput.value = '';
    numeroInventarioMaterialInput.value = '';
    descripcionMaterialInput.value = '';
    imagenMaterialInput.value = '';

    alert('Material guardado');
  } catch (err) {
    console.error(err);
    alert('Error al guardar material');
  }
});

    // Alternar visibilidad del formulario de "Agregar Nuevo Material"
    addMaterialBtn.addEventListener('click', () => {
        const addMaterialCard = document.querySelector('.add-material-card');
        addMaterialCard.classList.toggle('active'); // clase para mostrar/ocultar
        if (addMaterialCard.classList.contains('active')) {
            addMaterialCard.style.display = 'block';
        } else {
            addMaterialCard.style.display = 'none';
        }
    });

    // Inicialmente ocultar el formulario de agregar material
    document.querySelector('.add-material-card').style.display = 'none';

    inventarioTableBody.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-id]');
  if (!el) return;

  e.preventDefault();
  const id = parseInt(el.dataset.id, 10);
  if (Number.isNaN(id)) return;

  // ELIMINAR
  if (el.classList.contains('btn-delete-material')) {
    if (confirm('¿Estás seguro de que quieres eliminar este material?')) {
      try {
        await eliminarMaterialEnAPI(id);
      } catch (err) {
        console.error(err);
        alert('No se pudo eliminar el material.');
      }
    }
    return;
  }

  // EDITAR
if (el.classList.contains('btn-edit-material')) {
  const materialToEdit = materiales.find(m => m.id === id);
  if (!materialToEdit) return;

  // Asegura que el select del modal tenga opciones
  await cargarCatalogoDispositivos();

  editMaterialIdInput.value = materialToEdit.id;

  // Llenar campos nuevos
  if (editDispositivoSelect) {
    editDispositivoSelect.value = materialToEdit.idDispositivo ? String(materialToEdit.idDispositivo) : '';
  }

// ===== MOSTRAR IMAGEN ACTUAL EN EL MODAL =====
const previewImagenActual = document.getElementById('previewImagenActual');

// limpiar input file por si ya estaba abierto antes
if (editImagenMaterialInput) editImagenMaterialInput.value = '';

if (previewImagenActual) {
  const ruta = materialToEdit.rutaImagen;

  if (ruta && String(ruta).trim() !== '') {
    // se respeta la tabla API_BASE_URL + rutaImagen (sin slash extra)
    previewImagenActual.src = `${API_BASE_URL}${ruta}`;
    previewImagenActual.style.display = 'block';
  } else {
    previewImagenActual.src = '';
    previewImagenActual.style.display = 'none';
  }
}
  editMarcaMaterialInput.value = materialToEdit.marca ?? '';
  editModeloMaterialInput.value = materialToEdit.modelo ?? '';
  editNumeroSerieMaterialInput.value = materialToEdit.numeroSerie ?? '';
  editNumeroInventarioMaterialInput.value = materialToEdit.numeroInventario ?? '';
  editDescripcionMaterialInput.value = materialToEdit.descripcion ?? '';
  // limpiar input file (por si ya se abrio antes)
  if (editImagenMaterialInput) editImagenMaterialInput.value = '';

  editMaterialModal.classList.add('active');
}
});
    closeMaterialModalBtn.addEventListener('click', () => {
        editMaterialModal.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
        if (e.target === editMaterialModal) editMaterialModal.classList.remove('active');
        if (e.target === editTaskModal) editTaskModal.classList.remove('active');

        // cerrar modales nuevos al dar click fuera
        if (e.target === editCategoriaModal) editCategoriaModal.classList.remove('active');
        if (e.target === editSitioModal) editSitioModal.classList.remove('active');
    });

    // ==============================
    // CERRAR MODAL ADMINISTRAR DISPOSITIVOS
    // ==============================
    closeAdminDispositivosModal?.addEventListener('click', () => {
     adminDispositivosModal.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
     if (e.target === adminDispositivosModal) {
     adminDispositivosModal.classList.remove('active');
     }
    });

 updateMaterialBtn.addEventListener('click', async () => {
  const id = parseInt(editMaterialIdInput.value, 10);
  if (Number.isNaN(id)) return alert('ID inválido');

  const idDispositivo = editDispositivoSelect.value;
  if (!idDispositivo) return alert('Selecciona un dispositivo');

  const marca = editMarcaMaterialInput.value.trim();
  const modelo = editModeloMaterialInput.value.trim();
  const numeroSerie = editNumeroSerieMaterialInput.value.trim();
  const numeroInventario = editNumeroInventarioMaterialInput.value.trim();
  const descripcion = editDescripcionMaterialInput.value.trim();
  const imagen = editImagenMaterialInput?.files?.[0] || null;

  const fd = new FormData();
  fd.append('IdDispositivo', idDispositivo);
  fd.append('Marca', marca);
  fd.append('Modelo', modelo);
  fd.append('NumeroSerie', numeroSerie);
  fd.append('NumeroInventario', numeroInventario);
  fd.append('descripcion', descripcion);    
  if (imagen) fd.append('imagen', imagen);    
  try {
    const res = await fetch(`${API_BASE_URL}/api/materiales/${id}`, {
      method: 'PUT',
      body: fd
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.message || 'No se pudo actualizar en BD');
      return;
    }

    editMaterialModal.classList.remove('active');

    // esto asegura que es lo de la BD
    await cargarMaterialesDesdeAPI();
  } catch (err) {
    console.error(err);
    alert('Error de conexión al actualizar');
  }
});

    // ==============================
    // Funciones para Lista de Tareas
    // ==============================
    function renderTareas() {
        tareasTableBody.innerHTML = '';
        tareas.forEach(tarea => {
            const row = tareasTableBody.insertRow();
            row.innerHTML = `
                <td>
                    ${tarea.Descripcion}
                    <span style="font-size: 0.8rem; color: #666;">(${tarea.Estado})</span>
                </td>
                
                <td class="acciones">
    <button class="btn-action btn-completar" data-id="${tarea.IdTarea}">
        Completado
    </button>

    <button class="btn-action btn-editar btn-edit-tarea" data-id="${tarea.IdTarea}">
        Editar
    </button>

    <button class="btn-action btn-eliminar btn-delete-tarea" data-id="${tarea.IdTarea}">
        Eliminar
    </button>
</td>
`;
        });
    }

    guardarTareaBtn.addEventListener('click', async () => {
        const descripcion = descripcionTareaInput.value.trim();
        if (!descripcion) {
            alert('Por favor, ingresa una descripción para la tarea.');
            return;
        }
        try {
            await crearTareaEnAPI(descripcion);
            descripcionTareaInput.value = '';
        } catch (err) {
            console.error(err);
            alert('No se pudo crear la tarea.');
        }
    });

    tareasTableBody.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-id]');  // agarra el botón
  if (!el) return;

  e.preventDefault();
  const id = parseInt(el.dataset.id, 10);
  if (Number.isNaN(id)) return;

  // COMPLETAR
  if (el.classList.contains('btn-complete')) {
    try {
      await completarTareaEnAPI(id);
    } catch (err) {
      console.error(err);
      alert('No se pudo completar la tarea.');
    }
    return;
  }

  // EDITAR (clase nueva)
  if (el.classList.contains('btn-edit-tarea')) {
    const taskToEdit = tareas.find(t => t.IdTarea === id);
    if (taskToEdit) {
      editTaskIdInput.value = taskToEdit.IdTarea;
      editDescripcionTareaInput.value = taskToEdit.Descripcion;
      editTaskModal.classList.add('active');
    }
    return;
  }

  // ELIMINAR (clase nueva)
  if (el.classList.contains('btn-delete-tarea')) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        await eliminarTareaEnAPI(id);
      } catch (err) {
        console.error(err);
        alert('No se pudo eliminar la tarea.');
      }
    }
  }
});

    closeTaskModalBtn.addEventListener('click', () => {
        editTaskModal.classList.remove('active');
    });

    updateTaskBtn.addEventListener('click', async () => {
        const id = parseInt(editTaskIdInput.value);
        const descripcion = editDescripcionTareaInput.value.trim();

        if (!descripcion) {
            alert('Por favor, ingresa una descripción para la tarea.');
            return;
        }

        try {
            await actualizarTareaEnAPI(id, descripcion);
            editTaskModal.classList.remove('active');
        } catch (err) {
            console.error(err);
            alert('No se pudo actualizar la tarea.');
        }
    });

    // ==============================
    // Funciones para Historial de Actividad
    // ==============================
    function renderHistorial() {
        historialTableBody.innerHTML = '';
        historialActividad.forEach(item => {
            const fecha = item.FechaCambioEstado
                ? new Date(item.FechaCambioEstado).toLocaleString()
                : '';
            const desc = item.Descripcion ?? '';
            const anterior = item.EstadoAnterior || '';
            const nuevo = item.EstadoNuevo || '';
            const textoEstado = anterior && nuevo
                ? `${anterior} → ${nuevo}`
                : nuevo || '';

            const row = historialTableBody.insertRow();
            row.innerHTML = `
                <td>${desc} ${textoEstado ? '(' + textoEstado + ')' : ''}</td>
                <td>${fecha}</td>
            `;
        });
    }

    // ===============================================
    // CATEGORÍAS (LISTAR / CREAR / ELIMINAR / EDITAR) 
    // ===============================================
    async function cargarCategoriasDesdeAPI() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/categorias`);
            if (!res.ok) throw new Error('Error al cargar categorías');
            categorias = await res.json(); // [{IdCategoria, NombreCategoria}]
            renderCategorias();
            llenarSelectCategorias(); // llena select crear sitio + select editar sitio
        } catch (err) {
            console.error(err);
            alert('No se pudieron cargar las categorías.');
        }
    }

    async function crearCategoriaEnAPI(nombre) {
        const res = await fetch(`${API_BASE_URL}/api/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ NombreCategoria: nombre })
        });
        if (!res.ok) throw new Error('Error al crear categoría');
        await cargarCategoriasDesdeAPI();
    }

    async function eliminarCategoriaEnAPI(id) {
        const res = await fetch(`${API_BASE_URL}/api/categorias/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Error al eliminar categoría');
        await cargarCategoriasDesdeAPI();
    }

    async function actualizarCategoriaEnAPI(id, nombre) {
        const res = await fetch(`${API_BASE_URL}/api/categorias/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ NombreCategoria: nombre })
        });
        if (!res.ok) throw new Error('Error al actualizar categoría');
        await cargarCategoriasDesdeAPI();
    }

    function renderCategorias() {
        categoriasTableBody.innerHTML = '';
        categorias.forEach(cat => {
            const row = categoriasTableBody.insertRow();
            row.innerHTML = `
                <td>${cat.NombreCategoria}</td>
               <td class="acciones">
    <button class="btn-action btn-editar btn-edit-categoria" data-id="${cat.IdCategoria}">
        Editar
    </button>

    <button class="btn-action btn-eliminar btn-delete-categoria" data-id="${cat.IdCategoria}">
        Eliminar
    </button>
</td>
`;
        });
    }

    function llenarSelectCategorias() {
        // select del formulario crear sitio
        sitioCategoriaSelect.innerHTML = '';
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.IdCategoria;
            opt.textContent = cat.NombreCategoria;
            sitioCategoriaSelect.appendChild(opt);
        });

        // select del modal editar sitio
        editSitioCategoriaSelect.innerHTML = '';
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.IdCategoria;
            opt.textContent = cat.NombreCategoria;
            editSitioCategoriaSelect.appendChild(opt);
        });
    }

    guardarCategoriaBtn.addEventListener('click', async () => {
        const nombre = nombreCategoriaInput.value.trim();
        if (!nombre) return alert('Ingresa un nombre de categoría');

        try {
            await crearCategoriaEnAPI(nombre);
            nombreCategoriaInput.value = '';
        } catch (err) {
            console.error(err);
            alert('No se pudo crear la categoría');
        }
    });

    categoriasTableBody.addEventListener('click', async (e) => {
        // EDITAR
        if (e.target.classList.contains('btn-edit-categoria')) {
            e.preventDefault();
            const id = parseInt(e.target.dataset.id);
            const cat = categorias.find(c => c.IdCategoria === id);
            if (!cat) return;

            editCategoriaIdInput.value = cat.IdCategoria;
            editNombreCategoriaInput.value = cat.NombreCategoria;
            editCategoriaModal.classList.add('active');
            return;
        }

        // ELIMINAR
        if (e.target.classList.contains('btn-delete-categoria')) {
            e.preventDefault();
            const id = parseInt(e.target.dataset.id);
            if (confirm('¿Eliminar esta categoría?')) {
                try {
                    await eliminarCategoriaEnAPI(id);
                } catch (err) {
                    console.error(err);
                    alert('No se pudo eliminar la categoría');
                }
            }
        }
    });

    closeCategoriaModalBtn.addEventListener('click', () => {
        editCategoriaModal.classList.remove('active');
    });

    updateCategoriaBtn.addEventListener('click', async () => {
        const id = parseInt(editCategoriaIdInput.value);
        const nombre = editNombreCategoriaInput.value.trim();
        if (!nombre) return alert('Ingresa un nombre');

        try {
            await actualizarCategoriaEnAPI(id, nombre);
            editCategoriaModal.classList.remove('active');
        } catch (err) {
            console.error(err);
            alert('No se pudo actualizar la categoría');
        }
    });

    // ===========================================
    // SITIOS (LISTAR / CREAR / ELIMINAR / EDITAR)
    // ===========================================
    async function cargarSitiosDesdeAPI() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/sitios`);
            if (!res.ok) throw new Error('Error al cargar sitios');
            sitios = await res.json();
            renderSitios();
        } catch (err) {
            console.error(err);
            alert('No se pudieron cargar los sitios.');
        }
    }
    async function crearSitioEnAPI(payload) {
        const res = await fetch(`${API_BASE_URL}/api/sitios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error al crear sitio');
        await cargarSitiosDesdeAPI();
    }
    async function eliminarSitioEnAPI(id) {
        const res = await fetch(`${API_BASE_URL}/api/sitios/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Error al eliminar sitio');
        await cargarSitiosDesdeAPI();
    }
    async function actualizarSitioEnAPI(id, payload) {
        const res = await fetch(`${API_BASE_URL}/api/sitios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error al actualizar sitio');
        await cargarSitiosDesdeAPI();
    }
    // Helpers para fechas SIN desfase de día
    function dateOnlyYYYYMMDD(value) {
    if (!value) return '';

    // Si viene como string  YYYY-MM-DD  desde SQL Server
    if (typeof value === 'string') {
        return value.substring(0, 10);
    }

    // Si viene como Date, corregir zona horaria
    const d = new Date(value);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().substring(0, 10);
    }

    function dateOnlyDisplay(value) {
    const ymd = dateOnlyYYYYMMDD(value);
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`; // dd/mm/yyyy
    }

    // ====== BUSCADOR SITIOS ======
    const sitiosSearchInput = document.getElementById('sitiosSearchInput');
    let sitiosSearchQuery = '';

    function aplicarFiltroSitios() {
    const q = (sitiosSearchQuery || '').toLowerCase();
    const rows = sitiosTableBody.querySelectorAll('tr');

    rows.forEach(row => {
        const txt = row.innerText.toLowerCase();
        row.style.display = txt.includes(q) ? '' : 'none';
         });
    }

if (sitiosSearchInput) {
    sitiosSearchInput.addEventListener('input', () => {
        sitiosSearchQuery = sitiosSearchInput.value;
        aplicarFiltroSitios();  // reaplicar filtro
    });
}

    function renderSitios() {
        sitiosTableBody.innerHTML = '';
        
        sitios.forEach(sitio => {
            const visita = dateOnlyDisplay(sitio.FechaVisita);
            
            const row = sitiosTableBody.insertRow();
            row.innerHTML = `
                <td>${sitio.Sitio ?? ''}</td>
                <td>${sitio.NombreCategoria ?? ''}</td>
                <td>${sitio.URLMaps ? `<a href="${sitio.URLMaps}" target="_blank">Abrir</a>` : ''}</td>
                <td>${visita}</td>
                <td>${sitio.Activo ?? ''}</td>
                <td>${sitio.EquipoInstalado ?? ''}</td>
                <td>${sitio.AnchoBanda ?? ''}</td>
                <td>${sitio.SSID_Pass ?? ''}</td>
                <td>${sitio.Contacto ?? ''}</td>
                <td>${sitio.Telefono ?? ''}</td>
                <td class="acciones">
    <button
        type="button"
        class="btn-action btn-editar btn-edit-sitio"
        data-id="${sitio.IdSitio}">
        Editar
    </button>

    <button
        type="button"
        class="btn-action btn-eliminar btn-delete-sitio"
        data-id="${sitio.IdSitio}">
        Eliminar
    </button>

    <button
        type="button"
        class="btn-action btn-inventario btn-inventario-sitio"
        data-id="${sitio.IdSitio}">
        Inventario
    </button>
</td>
`;

        });
        aplicarFiltroSitios();  // reaplicar filtro después de renderizar
    }

    guardarSitioBtn.addEventListener('click', async () => {
        const Sitio = sitioNombreInput.value.trim();
        const IdCategoria = parseInt(sitioCategoriaSelect.value);

        if (!Sitio || isNaN(IdCategoria)) {
            alert('Completa el nombre del sitio y la categoría');
            return;
        }

        try {
            await crearSitioEnAPI({
                Sitio,
                IdCategoria,
                URLMaps: sitioURLMapsInput.value.trim() || null,
                FechaVisita: sitioFechaVisitaInput.value || null,
                Activo: sitioActivoInput.value.trim() || null,
                EquipoInstalado: sitioEquipoInput.value.trim() || null,
                AnchoBanda: sitioAnchoBandaInput.value.trim() || null,
                SSID_Pass: sitioSSIDPassInput.value.trim() || null,
                Contacto: sitioContactoInput.value.trim() || null,
                Telefono: sitioTelefonoInput.value.trim() || null
            });

            // limpiar inputs
            sitioNombreInput.value = '';
            sitioURLMapsInput.value = '';
            sitioFechaVisitaInput.value = '';
            sitioActivoInput.value = '';
            sitioEquipoInput.value = '';
            sitioAnchoBandaInput.value = '';
            sitioSSIDPassInput.value = '';
            sitioContactoInput.value = '';
            sitioTelefonoInput.value = '';

            // Ocultar formulario al guardar
            nuevoSitioCard.classList.add('oculto');
            toggleNuevoSitioBtn.textContent = '+ Nuevo sitio';

        } catch (err) {
            console.error(err);
            alert('No se pudo crear el sitio');
        }
    });

    sitiosTableBody.addEventListener('click', async (e) => {
        // EDITAR
        if (e.target.classList.contains('btn-edit-sitio')) {
            e.preventDefault();
            const id = parseInt(e.target.dataset.id);
            const s = sitios.find(x => x.IdSitio === id);
            if (!s) return;

            // asegurar selects (crear y editar)
            llenarSelectCategorias();

            editSitioIdInput.value = s.IdSitio;
            editSitioNombreInput.value = s.Sitio ?? '';
            editSitioURLMapsInput.value = s.URLMaps ?? '';
            editSitioFechaVisitaInput.value = dateOnlyYYYYMMDD(s.FechaVisita);
            editSitioActivoInput.value = s.Activo ?? '';
            editSitioEquipoInput.value = s.EquipoInstalado ?? '';
            editSitioAnchoBandaInput.value = s.AnchoBanda ?? '';
            editSitioSSIDPassInput.value = s.SSID_Pass ?? '';
            editSitioContactoInput.value = s.Contacto ?? '';
            editSitioTelefonoInput.value = s.Telefono ?? '';

            // Si backend devuelve IdCategoria, se preselecciona:
            if (s.IdCategoria) editSitioCategoriaSelect.value = s.IdCategoria;

            editSitioModal.classList.add('active');
            return;
        }
        //INVENTARIO, te dirige a la pantalla de inventario de materiales 
        if (e.target.classList.contains('btn-inventario-sitio')) {
        e.preventDefault();

        sitioInventarioActual = parseInt(e.target.dataset.id);

        // cambiar a sección inventario
        menuItems.forEach(i => i.classList.remove('active'));
        document.querySelector('[data-target="inventario"]').classList.add('active');

        contentSections.forEach(sec => sec.classList.remove('active'));
        document.getElementById('inventario').classList.add('active');

        // cargar inventario SOLO de ese sitio
        cargarMaterialesDesdeAPI();
      return;
    }

        // ELIMINAR
        if (e.target.classList.contains('btn-delete-sitio')) {
            e.preventDefault();
            const id = parseInt(e.target.dataset.id);

            if (confirm('¿Eliminar este sitio?')) {
                try {
                    await eliminarSitioEnAPI(id);
                } catch (err) {
                    console.error(err);
                    alert('No se pudo eliminar el sitio');
                }
            }
        }
    });

    closeSitioModalBtn.addEventListener('click', () => {
        editSitioModal.classList.remove('active');
    });

  // Boton actualizar 
   updateSitioBtn.addEventListener('click', async () => {
    const id = parseInt(editSitioIdInput.value);

    const Sitio = editSitioNombreInput.value.trim();
    const IdCategoria = parseInt(editSitioCategoriaSelect.value);

    if (!Sitio || isNaN(IdCategoria)) {
        alert('Completa Sitio y Categoría');
        return;
    }
    try {
        await actualizarSitioEnAPI(id, {
            Sitio,
            IdCategoria,
            URLMaps: editSitioURLMapsInput.value.trim() || null,
            FechaVisita: editSitioFechaVisitaInput.value || null,
            Activo: editSitioActivoInput.value.trim() || null,
            EquipoInstalado: editSitioEquipoInput.value.trim() || null,
            AnchoBanda: editSitioAnchoBandaInput.value.trim() || null,
            SSID_Pass: editSitioSSIDPassInput.value.trim() || null,
            Contacto: editSitioContactoInput.value.trim() || null,
            Telefono: editSitioTelefonoInput.value.trim() || null
        });

        editSitioModal.classList.remove('active');
    } catch (err) {
        console.error(err);
        alert('No se pudo actualizar el sitio');
    }
});
    // PERFIL (guardar cambios)
    const guardarPerfilBtn = document.getElementById('guardarPerfilBtn');

    if (guardarPerfilBtn) {
     guardarPerfilBtn.addEventListener('click', async () => {

        const payload = {
        Nombre: document.getElementById('perfilNombre').value,
        Apellido_P: document.getElementById('perfilApellidoP').value,
        Apellido_M: document.getElementById('perfilApellidoM').value,
        Correo: document.getElementById('perfilCorreo').value,
        Telefono: document.getElementById('perfilTelefono').value
    };

    try {
      await fetch(`http://localhost:4000/api/usuarios/${currentUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // actualizar datos locales
      const data = JSON.parse(localStorage.getItem('userData'));
      localStorage.setItem('userData', JSON.stringify({ ...data, ...payload }));

      alert('Perfil actualizado');
    } catch {
      alert('Error al guardar perfil');
    }
  });
}
    // PERFIL (cambiar contraseña)
    const cambiarPasswordBtn = document.getElementById('cambiarPasswordBtn');

    if (cambiarPasswordBtn) {
    cambiarPasswordBtn.addEventListener('click', async () => {
    if (!currentUserId) {
      alert('No se encontró el usuario actual. Inicia sesión de nuevo.');
      return;
    }

    const actual = document.getElementById('passActual').value.trim();
    const nueva = document.getElementById('passNueva').value.trim();
    const confirmar = document.getElementById('passConfirmar').value.trim();

    // Validaciones básicas
    if (!actual || !nueva || !confirmar) {
      alert('Completa los 3 campos de contraseña.');
      return;
    }
    if (nueva.length < 8) {
      alert('La nueva contraseña debe tener mínimo 8 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      alert('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/usuarios/${currentUserId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordActual: actual,
          passwordNueva: nueva
        })
      });

      // Si backend manda error con mensaje
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.message || 'No se pudo cambiar la contraseña.');
        return;
      }

      // limpiar inputs
      document.getElementById('passActual').value = '';
      document.getElementById('passNueva').value = '';
      document.getElementById('passConfirmar').value = '';

      alert('Contraseña cambiada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error de conexión al cambiar contraseña.');
    }
  });
}
    // Inicialización
    cargarMaterialesDesdeAPI();
    cargarTareasDesdeAPI();
    cargarHistorialDesdeAPI();
    // Activar la primera sección por defecto
    document.querySelector('.menu-item').click();
});