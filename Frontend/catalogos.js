// Persistencia compartida por los formularios de administracion.
const recursos = {
    productos: { id: 'codigoProducto', view: 'inventario', form: 'product-form', modal: 'product-modal', fields: { codigoProducto:'p-sku', producto:'p-name', categoria:'p-category', marca:'p-brand', stock:'p-stock', minStock:'p-min', precioCompra:'p-buy', precioVenta:'p-sell', origen:'p-origin', ubicacion:'p-location' }, numeric:['stock','minStock','precioCompra','precioVenta'] },
    clientes: { id:'idCliente', view:'clientes', form:'client-form', modal:'client-modal', fields:{empresa:'c-empresa',contacto:'c-contacto',puesto:'c-puesto',telefono:'c-telefono',correo:'c-correo',ciudad:'c-ciudad',tipoCliente:'c-tipo',estado:'c-estado'} },
    proveedores: { id:'idProveedor', view:'proveedores', form:'supplier-form', modal:'supplier-modal', fields:{nombreProveedor:'s-name',rfc:'s-rfc',tipoProveedor:'s-tipo',contacto:'s-contact',correo:'s-email',telefono:'s-phone',paisOrigen:'s-pais',estado:'s-estado'}, columns:['nombreProveedor','rfc','contacto','telefono','correo','paisOrigen','tipoProveedor','estado'] },
    especialistas: { id:'idEspecialista',view:'especialistas',form:'expert-form',modal:'expert-modal',fields:{nombre:'e-name',especialidad:'e-specialty',nivel:'e-level',estado:'e-status',correo:'e-email',telefono:'e-phone'},columns:['nombre','especialidad','nivel','estado','correo','telefono'] },
    sectores: {id:'idSector',view:'sectores',form:'sector-form',modal:'sector-modal',fields:{nombreSector:'sec-name',codigo:'sec-code',descripcion:'sec-desc',responsable:'sec-lead',estado:'sec-status'},columns:['codigo','nombreSector','descripcion','responsable','estado']},
    servicios: {id:'idServicio',view:'servicios',form:'service-form',modal:'service-modal',fields:{codigo:'srv-code',descripcionRequerimiento:'srv-name',idCliente:'srv-client',idEspecialista:'srv-expert',costo:'srv-cost',estado:'srv-status'},numeric:['costo'],columns:['codigo','descripcionRequerimiento','nombreCliente','nombreEspecialista','costo','estado']},
    usuarios: {id:'idUsuario',view:'roles',form:'user-form',modal:'user-modal',table:'#table-users tbody',fields:{nombreCompleto:'u-name',correo:'u-email',idRol:'u-role',estado:'u-status'},columns:['nombreCompleto','correo','nombreRol','estado']},
    roles: {id:'idRol',view:'roles',form:'role-form',modal:'role-modal',table:'#table-roles tbody',fields:{nombreRol:'r-name',descripcion:'r-desc',permisos:'r-perms'},columns:['nombreRol','descripcion','permisos']}
};

async function guardarRecurso(event, resource) {
    event.preventDefault();
    const config = recursos[resource];
    const form = document.getElementById(config.form);
    if (form.dataset.saving) return;
    const data = {};
    for (const [field, inputId] of Object.entries(config.fields)) {
        const value = document.getElementById(inputId).value.trim();
        data[field] = config.numeric?.includes(field) ? Number(value.replace(/[$,\s]|MXN/gi,'')) : value;
    }
    const recordId = form.dataset.recordId;
    form.dataset.saving = 'true';
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
        await apiFetch(`${API_BASE}/api/${resource}${recordId ? '/' + encodeURIComponent(recordId) : ''}`, {
            method: recordId ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
        });
        document.getElementById(config.modal).classList.add('hidden');
        form.reset();
        delete form.dataset.recordId;
        if (resource === 'productos') document.getElementById('p-sku').disabled = false;
        alert(recordId ? 'Registro actualizado correctamente.' : 'Registro guardado correctamente.');
        await recargarRecurso(resource);
        if (['clientes','usuarios','roles','especialistas'].includes(resource)) await cargarCatalogos();
    } catch (error) { alert(error.message); }
    finally { delete form.dataset.saving; if (submit) submit.disabled = false; }
}

function addNewSupplier(event) { return guardarRecurso(event, 'proveedores'); }
function addNewExpert(event) { return guardarRecurso(event, 'especialistas'); }
function addNewSector(event) { return guardarRecurso(event, 'sectores'); }
function addNewService(event) { return guardarRecurso(event, 'servicios'); }
function addNewUser(event) { return guardarRecurso(event, 'usuarios'); }
function addNewRole(event) { return guardarRecurso(event, 'roles'); }

const catalogData = {};
async function recargarRecurso(resource) {
    if (resource === 'productos') return cargarProductosDesdeBD();
    if (resource === 'clientes') return cargarClientesDesdeBD();
    const response = await apiFetch(`${API_BASE}/api/${resource}`);
    catalogData[resource] = await response.json();
    renderCatalogo(resource);
}

