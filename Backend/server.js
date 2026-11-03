const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

// Importación de todas las rutas del diagrama
const clientesRoutes = require('./routes/clientes');
const sectoresRoutes = require('./routes/sectores');
const productosRoutes = require('./routes/productos');
const proveedoresRoutes = require('./routes/proveedores');
const movimientosRoutes = require('./routes/movimientos');
const cotizacionesRoutes = require('./routes/cotizaciones');
const usuariosRoutes = require('./routes/usuarios');
const rolesRoutes = require('./routes/roles');
const especialistasRoutes = require('./routes/especialistas');
const serviciosRoutes = require('./routes/servicios');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 🚀 Ruta de bienvenida principal (para que http://localhost:5000 no marque Cannot GET)
app.get('/', (req, res) => {
    res.send('API de QUIAR Comercializadora funcionando correctamente 🚀');
});

// Registro de endpoints de la API REST
app.use('/api/auth', require('./auth').router);
app.use('/api', require('./auth').requireAuth);
app.use('/api/clientes', clientesRoutes);
app.use('/api/sectores', sectoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/especialistas', especialistasRoutes);
app.use('/api/servicios', serviciosRoutes);

// Puerto del servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});