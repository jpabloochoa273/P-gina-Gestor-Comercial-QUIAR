const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener historial de movimientos de inventario con datos del producto y usuario
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT m.*, p.producto AS "nombreProducto", u."nombreCompleto" AS "nombreUsuario"
            FROM movimiento_inventario m
            LEFT JOIN producto p ON m."codigoProducto" = p."codigoProducto"
            LEFT JOIN usuario u ON m."idUsuario" = u."idUsuario"
            ORDER BY m."fechaMovimiento" DESC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener movimientos:', err);
        res.status(500).json({ error: err.message });
    }
});

// Registrar entrada/salida de inventario
router.post('/', async (req, res) => {
    const { codigoProducto, idUsuario, tipoMovimiento, cantidad, referencia } = req.body;

    try {
        const query = `
            INSERT INTO movimiento_inventario ("codigoProducto", "idUsuario", "tipoMovimiento", cantidad, referencia)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const result = await db.query(query, [codigoProducto, idUsuario || null, tipoMovimiento, cantidad, referencia]);
        const nuevoMovimiento = result.rows[0];
        
        // Actualizar el stock del producto según el tipo de movimiento
        const signo = tipoMovimiento && tipoMovimiento.toUpperCase() === 'ENTRADA' ? '+' : '-';
        const queryUpdateStock = `UPDATE producto SET stock = stock ${signo} $1 WHERE "codigoProducto" = $2`;
        
        await db.query(queryUpdateStock, [cantidad, codigoProducto]);

        res.status(201).json({ 
            mensaje: 'Movimiento registrado y stock actualizado', 
            idMovimiento: nuevoMovimiento.idmovimiento || nuevoMovimiento.idMovimiento || nuevoMovimiento.id 
        });
    } catch (err) {
        console.error('Error al registrar movimiento:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;