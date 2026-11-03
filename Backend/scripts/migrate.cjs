const fs = require('fs');
const path = require('path');
const db = require('../db');
const migration = process.argv[2] || '002_form_fields.sql';
if (!/^\d{3}_[a-z_]+\.sql$/.test(migration)) throw new Error('Nombre de migraci?n inv?lido.');
const file = path.join(__dirname, '../../supabase/migrations', migration);
db.query(fs.readFileSync(file, 'utf8'))
    .then(() => console.log('Migraci?n aplicada.'))
    .catch(error => { console.error('No se pudo aplicar la migracion:', error.code || error.message); process.exitCode = 1; })
    .finally(() => db.end());
