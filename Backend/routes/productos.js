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
// Actualizar un producto (modifica todo MENOS el codigoProducto / SKU)
router.put('/:id', async (req, res) => {
    const { id } = req.params; // El SKU del producto que se está editando
    let { idProveedor, producto, categoria, marca, stock, minStock, precioCompra, precioVenta, origen, ubicacion } = req.body;
    
    // Sanitización estricta de números para evitar desbordamientos
    stock = parseFloat(stock) || 0;
    minStock = parseFloat(minStock) || 0;
    precioCompra = parseFloat(precioCompra) || 0;
    precioVenta = parseFloat(precioVenta) || 0;

    try {
        const query = `
            UPDATE producto 
            SET "idProveedor" = $1, producto = $2, categoria = $3, marca = $4, stock = $5, "minStock" = $6, "precioCompra" = $7, "precioVenta" = $8, origen = $9, ubicacion = $10
            WHERE "codigoProducto" = $11 
            RETURNING *;
        `;
        const values = [
            idProveedor || null, 
            producto, 
            categoria, 
            marca, 
            stock, 
            minStock, 
            precioCompra, 
            precioVenta, 
            origen, 
            ubicacion, 
            id
        ];
        
        const { rows } = await db.query(query, values);
        if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        
        res.json({ mensaje: 'Producto actualizado con éxito', producto: rows[0] });
    } catch (err) {
        console.error('Error al actualizar producto:', err);
        res.status(500).json({ error: err.message });
    }
});

// Eliminar un producto y sus movimientos en el Kardex asociados
router.delete('/:id', async (req, res) => {
    const { id } = req.params; // El codigoProducto / SKU
    try {
        // 1. Primero eliminamos los movimientos de inventario (Kardex) vinculados a este producto
        await db.query('DELETE FROM movimiento_inventario WHERE "codigoProducto" = $1', [id]);

        // 2. Después eliminamos el producto de la tabla principal
        const { rowCount } = await db.query('DELETE FROM producto WHERE "codigoProducto" = $1', [id]);
        
        if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        
        res.json({ mensaje: 'Producto y su historial eliminados con éxito' });
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;