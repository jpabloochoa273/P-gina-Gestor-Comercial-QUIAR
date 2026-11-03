const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../db');
const { router, hashPassword, verifyPassword, requireAuth } = require('../auth');
after(() => db.end());
const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
const handler = path => router.stack.find(layer => layer.route?.path === path).route.stack[0].handle;
test('hash con sal aleatoria y verificaci?n de contrase?a', async () => {
 const first = await hashPassword('segura123');
 assert.notEqual(first, await hashPassword('segura123'));
 assert.equal(await verifyPassword('segura123', first), true);
 assert.equal(await verifyPassword('incorrecta', first), false);
 assert.equal(await verifyPassword('segura123', null), false);
});
test('registro normaliza correo, omite rol solicitado y devuelve usuario sin hash', async () => {
 const original = db.query; const queries = [];
 db.query = async (sql, values) => { queries.push({sql, values}); return { rows: [{idUsuario: 1, nombreCompleto:'Ana', correo:'ana@example.com', idRol:null}] }; };
 try {
  const res = response();
  await handler('/register')({body:{nombreCompleto:' Ana ', correo:' ANA@example.com ', password:'segura123', idRol:1}},res);
  assert.equal(res.code,201); assert.equal(queries[0].values[1],'ana@example.com');
  assert.equal(queries[0].values.length,3); assert.equal(res.body.usuario.passwordHash,undefined);
  assert.equal(res.body.token.length,64); assert.notEqual(queries[1].values[0],res.body.token);
 } finally {db.query=original;}
});
test('rechaza registro corto y acceso sin token', async () => {
 const res=response();
 await handler('/register')({body:{nombreCompleto:'Ana',correo:'ana@example.com',password:'corta'}},res);
 assert.equal(res.code,400);
 const denied=response(); await requireAuth({headers:{}},denied,()=>assert.fail('acceso inesperado'));
 assert.equal(denied.code,401);
});
test('rechaza contrase?a incorrecta sin crear sesi?n', async () => {
 const original=db.query; let calls=0;
 db.query=async()=>{calls++;return {rows:[]};};
 try {const res=response();await handler('/login')({body:{correo:'ana@example.com',password:'incorrecta'}},res);assert.equal(res.code,401);assert.equal(calls,1);}
 finally {db.query=original;}
});
