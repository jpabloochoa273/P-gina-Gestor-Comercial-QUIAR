const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los especialistas
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM especialista');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener especialistas:', err);
        res.status(500).json({ error: err.message });
    }
});

// Registrar un nuevo especialista
router.post('/', async (req, res) => {
    const { nombre, especialidad, nivel, estado, correo, telefono } = req.body;
    try {
        const query = `
            INSERT INTO especialista (nombre, especialidad, nivel, estado, correo, telefono) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;
        `;
        const result = await db.query(query, [
            nombre, 
            especialidad, 
            nivel, 
            estado || 'Disponible', 
            correo, 
            telefono
        ]);
        const nuevoEspecialista = result.rows[0];
        
        res.status(201).json({ 
            mensaje: 'Especialista registrado con éxito', 
            idEspecialista: nuevoEspecialista.idespecialista || nuevoEspecialista.idEspecialista || nuevoEspecialista.id 
        });
    } catch (err) {
        console.error('Error al registrar especialista:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;