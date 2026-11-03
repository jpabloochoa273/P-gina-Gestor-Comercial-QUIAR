const express = require('express');
const db = require('./db');
const databaseError = require('./http-errors');

// Nombres SQL proceden exclusivamente de la configuracion del servidor.
module.exports = function crud({ table, id, fields, required = [], defaults = {}, numbers = [], select }) {
    const router = express.Router();
    router.get('/', async (req, res) => {
        try { res.json((await db.query(`SELECT ${select ? select.map(key => `"${key}"`).join(',') : '*'} FROM public."${table}" ORDER BY "${id}"`)).rows); }
        catch (error) { databaseError(error, res); }
    });
    function values(body) {
        const data = { ...defaults, ...body };
        if (fields.includes('fechaSolicitud') && !data.fechaSolicitud) data.fechaSolicitud = new Date().toISOString();
        for (const key of required) {
            if (typeof data[key] !== 'string' || !data[key].trim()) throw Object.assign(new Error(`El campo ${key} es obligatorio.`), { status: 400 });
            data[key] = data[key].trim();
        }
        for (const key of numbers) {
            if (data[key] !== undefined && data[key] !== null && (!Number.isFinite(Number(data[key])) || Number(data[key]) < 0)) throw Object.assign(new Error(`El campo ${key} debe ser un numero positivo o cero.`), { status: 400 });
        }
        return fields.map(key => data[key] === '' || data[key] === undefined ? null : data[key]);
    }
    router.post('/', async (req, res) => {
        try {
            const result = await db.query(`INSERT INTO public."${table}" (${fields.map(key => `"${key}"`).join(',')}) VALUES (${fields.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING "${id}"`, values(req.body));
            res.status(201).json({ message: 'Registro guardado.', ...result.rows[0] });
        } catch (error) { databaseError(error, res); }
    });
    router.put('/:id', async (req, res) => {
        try {
            const result = await db.query(`UPDATE public."${table}" SET ${fields.map((key, i) => `"${key}"=$${i + 1}`).join(',')} WHERE "${id}"=$${fields.length + 1} RETURNING "${id}"`, [...values(req.body), req.params.id]);
            if (!result.rowCount) return res.status(404).json({ error: 'Registro no encontrado.' });
            res.json({ message: 'Registro actualizado.', ...result.rows[0] });
        } catch (error) { databaseError(error, res); }
    });
    router.delete('/:id', async (req, res) => {
        try {
            const result = await db.query(`DELETE FROM public."${table}" WHERE "${id}"=$1`, [req.params.id]);
            if (!result.rowCount) return res.status(404).json({ error: 'Registro no encontrado.' });
            res.json({ message: 'Registro eliminado.' });
        } catch (error) { databaseError(error, res); }
    });
    return router;
};
