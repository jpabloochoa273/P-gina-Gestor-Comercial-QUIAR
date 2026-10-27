const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener lista de especialistas
router.get('/', (req, res) => {
    db.query('SELECT * FROM especialista', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener especialistas' });
        res.json(results);
    });
});

// Registrar nuevo especialista
router.post('/', (req, res) => {
    const { nombre, especialidad, telefono, estado } = req.body;
    const query = 'INSERT INTO especialista (nombre, especialidad, telefono, estado) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, especialidad, telefono, estado || 'Activo'], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al registrar especialista' });
        res.status(201).json({ mensaje: 'Especialista registrado con éxito', idEspecialista: result.insertId });
    });
});

module.exports = router;