function renderCatalogo(resource) {
    const config = recursos[resource];
    const tbody = document.querySelector(config.table || `#view-${config.view} tbody`);
    if (!tbody) return;
    tbody.replaceChildren();
    const rows = catalogData[resource] || [];
    for (const record of rows) {
        const row = document.createElement('tr');
        row.dataset.resource = resource;
        row.dataset.id = record[config.id];
        for (const field of config.columns) {
            const cell = document.createElement('td');
            let value = record[field];
            if (field === 'nombreRol') value = catalogData.roles?.find(role => role.idRol === record.idRol)?.nombreRol;
            if (field === 'nombreCliente') value = catalogData.clientes?.find(client => client.idCliente === record.idCliente)?.empresa;
            if (field === 'nombreEspecialista') value = catalogData.especialistas?.find(expert => expert.idEspecialista === record.idEspecialista)?.nombre;
            cell.textContent = value ?? '';
            row.append(cell);
        }
        const actions = document.createElement('td');
        for (const [label, handler] of [['Editar',editRow],['Eliminar',deleteRow]]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = label === 'Eliminar' ? 'btn-icon text-danger' : 'btn-icon';
            button.title = label;
            button.setAttribute('aria-label', label);
            const icon = document.createElement('i');
            icon.className = label === 'Eliminar' ? 'fa-solid fa-trash' : 'fa-solid fa-pen-to-square';
            icon.style.color = label === 'Eliminar' ? '#e74c3c' : 'var(--gold-color, #d4af37)';
            icon.setAttribute('aria-hidden', 'true');
            button.append(icon);
            button.addEventListener('click', () => handler(button)); actions.append(button);
        }
        row.append(actions); tbody.append(row);
    }
    if (!rows.length) {
        const row = tbody.insertRow(); const cell = row.insertCell();
        cell.colSpan = config.columns.length + 1; cell.textContent = 'No hay registros.';
    }
}

function opciones(inputId, records, key, label) {
    let select = document.getElementById(inputId);
    if (!select) return;
    const previous = select.value;
    if (select.tagName !== 'SELECT') {
        const replacement = document.createElement('select');
        replacement.id = select.id; replacement.className = select.className; replacement.required = select.required;
        select.replaceWith(replacement); select = replacement;
    }
    select.replaceChildren(new Option('Selecciona una opcion...', ''));
    for (const record of records) select.add(new Option(record[label], record[key]));
    select.value = previous;
}

async function cargarCatalogos() {
    const resources = ['roles','usuarios','proveedores','especialistas','sectores','servicios','clientes'];
    const results = await Promise.allSettled(resources.map(async resource => {
        const response = await apiFetch(`${API_BASE}/api/${resource}`);
        catalogData[resource] = await response.json();
    }));
    for (let i=0; i<results.length; i++) {
        if (results[i].status === 'rejected') {
            console.error(`No se pudo cargar ${resources[i]}:`, results[i].reason.message);
            const config = recursos[resources[i]];
            const tbody = config.columns && document.querySelector(config.table || `#view-${config.view} tbody`);
            if (tbody) { tbody.replaceChildren(); const cell = tbody.insertRow().insertCell(); cell.colSpan = config.columns.length + 1; cell.textContent = results[i].reason.message; }
        } else if (recursos[resources[i]].columns) renderCatalogo(resources[i]);
    }
    opciones('u-role',catalogData.roles || [],'idRol','nombreRol');
    opciones('srv-client',catalogData.clientes || [],'idCliente','empresa');
    opciones('srv-expert',catalogData.especialistas || [],'idEspecialista','nombre');
}

async function editRow(button) {
    const row = button.closest('tr');
    if (!row?.dataset.id) return;
    const resource = row.dataset.resource;
    if (!resource) return editarCotizacion(button);
    const config = recursos[resource];
    try {
        const response = await apiFetch(`${API_BASE}/api/${resource}`);
        const record = (await response.json()).find(item => String(item[config.id]) === row.dataset.id);
        if (!record) throw new Error('Registro no encontrado.');
        const form = document.getElementById(config.form);
        form.dataset.recordId = row.dataset.id;
        for (const [field,inputId] of Object.entries(config.fields)) document.getElementById(inputId).value = record[field] ?? '';
        if (resource === 'productos') document.getElementById('p-sku').disabled = true;
        document.getElementById(config.modal).classList.remove('hidden');
    } catch (error) { alert(error.message); }
}

async function deleteRow(button) {
    const row = button.closest('tr');
    const resource = row?.dataset.resource;
    if (!resource || !row.dataset.id || !confirm('¿Eliminar este registro de la base de datos?')) return;
    try {
        await apiFetch(`${API_BASE}/api/${resource}/${encodeURIComponent(row.dataset.id)}`, {method:'DELETE'});
        const config = recursos[resource];
        const form = document.getElementById(config.form);
        if (form.dataset.recordId === row.dataset.id) {
            document.getElementById(config.modal).classList.add('hidden');
            form.reset();
        }
        alert('Registro eliminado correctamente.');
        await recargarRecurso(resource);
        await cargarCatalogos();
    } catch (error) { alert(error.message); }
}

document.addEventListener('DOMContentLoaded', () => {
    for (const config of Object.values(recursos)) {
        const form = document.getElementById(config.form);
        form?.addEventListener('reset', () => {
            delete form.dataset.recordId;
            const sku = document.getElementById('p-sku'); if (sku) sku.disabled = false;
        });
    }
});
