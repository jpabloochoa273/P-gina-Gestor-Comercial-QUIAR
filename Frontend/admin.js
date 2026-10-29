const API_BASE = window.QUIAR_API_BASE || (location.port === '5000' ? location.origin : 'http://localhost:5000');
function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
async function apiFetch(url, options) {
    let response;
    try { response = await fetch(url, options); }
    catch { throw new Error('No se pudo contactar al backend. Ejecuta npm start en Backend y revisa /api/health.'); }
    if (!response.ok) {
        const data = await response.clone().json().catch(() => ({}));
        throw new Error(data.error || 'La solicitud fallo (' + response.status + ').');
    }
    return response;
}
// --- FUNCIONES NAVEGADOR Y LOGIN ---
function showAdminApp() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("admin-app").classList.remove("hidden");
}

function toggleLoginPassword(button) {
  const passwordInput = document.getElementById("login-password");
  const showPassword = passwordInput.type === "password";
  passwordInput.type = showPassword ? "text" : "password";
  button.setAttribute("aria-pressed", String(showPassword));
  button.setAttribute("aria-label", showPassword ? "Ocultar contraseña" : "Mostrar contraseña");
  const icon = button.querySelector("i");
  icon.classList.toggle("fa-eye", !showPassword);
  icon.classList.toggle("fa-eye-slash", showPassword);
}

function switchTab(viewId, element) {
  document.querySelectorAll(".tab-view").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));

  document.getElementById("view-" + viewId).classList.add("active");
  element.classList.add("active");
}

// --- BUSCADOR GLOBAL EN TIEMPO REAL ---
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".topbar-search input");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const activeView = document.querySelector(".tab-view.active");
      if (!activeView) return;

      const rows = activeView.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(searchTerm)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  }
  
  obtenerCotizaciones();
  cargarProductosDesdeBD();
  cargarClientesDesdeBD();
});

// --- CONTROL DEL MODAL DE PRODUCTOS ---
function openProductModal() {
  const modal = document.getElementById("product-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeProductModal() {
  currentRowEditing = null;
  const modal = document.getElementById("product-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.getElementById("product-form").reset();
  }
}



// --- CONTROL DEL MODAL DE CLIENTES ---
function openClientModal() {
  const modal = document.getElementById("client-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeClientModal() {
  currentRowEditing = null;
  const modal = document.getElementById("client-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.getElementById("client-form").reset();
  }
}



// --- CONTROL DEL MODAL DE COTIZACIONES ---
async function openQuoteModal() {
    const modal = document.getElementById('quote-modal');
    if (modal) modal.classList.remove('hidden');

    establecerFechaHoy();
    await cargarClientesYUsuarios(); // Carga automática de clientes y asesores desde la BD

    const inputFolio = document.getElementById('q-folio');
    if (inputFolio && !cotizacionEdicionId) {
        const anio = new Date().getFullYear();
        const consecutivo = Math.floor(Math.random() * 900) + 100;
        inputFolio.value = `COT-${anio}-${consecutivo}`;
    }
}

function closeQuoteModal() {
    cotizacionEdicionId = null; // Limpia el ID para futuras creaciones[cite: 10]
    const modal = document.getElementById("quote-modal");
    if (modal) {
        modal.classList.add("hidden");
        document.getElementById("quote-form").reset();
        renderizarDetallesEnTabla([]); // Limpia la tabla de productos[cite: 10]
    }
}

// Variable temporal para almacenar los datos mientras el usuario confirma
let cotizacionEdicionId = null;
let datosCotizacionPendiente = null;


// --- CONTROL DEL MODAL DE CONFIRMACIÓN ---
function closeConfirmModal() {
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal) confirmModal.classList.add('hidden');
    datosCotizacionPendiente = null; // Limpia la memoria si cancela
}

// --- ENLACE DEL FORMULARIO Y APERTURA DEL MODAL DE CONFIRMACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const quoteForm = document.getElementById('quote-form');
    if (quoteForm) {
        quoteForm.addEventListener('submit', (event) => {
            event.preventDefault();

            // 1. Capturar los datos del formulario y guardarlos temporalmente
            const folio = document.getElementById("q-folio").value;
            const client = document.getElementById("q-client").value;
            const date = document.getElementById("q-date").value;

            // Validación: Asegurar que la fecha no sea anterior a hoy al momento de guardar
            const ahora = new Date();
            const anio = ahora.getFullYear();
            const mes = String(ahora.getMonth() + 1).padStart(2, '0');
            const dia = String(ahora.getDate()).padStart(2, '0');
            const hoyLocal = `${anio}-${mes}-${dia}`;

            if (!cotizacionEdicionId && date < hoyLocal) {
                alert('No se puede guardar una cotización con una fecha anterior a hoy.');
                document.getElementById("q-date").value = hoyLocal;
                return; // Detiene el proceso si la fecha es inválida
            }

            const status = document.getElementById("q-status").value;
            const rawTotal = document.getElementById("q-total").value;
            const agent = document.getElementById("q-agent").value;
            
            const totalNum = parseFloat(rawTotal.replace(/[^0-9.-]+/g, "")) || 0;
            const subtotal = Number((totalNum / 1.16).toFixed(2));
            const iva = Number((totalNum - subtotal).toFixed(2));

            datosCotizacionPendiente = {
                folio,
                client,
                date,
                status,
                total: totalNum,
                subtotal,
                iva,
                agent,
                detalles: obtenerDetallesDesdeLaTabla()
            };

            // 2. Mostrar NUESTRA ventana de confirmación corporativa
            const confirmModal = document.getElementById('confirm-modal');
            if (confirmModal) confirmModal.classList.remove('hidden');
        });
    }
});

