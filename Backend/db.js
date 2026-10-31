const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Probar la conexión al iniciar
(async () => {
    try {
        const client = await db.connect();
        console.log('✅ ¡Conexión exitosa a Supabase (PostgreSQL)!');
        client.release();
    } catch (err) {
        console.error('❌ Error al conectar con Supabase:', err.message);
    }
})();

module.exports = db;