const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM producto');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Registrar un nuevo producto y su movimiento en el Kardex
router.post('/', async (req, res) => {
    const { codigoProducto, idProveedor, producto, categoria, marca, stock, minStock, precioCompra, precioVenta, origen, ubicacion } = req.body;

    try {
        const queryProducto = `
            INSERT INTO producto ("codigoProducto", "idProveedor", producto, categoria, marca, stock, "minStock", "precioCompra", "precioVenta", origen, ubicacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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

        // Buscamos un usuario válido de forma dinámica para evitar errores de llave foránea
        const userResult = await db.query('SELECT "idUsuario" FROM usuario LIMIT 1');
        const idUsuarioValido = userResult.rows.length > 0 ? (userResult.rows[0].idusuario || userResult.rows[0].idUsuario) : null;

        const queryKardex = `
            INSERT INTO movimiento_inventario ("codigoProducto", "idUsuario", "tipoMovimiento", cantidad, "fechaMovimiento", referencia)
            VALUES ($1, $2, 'Entrada', $3, NOW(), 'Carga inicial de inventario')
        `;
        await db.query(queryKardex, [codigoProducto, idUsuarioValido, stock || 0]);

        res.status(201).json({
            mensaje: 'Producto registrado y Kardex actualizado con éxito',
            codigoProducto
        });
    } catch (error) {
        console.error('Error al guardar producto:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;