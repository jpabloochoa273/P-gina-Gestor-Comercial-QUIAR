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

// --- BUSCADOR GLOBAL Y CARGA INICIAL ---
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
  
  // 🚀 TODAS LAS TABLAS SE CARGAN AQUí AUTOMÁTICAMENTE AL RECARGAR
  obtenerCotizaciones();
  cargarProductosDesdeBD();
  cargarClientesDesdeBD();
  cargarSectoresDesdeBD();
  cargarProveedoresDesdeBD();
  cargarEspecialistasDesdeBD();
  cargarServiciosDesdeBD();
  cargarUsuariosDesdeBD();
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
// --- REGISTRAR NUEVO CLIENTE (CAPTURA POR POSICIÓN EN MODAL) ---
async function addNewClient(event) {
    if (event) event.preventDefault();

    const modal = document.getElementById('client-modal');
    if (!modal) {
        alert('No se encontró el modal de clientes.');
        return;
    }

    // Capturamos todos los inputs y selects dentro del modal en el orden en que aparecen
    const campos = modal.querySelectorAll('input, select');
    
    const clientData = {
        empresa: campos[0]?.value || '',
        contacto: campos[1]?.value || '',
        puesto: campos[2]?.value || '',
        telefono: campos[3]?.value || '',
        correo: campos[4]?.value || '',
        ciudad: campos[5]?.value || '',
        tipoCliente: campos[6]?.value || 'Corporativo',
        estado: campos[7]?.value || 'Activo'
    };

    console.log("📦 Datos que se enviarán al servidor:", clientData);

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Cliente registrado exitosamente en la base de datos!');
            closeClientModal();     // Cierra el modal y limpia
            cargarClientesDesdeBD(); // Recarga la tabla
        } else {
            alert('Error al registrar cliente: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error de red al registrar cliente:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}
// --- REGISTRAR NUEVO PRODUCTO (CAPTURA POR POSICIÓN EN MODAL) ---
async function addNewProduct(event) {
    if (event) event.preventDefault();

    const limpiarPrecio = (valor) => {
        if (!valor) return 0;
        return parseFloat(String(valor).replace(/[^0-9.-]+/g, "")) || 0;
    };

    const productData = {
        codigoProducto: document.getElementById('p-sku')?.value || '',
        producto: document.getElementById('p-name')?.value || '',
        categoria: document.getElementById('p-category')?.value || '',
        marca: document.getElementById('p-brand')?.value || '',
        stock: parseInt(document.getElementById('p-stock')?.value) || 0,
        minStock: parseInt(document.getElementById('p-min')?.value) || 0,
        precioCompra: limpiarPrecio(document.getElementById('p-buy')?.value),
        precioVenta: limpiarPrecio(document.getElementById('p-sell')?.value),
        origen: document.getElementById('p-origin')?.value || 'Nacional',
        ubicacion: document.getElementById('p-location')?.value || ''
    };

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Producto registrado exitosamente en la base de datos!');
            closeProductModal();
            cargarProductosDesdeBD();
        } else {
            alert('Error al registrar producto: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error de red al registrar producto:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}
// --- REGISTRAR NUEVO SECTOR INDUSTRIAL ---
async function addNewSector(event) {
    if (event) event.preventDefault();

    const sectorData = {
        nombreSector: document.getElementById('sec-name')?.value || '',
        clave: document.getElementById('sec-code')?.value || '',
        descripcion: document.getElementById('sec-desc')?.value || '',
        lider: document.getElementById('sec-lead')?.value || '',
        estado: document.getElementById('sec-status')?.value || 'Activo'
    };

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/sectores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sectorData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Sector industrial registrado exitosamente!');
            closeSectorModal();     // Cierra el modal y limpia el formulario
            // cargarSectoresDesdeBD(); // Descomenta si tienes tu función para recargar la tabla
        } else {
            alert('Error al registrar sector: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error de red al registrar sector:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}
// --- CARGAR SECTORES DESDE LA BD ---
async function cargarSectoresDesdeBD() {
    try {
        const respuesta = await apiFetch(`${API_BASE}/api/sectores`);
        const sectores = await respuesta.json();
        
        const tbody = document.getElementById('sectores-tbody');
        if (!tbody) return;

        if (!Array.isArray(sectores) || sectores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No hay sectores registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        sectores.forEach(sec => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${sec.clave || 'SEC-001'}</td>
                <td><strong>${sec.nombreSector || sec.nombre || ''}</strong></td>
                <td>${sec.descripcion || 'Sin descripción'}</td>
                <td>${sec.lider || 'No asignado'}</td>
                <td><span class="badge badge-success">${sec.estado || 'Activo'}</span></td>
                <td>
                    <button class="btn-icon" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon text-danger" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar sectores:", error);
    }
}

// --- REGISTRAR NUEVO SECTOR INDUSTRIAL ---
async function addNewSector(event) {
    if (event) event.preventDefault();

    const sectorData = {
        nombreSector: document.getElementById('sec-name')?.value || '',
        clave: document.getElementById('sec-code')?.value || '',
        descripcion: document.getElementById('sec-desc')?.value || '',
        lider: document.getElementById('sec-lead')?.value || '',
        estado: document.getElementById('sec-status')?.value || 'Activo'
    };

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/sectores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sectorData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Sector industrial registrado exitosamente!');
            closeSectorModal();      // Cierra el modal y limpia
            cargarSectoresDesdeBD(); // Recarga la tabla automáticamente para que aparezca
        } else {
            alert('Error al registrar sector: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error de red al registrar sector:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}
// --- CARGAR PROVEEDORES DESDE LA BD ---
async function cargarProveedoresDesdeBD() {
    try {
        const respuesta = await apiFetch(`${API_BASE}/api/proveedores`);
        const proveedores = await respuesta.json();
        
        const tbody = document.getElementById('proveedores-tbody');
        if (!tbody) return;

        if (!Array.isArray(proveedores) || proveedores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No hay proveedores registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        proveedores.forEach(prov => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${prov.nombreProveedor || prov.nombre || ''}</strong></td>
                <td>${prov.rfc || ''}</td>
                <td>${prov.categoria || ''}</td>
                <td>${prov.contacto || ''}</td>
                <td>${prov.correo || ''}</td>
                <td>${prov.telefono || ''}</td>
                <td>
                    <button class="btn-icon" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon text-danger" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar proveedores:", error);
    }
}

async function addNewSupplier(event) {
    if (event) event.preventDefault();
    console.log("Ejecutando registro de proveedor..."); // Para probar en consola

    const supplierData = {
        nombreProveedor: document.getElementById('s-name')?.value || '',
        rfc: document.getElementById('s-rfc')?.value || '',
        contacto: document.getElementById('s-contact')?.value || '',
        telefono: document.getElementById('s-phone')?.value || '',
        correo: document.getElementById('s-email')?.value || '',
        paisOrigen: document.getElementById('s-pais')?.value || '',
        tipoProveedor: document.getElementById('s-tipo')?.value || '',
        estado: document.getElementById('s-estado')?.value || 'Activo'
    };

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/proveedores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplierData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Proveedor registrado exitosamente!');
            closeSupplierModal();      
            cargarProveedoresDesdeBD(); 
        } else {
            alert('Error al registrar proveedor: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error de red al registrar proveedor:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}
// --- CARGAR PROVEEDORES DESDE LA BD ---
async function cargarProveedoresDesdeBD() {
    try {
        const respuesta = await apiFetch(`${API_BASE}/api/proveedores`);
        const proveedores = await respuesta.json();
        
        const tbody = document.getElementById('proveedores-tbody');
        if (!tbody) return;

        if (!Array.isArray(proveedores) || proveedores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">No hay proveedores registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        proveedores.forEach(prov => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${prov.nombreproveedor || prov.nombreProveedor || ''}</strong></td>
                <td>${prov.rfc || ''}</td>
                <td>${prov.contacto || ''}</td>
                <td>${prov.telefono || ''}</td>
                <td>${prov.correo || ''}</td>
                <td>${prov.paisorigen || prov.paisOrigen || ''}</td>
                <td>${prov.tipoproveedor || prov.tipoProveedor || ''}</td>
                <td><span class="badge badge-success">${prov.estado || 'Activo'}</span></td>
                <td>
                    <button class="btn-icon" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon text-danger" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar proveedores:", error);
    }
}
// --- REGISTRAR NUEVO ESPECIALISTA ---
async function addNewExpert(event) {
    if (event) event.preventDefault();

    // Verificamos los IDs exactos de los inputs del modal
    const specialistData = {
        nombre: document.getElementById('esp-name')?.value || document.getElementById('nombre-especialista')?.value || '',
        especialidad: document.getElementById('esp-area')?.value || document.getElementById('especialidad-especialista')?.value || '',
        nivel: document.getElementById('esp-level')?.value || document.getElementById('nivel-especialista')?.value || '',
        estado: document.getElementById('esp-status')?.value || document.getElementById('estado-especialista')?.value || 'Disponible',
        correo: document.getElementById('esp-email')?.value || document.getElementById('correo-especialista')?.value || '',
        telefono: document.getElementById('esp-phone')?.value || document.getElementById('telefono-especialista')?.value || ''
    };

    console.log("Datos a enviar al backend:", specialistData); // Para depurar

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/especialistas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(specialistData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Especialista registrado exitosamente!');
            closeSpecialistModal(); 
            if (typeof cargarEspecialistasDesdeBD === 'function') {
                cargarEspecialistasDesdeBD(); 
            }
        } else {
            alert('Error al registrar especialista: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error al registrar especialista:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}


// --- CERRAR MODAL DE ESPECIALISTAS ---
function closeSpecialistModal() {
    const modal = document.getElementById('specialist-modal') || document.getElementById('modal-especialista');
    if (modal) {
        modal.style.display = 'none';
    }
    // Limpiar el formulario si existe
    const form = document.getElementById('specialist-form') || document.querySelector('#specialist-modal form');
    if (form) form.reset();
}

// --- REGISTRAR NUEVO ESPECIALISTA ---
async function addNewExpert(event) {
    if (event) event.preventDefault();

    const specialistData = {
        nombre: document.getElementById('e-name')?.value || '',
        especialidad: document.getElementById('e-specialty')?.value || '',
        nivel: document.getElementById('e-level')?.value || 'Sénior / Certificado',
        estado: document.getElementById('e-status')?.value || document.getElementById('e-estado')?.value || 'Disponible',
        correo: document.getElementById('e-email')?.value || document.getElementById('e-correo')?.value || '',
        telefono: document.getElementById('e-phone')?.value || document.getElementById('e-telefono')?.value || ''
    };

    console.log("Datos listos para enviar:", specialistData);

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/especialistas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(specialistData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Especialista registrado exitosamente!');
            closeExpertModal(); // Nota: tu botón usa closeExpertModal() según el HTML
            if (typeof cargarEspecialistasDesdeBD === 'function') {
                cargarEspecialistasDesdeBD(); 
            }
        } else {
            alert('Error al registrar especialista: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error al registrar especialista:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}
// --- CARGAR ESPECIALISTAS DESDE LA BD ---
async function cargarEspecialistasDesdeBD() {
    try {
        const respuesta = await apiFetch(`${API_BASE}/api/especialistas`);
        const especialistas = await respuesta.json();
        
        // AQUÍ VEREMOS LOS DATOS EXACTOS EN LA CONSOLA
        console.log("Datos recibidos de especialistas:", especialistas);
        
        const tbody = document.getElementById('especialistas-tbody');
        if (!tbody) return;

        if (!Array.isArray(especialistas) || especialistas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No hay especialistas registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        especialistas.forEach(esp => {
            // Buscamos en cualquier variante posible (minúsculas, mayúsculas, etc.)
            const nombre = esp.nombre || esp.Nombre || esp.nombre_completo || '';
            const especialidad = esp.especialidad || esp.Especialidad || '';
            const nivel = esp.nivel || esp.Nivel || '';
            const estado = esp.estado || esp.Estado || esp.estatus || 'Disponible';
            const correo = esp.correo || esp.Correo || '';
            const telefono = esp.telefono || esp.Telefono || '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${nombre}</strong></td>
                <td>${especialidad}</td>
                <td>${nivel}</td>
                <td><span class="badge badge-success">${estado}</span></td>
                <td>${correo}</td>
                <td>${telefono}</td>
                <td>
                    <button class="btn-icon" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon text-danger" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar especialistas:", error);
    }
}
// --- REGISTRAR NUEVO SERVICIO ESPECIALIZADO ---
async function addNewService(event) {
    if (event) event.preventDefault();

    const serviceData = {
        codigo: document.getElementById('srv-code')?.value || '',
        servicio: document.getElementById('srv-name')?.value || '',
        cliente: document.getElementById('srv-client')?.value || '',
        especialista: document.getElementById('srv-expert')?.value || '',
        descripcionRequerimiento: document.getElementById('srv-desc')?.value || document.getElementById('srv-name')?.value || 'Sin descripción',
        costo: document.getElementById('srv-cost')?.value || 0,
        estado: document.getElementById('srv-status')?.value || 'Programado'
    };

    console.log("Datos de servicio a enviar:", serviceData);

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/servicios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serviceData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Servicio registrado exitosamente!');
            closeServiceModal(); 
            if (typeof cargarServiciosDesdeBD === 'function') {
                cargarServiciosDesdeBD(); 
            }
        } else {
            alert('Error al registrar servicio: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error al registrar servicio:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}
async function cargarServiciosDesdeBD() {
    try {
        const respuesta = await apiFetch(`${API_BASE}/api/servicios`);
        const servicios = await respuesta.json();
        
        const tbody = document.getElementById('servicios-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = ''; // Limpiamos la tabla
        
        servicios.forEach(serv => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${serv.codigo || ''}</td>
                <td>${serv.servicio || serv.descripcionRequerimiento || ''}</td>
                <td>${serv.cliente || 'N/A'}</td>
                <td>${serv.especialista || 'N/A'}</td>
                <td>$${serv.costo || 0}</td>
                <td><span class="badge">${serv.estado || 'Programado'}</span></td>
                <td><!-- Acciones --></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar servicios:", error);
    }
}
// --- REGISTRAR NUEVO USUARIO DESDE EL PANEL DE ADMINISTRACIÓN ---
async function addNewUser(event) {
    if (event) event.preventDefault();

    const userData = {
        nombreCompleto: document.getElementById('u-name')?.value || '',
        correo: document.getElementById('u-email')?.value || '',
        idRol: document.getElementById('u-role')?.value || '1',
        estado: document.getElementById('u-status')?.value || 'Activo'
    };

    try {
        const respuesta = await apiFetch(`${API_BASE}/api/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Usuario registrado exitosamente en la base de datos!');
            closeUserModal();         
            cargarUsuariosDesdeBD();   
        } else {
            alert('Error al registrar usuario: ' + (resultado.error || 'Verifica los datos'));
        }
    } catch (error) {
        console.error("Error de red al registrar usuario:", error);
        alert('No se pudo conectar con el servidor backend.');
    }
}

// --- CARGAR USUARIOS DESDE LA BD PARA LA TABLA DE LA SECCIÓN ---
async function cargarUsuariosDesdeBD() {
    try {
        const respuesta = await apiFetch(`${API_BASE}/api/usuarios`);
        const usuarios = await respuesta.json();
        
        // Asegúrate de que tu tabla en la sección de Roles/Usuarios tenga un tbody con id="usuarios-tbody"
        const tbody = document.getElementById('usuarios-tbody');
        if (!tbody) return;

        if (!Array.isArray(usuarios) || usuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No hay usuarios registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        usuarios.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHTML(u.nombreCompleto || '')}</strong></td>
                <td>${escapeHTML(u.correo || '')}</td>
                <td>${escapeHTML(u.nombreRol || 'Asignado')}</td>
                <td><span class="badge badge-success">${escapeHTML(u.estado || 'Activo')}</span></td>
                <td>
                    <button class="btn-icon" title="Editar"><i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i></button>
                    <button class="btn-icon text-danger" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }
}