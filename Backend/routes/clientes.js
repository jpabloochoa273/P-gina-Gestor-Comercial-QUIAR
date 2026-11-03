const express = require('express');
const router = express.Router();
const databaseError = require('../http-errors');
const db = require('../db'); // Conexión a Supabase (PostgreSQL)

// Obtener todos los clientes
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM cliente');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ error: error.message });
    }
});

// Registrar un nuevo cliente
router.post('/', async (req, res) => {
    try {
        const { empresa, contacto, puesto, telefono, correo, ciudad, tipo, tipoCliente, estado } = req.body;
        const valorTipo = tipo || tipoCliente || 'Corporativo';
        
        const query = `
            INSERT INTO cliente (empresa, contacto, puesto, telefono, correo, ciudad, "tipoCliente", estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        
        const values = [empresa, contacto, puesto, telefono, correo, ciudad, valorTipo, estado || 'Activo'];
        const result = await db.query(query, values);
        
        res.status(201).json({ message: 'Cliente registrado exitosamente', cliente: result.rows[0] });
    } catch (error) {
        console.error("Error al registrar cliente:", error);
        res.status(500).json({ error: error.message });
    }
});

function validarId(req, res, next) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
        return res.status(400).json({ error: 'ID de cliente invalido.' });
    }
    next();
}

router.put('/:id', validarId, async (req, res) => {
    const { empresa, contacto, puesto, telefono, correo, ciudad, tipo, tipoCliente, estado } = req.body;
    if (typeof empresa !== 'string' || !empresa.trim()) {
        return res.status(400).json({ error: 'La empresa es obligatoria.' });
    }
    try {
        const { rows } = await db.query(`
            UPDATE cliente SET empresa=$1, contacto=$2, puesto=$3, telefono=$4,
                correo=$5, ciudad=$6, "tipoCliente"=$7, estado=$8
            WHERE "idCliente"=$9 RETURNING *
        `, [empresa.trim(), contacto, puesto, telefono, correo, ciudad,
            tipo || tipoCliente || 'Corporativo', estado || 'Activo', req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado.' });
        res.json({ message: 'Cliente actualizado exitosamente', cliente: rows[0] });
    } catch (error) { databaseError(error, res); }
});

router.delete('/:id', validarId, async (req, res) => {
    try {
        const { rows } = await db.query('DELETE FROM cliente WHERE "idCliente"=$1 RETURNING "idCliente"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado.' });
        res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) { databaseError(error, res); }
});

module.exports = router;