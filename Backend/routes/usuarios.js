const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los usuarios / asesores
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT u.*, r."nombreRol" AS "nombreRol"
            FROM usuario u
            LEFT JOIN rol r ON u."idRol" = r."idRol"
            ORDER BY u."idUsuario" ASC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ error: err.message });
    }
});

// Registrar un nuevo usuario
router.post('/', async (req, res) => {
    const { nombreCompleto, correo, idRol, estado } = req.body;
    try {
        const query = `
            INSERT INTO usuario ("nombreCompleto", correo, "idRol", estado) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        const result = await db.query(query, [nombreCompleto, correo, idRol || null, estado || 'Activo']);
        const nuevoUsuario = result.rows[0];
        
        res.status(201).json({ 
            mensaje: 'Usuario registrado con éxito', 
            idUsuario: nuevoUsuario.idusuario || nuevoUsuario.idUsuario || nuevoUsuario.id 
        });
    } catch (err) {
        console.error('Error al registrar usuario:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;