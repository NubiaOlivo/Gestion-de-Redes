const express = require('express');
const cors = require('cors');
const path = require('path');     
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// IMÁGENES 
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/materiales', require('./routes/materiales'));
app.use('/api/tareas', require('./routes/tareas'));
app.use('/api/historial', require('./routes/historial'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/sitios', require('./routes/sitios'));

// NUEVA RUTA PARA EL SELECT DE DISPOSITIVOS
app.use('/api/catalogo-dispositivos', require('./routes/catalogoDispositivos'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));