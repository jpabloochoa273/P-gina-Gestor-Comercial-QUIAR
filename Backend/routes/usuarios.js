const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los usuarios (Usando Async/Await)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM usuario');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;