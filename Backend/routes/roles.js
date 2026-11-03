const crud = require('../crud');

module.exports = crud({
    "table": "rol",
    "id": "idRol",
    "fields": [
        "nombreRol",
        "descripcion",
        "permisos"
    ],
    "required": [
        "nombreRol"
    ]
});
