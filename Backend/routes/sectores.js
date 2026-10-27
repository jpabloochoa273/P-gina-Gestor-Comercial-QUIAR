const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los sectores
router.get('/', (req, res) => {
    db.query('SELECT * FROM sector', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener sectores' });
        res.json(results);
    });
});

// Registrar un nuevo sector
router.post('/', (req, res) => {
    const { nombreSector } = req.body;
    db.query('INSERT INTO sector (nombreSector) VALUES (?)', [nombreSector], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al registrar sector' });
        res.status(201).json({ mensaje: 'Sector creado con éxito', idSector: result.insertId });
    });
});

module.exports = router;