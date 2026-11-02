const express = require('express');
const router = express.Router();
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

module.exports = router;