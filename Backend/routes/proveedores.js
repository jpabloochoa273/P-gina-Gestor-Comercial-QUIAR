const crud = require('../crud');

module.exports = crud({
    "table": "proveedor",
    "id": "idProveedor",
    "fields": [
        "nombreProveedor",
        "rfc",
        "tipoProveedor",
        "contacto",
        "correo",
        "telefono",
        "paisOrigen",
        "estado"
    ],
    "defaults": { "estado": "Activo" },
    "required": [
        "nombreProveedor"
    ]
});