// --- EJECUTAR GUARDADO FINAL AL DAR CLIC EN "SÍ, GUARDAR" ---
async function ejecutarGuardadoFinal() {
    if (!datosCotizacionPendiente) return;

    try {
        const url = cotizacionEdicionId 
            ? `${API_BASE}/api/cotizaciones/${cotizacionEdicionId}` 
            : `${API_BASE}/api/cotizaciones`;
            
        const metodo = cotizacionEdicionId ? 'PUT' : 'POST';

        const respuesta = await apiFetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosCotizacionPendiente)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Cotización guardada exitosamente en la base de datos!');
            closeConfirmModal();
            closeQuoteModal();
            obtenerCotizaciones();
        } else {
            alert('Error al guardar: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error de red al guardar cotización:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}

// --- OBTENER COTIZACIONES DESDE EL BACKEND (CORREGIDO Y ALINEADO) ---
async function obtenerCotizaciones() {
    try {
        const respuesta = await apiFetch(`${API_BASE}/api/cotizaciones`);
        if (!respuesta.ok) throw new Error('Error al obtener cotizaciones');

        const cotizaciones = await respuesta.json();
        const tbody = document.querySelector("#cotizaciones-tbody"); 
        if (!tbody) return;

        if (!cotizaciones || cotizaciones.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No hay cotizaciones registradas.</td></tr>`;
            return;
        }

        tbody.innerHTML = cotizaciones.map(c => {
            const id = c.idPedido || c.id || c.id_cotizacion;
            const folio = c.folio || 'N/A';
            const cliente = c.nombreCliente || c.client || c.cliente || c.idCliente || 'Cliente General';
            const fecha = c.fecha ? c.fecha.split('T')[0] : 'N/A';
            
            // Formatear valores monetarios a 2 decimales
            const subtotal = Number(c.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const iva = Number(c.iva || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const total = Number(c.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            const estado = c.estado || c.status || 'Pendiente';
            const asesor = c.nombreVendedor || c.agent || c.asesor || c.idUsuario || 'Asesor';

            // 9 columnas perfectamente ordenadas con el data-id incluido
            return `
                <tr data-id="${id}">
                    <td><code>${folio}</code></td>
                    <td><strong>${cliente}</strong></td>
                    <td>${fecha}</td>
                    <td>$${subtotal}</td>
                    <td>$${iva}</td>
                    <td><strong>$${total}</strong></td>
                    <td><span class="badge badge-blue">${estado}</span></td>
                    <td>${asesor}</td>
                    <td>
                        <button class="btn-icon" title="Editar" onclick="editRow(this)"><i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i></button>
                        <button class="btn-icon" title="Eliminar" onclick="eliminarCotizacion(${id})"><i class="fa-solid fa-trash" style="color: #e74c3c;"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error al obtener cotizaciones:", error);
    }
}

// --- ELIMINAR COTIZACIÓN ---
async function eliminarCotizacion(idPedido) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cotización de la base de datos?")) return;

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/cotizaciones/${idPedido}`, {
            method: 'DELETE'
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Cotización eliminada exitosamente!');
            obtenerCotizaciones();
        } else {
            alert('Error al eliminar: ' + (resultado.error || 'No se pudo completar la acción'));
        }
    } catch (error) {
        console.error("Error de red al eliminar cotización:", error);
        alert('No se pudo conectar con el servidor.');
    }
}

// --- CONTROL DE PROVEEDORES, ESPECIALISTAS, SECTORES, SERVICIOS, USUARIOS Y ROLES ---
function openSupplierModal() { document.getElementById("supplier-modal")?.classList.remove("hidden"); }
function closeSupplierModal() { document.getElementById("supplier-modal")?.classList.add("hidden"); document.getElementById("supplier-form")?.reset(); }


function openExpertModal() { document.getElementById("expert-modal")?.classList.remove("hidden"); }
function closeExpertModal() { document.getElementById("expert-modal")?.classList.add("hidden"); document.getElementById("expert-form")?.reset(); }


function openSectorModal() { document.getElementById("sector-modal")?.classList.remove("hidden"); }
function closeSectorModal() { document.getElementById("sector-modal")?.classList.add("hidden"); document.getElementById("sector-form")?.reset(); }


function openServiceModal() { document.getElementById("service-modal")?.classList.remove("hidden"); }
function closeServiceModal() { document.getElementById("service-modal")?.classList.add("hidden"); document.getElementById("service-form")?.reset(); }


function openUserModal() { document.getElementById("user-modal")?.classList.remove("hidden"); }
function closeUserModal() { document.getElementById("user-modal")?.classList.add("hidden"); document.getElementById("user-form")?.reset(); }


function openRoleModal() { document.getElementById("role-modal")?.classList.remove("hidden"); }
function closeRoleModal() { document.getElementById("role-modal")?.classList.add("hidden"); document.getElementById("role-form")?.reset(); }




// --- CONFIGURAR FECHA LOCAL DE HOY AL ABRIR ---
function establecerFechaHoy() {
    const fechaInput = document.getElementById('q-date');
    if (!fechaInput) return;

    // Calcular fecha actual local (YYYY-MM-DD)
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hoyLocal = `${anio}-${mes}-${dia}`;
    
    // Asignar el mínimo permitido en el calendario del navegador
    fechaInput.min = cotizacionEdicionId ? '' : hoyLocal;
    
    // Poner la fecha de hoy por defecto si está vacío
    if (!fechaInput.value) {
        fechaInput.value = hoyLocal;
    }
}

function validarFechaCotizacion() {
    const fechaInput = document.getElementById('q-date');
    if (!fechaInput) return;

    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hoyLocal = `${anio}-${mes}-${dia}`;

    if (!cotizacionEdicionId && fechaInput.value < hoyLocal) {
        alert('No se pueden seleccionar fechas anteriores a hoy.');
        fechaInput.value = hoyLocal;
    }
}

function limpiarMoneda(texto) {
    if (!texto) return 0;
    const soloDigitos = texto.toString().replace(/[^0-9]/g, '');
    if (soloDigitos === '') return 0;
    return parseInt(soloDigitos, 10) / 100;
}

function formatearMoneda(valor) {
    return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcularTotalesCotizacion() {
    let subtotalGeneral = 0;
    let descuentoTotalGeneral = 0;
    
    const filas = document.querySelectorAll('#detalle-tbody tr');
    
    filas.forEach(fila => {
        const inputCantidad = fila.querySelector('.input-cantidad');
        const inputPrecio = fila.querySelector('.input-precio');
        const inputDescuento = fila.querySelector('.input-descuento');
        const inputSubtotalLinea = fila.querySelector('.input-subtotal');
        
        if (!inputCantidad || !inputPrecio || !inputSubtotalLinea) return;

        const cantidad = parseFloat(inputCantidad.value) || 0;
        const precioVenta = limpiarMoneda(inputPrecio.value);
        const porcentajeDesc = inputDescuento ? parseFloat(inputDescuento.value) || 0 : 0;
        
        const brutoLinea = cantidad * precioVenta;
        const montoDescuentoLinea = brutoLinea * (porcentajeDesc / 100);
        let subtotalLinea = brutoLinea - montoDescuentoLinea;
        if (subtotalLinea < 0) subtotalLinea = 0;
        
        inputSubtotalLinea.value = formatearMoneda(subtotalLinea);
        
        subtotalGeneral += brutoLinea;
        descuentoTotalGeneral += montoDescuentoLinea;
    });
    
    let subtotalConDescuento = subtotalGeneral - descuentoTotalGeneral;
    if (subtotalConDescuento < 0) subtotalConDescuento = 0;
    
    const iva = subtotalConDescuento * 0.16;
    const total = subtotalConDescuento + iva;
    
    const elSub = document.getElementById('q-subtotal');
    const elDesc = document.getElementById('q-descuento');
    const elIva = document.getElementById('q-iva');
    const elTot = document.getElementById('q-total');

    if (elSub) elSub.value = formatearMoneda(subtotalGeneral);
    if (elDesc) elDesc.value = formatearMoneda(descuentoTotalGeneral);
    if (elIva) elIva.value = formatearMoneda(iva);
    if (elTot) elTot.value = formatearMoneda(total);
}

// --- FORMATO ESTILO NU PARA PRECIOS (DERECHA A IZQUIERDA Y BLOQUEO DE LETRAS) ---
document.addEventListener('keydown', function(e) {
    if (e.target.classList.contains('input-precio')) {
        let input = e.target;
        
        if (e.key === 'Tab' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.ctrlKey || e.metaKey) {
            return;
        }

        let rawCents = parseInt(input.dataset.rawCents || '0', 10);

        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            rawCents = (rawCents * 10) + parseInt(e.key, 10);
            if (rawCents > 99999999999) rawCents = 99999999999;
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            rawCents = Math.floor(rawCents / 10);
        } else {
            e.preventDefault(); // Bloquea cualquier letra o símbolo no deseado
            return;
        }

        input.dataset.rawCents = rawCents;
        let valorDecimal = rawCents / 100;
        input.value = valorDecimal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        input.setSelectionRange(input.value.length, input.value.length);
        
        calcularTotalesCotizacion();
    }
});

document.addEventListener('focusin', function(e) {
    if (e.target.classList.contains('input-precio')) {
        let input = e.target;
        if (!input.dataset.rawCents) {
            let initialVal = limpiarMoneda(input.value) * 100;
            input.dataset.rawCents = isNaN(initialVal) ? 0 : Math.round(initialVal);
        }
    }
});

// Bloquear letras/símbolos no deseados en cantidad y descuento
document.addEventListener('keydown', function(e) {
    if (e.target.classList.contains('input-cantidad') || e.target.classList.contains('input-descuento')) {
        if (['e', 'E', '+', '-', '.'].includes(e.key)) {
            e.preventDefault();
        }
    }
});

document.addEventListener('input', function(e) {
    if (e.target.closest('#quote-form')) {
        calcularTotalesCotizacion();
    }
});// --- EDITAR COTIZACIÓN DESDE LA TABLA ---
async function editarCotizacion(button) {
    const fila = button.closest('tr');
    if (!fila) return;

    const id = fila.dataset.id;
    console.log("👉 ID capturado de la fila:", id); // <-- Veremos esto en la consola
    if (!id) {
        console.error("❌ ¡La fila no tiene un dataset.id válido!");
        return;
    }

    cotizacionEdicionId = id;
    await openQuoteModal();

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/cotizaciones/${id}`);
        console.log("📡 Status de respuesta del backend:", respuesta.status);
        
        if (respuesta.ok) {
            const data = await respuesta.json();
            console.log("📦 Objeto completo recibido del backend:", data); // <-- Veremos la estructura exacta aquí

            if (data.pedido) {
                document.getElementById("q-folio").value = data.pedido.folio || '';
                document.getElementById("q-date").value = data.pedido.fecha ? data.pedido.fecha.split('T')[0] : '';
                document.getElementById("q-subtotal").value = data.pedido.subtotal || '0.00';
                document.getElementById("q-iva").value = data.pedido.iva || '0.00';
                document.getElementById("q-total").value = data.pedido.total || '0.00';
                document.getElementById("q-status").value = data.pedido.estado || 'Pendiente';
            }

            {
                const selectClient = document.getElementById("q-client");
                if (selectClient && data.pedido) {
                    selectClient.value = data.pedido.idCliente || data.pedido.id_cliente || '';
                }

                const selectAgent = document.getElementById("q-agent");
                if (selectAgent && data.pedido) {
                    selectAgent.value = data.pedido.idUsuario || data.pedido.id_usuario || '';
                }
            }

            if (data.productos && data.productos.length > 0) {
                renderizarDetallesEnTabla(data.productos);
            } else {
                renderizarDetallesEnTabla([]);
            }
        } else {
            console.warn("⚠️ No se encontró la cotización en el servidor.");
        }
    } catch (error) {
        console.error("❌ Error al conectar con el backend para editar:", error);
    }
}
// --- RENDERIZAR LAS LÍNEAS DE PRODUCTOS EN EL MODAL (Soporte total para MySQL y JS) ---
function renderizarDetallesEnTabla(detalles) {
    const tbody = document.getElementById('detalle-tbody');
    if (!tbody) return;

    if (!detalles || detalles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td><input type="text" placeholder="Ej. FLK-87V" class="table-input input-sku" style="width:100%; padding:5px;" required /></td>
                <td><input type="number" value="1" min="1" class="table-input input-cantidad" style="width:100%; padding:5px;" required /></td>
                <td>
                    <div class="input-group-custom">
                        <span class="input-prefix">$</span>
                        <input type="text" value="0.00" class="table-input input-precio" required />
                    </div>
                </td>
                <td>
                    <div class="input-group-custom">
                        <input type="number" value="0" min="0" max="100" class="table-input input-descuento" placeholder="0" />
                        <span class="input-suffix">%</span>
                    </div>
                </td>
                <td><input type="text" value="$0.00" class="table-input input-subtotal" style="width:100%; padding:5px;" readonly /></td>
                <td><button type="button" class="btn btn-outline" style="padding: 2px 8px; color: red;" onclick="eliminarFilaDetalle(this)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = detalles.map(item => {
        const sku = item.codigoProducto || item.codigo_sku || item.codigoSku || item.sku || '';
        const cantidad = item.cantidad || 1;
        const precio = item.precioVenta || item.precio_venta || item.precio || '0.00';
        const descuento = item.descuento || 0;
        const subtotal = item.subtotalLinea || item.subtotal_linea || item.subtotal || '0.00';

        return `
            <tr>
                <td><input type="text" value="${escapeHTML(sku)}" class="table-input input-sku" style="width:100%; padding:5px;" required /></td>
                <td><input type="number" value="${cantidad}" min="1" class="table-input input-cantidad" style="width:100%; padding:5px;" required /></td>
                <td>
                    <div class="input-group-custom">
                        <span class="input-prefix">$</span>
                        <input type="text" value="${precio}" class="table-input input-precio" required />
                    </div>
                </td>
                <td>
                    <div class="input-group-custom">
                        <input type="number" value="${descuento}" min="0" max="100" class="table-input input-descuento" placeholder="0" />
                        <span class="input-suffix">%</span>
                    </div>
                </td>
                <td><input type="text" value="$${subtotal}" class="table-input input-subtotal" style="width:100%; padding:5px;" readonly /></td>
                <td><button type="button" class="btn btn-outline" style="padding: 2px 8px; color: red;" onclick="eliminarFilaDetalle(this)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    }).join('');
}
// --- ELIMINAR UNA FILA DE DETALLE DE PRODUCTO ---
function eliminarFilaDetalle(button) {
    const fila = button.closest('tr');
    const tbody = fila.closest('tbody');
    
    // Si hay más de una fila en la tabla, la eliminamos; si es la única, la limpiamos
    if (tbody.rows.length > 1) {
        fila.remove();
    } else {
        fila.querySelectorAll('input').forEach(input => {
            if (input.type === 'number') input.value = 1;
            else if (input.classList.contains('input-descuento')) input.value = 0;
            else input.value = '0.00';
        });
    }
}
function obtenerDetallesDesdeLaTabla() {
    const filas = document.querySelectorAll('#detalle-tbody tr');
    console.log("🔍 Filas encontradas en la tabla:", filas.length); // <-- ¿Sale 0 aquí?
    
    const detalles = [];

    filas.forEach((fila, index) => {
        const skuInput = fila.querySelector('.input-sku');
        const sku = skuInput ? skuInput.value : '';
        console.log(`📌 Fila ${index} - SKU detectado:`, sku); // <-- ¿Sale vacío o detecta el producto?

        const cantidad = parseFloat(fila.querySelector('.input-cantidad')?.value) || 1;
        const precioInput = fila.querySelector('.input-precio');
        const precio = precioInput ? limpiarMoneda(precioInput.value) : 0;
        const descuento = parseFloat(fila.querySelector('.input-descuento')?.value) || 0;
        const subtotalInput = fila.querySelector('.input-subtotal');
        const subtotal = subtotalInput ? limpiarMoneda(subtotalInput.value) : (cantidad * precio);

        if (sku.trim() !== '') {
            detalles.push({
                sku: sku.trim(),
                cantidad: cantidad,
                precio: precio,
                descuento: descuento,
                subtotal: subtotal
            });
        }
    });

    console.log("📦 Arreglo final de detalles listo para enviar:", detalles);
    return detalles;
}
// --- CARGAR CLIENTES Y USUARIOS DINÁMICAMENTE EN LOS SELECTS ---
async function cargarClientesYUsuarios() {
    try {
        // 1. Cargar Clientes desde el backend
        const resClientes = await apiFetch(`${API_BASE}/api/clientes`);
        if (resClientes.ok) {
            const clientes = await resClientes.json();
            const selectClient = document.getElementById('q-client');
            if (selectClient) {
                selectClient.innerHTML = '<option value="">Seleccione un cliente...</option>';
                clientes.forEach(c => {
                    const id = c.idCliente || c.id_cliente || c.id;
                    const nombre = c.empresa || c.nombre || '';
                    selectClient.add(new Option(nombre, id));
                });
            }
        }

        // 2. Cargar Asesores / Usuarios desde el backend
        const resUsuarios = await apiFetch(`${API_BASE}/api/usuarios`);
        if (resUsuarios.ok) {
            const usuarios = await resUsuarios.json();
            const selectAgent = document.getElementById('q-agent');
            if (selectAgent) {
                selectAgent.innerHTML = '<option value="">Seleccione un asesor...</option>';
                usuarios.forEach(u => {
                    const id = u.idUsuario || u.id_usuario || u.id;
                    const nombre = u.nombreCompleto || u.nombre || u.correo;
                    selectAgent.add(new Option(nombre, id));
                });
            }
        }
    } catch (error) {
        console.error("Error al cargar los catálogos en el formulario:", error);
    }
}

async function cargarProductosDesdeBD() {
  try {
    const response = await apiFetch(`${API_BASE}/api/productos`);
    if (!response.ok) throw new Error('Error al obtener productos');

    const productos = await response.json();
    const tableBody = document.querySelector("#view-inventario tbody");
    if (!tableBody) return;

    // Si no hay productos en la BD, mostramos el mensaje amigable
    if (!productos || productos.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px; color: #666;">No hay productos registrados.</td></tr>`;
      return;
    }

    // Si sí hay productos, los dibujamos en la tabla
    tableBody.innerHTML = productos.map(p => `
      <tr data-resource="productos" data-id="${escapeHTML(p.codigoProducto)}">
        <td><code>${escapeHTML(p.codigoProducto)}</code></td>
        <td><strong>${escapeHTML(p.producto)}</strong></td>
        <td>${escapeHTML(p.categoria)}</td>
        <td>${escapeHTML(p.marca)}</td>
        <td>${escapeHTML(p.origen)}</td>
        <td><strong>${escapeHTML(p.stock)}</strong></td>
        <td>${escapeHTML(p.minStock)}</td>
        <td><span class="text-secure">$${escapeHTML(p.precioCompra)}</span></td>
        <td><strong>$${escapeHTML(p.precioVenta)}</strong></td>
        <td>${escapeHTML(p.ubicacion)}</td>
        <td>
          <button class="btn-icon" title="Editar" onclick="editRow(this)"><i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i></button>
          <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)"><i class="fa-solid fa-trash" style="color: #e74c3c;"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error("Error al cargar productos desde la BD:", error);
    const tableBody = document.querySelector("#view-inventario tbody");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px; color: #e74c3c;">Error al conectar con el servidor.</td></tr>`;
    }
  }
}

