const express = require('express');
const router = express.Router();
const db = require('../db');

// Ruta GET para obtener los servicios (si ya la tenías)
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM servicio_especializado');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener servicios:', err);
        res.status(500).json({ error: err.message });
    }
});

// Ruta POST para registrar un nuevo servicio
router.post('/', async (req, res) => {
    const { codigo, descripcionRequerimiento, estado, costo } = req.body;
    try {
        const query = `
            INSERT INTO servicio_especializado (codigo, "descripcionRequerimiento", estado, costo) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        const result = await db.query(query, [
            codigo, 
            descripcionRequerimiento, 
            estado || 'Programado', 
            costo || 0
        ]);
        
        res.status(201).json({ mensaje: 'Servicio registrado con éxito', data: result.rows[0] });
    } catch (err) {
        console.error('Error al registrar servicio:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;