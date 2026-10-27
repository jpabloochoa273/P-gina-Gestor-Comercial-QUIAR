const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener servicios especializados solicitados
router.get('/', (req, res) => {
    const query = `
        SELECT s.*, cl.empresa AS nombreCliente, e.nombre AS nombreEspecialista
        FROM servicio_especializado s
        LEFT JOIN cliente cl ON s.idCliente = cl.idCliente
        LEFT JOIN especialista e ON s.idEspecialista = e.idEspecialista
        ORDER BY s.fechaSolicitud DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener servicios' });
        res.json(results);
    });
});

// Registrar solicitud de servicio especializado
router.post('/', (req, res) => {
    const { idCliente, idEspecialista, descripcionRequerimiento, fechaSolicitud, fechaProgramada, estado } = req.body;
    const query = `
        INSERT INTO servicio_especializado (idCliente, idEspecialista, descripcionRequerimiento, fechaSolicitud, fechaProgramada, estado)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
        query,
        [idCliente || null, idEspecialista || null, descripcionRequerimiento, fechaSolicitud || new Date(), fechaProgramada, estado || 'Pendiente'],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al registrar servicio' });
            res.status(201).json({ mensaje: 'Servicio registrado con éxito', idServicio: result.insertId });
        }
    );
});

module.exports = router;