// --- CARGAR CLIENTES DESDE LA BASE DE DATOS ---
async function cargarClientesDesdeBD() {
    try {
        const response = await apiFetch(`${API_BASE}/api/clientes`);
        if (!response.ok) throw new Error('Error al obtener clientes');

        const clientes = await response.json();
        const tbody = document.querySelector("#view-clientes-tbody");
        if (!tbody) return;

        // Si la base de datos no regresa ningún cliente, mostramos el mensaje correcto
        if (!clientes || clientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">No hay clientes registrados.</td></tr>`;
            return;
        }

        // Si sí hay clientes, los pintamos en la tabla con sus campos reales
        tbody.innerHTML = clientes.map(c => `
            <tr data-resource="clientes" data-id="${c.idCliente}">
                <td><strong>${escapeHTML(c.empresa)}</strong></td>
                <td>${escapeHTML(c.contacto)}</td>
                <td>${escapeHTML(c.puesto)}</td>
                <td>${escapeHTML(c.telefono)}</td>
                <td>${escapeHTML(c.correo)}</td>
                <td>${escapeHTML(c.ciudad)}</td>
                <td><span class="badge badge-blue">${escapeHTML(c.tipoCliente)}</span></td>
                <td><span class="badge badge-success">${escapeHTML(c.estado || 'Activo')}</span></td>
                <td>
                    <button class="btn-icon" title="Editar" onclick="editRow(this)"><i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i></button>
                    <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)"><i class="fa-solid fa-trash" style="color: #e74c3c;"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error al cargar clientes:", error);
        const tbody = document.querySelector("#view-clientes-tbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #e74c3c;">Error al conectar con el servidor.</td></tr>`;
        }
    }
}
