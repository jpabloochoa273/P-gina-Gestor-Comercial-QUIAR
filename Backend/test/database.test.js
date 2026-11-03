const { test } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../db');

test('sin DATABASE_URL entrega un error controlado por promesa y callback', async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
        await assert.rejects(db.query('SELECT 1'), /Falta DATABASE_URL/);
        await new Promise(resolve => db.query('SELECT 1', error => {
            assert.match(error.message, /Falta DATABASE_URL/);
            resolve();
        }));
    } finally {
        if (original !== undefined) process.env.DATABASE_URL = original;
    }
});

test('producto e inventario comparten transaccion y no requieren usuario ficticio', async () => {
    const router = require('../routes/productos');
    const handler = router.stack.find(layer => layer.route?.methods.post).route.stack[0].handle;
    const original = db.transaction;
    const queries = [];
    db.transaction = async work => work({ query: async (sql, values) => {
        queries.push({ sql, values });
        return { rows: [] };
    } });
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    try {
        await handler({ body: { codigoProducto: 'TEST', producto: 'Prueba', stock: 2 } }, res);
        assert.equal(res.code, 201);
        assert.equal(queries.length, 2);
        assert.match(queries[1].sql, /NULL, 'ENTRADA'/);
        assert.deepEqual(queries[1].values, ['TEST', 2]);
    } finally { db.transaction = original; }
});

test('cliente devuelve el id retornado por PostgreSQL', async () => {
    const router = require('../routes/clientes');
    const handler = router.stack.find(layer => layer.route?.methods.post).route.stack[0].handle;
    const original = db.query;
    db.query = async () => ({ rows: [{ idCliente: 42 }] });
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    try {
        await handler({ body: { empresa: 'Prueba' } }, res);
        assert.equal(res.code, 201);
        assert.equal(res.body.idCliente, 42);
    } finally { db.query = original; }
});
