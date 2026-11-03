const crud = require('../crud');

module.exports = crud({
    "table": "sector",
    "id": "idSector",
    "fields": [
        "nombreSector",
        "codigo",
        "descripcion",
        "responsable",
        "estado"
    ],
    "required": [
        "nombreSector"
    ],
    "defaults": {
        "estado": "Activo"
    }
});
