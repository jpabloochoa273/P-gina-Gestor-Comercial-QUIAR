const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener roles
router.get('/', (req, res) => {
    db.query('SELECT * FROM rol', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener roles' });
        res.json(results);
    });
});

// Obtener todos los permisos del sistema
router.get('/permisos', (req, res) => {
    db.query('SELECT * FROM permiso', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener permisos' });
        res.json(results);
    });
});

// Registrar nuevo rol
router.post('/', (req, res) => {
    const { nombreRol, descripcion } = req.body;
    db.query('INSERT INTO rol (nombreRol, descripcion) VALUES (?, ?)', [nombreRol, descripcion], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al crear rol' });
        res.status(201).json({ mensaje: 'Rol creado con éxito', idRol: result.insertId });
    });
});

module.exports = router;