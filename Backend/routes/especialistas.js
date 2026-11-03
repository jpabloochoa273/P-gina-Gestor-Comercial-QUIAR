const crud = require('../crud');

module.exports = crud({
    "table": "especialista",
    "id": "idEspecialista",
    "fields": [
        "nombre",
        "especialidad",
        "nivel",
        "estado",
        "correo",
        "telefono"
    ],
    "required": [
        "nombre"
    ],
    "defaults": {
        "estado": "Disponible"
    }
});
