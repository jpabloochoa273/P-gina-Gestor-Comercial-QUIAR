const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener historial de movimientos de inventario con datos del producto y usuario
router.get('/', (req, res) => {
    const query = `
        SELECT m.*, p.producto AS nombreProducto, u.nombreCompleto AS nombreUsuario
        FROM movimiento_inventario m
        LEFT JOIN producto p ON m.codigoProducto = p.codigoProducto
        LEFT JOIN usuario u ON m.idUsuario = u.idUsuario
        ORDER BY m.fechaMovimiento DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener movimientos' });
        res.json(results);
    });
});

// Registrar entrada/salida de inventario
router.post('/', (req, res) => {
    const { codigoProducto, idUsuario, tipoMovimiento, cantidad, referencia } = req.body;

    const query = `
        INSERT INTO movimiento_inventario (codigoProducto, idUsuario, tipoMovimiento, cantidad, referencia)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [codigoProducto, idUsuario || null, tipoMovimiento, cantidad, referencia], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al registrar movimiento' });
        
        // Actualizar el stock del producto según el tipo de movimiento
        const signo = tipoMovimiento === 'ENTRADA' ? '+' : '-';
        const queryUpdateStock = `UPDATE producto SET stock = stock ${signo} ? WHERE codigoProducto = ?`;
        
        db.query(queryUpdateStock, [cantidad, codigoProducto], (errUpdate) => {
            if (errUpdate) console.error('Error al actualizar stock:', errUpdate);
            res.status(201).json({ mensaje: 'Movimiento registrado y stock actualizado', idMovimiento: result.insertId });
        });
    });
});

module.exports = router;