// Prueba real opt-in. Solo elimina registros creados por esta ejecucion.
const assert = require('node:assert/strict');
const app = require('../server');
const db = require('../db');
const token = 'QA-' + Date.now();
const created = [];
let server;
async function run() {
    server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    async function request(resource, method='GET', body, status=200) {
        const response = await fetch(`${base}/${resource}`, {method, headers:{'Content-Type':'application/json'}, body:body ? JSON.stringify(body) : undefined});
        const data = await response.json();
        assert.equal(response.status,status,`${method} ${resource}: ${JSON.stringify(data)}`);
        return data;
    }
    await request('health');
    for (const resource of ['clientes','productos','cotizaciones','proveedores','sectores','especialistas','servicios','usuarios','roles','roles/permisos','movimientos']) assert.ok(Array.isArray(await request(resource)));
    async function create(resource,body,key,table) {
        const row = await request(resource,'POST',body,201);
        created.push({table,key,id:row[key]}); return row[key];
    }
    const idRol = await create('roles',{nombreRol:token,descripcion:'Verificacion',permisos:'Prueba'},'idRol','rol');
    const idUsuario = await create('usuarios',{nombreCompleto:token,correo:token+'@example.invalid',idRol},'idUsuario','usuario');
    const idCliente = await create('clientes',{empresa:token,contacto:'Prueba'},'idCliente','cliente');
    const idProveedor = await create('proveedores',{nombreProveedor:token,rfc:'QA'},'idProveedor','proveedor');
    const idEspecialista = await create('especialistas',{nombre:token,nivel:'Prueba'},'idEspecialista','especialista');
    await create('sectores',{nombreSector:token,codigo:token},'idSector','sector');
    const idServicio = await create('servicios',{descripcionRequerimiento:token,idCliente,idEspecialista,costo:10},'idServicio','servicio_especializado');
    await request(`servicios/${idServicio}`,'PUT',{descripcionRequerimiento:token,idCliente,idEspecialista,costo:20,estado:'Programado'});
    const sku = token+'-SKU';
    await request('productos','POST',{codigoProducto:sku,producto:token,stock:10,precioCompra:5,precioVenta:10,idProveedor},201);
    created.push({table:'producto',key:'codigoProducto',id:sku});
    await request('productos','POST',{codigoProducto:sku,producto:token},409);
    await request('productos','POST',{codigoProducto:token+'-BAD',producto:token,stock:-1},400);
    await request('clientes','POST',{empresa:''},400);
    const quote = {folio:token,client:idCliente,agent:idUsuario,date:'2026-10-27',detalles:[{sku,cantidad:2,precio:10,descuento:10}],total:999};
    const idPedido = await create('cotizaciones',quote,'idPedido','cotizacion_pedido');
    let detail = await request('cotizaciones/'+idPedido);
    assert.equal(detail.pedido.total,20.88);
    assert.equal(detail.pedido.nombreCliente,token);
    assert.equal(detail.productos.length,1);
    await request('cotizaciones/'+idPedido,'PUT',{...quote,detalles:[{sku,cantidad:3,precio:10,descuento:0}]});
    detail = await request('cotizaciones/'+idPedido);
    assert.equal(detail.pedido.total,34.8);
    await request('cotizaciones/'+idPedido,'PUT',{...quote,detalles:[{sku:'NO-EXISTE-'+token,cantidad:1,precio:10,descuento:0}]},409);
    detail = await request('cotizaciones/'+idPedido);
    assert.equal(detail.productos[0].cantidad,3,'Rollback conserva el detalle anterior');
    await request('productos/'+sku,'DELETE',undefined,409);
    await request('cotizaciones/2147483647','PUT',quote,404);
    await request('movimientos','POST',{codigoProducto:sku,tipoMovimiento:'Salida',cantidad:2},201);
    await request('movimientos','POST',{codigoProducto:sku,tipoMovimiento:'SALIDA',cantidad:999999},400);
    assert.equal((await request('productos')).find(p=>p.codigoProducto===sku).stock,8);
    await request('productos/'+sku,'PUT',{producto:token,stock:12,precioCompra:5,precioVenta:10});
    assert.equal((await request('productos')).find(p=>p.codigoProducto===sku).stock,12);
    await request('clientes/'+idCliente,'PUT',{empresa:token+' actualizado'});
    await request('cotizaciones/'+idPedido,'DELETE');
    await request('productos/'+sku,'DELETE');
    console.log('OK: SSL, 11 listados, altas, cambios, bajas, validaciones, totales, stock y rollback.');
}
run().catch(error => { console.error(error.message); process.exitCode=1; }).finally(async () => {
    for (const item of created.reverse()) {
        try {
            if (item.table==='producto') await db.query('DELETE FROM movimiento_inventario WHERE "codigoProducto"=$1',[item.id]);
            await db.query(`DELETE FROM "${item.table}" WHERE "${item.key}"=$1`,[item.id]);
        } catch (error) { console.error('Limpieza pendiente:',item.table,error.code); process.exitCode=1; }
    }
    if(server) await new Promise(resolve=>server.close(resolve));
    await db.end();
});
