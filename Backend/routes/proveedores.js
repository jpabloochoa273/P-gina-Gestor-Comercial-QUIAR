const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los proveedores
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM proveedor');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        res.status(500).json({ error: err.message });
    }
});

// Registrar un nuevo proveedor con todos sus campos, incluido el RFC
router.post('/', async (req, res) => {
    const { nombreProveedor, rfc, contacto, telefono, correo, paisOrigen, tipoProveedor, estado } = req.body;
    try {
        const query = `
            INSERT INTO proveedor ("nombreProveedor", rfc, contacto, telefono, correo, "paisOrigen", "tipoProveedor", estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *;
        `;
        const result = await db.query(query, [
            nombreProveedor, 
            rfc, 
            contacto, 
            telefono, 
            correo, 
            paisOrigen, 
            tipoProveedor, 
            estado || 'Activo'
        ]);
        const nuevoProveedor = result.rows[0];
        
        res.status(201).json({ 
            mensaje: 'Proveedor registrado con éxito', 
            idProveedor: nuevoProveedor.idproveedor || nuevoProveedor.idProveedor || nuevoProveedor.id 
        });
    } catch (err) {
        console.error('Error al registrar proveedor:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;