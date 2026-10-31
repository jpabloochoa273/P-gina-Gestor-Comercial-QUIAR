const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los roles
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM rol');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener roles:', err);
        res.status(500).json({ error: err.message });
    }
});

// Registrar un nuevo rol
router.post('/', async (req, res) => {
    const { nombreRol, descripcion } = req.body;
    try {
        const query = 'INSERT INTO rol ("nombreRol", descripcion) VALUES ($1, $2) RETURNING *;';
        const result = await db.query(query, [nombreRol, descripcion]);
        const nuevoRol = result.rows[0];
        
        res.status(201).json({ 
            mensaje: 'Rol registrado con éxito', 
            idRol: nuevoRol.idrol || nuevoRol.idRol || nuevoRol.id 
        });
    } catch (err) {
        console.error('Error al registrar rol:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;