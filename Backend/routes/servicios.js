const crud = require('../crud');

module.exports = crud({
    "table": "servicio_especializado",
    "id": "idServicio",
    "fields": [
        "codigo",
        "descripcionRequerimiento",
        "idCliente",
        "idEspecialista",
        "costo",
        "estado"
    ],
    "required": [
        "descripcionRequerimiento"
    ],
    "defaults": {
        "estado": "Programado",
        "costo": 0
    },
    "numbers": [
        "costo"
    ]
});
