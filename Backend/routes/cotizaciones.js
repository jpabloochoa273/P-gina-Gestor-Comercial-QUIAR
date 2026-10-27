const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Obtener todas las cotizaciones/pedidos con los datos del cliente
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT c.*, cl.empresa AS nombreCliente, u.nombreCompleto AS nombreVendedor
            FROM cotizacion_pedido c
            LEFT JOIN cliente cl ON c.idCliente = cl.idCliente
            LEFT JOIN usuario u ON c.idUsuario = u.idUsuario
            ORDER BY c.fecha DESC
        `;
        const [results] = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ error: 'Error al obtener cotizaciones' });
    }
});

// 2. Obtener una cotización específica con su detalle de productos
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const queryPedido = `
            SELECT c.*, cl.empresa AS nombreCliente, u.nombreCompleto AS nombreVendedor
            FROM cotizacion_pedido c
            LEFT JOIN cliente cl ON c.idCliente = cl.idCliente
            LEFT JOIN usuario u ON c.idUsuario = u.idUsuario
            WHERE c.idPedido = ?
        `;

        const queryDetalle = `
            SELECT d.*, p.producto AS nombreProducto, p.marca
            FROM detalle_pedido d
            JOIN producto p ON d.codigoProducto = p.codigoProducto
            WHERE d.idPedido = ?
        `;

        const [pedidoResults] = await db.query(queryPedido, [id]);
        if (pedidoResults.length === 0) {
            return res.status(404).json({ error: 'Cotización no encontrada' });
        }

        const [detalleResults] = await db.query(queryDetalle, [id]);

        res.json({
            pedido: pedidoResults[0],
            productos: detalleResults
        });
    } catch (error) {
        console.error('Error al obtener detalle de la cotización:', error);
        res.status(500).json({ error: 'Error al obtener detalle de la cotización' });
    }
});

// 3. Crear una nueva cotización/pedido junto con sus detalles de productos
router.post('/', async (req, res) => {
    try {
        const { folio, client, date, status, total, subtotal, iva, agent, detalles } = req.body;

        const queryPedido = `
            INSERT INTO cotizacion_pedido (idCliente, idUsuario, folio, fecha, subtotal, descuentoTotal, iva, total, estado)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
        `;

        const [resultPedido] = await db.query(queryPedido, [
            client || null,
            agent || null,
            folio || 'Sin Folio',
            date || new Date(),
            subtotal || 0,
            iva || 0,
            total || 0,
            status || 'Pendiente'
        ]);

        const idPedidoGenerado = resultPedido.insertId;

        if (detalles && Array.isArray(detalles) && detalles.length > 0) {
            for (const item of detalles) {
                const queryDetalle = `
                    INSERT INTO detalle_pedido (idPedido, codigoProducto, cantidad, precioVenta, descuento, subtotalLinea)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                await db.query(queryDetalle, [
                    idPedidoGenerado,
                    item.sku || item.codigoProducto,
                    item.cantidad || 1,
                    item.precio || 0,
                    item.descuento || 0,
                    item.subtotal || 0
                ]);
            }
        }

        res.status(201).json({ 
            message: 'Cotización y detalles guardados exitosamente', 
            idPedido: idPedidoGenerado 
        });

    } catch (error) {
        console.error("Error al guardar cotización y detalle en MySQL:", error);
        res.status(500).json({ error: 'Error al guardar la cotización en la base de datos' });
    }
});

// 4. Actualizar una cotización existente y sus detalles (PUT)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { folio, client, date, status, total, subtotal, iva, agent, detalles } = req.body;

        const queryPedido = `
            UPDATE cotizacion_pedido 
            SET idCliente = ?, idUsuario = ?, folio = ?, fecha = ?, subtotal = ?, iva = ?, total = ?, estado = ?
            WHERE idPedido = ?
        `;

        await db.query(queryPedido, [
            client || null,
            agent || null,
            folio || 'Sin Folio',
            date || new Date(),
            subtotal || 0,
            iva || 0,
            total || 0,
            status || 'Pendiente',
            id
        ]);

        // Limpiamos los detalles anteriores y reinsertamos los actualizados
        await db.query('DELETE FROM detalle_pedido WHERE idPedido = ?', [id]);

        if (detalles && Array.isArray(detalles) && detalles.length > 0) {
            for (const item of detalles) {
                await db.query(
                    `INSERT INTO detalle_pedido (idPedido, codigoProducto, cantidad, precioVenta, descuento, subtotalLinea) VALUES (?, ?, ?, ?, ?, ?)`,
                    [id, item.sku || item.codigoProducto, item.cantidad || 1, item.precio || 0, item.descuento || 0, item.subtotal || 0]
                );
            }
        }

        res.json({ message: 'Cotización actualizada correctamente' });
    } catch (error) {
        console.error("Error al actualizar cotización:", error);
        res.status(500).json({ error: 'Error al actualizar la cotización' });
    }
});

// --- RUTA DELETE PARA ELIMINAR COTIZACIÓN ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM cotizacion_pedido WHERE idPedido = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cotización no encontrada' });
        }
        
        res.json({ message: 'Cotización eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar en MySQL:", error);
        res.status(500).json({ error: 'Error al eliminar la cotización' });
    }
});

module.exports = router;