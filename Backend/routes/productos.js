const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM producto');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// 2. Registrar un nuevo producto y su movimiento en el Kardex
router.post('/', async (req, res) => {
    const { codigoProducto, idProveedor, producto, categoria, marca, stock, minStock, precioCompra, precioVenta, origen, ubicacion } = req.body;

    try {
        // Paso A: Insertar el producto en la tabla 'producto'
        const queryProducto = `
            INSERT INTO producto (codigoProducto, idProveedor, producto, categoria, marca, stock, minStock, precioCompra, precioVenta, origen, ubicacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(queryProducto, [
            codigoProducto, 
            idProveedor || null, 
            producto, 
            categoria, 
            marca, 
            stock || 0, 
            minStock || 0, 
            precioCompra, 
            precioVenta, 
            origen, 
            ubicacion
        ]);

        // Paso B: Registrar automáticamente la entrada inicial en el Kardex
        const queryKardex = `
            INSERT INTO movimiento_inventario (codigoProducto, idUsuario, tipoMovimiento, cantidad, fechaMovimiento, referencia)
            VALUES (?, 1, 'Entrada', ?, NOW(), 'Carga inicial de inventario')
        `;
        await db.query(queryKardex, [codigoProducto, stock || 0]);

        res.status(201).json({
            mensaje: 'Producto registrado y Kardex actualizado con éxito',
            codigoProducto
        });
    } catch (error) {
        console.error('Error al guardar producto:', error);
        res.status(500).json({ error: 'Error al guardar producto en la base de datos' });
    }
});

module.exports = router;