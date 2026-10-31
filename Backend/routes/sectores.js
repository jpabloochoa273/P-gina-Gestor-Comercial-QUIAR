const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los sectores
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM sector');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener sectores:', err);
        res.status(500).json({ error: err.message });
    }
});

// Registrar un nuevo sector
router.post('/', async (req, res) => {
    const { nombreSector } = req.body;
    try {
        const query = 'INSERT INTO sector ("nombreSector") VALUES ($1) RETURNING *;';
        const result = await db.query(query, [nombreSector]);
        const nuevoSector = result.rows[0];
        
        res.status(201).json({ 
            mensaje: 'Sector creado con éxito', 
            idSector: nuevoSector.idsector || nuevoSector.idSector || nuevoSector.id 
        });
    } catch (err) {
        console.error('Error al registrar sector:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;