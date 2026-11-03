function databaseError(error, res) {
    const codes = {
        '23505': [409, 'Ya existe un registro con ese codigo, nombre o correo.'],
        '23503': [409, 'El registro esta relacionado con otros datos o la referencia no existe.'],
        '23514': [400, 'Revisa los importes, cantidades y el stock disponible.'],
        '23502': [400, 'Faltan campos obligatorios.'],
        '22P02': [400, 'Uno de los valores tiene un formato incorrecto.'],
        '42P01': [503, 'Faltan tablas en Supabase. Ejecuta supabase/schema.sql.'],
        '42703': [503, 'Faltan columnas. Ejecuta supabase/migrations/002_form_fields.sql.'],
        '28P01': [503, 'Supabase rechazo la contrasena de la base de datos. Revisa Backend/.env.'],
        'ENOTFOUND': [503, 'No se pudo resolver el servidor de DATABASE_URL. Revisa el host y reinicia el backend.'],
        'SELF_SIGNED_CERT_IN_CHAIN': [503, 'No se pudo verificar el certificado SSL. Revisa DB_SSL_CA_FILE.']
    };
    const [status, message] = codes[error.code] || [error.status || 500, error.status ? error.message : 'No se pudo completar la operacion. Revisa la conexion del backend.'];
    console.error('Operacion rechazada:', error.code || error.message);
    return res.status(status).json({ error: message, code: error.code });
}
module.exports = databaseError;
