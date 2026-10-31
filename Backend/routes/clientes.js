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
        const { empresa, contacto, puesto, telefono, correo, ciudad, tipoCliente, estado } = req.body;
        
        // Usamos comillas dobles en las columnas que tienen mayúsculas en Supabase
        const query = `
            INSERT INTO cliente (empresa, contacto, puesto, telefono, correo, ciudad, "tipoCliente", estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        
        const values = [empresa, contacto, puesto, telefono, correo, ciudad, tipoCliente, estado || 'Activo'];
        const result = await db.query(query, values);
        
        const nuevoCliente = result.rows[0];
        
        res.status(201).json({ 
            message: 'Cliente registrado exitosamente', 
            idCliente: nuevoCliente.idcliente || nuevoCliente.idCliente || nuevoCliente.id
        });
    } catch (error) {
        console.error("Error al registrar cliente:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;