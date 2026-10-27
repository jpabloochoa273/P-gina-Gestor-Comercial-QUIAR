const express = require('express');
const router = express.Router();
const db = require('../db'); // Tu archivo de conexión a MySQL

// Obtener todos los clientes (Usando Async/Await)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cliente');
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
        
        const query = `
            INSERT INTO cliente (empresa, contacto, puesto, telefono, correo, ciudad, tipoCliente, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [empresa, contacto, puesto, telefono, correo, ciudad, tipoCliente, estado]);
        
        res.status(201).json({ 
            message: 'Cliente registrado exitosamente', 
            idCliente: result.insertId 
        });
    } catch (error) {
        console.error("Error al registrar cliente:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;