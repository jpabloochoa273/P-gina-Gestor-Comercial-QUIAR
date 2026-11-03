const crud = require('../crud');

module.exports = crud({
    "table": "usuario",
    "select": ["idUsuario", "nombreCompleto", "correo", "idRol", "estado"],
    "id": "idUsuario",
    "fields": [
        "nombreCompleto",
        "correo",
        "idRol",
        "estado"
    ],
    "required": [
        "nombreCompleto"
    ],
    "defaults": {
        "estado": "Activo"
    }
});
