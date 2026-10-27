const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Obtener todos los proveedores
router.get('/', (req, res) => {
    const query = 'SELECT * FROM proveedor';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener proveedores:', err);
            return res.status(500).json({ error: 'Error al obtener proveedores' });
        }
        res.json(results);
    });
});

// 2. Registrar un nuevo proveedor
router.post('/', (req, res) => {
    const { nombreProveedor, contacto, telefono, correo, paisOrigen, tipoProveedor, estado } = req.body;

    const query = `
        INSERT INTO proveedor (nombreProveedor, contacto, telefono, correo, paisOrigen, tipoProveedor, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [nombreProveedor, contacto, telefono, correo, paisOrigen, tipoProveedor, estado || 'Activo'],
        (err, result) => {
            if (err) {
                console.error('Error al guardar proveedor:', err);
                return res.status(500).json({ error: 'Error al guardar proveedor en la base de datos' });
            }
            res.status(201).json({
                mensaje: 'Proveedor registrado con éxito',
                idProveedor: result.insertId
            });
        }
    );
});

module.exports = router;