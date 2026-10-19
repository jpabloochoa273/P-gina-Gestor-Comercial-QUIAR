// --- funciones navegador y login ---
function showAdminApp() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("admin-app").classList.remove("hidden");
}

function switchTab(viewId, element) {
  document
    .querySelectorAll(".tab-view")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));

  document.getElementById("view-" + viewId).classList.add("active");
  element.classList.add("active");
}

// --- buscador global en tiempo real ---
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".topbar-search input");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      
      // Buscar la pestaña que está activa actualmente
      const activeView = document.querySelector(".tab-view.active");
      if (!activeView) return;

      // Encontrar todas las filas de las tablas dentro de la pestaña activa
      const rows = activeView.querySelectorAll("tbody tr");

      rows.forEach((row) => {
        const rowText = row.textContent.toLowerCase();
        // Si el texto de la fila incluye lo que se escribió, se muestra; si no, se oculta
        if (rowText.includes(searchTerm)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  }
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

// --- FUNCIÓN PARA AGREGAR NUEVO PRODUCTO A LA TABLA ---
function addNewProduct(event) {
  event.preventDefault();

  // Capturar los valores del formulario
  const sku = document.getElementById("p-sku").value;
  const name = document.getElementById("p-name").value;
  const category = document.getElementById("p-category").value;
  const brand = document.getElementById("p-brand").value;
  const stock = document.getElementById("p-stock").value;
  const minStock = document.getElementById("p-min").value;
  const buyPrice = document.getElementById("p-buy").value;
  const sellPrice = document.getElementById("p-sell").value;
  const origin = document.getElementById("p-origin").value; // Capturar el origen seleccionado
  const location = document.getElementById("p-location").value;

  // Seleccionar el cuerpo de la tabla de inventario
  const tableBody = document.querySelector("#view-inventario tbody");
  if (!tableBody) return;

  // Crear la nueva fila con la estructura HTML de la tabla
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><code>${sku}</code></td>
    <td>${name}</td>
    <td>${category}</td>
    <td>${brand}</td>
    <td>${origin}</td>
    <td><strong>${stock}</strong></td>
    <td>${minStock}</td>
    <td><span class="text-secure">${buyPrice}</span></td>
    <td><strong>${sellPrice}</strong></td>
    <td>${location}</td>
    <td>
      <button class="btn-icon" title="Editar" onclick="editRow(this)">
        <i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i>
      </button>
      <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)">
        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
      </button>
    </td>
  `;

  // Insertar la nueva fila al principio de la tabla
  tableBody.prepend(newRow);

  // Cerrar el modal y limpiar formulario
  closeProductModal();
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

// --- FUNCIÓN PARA AGREGAR NUEVO CLIENTE A LA TABLA ---
function addNewClient(event) {
  event.preventDefault();

  // Capturar valores
  const name = document.getElementById("c-name").value;
  const rfc = document.getElementById("c-rfc").value;
  const segment = document.getElementById("c-segment").value;
  const type = document.getElementById("c-type").value;
  const contact = document.getElementById("c-contact").value;
  const email = document.getElementById("c-email").value;
  const credit = document.getElementById("c-credit").value;

  // Seleccionar la tabla de clientes
  const tableBody = document.querySelector("#view-clientes tbody");
  if (!tableBody) return;

  // Crear la fila
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><strong>${name}</strong></td>
    <td><code>${rfc}</code></td>
    <td>${segment}</td>
    <td><span class="badge badge-blue">${type}</span></td>
    <td>${contact}</td>
    <td>${email}</td>
    <td><strong>${credit}</strong></td>
    <!-- EL BOTÓN VA AQUÍ AL FINAL -->
    <td>
      <button class="btn-icon" title="Editar" onclick="editRow(this)">
        <i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i>
      </button>
      <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)">
        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
      </button>
    </td>
  `;

  // Insertar al inicio de la tabla
  tableBody.prepend(newRow);

  // Cerrar y limpiar
  closeClientModal();
}
// --- CONTROL DEL MODAL DE COTIZACIONES ---
function openQuoteModal() {
  const modal = document.getElementById("quote-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeQuoteModal() {
    currentRowEditing = null;
  const modal = document.getElementById("quote-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.getElementById("quote-form").reset();
  }
}

// --- FUNCIÓN PARA AGREGAR NUEVA COTIZACIÓN A LA TABLA ---
function addNewQuote(event) {
  event.preventDefault();

  const folio = document.getElementById("q-folio").value;
  const client = document.getElementById("q-client").value;
  const date = document.getElementById("q-date").value;
  const status = document.getElementById("q-status").value;
  const total = document.getElementById("q-total").value;
  const agent = document.getElementById("q-agent").value;

  const tableBody = document.querySelector("#view-cotizaciones tbody");
  if (!tableBody) return;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><code>${folio}</code></td>
    <td><strong>${client}</strong></td>
    <td>${date}</td>
    <td><span class="badge badge-blue">${status}</span></td>
    <td><strong>${total}</strong></td>
    <td>${agent}</td>
    <td>
      <button class="btn-icon" title="Editar" onclick="editRow(this)">
        <i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i>
      </button>
      <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)">
        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
      </button>
    </td>
  `;

  tableBody.prepend(newRow);
  closeQuoteModal();
}
// --- CONTROL DEL MODAL DE PROVEEDORES ---
function openSupplierModal() {
  const modal = document.getElementById("supplier-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeSupplierModal() {
    currentRowEditing = null;
  const modal = document.getElementById("supplier-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.getElementById("supplier-form").reset();
  }
}

// --- FUNCIÓN PARA AGREGAR NUEVO PROVEEDOR A LA TABLA ---
function addNewSupplier(event) {
  event.preventDefault();

  const name = document.getElementById("s-name").value;
  const rfc = document.getElementById("s-rfc").value;
  const category = document.getElementById("s-category").value;
  const contact = document.getElementById("s-contact").value;
  const email = document.getElementById("s-email").value;
  const phone = document.getElementById("s-phone").value;

  const tableBody = document.querySelector("#view-proveedores tbody");
  if (!tableBody) return;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><strong>${name}</strong></td>
    <td><code>${rfc}</code></td>
    <td>${category}</td>
    <td>${contact}</td>
    <td>${email}</td>
    <td>${phone}</td>
    <td>
      <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)">
        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
      </button>
    </td>
  `;

  tableBody.prepend(newRow);
  closeSupplierModal();
}
// --- CONTROL DEL MODAL DE ESPECIALISTAS ---
function openExpertModal() {
  const modal = document.getElementById("expert-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeExpertModal() {
    currentRowEditing = null;
  const modal = document.getElementById("expert-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.getElementById("expert-form").reset();
  }
}

// --- FUNCIÓN PARA AGREGAR NUEVO ESPECIALISTA A LA TABLA ---
function addNewExpert(event) {
  event.preventDefault();

  const name = document.getElementById("e-name").value;
  const specialty = document.getElementById("e-specialty").value;
  const level = document.getElementById("e-level").value;
  const status = document.getElementById("e-status").value;
  const email = document.getElementById("e-email").value;
  const phone = document.getElementById("e-phone").value;

  const tableBody = document.querySelector("#view-especialistas tbody");
  if (!tableBody) return;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><strong>${name}</strong></td>
    <td>${specialty}</td>
    <td><span class="badge badge-blue">${level}</span></td>
    <td><span class="badge badge-green">${status}</span></td>
    <td>${email}</td>
    <td>${phone}</td>
    <td>
      <button class="btn-icon" title="Editar" onclick="editRow(this)">
        <i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i>
      </button>
      <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)">
        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
      </button>
    </td>
  `;

  tableBody.prepend(newRow);
  closeExpertModal();
}

// --- CONTROL DEL MODAL DE SECTORES ---
function openSectorModal() {
  const modal = document.getElementById("sector-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeSectorModal() {
    currentRowEditing = null;
  const modal = document.getElementById("sector-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.getElementById("sector-form").reset();
  }
}

// --- FUNCIÓN PARA AGREGAR NUEVO SECTOR A LA TABLA ---
function addNewSector(event) {
  event.preventDefault();

  const name = document.getElementById("sec-name").value;
  const code = document.getElementById("sec-code").value;
  const description = document.getElementById("sec-desc").value;
  const lead = document.getElementById("sec-lead").value;
  const status = document.getElementById("sec-status").value;

  const tableBody = document.querySelector("#view-sectores tbody");
  if (!tableBody) return;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><code>${code}</code></td>
    <td><strong>${name}</strong></td>
    <td>${description}</td>
    <td>${lead}</td>
    <td><span class="badge badge-green">${status}</span></td>
    <td>
      <button class="btn-icon" title="Editar" onclick="editRow(this)">
        <i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i>
      </button>
      <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)">
        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
      </button>
    </td>
  `;

  tableBody.prepend(newRow);
  closeSectorModal();
}

// --- CONTROL DEL MODAL DE SERVICIOS ESPECIALIZADOS ---
function openServiceModal() {
  const modal = document.getElementById("service-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeServiceModal() {
    currentRowEditing = null;
  const modal = document.getElementById("service-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.getElementById("service-form").reset();
  }
}

// --- FUNCIÓN PARA AGREGAR NUEVO SERVICIO A LA TABLA ---
function addNewService(event) {
  event.preventDefault();

  const code = document.getElementById("srv-code").value;
  const name = document.getElementById("srv-name").value;
  const client = document.getElementById("srv-client").value;
  const expert = document.getElementById("srv-expert").value;
  const cost = document.getElementById("srv-cost").value;
  const status = document.getElementById("srv-status").value;

  const tableBody = document.querySelector("#view-servicios tbody");
  if (!tableBody) return;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><code>${code}</code></td>
    <td><strong>${name}</strong></td>
    <td>${client}</td>
    <td>${expert}</td>
    <td><strong>${cost}</strong></td>
    <td><span class="badge badge-blue">${status}</span></td>
    <td>
      <button class="btn-icon" title="Editar" onclick="editRow(this)">
        <i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i>
      </button>
      <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)">
        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
      </button>
    </td>
  `;

  tableBody.prepend(newRow);
  closeServiceModal();
}
// --- CONTROL DEL MODAL DE USUARIOS ---
function openUserModal() {
  const modal = document.getElementById("user-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeUserModal() {
    currentRowEditing = null;
  const modal = document.getElementById("user-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.getElementById("user-form").reset();
  }
}

function addNewUser(event) {
  event.preventDefault();

  const name = document.getElementById("u-name").value;
  const email = document.getElementById("u-email").value;
  const role = document.getElementById("u-role").value;
  const status = document.getElementById("u-status").value;

  const tableBody = document.querySelector("#table-users tbody");
  if (!tableBody) return;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><strong>${name}</strong></td>
    <td>${email}</td>
    <td>${role}</td>
    <td><span class="badge badge-success">${status}</span></td>
    <td>
      <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)">
        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
      </button>
    </td>
  `;

  tableBody.prepend(newRow);
  closeUserModal();
}

// --- CONTROL DEL MODAL DE ROLES ---
function openRoleModal() {
  const modal = document.getElementById("role-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeRoleModal() {
    currentRowEditing = null;
  const modal = document.getElementById("role-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.getElementById("role-form").reset();
  }
}

function addNewRole(event) {
  event.preventDefault();

  const name = document.getElementById("r-name").value;
  const desc = document.getElementById("r-desc").value;
  const perms = document.getElementById("r-perms").value;

  const tableBody = document.querySelector("#table-roles tbody");
  if (!tableBody) return;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><strong>${name}</strong></td>
    <td>${desc}</td>
    <td><span class="badge badge-navy">${perms}</span></td>
    <td>
      <button class="btn-icon" title="Editar" onclick="editRow(this)">
        <i class="fa-solid fa-pen-to-square" style="color: var(--gold-color, #d4af37);"></i>
      </button>
      <button class="btn-icon" title="Eliminar" onclick="deleteRow(this)">
        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
      </button>
    </td>
  `;

  tableBody.prepend(newRow);
  closeRoleModal();
}
// --- FUNCIÓN GLOBAL PARA ELIMINAR REGISTROS ---
function deleteRow(button) {
  // Buscar la fila (tr) más cercana al botón presionado y eliminarla
  const row = button.closest("tr");
  if (row) {
    // Opcional: una confirmación rápida antes de borrar
    if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      row.remove();
    }
  }
}
// --- VARIABLE GLOBAL PARA RASTREAR LA FILA EN EDICIÓN ---
let currentRowEditing = null;

// --- FUNCIÓN GLOBAL EDITAR ---
function editRow(button) {
  currentRowEditing = button.closest("tr");
  if (!currentRowEditing) return;

  const cells = currentRowEditing.querySelectorAll("td");
  const currentSection = button.closest("section").id;

  if (currentSection === "view-inventario") {
    document.getElementById("p-sku").value = cells[0].textContent.trim();
    document.getElementById("p-name").value = cells[1].textContent.trim();
    document.getElementById("p-category").value = cells[2].textContent.trim();
    document.getElementById("p-brand").value = cells[3].textContent.trim();
    document.getElementById("p-origin").value = cells[4].textContent.trim();
    document.getElementById("p-stock").value = cells[5].textContent.trim();
    document.getElementById("p-min").value = cells[6].textContent.trim();
    document.getElementById("p-buy").value = cells[7].textContent.trim();
    document.getElementById("p-sell").value = cells[8].textContent.trim();
    document.getElementById("p-location").value = cells[9].textContent.trim();
    openProductModal();
  } 
  else if (currentSection === "view-clientes") {
    document.getElementById("c-name").value = cells[0].textContent.trim();
    document.getElementById("c-rfc").value = cells[1].textContent.trim();
    document.getElementById("c-segment").value = cells[2].textContent.trim();
    document.getElementById("c-type").value = cells[3].textContent.trim();
    document.getElementById("c-contact").value = cells[4].textContent.trim();
    document.getElementById("c-email").value = cells[5].textContent.trim();
    document.getElementById("c-credit").value = cells[6].textContent.trim();
    openClientModal();
  }
  else if (currentSection === "view-cotizaciones") {
    document.getElementById("q-folio").value = cells[0].textContent.trim();
    document.getElementById("q-client").value = cells[1].textContent.trim();
    document.getElementById("q-date").value = cells[2].textContent.trim();
    document.getElementById("q-status").value = cells[3].textContent.trim();
    document.getElementById("q-total").value = cells[4].textContent.trim();
    document.getElementById("q-agent").value = cells[5].textContent.trim();
    openQuoteModal();
  }
  else if (currentSection === "view-proveedores") {
    document.getElementById("prov-name").value = cells[0].textContent.trim();
    document.getElementById("prov-rfc").value = cells[1].textContent.trim();
    document.getElementById("prov-category").value = cells[2].textContent.trim();
    document.getElementById("prov-contact").value = cells[3].textContent.trim();
    document.getElementById("prov-email").value = cells[4].textContent.trim();
    document.getElementById("prov-phone").value = cells[5].textContent.trim();
    openSupplierModal();
  }
  else if (currentSection === "view-especialistas") {
    document.getElementById("e-name").value = cells[0].textContent.trim();
    document.getElementById("e-specialty").value = cells[1].textContent.trim();
    document.getElementById("e-level").value = cells[2].textContent.trim();
    document.getElementById("e-status").value = cells[3].textContent.trim();
    document.getElementById("e-email").value = cells[4].textContent.trim();
    document.getElementById("e-phone").value = cells[5].textContent.trim();
    openExpertModal();
  }
  else if (currentSection === "view-sectores") {
    document.getElementById("sec-code").value = cells[0].textContent.trim();
    document.getElementById("sec-name").value = cells[1].textContent.trim();
    document.getElementById("sec-desc").value = cells[2].textContent.trim();
    document.getElementById("sec-lead").value = cells[3].textContent.trim();
    document.getElementById("sec-status").value = cells[4].textContent.trim();
    openSectorModal();
  }
  else if (currentSection === "view-servicios") {
    document.getElementById("srv-code").value = cells[0].textContent.trim();
    document.getElementById("srv-name").value = cells[1].textContent.trim();
    document.getElementById("srv-client").value = cells[2].textContent.trim();
    document.getElementById("srv-expert").value = cells[3].textContent.trim();
    document.getElementById("srv-cost").value = cells[4].textContent.trim();
    document.getElementById("srv-status").value = cells[5].textContent.trim();
    openServiceModal();
  }
  else if (currentSection === "view-roles") {
    // Si la edición viene de la tabla de usuarios
    const userTable = button.closest("#table-users");
    if (userTable) {
      document.getElementById("u-name").value = cells[0].textContent.trim();
      document.getElementById("u-email").value = cells[1].textContent.trim();
      document.getElementById("u-role").value = cells[2].textContent.trim();
      document.getElementById("u-status").value = cells[3].textContent.trim();
      openUserModal();
    } else {
      // Si la edición viene de la tabla de roles
      document.getElementById("r-name").value = cells[0].textContent.trim();
      document.getElementById("r-desc").value = cells[1].textContent.trim();
      document.getElementById("r-perms").value = cells[2].textContent.trim();
      openRoleModal();
    }
  }
}